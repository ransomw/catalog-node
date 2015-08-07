define([
  'angular',
  'constants',
  'superagent'
], function (angular, CONST, request) {
  var services = angular.module(CONST.APP_NAME + '.services', []);

  services.factory('loginProvider', function() {

    var user;

    request.get('/user')
      .accept('json')
      .end(function (err, res) {
        if (err) {
          throw new Error("couldn't get login status");
        }
        user = res.body;
      });

    var logged_in = function () {
      return user !== null;
    };

    return {
      logged_in: logged_in
    };
  });
});
