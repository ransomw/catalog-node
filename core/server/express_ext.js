var _ = require('lodash');
var express = require('express');

/*
 * Extend express.js functionality
 */

// todo: express uses non-standard __proto__ inheritance scheme
//       despite warnings at
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/proto
//       see if there's a way to skew toward prototype-based inheritance

/*
 * Register router callbacks a-la Flask blueprints
 */

var on_register = function (app) {};

var Router = function () {
  var router = express.Router.apply(this, arguments);
  router.on_register = on_register;
  return router;
};
Router.prototype = Object.create(express.Router.prototype);
_.merge(Router, express.Router);

var register_router = function (path, router) {
  var self = this;
  if (typeof router.on_register !== 'function') {
    throw new Error("attempt to register invalid router");
  } else {
    router.on_register(this);
  }
  self.use(path, router);
};

var express_ext = function () {
  var app = express.apply(this, arguments);
  app.register_router = register_router;
  return app;
};
express_ext.prototype = Object.create(express.prototype);
_.merge(express_ext,
        _.omit(express, ['Router']));


express_ext.Router = Router;


module.exports = express_ext;
