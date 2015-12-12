var Q = require('q');
var CONST = require('../constants');

// todo: wrong behavior when no category is selected
// todo: form validation

module.exports = [
  '$scope', '$location', '$routeParams', 'catalogProvider',
  function CUItemCtrl($scope, $location, $routeParams, catalog) {

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
      $scope.loading = true;
      var add_edit_promise;
      if ($scope.item.id) {
        add_edit_promise = catalog
          .update_item($scope.item, $scope.item.id);
      } else {
        add_edit_promise = catalog
          .create_item($scope.item);
      }
      add_edit_promise.then(function () {
        $scope.$apply(function () {
          $location.path('/');
        });
      }).catch(function (err) {
        $scope.err_msg = err.toString();
      }).finally(function () {
        $scope.loading = false;
      });
    };

    // null trick makes for messy flow here (?)
    Q.all([catalog.get_categories(),
           item_title ? catalog.get_items({title: item_title}) : null])
      .spread(function (cats, items) {
        if (items !== null && items.length !== 1) {
          throw new Error("expected exactly one item");
        }
        $scope.$apply(function () {
          $scope.categories = cats;
          if (items !== null) {
            $scope.item = items[0];
          }
        });
      }).finally(function () {
        $scope.$apply(function () {
          $scope.loading_init = false;
        });
      });

  }];
