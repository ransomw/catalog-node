define([
  'angular',
  'constants',
  'superagent'
], function (angular, CONST, request) {

  var controllers = angular.module(
    CONST.APP_NAME+'.controllers', []);


  // todo: nested views
  // todo: custom filter for items
  // todo: service/factory for data
  // todo: frontend routing like python app when categories are clicked
  controllers.controller('HomeCtrl', [
    '$scope',
    function HomeCtrl($scope) {

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

      request.get('/api/categories')
        .accept('json')
        .end(function (err, res) {
          $scope.$apply(function () {
            $scope.categories = res.body;
          });
        });

      request.get('/api/items')
        .accept('json')
        .end(function (err, res) {
          items = res.body.sort(function (i1, i2) {
            var t1 = new Date(i1.updatedAt);
            var t2 = new Date(i2.updatedAt);
            return t1.getTime() - t2.getTime();
          });
          $scope.$apply(function () {
            $scope.items = items;
          });
        });
    }]);


  controllers.controller('RItemCtrl', [
    '$scope', '$routeParams',
    function RItemCtrl($scope, $routeParams) {
      debugger;
    }]);

});
