define([
  'angular',
  'constants'
], function (angular, CONST) {

  var controllers = angular.module(
    CONST.APP_NAME+'.controllers', []);

  controllers.controller('HomeCtrl', [
    '$scope',
    function HomeCtrl($scope) {
      console.log("top of HomeCtrl");
    }]);

});
