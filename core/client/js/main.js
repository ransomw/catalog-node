require.config({
  paths: {
    angular: 'vendor/bower/angular/angular',
    angularRoute: 'vendor/bower/angular-route/angular-route',
    superagent: 'vendor/superagent-1.3.0'
  },
  baseUrl: 'static/js',
  shim: {
		'angular' : {'exports' : 'angular'},
		'angularRoute': ['angular']
	},
	priority: [
		"angular"
	]
});

window.name = "NG_DEFER_BOOTSTRAP!";

// todo: look into reverse routing (like flask's url_for) in angular

require([
  'angular',
  'constants',
  'angularRoute',
  'controllers'
], function(angular, CONST) {

  angular.element(document).ready(function () {
    var catalog_app = angular.module(CONST.APP_NAME, [
      'ngRoute',
      CONST.APP_NAME+'.controllers'
    ]);

    catalog_app.config(
      ['$routeProvider',
       function($routeProvider) {
         $routeProvider
           .when('/', {
             templateUrl: CONST.PARTIAL_BASE + 'home.html',
             controller: 'HomeCtrl'
           })
         // todo: be sure to place items url before here
         //       if rewriting the home controller to handle
         //       a url scheme more like the python client
           .when('/catalog/:catName/:itemName', {
             templateUrl: CONST.PARTIAL_BASE + 'item.html',
             controller: 'RItemCtrl' // R for Read
           })
           .otherwise({
             redirectTo: '/'
           });
       }]);

    angular.bootstrap(document, [CONST.APP_NAME]);

  });

});
