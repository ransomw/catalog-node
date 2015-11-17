var execFile = require('child_process').execFile;
var webdriverio = require('webdriverio');
var path = require('path');
var q = require('q');
var assert = require('chai').assert;

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

// pass to webdriverio client's .waitUntil
var wait_until_load = function () {
  return this.elements("[class*='sk-']") // spinner elements
    .then(function (res) {
      var self = this;
      if (!res.value) {
        return [];
      }
      return q.all(res.value.map(function (el) {
        return q.all([
          self.elementIdLocationInView(el.ELEMENT),
          self.elementIdSize(el.ELEMENT),
          self.elementIdAttribute(el.ELEMENT, 'class')
        ])
          .then(function (loc_size_cls) {
            return {location: loc_size_cls[0].value,
                    size: {
                      h: loc_size_cls[1].value.height,
                      w: loc_size_cls[1].value.width},
                    cls: loc_size_cls[2].value // for debug
                   };
          })
          .catch(function (err) {
            return null;
          });
      }));
    }).then(function (el_infos) {
      var is_visible_el_info = function (el_info) {
        if (el_info === null) {
          return false; // stale WebElement, wait some more
        }
        return el_info.size.h === 0 && el_info.size.w === 0 &&
          el_info.location.x === 0 && el_info.location.y === 0;
      };
      return el_infos.map(is_visible_el_info)
        .reduce(function (a, b) {
          return a && b;
        }, true);
    });
};

describe("functional tests", function() {

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

  describe("no login tests", function () {


    it("displays the homepage", function(done) {
      client
        .init()
        .url(url('/'))
        .waitUntil(wait_until_load, 10000)
        .getTitle().then(function(title) {
          assert.equal(title, "Catalog App",
                       "has the correct title");
        })
        .end(function () {
          done();
        });
    });

    it("displays the item list pages", function(done) {
      assert.ok(false,
                "test unimplemented");
      done();
    });

    it("displays the items' pages", function(done) {
      assert.ok(false,
                "test unimplemented");
      done();
    });

    it("displays the item list pages", function(done) {
      assert.ok(false,
                "test unimplemented");
      done();
    });


  });

});
