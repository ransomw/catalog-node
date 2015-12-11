window.name = "NG_DEFER_BOOTSTRAP!";

var angular = require('angular');
require('angular-route');
var CONST = require('./constants');
var controllers = require('./controllers');
var routes = require('./routes');
require('./services');

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

       routes.defs.forEach(function (def) {
         $routeProvider.when
           .apply($routeProvider, routes.make_when_args(def));
       });
       $routeProvider
         .otherwise({
           redirectTo: '/'
         });

     }]);

  catalog_app.directive(
    'navBar',
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
