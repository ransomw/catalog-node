/*global require, module */
const _ = require('lodash');
const Sqlize = require('sequelize');
const Router = require('../express_ext').Router;
const Models = require('../models');
const CONST = require('../const');
const util = require('../util');
const make_login_req_mw = require('./auth').make_login_req_mw;

const API_ENDPOINTS = CONST.API_ENDPOINTS;

// set in register callback
var router;
var get_db;
var models;

const make_router = function () {
  router = Router();
  router.on_register = on_register_router;
  return router;
};

// todo: support querying using comparisons... after integration tests
//       like ?createdAt__gt=val in URL and other typical querying stuff
//       like ordering and restricting to a particular count
var make_models_endpoint = function (model_def) {
  var model = models.get_model(get_db(), model_def);
  return function (req, res) {
    var query_params = _.keys(req.query);
    var set_res = function (instances) {
      res.json(_.map(instances, function (instance) {
        return instance.toJSON();
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
        res.status(CONST.HTTP_RES_CODE.client_err)
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

var api_login_req = make_login_req_mw(function (res) {
  res.status(CONST.HTTP_RES_CODE.auth_err)
    .json({error: "unauthorized"});
});

/* create */
var make_model_endpoint = function(model_def) {
  return function (req, res) {
    models.get_model(get_db(), model_def)
      .create(req.body)
      .then(function (new_instance) {
        res.json({});
      }, function (err) {
        res.status(CONST.HTTP_RES_CODE.client_err)
          .json({error: err.toString()});
      });
  };
};

/* update, delete */
var make_instance_endpoint = function(model_def, action) {
  return function(req, res) {
    var instance_id = util.filter_int(req.params.id);
    if (isNaN(instance_id) || instance_id < 0) {
      res.status(CONST.HTTP_RES_CODE.client_err)
        .json({error: "instance id must be a non-negative integer"});
    } else {
      models.get_model(get_db(), model_def)
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
            res.status(CONST.HTTP_RES_CODE.client_err)
              .json({error: "model instance lookup by id failed",
                     data: instance_id});
          }
        }, function (err) {
          if (err instanceof Sqlize.ValidationError) {
            res.status(CONST.HTTP_RES_CODE.client_err);
          } else {
            res.status(CONST.HTTP_RES_CODE.server_err);
          }
          res.json({error: err.toString()});
        });
    }
  };
};

var register_endpoints = function () {
  router.get(API_ENDPOINTS.categories,
             make_models_endpoint(models.Category));
  router.get(API_ENDPOINTS.items,
             make_models_endpoint(models.Item));

  router.post(API_ENDPOINTS.item,
              api_login_req, make_model_endpoint(models.Item));

  // could use router.param, tho with entire handler abstracted,
  // there's no duplicate code anyway
  router.post(API_ENDPOINTS.item + '/:id', api_login_req,
              make_instance_endpoint(models.Item, function (req, item) {
                return item.updateAttributes(
                  _.pick(req.body, [
                    'title',
                    'description',
                    'category_id'
                  ]));
              }));

  router.delete(API_ENDPOINTS.item + '/:id', api_login_req,
                make_instance_endpoint(models.Item, function (req, item) {
                  return item.destroy();
                }));
};

const on_register_router = function (app) {
  // todo: duplicate code w/ auth.js
  if (!app.locals.config.PERSISTANCE_TYPE) {
    throw new Error("persistance type not defined in app config");
  }
  models = (function (p_type) {
    return new Models(p_type);
  }(app.locals.config.PERSISTANCE_TYPE));
  if (!app.locals.config.SQLITE_PATH) {
    throw new Error("sqlite path not defined in app config");
  }
  get_db = (function (sqlite_path) {
    return function () {
      return models.get_db({
        sqlite_path: sqlite_path
      });
    };
  }(app.locals.config.SQLITE_PATH));
  //
  register_endpoints();
};

var exports = {};

exports.make_router = make_router;

module.exports = exports;
