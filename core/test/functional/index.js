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


var client = webdriverio.remote({
  host: 'localhost',
  port: CD_PORT,
  desiredCapabilities: { browserName: 'chrome' }
});
var cd_proc;
var server;


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
      .url('http://localhost:'+APP_PORT.toString())
      .getTitle().then(function(title) {
        console.log('Title is: ' + title);
      })
      .end(function () {
        done();
      });
  });

});
