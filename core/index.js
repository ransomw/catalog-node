var fs = require('fs');
var fse = require('fs-extra');
var Q = require('q');
var path = require('path');
var browserify = require('browserify');
var watchify = require('watchify');
var less = require('less');

var app = require('./server');
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
  PATH_CLIENT, 'js', 'main.js');
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

module.exports.watch_styles = function () {
  build_styles().then(function () {
    fs.watch(PATH_SRC_STYLES, function () {
      build_styles();
    });
  });
};

module.exports.build_styles = build_styles;

module.exports.populate_client_static = function () {
  if (fs.existsSync(CONST.CLIENT_STATIC_DIR)) {
    fse.removeSync(CONST.CLIENT_STATIC_DIR);
  }
  fse.copySync(PATH_CLIENT_STATIC_SRC, CONST.CLIENT_STATIC_DIR);
};

module.exports.watchify_build = function () {
  var bfy = browserify({
    entries: [PATH_CLIENT_MAIN],
    cache: {},
    packageCache: {},
    debug: true, // source maps
    plugin: [watchify]
  });

  var bundle = function () {
    // console.log("writing client bundle");
    bfy.bundle().pipe(fs.createWriteStream(PATH_CLIENT_BUNDLE));
  };

  bfy.on('update', bundle);
  bundle();
};

module.exports.browserify_build = function () {
  var b = browserify();
  b.add(PATH_CLIENT_MAIN);
  b.bundle().pipe(fs.createWriteStream(PATH_CLIENT_BUNDLE));
};

module.exports.run_server = function () {
  var port = process.env.PORT || 3000;
  var server = app.listen(port, function () {
    console.log("app running on port " + port);
  });
};
