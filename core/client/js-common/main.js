window.name = "NG_DEFER_BOOTSTRAP!";

var angular = require('angular');
require('angular-route');
var CONST = require('./constants');
require('./controllers_main');
var controllers = require('./controllers');
var routes = require('./routes');
require('./services_main');

angular.element(document).ready(function () {
  var catalog_app = angular.module(CONST.APP_NAME, [
    'ngRoute',
    CONST.APP_NAME + '.controllers',
    CONST.APP_NAME + '.services'
  ]);

  catalog_app.config(
    ['$routeProvider',
     function($routeProvider) {
       routes.get_when_args().forEach(function (when_args) {
         $routeProvider.when
           .apply($routeProvider, when_args);
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
       var HeaderCtrl = controllers.header.slice(-1)[0];
       HeaderCtrl.$inject = controllers.header.slice(0, -1);
       var directive_link = function(scope, $el, attrs) {
         var locals = {};
         locals.$scope = scope;
         // for api reference
         // console.log(attrs.myDataSample);
         $templateRequest(CONST.PARTIAL_BASE + 'nav.html')
           .then(function (template) {
             var link;
             var controller;
             $el.html(template);
             link = $compile($el.contents());
             controller = $controller(HeaderCtrl, locals);
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
