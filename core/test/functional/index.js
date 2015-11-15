var execFile = require('child_process').execFile;
var webdriverio = require('webdriverio');
var path = require('path');

// see bin/test
var config = require(global.M_ARGS.test_dir+'/config');
var PROJ_ROOT = path.join(global.M_ARGS.test_dir, '../../..');
var app = require(PROJ_ROOT + '/core/server');
var CD_PATH = config.CD_PATH;
var CD_PORT = config.CD_PORT;
var APP_PORT = process.env.PORT || 3001;
var APP_URL = 'http://localhost';

var client = webdriverio.remote({
  host: 'localhost',
  port: CD_PORT,
  desiredCapabilities: { browserName: 'chrome' }
});
var cd_proc;
var server;

//// convenience

var url = function (url_path) {
  return APP_URL + ':' + APP_PORT.toString() + url_path;
};

describe('functional tests', function() {

  before(function (done) {
    cd_proc = execFile(CD_PATH, ['--url-base=/wd/hub',
                                 '--port='+CD_PORT.toString()]);
    server = app.listen(APP_PORT, function () {
      done();
    });
  });

  after(function (done) {
    cd_proc.kill();
    server.close();
    done();
  });

  it('loads the homepage', function (done) {
    client
      .init()
      .url(url('/'))
      .getTitle().then(function(title) {
        console.log('Title is: ' + title);
      })
      .end(function () {
        done();
      });
  });

  describe('no login tests', function () {
    it('displays the homepage', function(done) {
      // client.init
      done();
    });
  });

});
