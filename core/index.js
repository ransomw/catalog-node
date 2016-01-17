var fs = require('fs');
var fse = require('fs-extra');
var Q = require('q');
var path = require('path');
var _ = require('lodash');
var browserify = require('browserify');
var watchify = require('watchify');
var less = require('less');

var app = require('./server');
var models = require('./server/models'); // needs to be after app import
var CONST = require('./common/const');

// path for generated assets, todo: duplicated between here and template
var PATH_CLIENT_BUNDLE = path.join(
  CONST.CLIENT_STATIC_DIR, 'js', 'bundle.js');
var PATH_GEN_STYLES = path.join(
  CONST.CLIENT_STATIC_DIR, 'css');
// client source paths
var PATH_CLIENT = path.join(
  'core', 'client');
var PATH_CLIENT_MAIN = path.join(
  PATH_CLIENT, 'angular', 'js', 'main.js');
var PATH_CLIENT_PARTIALS = path.join(
  PATH_CLIENT, 'angular', 'partials');
var PATH_CLIENT_STATIC_SRC = path.join(
  PATH_CLIENT, 'static');
var PATH_SRC_STYLES = path.join(
  PATH_CLIENT, 'less');

var build_style = function(filename) {
  var path_src = path.join(PATH_SRC_STYLES, filename);
  var path_dest = path.join(
    PATH_GEN_STYLES,
    path.basename(filename, '.less')) + '.css';
  return Q().then(function () {
    var deferred = Q.defer();
    fs.readFile(path_src, 'utf8', function (err, data) {
      if (err) {
        deferred.reject(err);
      } else {
        deferred.resolve(data);
      }
    });
    return deferred.promise;
  }).then(function (less_input) {
    return less.render(less_input);
  }).then(function (less_output) {
    var css = less_output.css;
    var deferred = Q.defer();
    fs.writeFile(path_dest, css, function (err) {
      if (err) {
        deferred.reject(err);
      } else {
        deferred.resolve();
      }
    });
    return deferred.promise;
  });
};

var build_styles = function () {
  return Q().then(function () {
    var deferred = Q.defer();
    fs.readdir(PATH_SRC_STYLES, function(err, files) {
      if (err) {
        deferred.reject(err);
      } else {
        deferred.resolve(files);
      }
    });
    return deferred.promise;
  }).then(function (files) {
    return Q.all(files.map(build_style));
  });
};

var watch_styles = function () {
  build_styles().then(function () {
    fs.watch(PATH_SRC_STYLES, function () {
      build_styles();
    });
  });
};

var make_populate_dir = function (src, dest) {
  return function () {
    if (fs.existsSync(dest)) {
      fse.removeSync(dest);
    }
    fse.copySync(src, dest);
  };
};

var populate_client_static = function () {
  (make_populate_dir(
    PATH_CLIENT_STATIC_SRC, CONST.CLIENT_STATIC_DIR)());
  (make_populate_dir(
    PATH_CLIENT_PARTIALS,
    path.join(CONST.CLIENT_STATIC_DIR, 'partials'))());
};

var make_write_bundle = function (bfy, path_bundle) {
  return function () {
    var deferred = Q.defer();
    var stream_bundle = bfy.bundle();
    stream_bundle.pipe(fs.createWriteStream(path_bundle));
    stream_bundle.on('end', function () {
      deferred.resolve();
    });
    return deferred.promise;
  };
};

var build_client_js = function (cts) {
  var bfy = browserify({
    entries: [PATH_CLIENT_MAIN],
    cache: {},
    packageCache: {},
    debug: true, // source maps
    plugin: cts ? [watchify] : []
  });
  var write_bundle = make_write_bundle(bfy, PATH_CLIENT_BUNDLE);
  if (cts) {
    bfy.on('update', write_bundle);
  }
  return write_bundle();
};

var exports = {};

/* client - one of CONST.CLIENTS values
 * opts -
 *  cts: continuous build
 */
exports.build_client = function (client, opt_args) {
  var opts = opt_args || {};
  populate_client_static();
  if (opts.cts) {
    watch_styles();
    return build_client_js(true);
  } else {
    return Q().then(function () {
      return build_client_js();
    }).then(function () {
      return build_styles();
    });
  }
};

exports.run_server = function (config_arg, port_arg) {
  var config = config_arg || {};
  var port = port_arg || process.env.PORT || 3000;
  var server;
  var deferred = Q.defer();
  var unallowed_config = _.difference(
    config,
    ['SERVER', 'SQLITE_PATH']);
  if (unallowed_config.length !== 0) {
    throw new Error("unallowed config keys: " + unallowed_config);
  }
  _.merge(app.locals.config, _.omit(config, ['SQLITE_PATH']));
  if (config.SQLITE_PATH &&
      app.locals.config.SQLITE_PATH !== config.SQLITE_PATH) {
    throw new Error(
      "unexpected sqlite path.  got '" + config.SQLITE_PATH +
        "' expected '" + app.locals.config.SQLITE_PATH);
  }
  server = app.listen(port, function () {
    deferred.resolve({server: server, port: port});
  });
  server.on('error', function (err) {
    deferred.reject(err);
  });
  return deferred.promise;
};

exports.init_db = function (opt_args) {
  var opts = opt_args || {};
  if (opts.SQLITE_PATH) {
    app.locals.config.SQLITE_PATH = opts.SQLITE_PATH;
  }
  return models.lots_of_items();
};

module.exports = exports;

