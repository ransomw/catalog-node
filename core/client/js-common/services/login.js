var request = require('superagent');
var CONST = require('../constants');

module.exports = function () {

  var loading = true;
  var user;

  request.get(CONST.AUTH_ENDPOINTS.user)
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
};
