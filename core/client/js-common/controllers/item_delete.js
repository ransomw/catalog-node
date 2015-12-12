var request = require('superagent');
var CONST = require('../constants');

// todo: form validation

module.exports = [
  '$scope', '$location', '$routeParams',
  function DItemCtrl($scope, $location, $routeParams) {

    var item_id;

    // status for POST
    $scope.loading = false;
    // status for initial GET
    $scope.loading_init = true;

    $scope.delItem = function () {
      $scope.loading = true;
      request.del(CONST.ENDPOINTS.item_new + '/' + item_id)
        .end(function (err, res) {
          $scope.loading = false;
          if (err) {
            throw new Error("delete failed");
          }
          $scope.$apply(function () {
            $location.path('/');
          });
        });
    };

    request.get(CONST.ENDPOINTS.items)
      .accept('json')
      .query({title: $routeParams.title})
      .end(function (err, res) {
        if (res.body.length !== 1) {
          throw new Error("expected exactly one item");
        }
        $scope.$apply(function () {
          item_id = res.body[0].id;
          if (!item_id) {
            throw new Error("expected item id to be defined");
          }
          $scope.loading_init = false;
        });
      });

  }];
