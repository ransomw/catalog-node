var Q = require('q');
var routes = require('../routes');
var util = require('../util');

// todo: nested views
// todo: custom filter for items
// todo: frontend routing like python app when categories are clicked

module.exports = [
  '$scope', 'loginProvider', '$route', 'catalogProvider',
  function HomeCtrl($scope, loginProvider, $route, catalog) {
    $scope.reverse = routes.reverse;
    $scope.logged_in = loginProvider.logged_in;
    $scope.loading = true;

    $scope.items_title = "Latest Items";
    $scope.categories = [];
    $scope.items = [];
    var items = [];

    var get_cat = function (cat_id) {
      var filtered_cats = $scope.categories.filter(function (cat) {
        return cat.id === cat_id;
      });
      if (filtered_cats.length !== 1) {
        throw new Error("expected exactly one category with given id");
      }
      return filtered_cats[0];
    };

    $scope.getCatName = function (cat_id) {
      return get_cat(cat_id).name;
    };

    $scope.showCat = function (cat_id) {
      var cat = get_cat(cat_id);
      var cat_items = items.filter(function (item) {
        return item.category_id === cat_id;
      });
      $scope.items = cat_items;
      $scope.items_title = [
        cat.name,
        "Items",
        "("+cat_items.length+" items)"
      ].join(' ');
    };

    // categories must be populated before items
    Q.all([catalog.get_categories(), catalog.get_items()])
      .spread(function (cats, items_update) {
        items = items_update.sort(util.sort_items_updated_at);
        $scope.$apply(function () {
          $scope.categories = cats;
          $scope.items = items;
          $scope.loading = false;
        });
      });

  }];
