var routes = require('../routes');

module.exports = [
  '$scope', '$routeParams', 'loginProvider','catalogProvider',
  function ($scope, $routeParams, loginProvider, catalog) {

    var cat_name = $routeParams.catName;
    var item_title = $routeParams.itemTitle;

    $scope.reverse = routes.reverse;
    $scope.loading = true;
    $scope.logged_in = loginProvider.logged_in;

    catalog
      .get_categories({name: cat_name})
      .then(function (cats) {
        if (cats.length !== 1) {
          throw new Error("expected exactly one category");
        }
        return cats[0];
      }).then(function (cat) {
        return catalog.get_items({title: item_title,
                                  category_id: cat.id});
      }).then(function (items) {
        if (items.length !== 1) {
          throw new Error("expected exactly one item");
        }
        $scope.$apply(function () {
          $scope.item = items[0];
        });
      }).finally(function () {
        $scope.$apply(function () {
          $scope.loading = false;
        });
      });

  }];
