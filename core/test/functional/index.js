var execFile = require('child_process').execFile;
var webdriverio = require('webdriverio');
var path = require('path');
var q = require('q');
var assert = require('chai').assert;
var _ = require('lodash');
var tmp = require('tmp');
var fs = require('fs');

// see bin/test
var TEST_DIR = global.M_ARGS.test_dir;
var config = require(path.join(TEST_DIR, 'config'));
var pages = require(path.join(TEST_DIR, 'pages'));
var CONST = require(path.join(TEST_DIR, 'const'));
var util = require(path.join(TEST_DIR, 'util'));
var PROJ_ROOT = path.join(TEST_DIR, '../../..');
var app = require(PROJ_ROOT + '/core/server');
var init_db = require(PROJ_ROOT + '/core/server/models').lots_of_items;
var CD_PATH = config.CD_PATH;
var CD_PORT = config.CD_PORT;
var APP_PORT = process.env.PORT || 3001;
var APP_URL = 'http://localhost';

tmp.setGracefulCleanup();

var client = webdriverio.remote({
  host: 'localhost',
  port: CD_PORT,
  desiredCapabilities: { browserName: 'chrome' }
});
var cd_proc; // chomedriver process
var server;
var db_file; // sqlite database temp file object

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

  // todo: (?) app/server per-request setup/teardown
  before(function (done) {
    cd_proc = execFile(CD_PATH, ['--url-base=/wd/hub',
                                 '--port='+CD_PORT.toString()]);
    db_file = tmp.fileSync();
    app.locals.config.SQLITE_PATH = db_file.name;
    init_db();
    server = app.listen(APP_PORT, function () {
      done();
    });
  });

  after(function (done) {
    cd_proc.kill();
    server.close();
    fs.closeSync(db_file.fd);
    fs.unlinkSync(db_file.name);
    done();
  });

  describe("no login tests", function () {


    it("displays the homepage", function(done) {

      client
        .init()
        .url(url('/'))
        .waitUntil(wait_until_load, 10000)
        .getHTML('html').then(function (res) {

          var home_page = new pages.HomePage(res);
          // test nav
          assert.equal(home_page.brand(), 'Catalog App',
                       "has correct brand text");
          home_page.login_url();
          // test cats
          assert.ok(util.set_eq(
            CONST.CATS,
                  home_page.cats()
                    .map(function (cat) {return cat.name;})),
                    "category names as expected");
          // test other things
          var items = home_page.items();
          assert.ok(util.set_eq(
            CONST.ITEMS.map(function (item) {return item.title;}),
                  items.map(function (item) {return item.title;})),
                    "item titles as expected");
          items.forEach(function (curr_item) {
            var expected_item = util.arr_elem(
              items.filter(function (item) {
                return item['title'] === curr_item['title'];
              }));
            assert.equal(curr_item['cat'], expected_item['cat'],
                         "item category doesn't match expected");
          });
        })
        .end(function (err, res) {
          if (err) {
            done(err);
          } else {
            done();
          }
        });

    });

    // it("displays the item list pages", function(done) {
    //   assert.ok(false,
    //             "test unimplemented");
    //   done();
    // });

    // it("displays the items' pages", function(done) {
    //   assert.ok(false,
    //             "test unimplemented");
    //   done();
    // });

    // it("displays the item list pages", function(done) {
    //   assert.ok(false,
    //             "test unimplemented");
    //   done();
    // });


  });

});
