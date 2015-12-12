var request = require('superagent');
var CONST = require('../constants');
var routes = require('../routes');

module.exports = [
  '$scope', '$routeParams', 'loginProvider',
  function ($scope, $routeParams, loginProvider) {

    var cat_name = $routeParams.catName;
    var item_title = $routeParams.itemTitle;
    var item;

    $scope.reverse = routes.reverse;
    $scope.loading = true;
    $scope.logged_in = loginProvider.logged_in;

    // todo: use promises rather than nested callbacks
    request.get(CONST.ENDPOINTS.categories)
      .accept('json')
      .query({name: cat_name})
      .end(function (err, res) {
        if (res.body.length !== 1) {
          throw new Error("expected exactly one category");
        }
        var cat = res.body[0];
        request.get(CONST.ENDPOINTS.items)
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
              $scope.loading = false;
            });
          });
      });
  }];
