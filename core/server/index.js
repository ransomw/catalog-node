var _ = require('lodash');
var express = require('express');
var session = require('express-session');
var bodyParser = require('body-parser');

var models = require('./models');

var app = express();

////////////// all the expressjs stuff crammed into one file
// todo: route module and url tree ... or some other pattern?
//       search around
// todo: shared error codes in json responses between client and server
///////

var HTTP_RES_CODE = {
  client_err: 400,
  auth_err: 401,
  server_err: 500
};

app.use(bodyParser.json());
app.use(bodyParser.urlencoded());

// todo: not suitable for production
app.use(session({
  secret: 'super secret',
  cookie: {}
}));

app.use('/static', express.static('core/client'));

app.get('/', function (req, res) {
  // todo: use template
  res.sendfile('core/client/index.html');
});

app.get('/login', function (req, res) {
  if (req.session.user_id) {
    res.redirect('/');
  } else {
    // todo: use template
    res.sendfile('core/client/login.html');
  }
});

// todo: hash passwords
// todo: make control-flow less messy
app.post('/login', function (req, res) {
  var req_keys = _.keys(req.body);
  if (req_keys.indexOf('sign-in') !== -1) {
    models.User.findOne({where: {email: req.body.email}})
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
      models.User.findOne({where: {email: req.body.email}})
        .then(function (existing_user) {
          if (existing_user === null) {
            models.User.create({
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
    models.User.findById(req.session.user_id)
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

// todo: support querying using comparisons...
//       like ?createdAt__gt=val in URL and other typical querying stuff
//       like ordering and restricting to a particular count
var make_models_endpoint = function (model) {
  return function (req, res) {
    // todo: edit control flow such that there's a single find-all
    //       statement with an empty where object if the sequelize api
    //       permits this being equivalent to the include all usage
    var query_params = _.keys(req.query);
    // todo: don't use dataValues attribute directly.
    //       try .get({plain: true}) or .toJSON
    if (query_params.length === 0) {
      model.findAll({ include: [{ all: true }]})
        .then(function (categories) {
          res.json(_.map(categories, function (category) {
            return category.dataValues;
          }));
        });
    } else {
      var category_params = _.keys(model.tableAttributes);
      var invalid_params = _.difference(query_params, category_params);
      if (invalid_params.length !== 0) {
        res.status(HTTP_RES_CODE.client_err)
          .json({error: "invalid query string parameters",
                 data: invalid_params});
      } else {
        model.findAll({where: req.query})
          .then(function (categories) {
            res.json(_.map(categories, function (category) {
              return category.dataValues;
            }));
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
};

app.post('/api/item', api_login_req, function (req, res) {
  models.Item.create(req.body)
    .then(function (new_item) {
      res.json({});
    }, function (err) {
      res.status(HTTP_RES_CODE.client_err)
        .json({error: err.toString()});
    });
});

// todo: read more about parameters
//       http://webapplog.com/url-parameters-and-routing-in-express-js/
app.post('/api/item/:id', api_login_req, function(req, res) {
  var item_id = parseInt(req.params.id);
  // todo: other checks/parsing for string to int in js?
  if (isNaN(item_id) && item_id !== parseFloat(req.params.id)) {
      res.status(HTTP_RES_CODE.client_err)
        .json({error: "item id must be an integer"});
  } else {
    // todo: more sensible promise-chaining
    models.Item.findById(item_id)
      .then(function (item) {
        if (item === null) {
          res.status(HTTP_RES_CODE.client_err)
            .json({error: "item lookup by id failed",
                   data: item_id});
        } else {
          // todo: less DRY in which attributes get updated
          item.updateAttributes({
            title: req.body.title,
            description: req.body.description,
            category_id: req.body.category_id
          }).then(function () {
            res.json({});
          }, function (err) {
            // todo: this might really be a client or server error
            res.status(HTTP_RES_CODE.client_err)
              .json({error: err.toString()});
          });
        }
      });
  }
});

module.exports = app;
