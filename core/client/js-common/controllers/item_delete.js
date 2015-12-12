
// todo: form validation

module.exports = [
  '$scope', '$location', '$routeParams', 'catalogProvider',
  function DItemCtrl($scope, $location, $routeParams, catalog) {

    var item_id;

    // status for POST
    $scope.loading = false;
    // status for initial GET
    $scope.loading_init = true;

    $scope.delItem = function () {
      $scope.loading = true;
      catalog.delete_item(item_id).then(function () {
        $scope.$apply(function () {
          $location.path('/');
        });
      }).catch(function (err) {
        throw new Error("delete failed: " + err.toString());
      }).finally(function () {
        $scope.$apply(function () {
          $scope.loading = false;
        });
      });
    };

    catalog.get_items({title: $routeParams.title})
      .then(function (items) {
        var item;
        if (items.length !== 1) {
          throw new Error("expected exactly one item");
        }
        item_id = items[0].id;
        if (!item_id) {
          throw new Error("expected item id to be defined");
        }
      }).finally(function () {
        $scope.$apply(function () {
          $scope.loading_init = false;
        });
      });

  }];
