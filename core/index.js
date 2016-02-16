/*global require, process, module */
var Q = require('q');
var _ = require('lodash');
var freeze = require('deep-freeze');

var catalog_server = require('./server');
var Models = require('./server/models');

var build_client = require('./build_client');

var M_CONST = require('./server/models/const');

var CONST = {};
var exports = {};

CONST.DEFAULTS = (function () {
  var default_config = catalog_server.make_app().locals.config;
  return {
    PERSISTANCE_TYPE: default_config.PERSISTANCE_TYPE
  };
}());
// todo: check for duplicate keys w/ not-equal values
//       consider abstracting to a safe_merge function and use elsewhere
_.merge(CONST, M_CONST);

freeze(CONST);

exports.CONST = CONST;

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
  var opts = _.cloneDeep(opt_args) || {};
  var app = catalog_server.make_app();
  var p_type_key = 'PERSISTANCE_TYPE';
  // map init_db options to lots_of_items options
  var opts_map = {
    SQLITE_PATH: 'sqlite_path'
  };
  opts = _.merge({}, _.pick(app.locals.config, [
    'SQLITE_PATH',
    p_type_key
  ]), opts);
  return (new Models(opts[p_type_key])).lots_of_items(
    _.mapKeys(
      _.omit(opts, [p_type_key]),
      function (val, key) {
        return opts_map[key] || key;
      })
  );
};

module.exports = exports;
