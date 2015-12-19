var fs = require('fs');
var fse = require('fs-extra');
var Q = require('q');
var path = require('path');
var browserify = require('browserify');
var watchify = require('watchify');

var app = require('./server');
var CONST = require('./common/const');

var PATH_CLIENT_MAIN = path.join(
  'core', 'client', 'js', 'main.js');
var PATH_CLIENT_BUNDLE = path.join(
  CONST.CLIENT_STATIC_DIR , 'js', 'bundle.js');
var PATH_CLIENT_STATIC_SRC = path.join(
  'core', 'client', 'static');

module.exports.populate_client_static = function () {
  var deferred = Q.defer();
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
