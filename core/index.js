var Q = require('q');

var catalog_server = require('./server');
var models = require('./server/models');

var build_client = require('./build_client');

var exports = {};

/* client - one of CONST.CLIENTS values
 * opts -
 *  cts: continuous build
 */
exports.build_client = build_client;

exports.run_server = function (config_arg, port_arg) {
  var config = config_arg || {};
  var port = port_arg || process.env.PORT || 3000;
  var app = catalog_server.make_app(config);
  var deferred = Q.defer();
  var server = app.listen(port, function () {
    deferred.resolve({server: server, port: port});
  });
  server.on('error', function (err) {
    deferred.reject(err);
  });
  return deferred.promise;
};

exports.init_db = function (opt_args) {
  var opts = opt_args || {};
  var app = catalog_server.make_app();
  var sqlite_path;
  if (opts.SQLITE_PATH) {
    sqlite_path = opts.SQLITE_PATH;
  } else {
    sqlite_path = app.locals.config.SQLITE_PATH;
  }
  return models.lots_of_items({
    sqlite_path: sqlite_path
  });
};

module.exports = exports;
