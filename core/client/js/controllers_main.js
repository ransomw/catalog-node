var angular = require('angular');
var _ = require('lodash');
var CONST = require('./constants');
var util = require('./util');

var controllers = require('./controllers');

// todo: check for error in superagent callbacks
// todo: replace throws with information in the UI

var angular_module_controllers = angular.module(
  CONST.APP_NAME+'.controllers', []);


util.spread(
  _.pairs(_.omit(controllers, ['header'])),
  // anon fn to make usage explicit
  function (controller_name, controller_def) {
    angular_module_controllers
      .controller(controller_name, controller_def);
  });


