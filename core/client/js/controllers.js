define([
  'angular',
  'constants',
  'superagent'
], function (angular, CONST, request) {


  var ENDPOINTS = {
    categories: '/api/categories',
    items: '/api/items',
    item_new: '/api/item'
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
    '$scope', 'loginProvider',
    function HomeCtrl($scope, loginProvider) {
      $scope.logged_in = loginProvider.logged_in;

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


  // Read item controller
  controllers.controller('RItemCtrl', [
    '$scope', '$routeParams', 'loginProvider',
    function RItemCtrl($scope, $routeParams, loginProvider) {

      var cat_name = $routeParams.catName;
      var item_title = $routeParams.itemTitle;
      var item;

      $scope.logged_in = loginProvider.logged_in;

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

  // todo: form validation
  controllers.controller('CUItemCtrl', [
    '$scope', '$location', '$routeParams',
    function CUItemCtrl($scope, $location, $routeParams) {

      var item_title = $routeParams.title;

      if (item_title) {
        $scope.action = "Add";
      } else {
        $scope.action = "Edit";
      }
      $scope.loading = true;
      $scope.err_msg = undefined;

      $scope.addEditItem = function (itemForm) {
        var endpoint = ENDPOINTS.item_new;
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
              // todo: appears not to be working ...
              $location.path('/');
            }
          });
      };

      request.get(ENDPOINTS.categories)
        .accept('json')
        .end(function (err, res) {
          $scope.$apply(function () {
            $scope.categories = res.body;
            if (item_title) {
              request.get(ENDPOINTS.items)
                .accept('json')
                .query({title: item_title})
                .end(function (err, res) {
                  if (res.body.length !== 1) {
                    throw new Error("expected exactly one item");
                  }
                  $scope.$apply(function () {
                    $scope.item = res.body[0];
                    $scope.loading = false;
                  });
                });
            } else {
              $scope.loading = false;
            }
          });
        });

    }]);

});
