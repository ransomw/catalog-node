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
  'controllers',
  'services'
], function(angular, CONST) {

  // todo: use angular logging on errors

  angular.element(document).ready(function () {
    var catalog_app = angular.module(CONST.APP_NAME, [
      'ngRoute',
      CONST.APP_NAME + '.controllers',
      CONST.APP_NAME + '.services'
    ]);

    catalog_app.config(
      ['$routeProvider',
       function($routeProvider) {
         $routeProvider
           .when('/', {
             templateUrl: CONST.PARTIAL_BASE + 'home.html',
             controller: 'HomeCtrl'
           })
           .when('/catalog/item/new', {
             templateUrl: CONST.PARTIAL_BASE + 'item_add_edit.html',
             controller: 'CUItemCtrl' // C for Create, U for Update
           })
           .when('/catalog/:title/edit', {
             templateUrl: CONST.PARTIAL_BASE + 'item_add_edit.html',
             controller: 'CUItemCtrl' // C for Create, U for Update
           })
           .when('/catalog/:title/delete', {
             templateUrl: CONST.PARTIAL_BASE + 'item_delete.html',
             controller: 'DItemCtrl' // D for Delete
           })
           .when('/catalog/:catName/:itemTitle', {
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
