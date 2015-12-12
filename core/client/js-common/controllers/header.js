var routes = require('../routes');

module.exports = [
  '$scope', '$templateRequest', 'loginProvider',
  function ($scope, $templateRequest, loginProvider) {
  $scope.reverse = routes.reverse;
  $scope.loading = true;
  $scope.logged_in = loginProvider.logged_in;
  $scope.$watch(loginProvider.loading, function () {
    $scope.loading = loginProvider.loading();
  });
}];
