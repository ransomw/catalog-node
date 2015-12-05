var _ = require('lodash');
var Sqlize = require('sequelize');
var app = require('./index');
var models = require('./models');
var util = require('./util');

var HTTP_RES_CODE = {
  client_err: 400,
  auth_err: 401,
  server_err: 500
};

app.get('/', function (req, res) {
  res.render('index', {client_url_path: app.locals.client_url_path});
});

app.get('/login', function (req, res) {
  if (req.session.user_id) {
    res.redirect('/');
  } else {
    res.render('login', {client_url_path: app.locals.client_url_path});
  }
});

// todo: hash passwords
// todo: make control-flow less messy
app.post('/login', function (req, res) {
  var req_keys = _.keys(req.body);
  if (req_keys.indexOf('sign-in') !== -1) {
    models.get_model(models.get_db(), models.User)
      .findOne({where: {email: req.body.email}})
      .then(function (user) {
        if (user === null) {
          res.status(HTTP_RES_CODE.client_err)
            .json({error: "user record for email not found",
                   data: req.body.email});
        } else if (user.get('password') === null) {
          res.status(HTTP_RES_CODE.client_err)
            .json({error: ["user account created with third-party ",
                           "service sign up locally or sign in with ",
                           "third-party"].join('')});
        } else if (user.get('password') === req.body.password) {
          req.session.user_id = user.get('id');
          res.redirect('/');
        } else {
          res.status(HTTP_RES_CODE.client_err)
            .json({error: "bad password"});
        }
      });
  } else if (req_keys.indexOf('sign-up') !== -1) {
    if (req.body.password !== req.body['password-confirm']) {
      res.status(HTTP_RES_CODE.client_err)
        .json({error: "passwords don't match"});
    } else {
      models.get_model(models.get_db(), models.User)
        .findOne({where: {email: req.body.email}})
        .then(function (existing_user) {
          if (existing_user === null) {
            models.get_model(models.get_db(), models.User)
              .create({
              name: req.body.name,
              email: req.body.email,
              password: req.body.password
            }).then(function (new_user) {
              req.session.user_id = new_user.null;
              res.redirect('/');
            });
          } else if (existing_user.get('password') !== null) {
            res.status(HTTP_RES_CODE.client_err)
              .json({error: "user already registered"});
          } else {
            existing_user.updateAttributes({
              name: req.body.name,
              password: req.body.password
            }).then(function () {
              req.session.user_id = existing_user.get('id');
              res.redirect('/');
            });
          }
        });
    }
  } else {
    res.status(HTTP_RES_CODE.client_err)
      .json({error: ["expected request to either specify ",
                     "sign up or sign in"].join('')});
  }
});

app.get('/logout', function (req, res) {
  req.session.user_id = undefined;
  res.redirect('/');
});

app.get('/user', function (req, res) {
  if (req.session.user_id) {
    models.get_model(models.get_db(), models.User)
      .findById(req.session.user_id)
      .then(function (user) {
        if (user === null) {
          res.status(HTTP_RES_CODE.server_error)
            .json({error: "failed to look up user by id"});
        } else {
          // todo: override toJSON on user model
          //       so as not to send password
          res.json(user.toJSON());
        }
      });
  } else {
    res.json(null);
  }
});

// todo: support querying using comparisons... after integration tests
//       like ?createdAt__gt=val in URL and other typical querying stuff
//       like ordering and restricting to a particular count
var make_models_endpoint = function (model_def) {
  return function (req, res) {
    var model = models.get_model(models.get_db(), model_def);
    // todo: edit control flow such that there's a single find-all
    //       statement with an empty where object if the sequelize api
    //       permits this being equivalent to the include all usage
    var query_params = _.keys(req.query);
    // todo: don't use dataValues attribute directly.
    //       try .get({plain: true}) or .toJSON
    var set_res = function (instances) {
      res.json(_.map(instances, function (instance) {
        return instance.dataValues;
      }));
    };
    if (query_params.length === 0) {
      model.findAll({ include: [{ all: true }]})
        .then(function (instances) {
          set_res(instances);
        });
    } else {
      var instance_params = _.keys(model.tableAttributes);
      var invalid_params = _.difference(query_params, instance_params);
      if (invalid_params.length !== 0) {
        res.status(HTTP_RES_CODE.client_err)
          .json({error: "invalid query string parameters",
                 data: invalid_params});
      } else {
        model.findAll({where: req.query})
          .then(function (instances) {
            set_res(instances);
          });
      }
    }
  };
};

app.get('/api/categories', make_models_endpoint(models.Category));
app.get('/api/items', make_models_endpoint(models.Item));

var api_login_req = function (req, res, next) {
  if (req.session.user_id) {
    return next();
  }
  res.status(HTTP_RES_CODE.auth_err)
    .json({error: "unauthorized"});
  return next();
};

app.post('/api/item', api_login_req, function (req, res) {
    models.get_model(models.get_db(), models.Item)
    .create(req.body)
    .then(function (new_item) {
      res.json({});
    }, function (err) {
      res.status(HTTP_RES_CODE.client_err)
        .json({error: err.toString()});
    });
});

var make_instance_endpoint = function(model_def, action) {
  return function(req, res) {
    var instance_id = util.filter_int(req.params.id);
    if (isNaN(instance_id) || instance_id < 0) {
      res.status(HTTP_RES_CODE.client_err)
        .json({error: "instance id must be a non-negative integer"});
    } else {
      models.get_model(models.get_db(), model_def)
        .findById(instance_id)
        .then(function (instance) {
          if (instance === null) {
            return instance;
          }
          // not certain if passing the entire req to the action is
          // the right level of abstraction...
          return action(req, instance);
        }).then(function (instance) {
          if (instance !== null) {
            res.json({});
          } else {
            res.status(HTTP_RES_CODE.client_err)
              .json({error: "model instance lookup by id failed",
                     data: instance_id});
          }
        }, function (err) {
          if (err instanceof Sqlize.ValidationError) {
            res.status(HTTP_RES_CODE.client_err);
          } else {
            res.status(HTTP_RES_CODE.server_err);
          }
          res.json({error: err.toString()});
        });
    }
  };
};

// could use app.param, tho with entire handler abstracted,
// there's no duplicate code anyway
app.post('/api/item/:id', api_login_req,
         make_instance_endpoint(models.Item, function (req, item) {
           return item.updateAttributes(
             _.pick(req.body, [
               'title',
               'description',
               'category_id'
             ]));
         }));

app.del('/api/item/:id', api_login_req,
         make_instance_endpoint(models.Item, function (req, item) {
           return item.destroy();
         }));
