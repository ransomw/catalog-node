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
  'controllers',
  'angularRoute',
  'services'
], function(angular, CONST, controllers) {

  // todo: use angular logging on errors

  angular.element(document).ready(function () {
    var catalog_app = angular.module(CONST.APP_NAME, [
      'ngRoute',
      CONST.APP_NAME + '.controllers',
      CONST.APP_NAME + '.services'
    ]);

    // todo: special characters (%20 for space, etc) in URLs look bad
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

    catalog_app.directive('navBar',
      ['$templateRequest', '$compile', '$controller',
       function($templateRequest, $compile, $controller) {

         controllers.HeaderCtrl.$inject = ['$scope',
                                           '$templateRequest',
                                           'loginProvider'];

         var directive_link = function(scope, $el, attrs) {
           var locals = {};
           locals.$scope = scope;

           // just for api reference
           console.log(attrs.myDataSample);

           $templateRequest(CONST.PARTIAL_BASE + 'nav.html')
             .then(function (template) {
               var link;
               var controller;
               $el.html(template);
               link = $compile($el.contents());
               controller = $controller(controllers.HeaderCtrl,
                                            locals);
               $el.data('$ngControllerController', controller);
               $el.children().data('$ngControllerController',
                                   controller);
               link(scope);
             });

         };

         return {
           link: directive_link
         };
       }]);


    angular.bootstrap(document, [CONST.APP_NAME]);

  });

});
