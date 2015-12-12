var angular = require('angular');
var request = require('superagent');
var CONST = require('./constants');

// todo: handle all HTTP API calls through services
//       and update login status using a module global

var services = angular.module(CONST.APP_NAME + '.services', []);

services.factory('loginProvider', function() {

  var loading = true;
  var user;

  request.get('/user')
    .accept('json')
    .end(function (err, res) {
      if (err) {
        throw new Error("couldn't get login status");
      }
      user = res.body;
      loading = false;
    });

  var logged_in = function () {
    return user && user !== null;
  };

  var is_loading = function () {
    return loading;
  };

  return {
    logged_in: logged_in,
    loading: is_loading
  };
});
