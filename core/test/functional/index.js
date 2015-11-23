var execFile = require('child_process').execFile;
var webdriverio = require('webdriverio');
var path = require('path');
var Q = require('q');
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
var PAGELOAD_TIMEOUT = 10000;

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
      return Q.all(res.value.map(function (el) {
        return Q.all([
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

var make_client_end_cb = function(test_done_cb) {
  return function (err, res) {
    if (err) {
      test_done_cb(err);
    } else {
      test_done_cb();
    }
  };
};


describe("functional tests", function() {

  var _test_nav = function (nav_page) {
    assert.equal(nav_page.brand(), 'Catalog App',
                 "has correct brand text");
    nav_page.login_url();
  };

  var _test_cats = function (cats_page) {
    assert.ok(util.set_eq(
      CONST.CATS,
            cats_page.cats()
              .map(function (cat) {return cat.name;})),
              "category names as expected");
  };

  // todo: (?) app/server per-request setup/teardown
  before(function (done) {
    cd_proc = execFile(CD_PATH, ['--url-base=/wd/hub',
                                 '--port='+CD_PORT.toString()]);
    db_file = tmp.fileSync();
    app.locals.config.SQLITE_PATH = db_file.name;
    // todo: double-check args for .done() cb out of db api
    init_db().done(function (res, err) {
      assert.ok(!err, "database init fail");
      server = app.listen(APP_PORT, function () {
        done();
      });
    });
  });

  // todo: does not stop browser proc when tests fail
  after(function (done) {
    cd_proc.kill();
    server.close();
    fs.closeSync(db_file.fd);
    fs.unlinkSync(db_file.name);
    done();
  });

  describe("no login tests", function () {

    it("displays the homepage", function(done) {

      var test_home_page = function (html_str) {
        var home_page = new pages.HomePage(html_str);
        _test_nav(home_page);
        _test_cats(home_page);
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
      };

      client.init().url(url('/'))
        .waitUntil(wait_until_load, PAGELOAD_TIMEOUT)
        .getHTML('html').then(function (res) {
          test_home_page(res);
        })
        .end(make_client_end_cb(done));
    });

    it("displays the item list pages", function(done) {

      var test_items_page = function (cat_name, html_str) {
        var items_page = new pages.ItemsPage(html_str);
        _test_nav(items_page);
        _test_cats(items_page);
        var expected_item_titles = CONST.ITEMS.filter(function (item) {
          return item.cat === cat_name;
        }).map(function (item) {
          return item.title;
        });
        assert.ok(util.set_eq(
          expected_item_titles,
          items_page.items().map(function (item) {
            return item.title;
          })), "missing expected items title");
        assert.equal(
          items_page.item_list_header_text(),
          [cat_name, " Items (",
           expected_item_titles.length.toString(),
           " items)"].join(''),
          "wrong items list header");
      };

      client.init().url(url('/'))
        .waitUntil(wait_until_load, PAGELOAD_TIMEOUT)
      // todo: selectors ought not appear in tests
        .elements("div.col-md-3 a").then(function (res) {
          var self = this;
          assert.ok(res.value, "found category link elements");
          assert.equal(res.value.length, CONST.CATS.length,
                       "found the right number of category link elems");
          return Q.all(res.value.map(function (cat_a_val) {
            return self.elementIdText(cat_a_val.ELEMENT)
              .then(function (res) {
                return {
                  name: res.value.trim(),
                  a_el: cat_a_val.ELEMENT
                };
              });
          }));
        })
        .then(function (cat_infos) {
          var self = this;
          return util.promise_seq_do(cat_infos, function (cat_info) {
            return self.elementIdClick(cat_info.a_el)
              // todo: ought to wait for render
              .then(function () {
                return this.getHTML('html');
              }).then(function (res) {
                test_items_page(cat_info.name, res);
              });
          });
        })
        .end(make_client_end_cb(done));
    });

    it("displays the items' pages", function(done) {

      var test_item_page = function(html_str) {
        var item_page = new pages.ItemPage(html_str);
        var expected_description = util.arr_elem(
          CONST.ITEMS.filter(function (item) {
            return item.title === item_page.title();
          }).map(function (item) {
            return item.description;
          }));
        assert.equal(item_page.description(),
                     expected_description,
                     "did not find expected description on item page");
        // todo: these fail b/c html is present but not displayed
        // assert.isFalse(item_page.has_edit_link(),
        //               "does not display edit link when logged out");
        // assert.isFalse(item_page.had_delete_link(),
        //                "does not display delete link when logged out");
      };

      client.init().url(url('/'))
        .waitUntil(wait_until_load, PAGELOAD_TIMEOUT)
        .getHTML('html').then(function (res) {
          var self = this;
          var home_page = new pages.HomePage(res);
          return util.promise_seq_map(home_page.items(), function (item) {
            return self.url(url(item.url))
              .waitUntil(wait_until_load, PAGELOAD_TIMEOUT)
              .getHTML('html');
          });
        }).then(function (item_page_html_strs) {
          item_page_html_strs.forEach(function (item_page_html_str) {
            test_item_page(item_page_html_str);
          });
        })
        .end(make_client_end_cb(done));
    });

  });

});
