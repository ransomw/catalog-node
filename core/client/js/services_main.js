var angular = require('angular');

var CONST = require('./constants');
var services = require('./services');

var angular_module_services = angular
      .module(CONST.APP_NAME + '.services', []);

angular_module_services
  .factory('loginProvider', services.login);
angular_module_services
  .factory('catalogProvider', services.catalog);
