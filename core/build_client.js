var fs = require('fs');
var path = require('path');

var Q = require('q');
var freeze = require('deep-freeze');
var fse = require('fs-extra');
var browserify = require('browserify');
var watchify = require('watchify');
var less = require('less');

// todo: keep CLIENT_STATIC_DIR in common constants module?
var CLIENT_STATIC_DIR = require('./common/const').CLIENT_STATIC_DIR;

var CLIENT_DIR = path.join('core', 'client');
var PATHS = {
  // generated assets
  // todo: duplicated paths between here and template
  CLIENT_BUNDLE: path.join(
    CLIENT_STATIC_DIR, 'js', 'bundle.js'),
  GEN_STYLES: path.join(
    CLIENT_STATIC_DIR, 'css'),
  // client source paths
  CLIENT_MAIN: path.join(
    CLIENT_DIR, 'angular', 'js', 'main.js'),
  CLIENT_PARTIALS: path.join(
    CLIENT_DIR, 'angular', 'partials'),
  CLIENT_STATIC_SRC: path.join(
    CLIENT_DIR, 'static'),
  SRC_STYLES: path.join(
    CLIENT_DIR, 'less')
};
freeze(PATHS);

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
    PATHS.CLIENT_STATIC_SRC, CLIENT_STATIC_DIR)());
  (make_populate_dir(
    PATHS.CLIENT_PARTIALS,
    path.join(CLIENT_STATIC_DIR, 'partials'))());
};

var build_style = function(filename) {
  var path_src = path.join(PATHS.SRC_STYLES, filename);
  var path_dest = path.join(
    PATHS.GEN_STYLES,
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
    fs.readdir(PATHS.SRC_STYLES, function(err, files) {
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
    fs.watch(PATHS.SRC_STYLES, function () {
      build_styles();
    });
  });
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
    entries: [PATHS.CLIENT_MAIN],
    cache: {},
    packageCache: {},
    debug: true, // source maps
    plugin: cts ? [watchify] : []
  });
  var write_bundle = make_write_bundle(bfy, PATHS.CLIENT_BUNDLE);
  if (cts) {
    bfy.on('update', write_bundle);
  }
  return write_bundle();
};

module.exports = function (client, opt_args) {
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
