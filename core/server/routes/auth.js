var _ = require('lodash');
var models = require('../models');
var CONST = require('../const');
var util = require('../util');
// todo: app import ought not be required
var app_locals = require('../index').locals;
var router = require('express').Router();

/* make login required middleware
 * res_cb: callback fcn passed a res obj on unsuccessful login
 */
var make_login_req_mw = function (res_cb) {
  return function (req, res, next) {
    if (req.session.user_id) {
      return next();
    }
    res_cb(res);
    return next();
  };
};

// todo: hash passwords
var handle_sign_in = function (req, res) {
  models.get_model(models.get_db(), models.User)
    .findOne({where: {email: req.body.email}})
    .then(function (user) {
      if (user === null) {
        res.status(CONST.HTTP_RES_CODE.client_err)
          .json({error: "user record for email not found",
                 data: req.body.email});
      } else if (user.get('password') === null) {
        res.status(CONST.HTTP_RES_CODE.client_err)
          .json({error: ["user account created with third-party ",
                         "service sign up locally or sign in with ",
                         "third-party"].join('')});
      } else if (user.get('password') === req.body.password) {
        req.session.user_id = user.get('id');
        res.redirect('/');
      } else {
        res.status(CONST.HTTP_RES_CODE.client_err)
          .json({error: "bad password"});
      }
    }, function (err) {
      res.status(CONST.HTTP_RES_CODE.server_err)
        .json({error: err.toString()});
    });
};

var handle_sign_up = function (req, res) {
  if (req.body.password !== req.body['password-confirm']) {
    res.status(CONST.HTTP_RES_CODE.client_err)
      .json({error: "passwords don't match"});
  } else {
    // still not totally happy with this control-flow...
    models.get_model(models.get_db(), models.User)
      .findOne({where: {email: req.body.email}})
      .then(function (user) {
        if (user === null) {
          return models.get_model(models.get_db(), models.User)
            .create({
              name: req.body.name,
              email: req.body.email,
              password: req.body.password
            });
        }
        if (user.get('password') !== null) {
          res.status(CONST.HTTP_RES_CODE.client_err)
            .json({error: "user already registered"});
          return null; // null_wrap callbacks will pass
        }
        return user;
      }).then(util.null_wrap(function (user) {
        // sequelize weirdness: .null attr is id of newly-created item
        if (user.null) {
          return user;
        }
        return user.updateAttributes({
          name: req.body.name,
          password: req.body.password
        });
      })).then(util.null_wrap(function (user) {
        req.session.user_id = user.get('id') || user.null;
        res.redirect('/');
      }), function (err) {
        res.status(CONST.HTTP_RES_CODE.server_err)
          .json({error: err.toString()});
      });
  }
};

router.get('/login', function (req, res) {
  if (req.session.user_id) {
    res.redirect('/');
  } else {
    res.render('login', {client_url_path: app_locals.client_url_path});
  }
});

router.post('/login', function (req, res) {
  var req_keys = _.keys(req.body);
  if (req_keys.indexOf('sign-in') !== -1) {
    handle_sign_in(req, res);
  } else if (req_keys.indexOf('sign-up') !== -1) {
    handle_sign_up(req, res);
  } else {
    res.status(CONST.HTTP_RES_CODE.client_err)
      .json({error: ["expected request to either specify ",
                     "sign up or sign in"].join('')});
  }
});

router.get('/logout', function (req, res) {
  req.session.user_id = undefined;
  res.redirect('/');
});

router.get('/user', function (req, res) {
  if (req.session.user_id) {
    models.get_model(models.get_db(), models.User)
      .findById(req.session.user_id)
      .then(function (user) {
        if (user === null) {
          res.status(CONST.HTTP_RES_CODE.server_error)
            .json({error: "failed to look up user by id"});
        } else {
          res.json(user.toJSON());
        }
      });
  } else {
    res.json(null);
  }
});

module.exports.router = router;
module.exports.make_login_req_mw = make_login_req_mw;
