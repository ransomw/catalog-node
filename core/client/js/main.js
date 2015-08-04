require.config({
  paths: {
    angular: 'vendor/angular/angular',
    angularRoute: 'vendor/angular-route/angular-route'
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
             templateUrl: '/static/partials/home.html',
             controller: 'HomeCtrl'
           })
           .otherwise({
             redirectTo: '/'
           });
       }]);

    angular.bootstrap(document, [CONST.APP_NAME]);

  });

});
