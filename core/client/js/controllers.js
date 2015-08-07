define([
  'angular',
  'constants',
  'superagent'
], function (angular, CONST, request) {


  var ENDPOINTS = {
    categories: '/api/categories',
    items: '/api/items'
  };

  // todo: check for error in superagent callbacks
  // todo: replace throws with information in the UI

  var controllers = angular.module(
    CONST.APP_NAME+'.controllers', []);


  controllers.controller('HeaderCtrl', [
    '$scope', 'loginProvider',
    function HeaderCtrl($scope, loginProvider) {
      $scope.logged_in = loginProvider.logged_in;
    }]);


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

      request.get(ENDPOINTS.categories)
        .accept('json')
        .end(function (err, res) {
          $scope.$apply(function () {
            $scope.categories = res.body;
            // ensure categories populated before items
            // since we need to get category name before displaying
            // item info in the view
            request.get(ENDPOINTS.items)
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
          });
        });

    }]);


  controllers.controller('RItemCtrl', [
    '$scope', '$routeParams',
    function RItemCtrl($scope, $routeParams) {
      var cat_name = $routeParams.catName;
      var item_title = $routeParams.itemTitle;
      var item;

      // todo: use promises rather than nested callbacks
      request.get(ENDPOINTS.categories)
        .accept('json')
        .query({name: cat_name})
        .end(function (err, res) {
          if (res.body.length !== 1) {
            throw new Error("expected exactly one category");
          }
          var cat = res.body[0];
          request.get(ENDPOINTS.items)
            .accept('json')
            .query({title: item_title,
                    category_id: cat.id})
            .end(function (err, res) {
              if (res.body.length !== 1) {
                throw new Error("expected exactly one item");
              }
              item = res.body[0];
              $scope.$apply(function () {
                $scope.item = item;
              });
            });
        });
    }]);

});
