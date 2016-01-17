var _ = require('lodash');
var Q = require('q');
var bcrypt = require('bcrypt');
var models = require('../models');
var CONST = require('../const');
var util = require('../util');
var router = new require('../express_ext').Router();

var SALT_LEN = 8;

// set in register callback
var client_url_path;
var get_db;

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

var handle_sign_in = function (req, res) {
  var user_promise = Q().then(function () {
    return models.get_model(get_db(), models.User)
      .findOne({where: {email: req.body.email}});
  });
  var login_res_promise = user_promise.then(function (user) {
    var deferred;
    if (user === null) {
      res.status(CONST.HTTP_RES_CODE.client_err)
        .json({error: "user record for email not found",
               data: req.body.email});
      return null;
    }
    if (user.get('password') === null) {
      res.status(CONST.HTTP_RES_CODE.client_err)
        .json({error: ["user account created with third-party ",
                       "service sign up locally or sign in with ",
                       "third-party"].join('')});
      return null;
    }
    deferred = Q.defer();
    bcrypt.compare(
      req.body.password, user.get('password'),
      function (err, res) {
        if (err) {
          deferred.reject(err);
        } else {
          deferred.resolve(res);
        }
      });
    return deferred.promise;
  });
  Q.all([user_promise, login_res_promise])
    .spread(util.null_wrap(function (user, pass_is_correct) {
      if (pass_is_correct) {
        req.session.user_id = user.get('id');
        res.redirect('/');
      } else {
        res.status(CONST.HTTP_RES_CODE.client_err)
          .json({error: "bad password"});
      }
    })).catch(function (err) {
      res.status(CONST.HTTP_RES_CODE.server_err)
        .json({error: err.toString()});
    });
};

var handle_sign_up_pass_matched = function (req, res) {
  var password_hash_promise = Q().then(function () {
    var deferred = Q.defer();
    bcrypt.hash(req.body.password, SALT_LEN, function(err, hash) {
      if (err) {
        deferred.reject(err);
      } else {
        deferred.resolve(hash);
      }
    });
    return deferred.promise;
  });
  var user_promise = Q().then(function () {
    return models.get_model(get_db(), models.User)
      .findOne({where: {email: req.body.email}});
  });
  var create_user_promise = Q.all(
    [password_hash_promise,
     user_promise]).spread(function (password_hash, user) {
       if (user === null) {
         return models.get_model(get_db(), models.User)
           .create({
             name: req.body.name,
             email: req.body.email,
             password: password_hash
           });
       }
       if (user.get('password') !== null) {
         res.status(CONST.HTTP_RES_CODE.client_err)
           .json({error: "user already registered"});
         return null; // null_wrap callbacks will pass
       }
       return user;
     });
  Q.all(
    [password_hash_promise,
     create_user_promise]).spread(
       util.null_wrap(function (password_hash, user) {
         // sequelize weirdness: .null attr is id of newly-created item
         if (user.null) {
           return user;
         }
         return user.updateAttributes({
           name: req.body.name,
           password: password_hash
         });
       })).then(util.null_wrap(function (user) {
         req.session.user_id = user.get('id') || user.null;
         res.redirect('/');
       })).catch(function (err) {
         res.status(CONST.HTTP_RES_CODE.server_err)
           .json({error: err.toString()});
       });
};

var handle_sign_up = function (req, res) {
  if (req.body.password !== req.body['password-confirm']) {
    res.status(CONST.HTTP_RES_CODE.client_err)
      .json({error: "passwords don't match"});
  } else {
    handle_sign_up_pass_matched(req, res);
  }
};

router.get(CONST.AUTH_ENDPOINTS.login, function (req, res) {
  if (req.session.user_id) {
    res.redirect('/');
  } else {
    res.render('login', {client_url_path: client_url_path});
  }
});

router.post(CONST.AUTH_ENDPOINTS.login, function (req, res) {
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

router.get(CONST.AUTH_ENDPOINTS.logout, function (req, res) {
  req.session.user_id = undefined;
  res.redirect('/');
});

router.get(CONST.AUTH_ENDPOINTS.user, function (req, res) {
  if (req.session.user_id) {
    models.get_model(get_db(), models.User)
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

router.on_register = function (app) {
  if (typeof app.locals.client_url_path === 'undefined') {
    throw new Error("app using auth router must define " +
                    "'client_url_path' in locals");
  } else if (typeof app.locals.client_url_path !== 'string') {
    throw new Error("app.locals.client_url_path not string type");
  } else {
    client_url_path = app.locals.client_url_path;
  }
  if (app.locals.config.SQLITE_PATH) {
    get_db = (function (sqlite_path) {
      return function () {
        return models.get_db({
          sqlite_path: sqlite_path
        });
      };
    }(app.locals.config.SQLITE_PATH));
  } else {
    throw new Error("sqlite path not defined in app config");
  }
};

module.exports.router = router;
module.exports.make_login_req_mw = make_login_req_mw;
