var request = require('superagent');
var CONST = require('../constants');

// todo: wrong behavior when no category is selected
// todo: form validation

module.exports = [
  '$scope', '$location', '$routeParams',
  function CUItemCtrl($scope, $location, $routeParams) {

    var item_title = $routeParams.title;

    if (item_title) {
      $scope.action = "Edit";
    } else {
      $scope.action = "Add";
    }

    // status for POST
    $scope.loading = false;
    // status for initial GET
    $scope.loading_init = true;

    $scope.err_msg = undefined;

    $scope.addEditItem = function (itemForm) {
      var endpoint = CONST.ENDPOINTS.item_new;
      $scope.loading = true;
      if ($scope.item.id) {
        endpoint += '/' + $scope.item.id;
      }
      request.post(endpoint)
        .send($scope.item)
        .accept('json')
        .end(function (err, res) {
          $scope.loading = false;
          if (err !== null) {
            $scope.err_msg = res.body.error;
          } else {
            $scope.$apply(function () {
              $location.path('/');
            });
          }
        });
    };

    request.get(CONST.ENDPOINTS.categories)
      .accept('json')
      .end(function (err, res) {
        $scope.$apply(function () {
          $scope.categories = res.body;
          if (item_title) {
            request.get(CONST.ENDPOINTS.items)
              .accept('json')
              .query({title: item_title})
              .end(function (err, res) {
                if (res.body.length !== 1) {
                  throw new Error("expected exactly one item");
                }
                $scope.$apply(function () {
                  $scope.item = res.body[0];
                  $scope.loading_init = false;
                });
              });
          } else {
            $scope.loading_init = false;
          }
        });
      });

  }];
