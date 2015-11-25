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
var cpages = require(path.join(TEST_DIR, 'client_pages'));
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

// todo: more util.promise_seq_* would make a lot of this less noisy

//// convenience

var url = function (url_path) {
  assert(typeof url_path === 'string', "url_path should be a string");
  if (url_path[0] !== '/') {
    if (url_path[0] === '#') {
      url_path = '/' + url_path;
    } else {
      assert(false, "url_path should begin with '/' or '#', " +
             "but got '" + url_path + "'");
    }
  }
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

var wait_for_url = function (url) {
  return function () {
    var client = this;
    return Q().then(function () {
      return client.url();
    }).then(function (url_res) {
      return url_res.value === url;
    });
  };
};

describe("functional tests", function() {


  var client = webdriverio.remote({
    host: 'localhost',
    port: CD_PORT,
    desiredCapabilities: { browserName: 'chrome' }
  });
  var cd_proc; // chomedriver process
  var server;
  var db_file; // sqlite database temp file object

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
  var _before_test_case = function () {
    db_file = tmp.fileSync();
    app.locals.config.SQLITE_PATH = db_file.name;
    // todo: double-check args for .done() cb out of db api
    return Q().then(function() {
      return init_db();
    }).then(function () {
      var deferred = Q.defer();
      server = app.listen(APP_PORT, function () {
        deferred.resolve();
      });
      return deferred.promise;
    }).then(function () {
      return client.init();
    });
  };

  var _after_test_case = function () {
    return Q().then(function () {
      return client.end();
    }).then(function () {
      var deferred = Q.defer();
      server.close(function () {
        deferred.resolve();
      });
      return deferred.promise;
    }).then(function () {
      fs.closeSync(db_file.fd);
      fs.unlinkSync(db_file.name);
    });
  };

  before(function () {
    cd_proc = execFile(CD_PATH, ['--url-base=/wd/hub',
                                 '--port='+CD_PORT.toString()]);
  });

  // todo: does not stop browser proc when tests fail
  after(function () {
    cd_proc.kill();
  });

  describe("no login tests", function () {

    beforeEach(function () {
      return _before_test_case();
    });

    afterEach(function () {
      return _after_test_case();
    });

    it("displays the homepage", function() {
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

      return Q().then(function () {
        return client.url(url('/'))
          .waitUntil(wait_until_load, CONST.PAGELOAD_TIMEOUT)
          .getHTML('html');
      }).then(function (res) {
        test_home_page(res);
      });
    });

    it("displays the item list pages", function() {

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

      return Q().then(function () {
        return client.url(url('/'))
          .waitUntil(wait_until_load, CONST.PAGELOAD_TIMEOUT)
        // todo: selectors ought not appear in tests
          .elements("div.col-md-3 a");
      }).then(function (res) {
        assert.ok(res.value, "found category link elements");
        assert.equal(res.value.length, CONST.CATS.length,
                     "found the right number of category link elems");
        return Q.all(res.value.map(function (cat_a_val) {
          return client.elementIdText(cat_a_val.ELEMENT)
            .then(function (res) {
              return {
                name: res.value.trim(),
                a_el: cat_a_val.ELEMENT
              };
            });
        }));
      }).then(function (cat_infos) {
        return util.promise_seq_do(cat_infos, function (cat_info) {
          return client.elementIdClick(cat_info.a_el)
          // todo: ought to wait for render
            .then(function () {
              return this.getHTML('html');
            }).then(function (res) {
              test_items_page(cat_info.name, res);
            });
        });
      });
    });

    it("displays the items' pages", function() {

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

      return Q().then(function () {
        return client.url(url('/'))
          .waitUntil(wait_until_load, CONST.PAGELOAD_TIMEOUT)
          .getHTML('html');
      }).then(function (res) {
        var home_page = new pages.HomePage(res);
        return util.promise_seq_map(home_page.items(), function (item) {
          return client.url(url(item.url))
            .waitUntil(wait_until_load, CONST.PAGELOAD_TIMEOUT)
            .getHTML('html');
        });
      }).then(function (item_page_html_strs) {
        item_page_html_strs.forEach(function (item_page_html_str) {
          test_item_page(item_page_html_str);
        });
      });
    });

  });

  describe("login tests", function () {

    var EMAIL = 'a@a.org';
    var PASS = 'password';
    var NAME = 'alice';

    var _get_login_url = function () {
      return Q().then(function () {
        return client.url(url('/'))
          .waitUntil(wait_until_load, CONST.PAGELOAD_TIMEOUT)
          .getHTML('html');
      }).then(function (res) {
        var home_page = new pages.HomePage(res);
        var login_url = home_page.login_url();
        return url(login_url);
      });
    };

    var sign_up = function (url) {
      var login_page;
      var login_url = url;
      return Q().then(function () {
        if (!login_url) {
          return _get_login_url();
        }
        return null;
      }).then(function (found_login_url) {
        if (found_login_url !== null) {
          login_url = found_login_url;
        }
      }).then(function () {
        return new cpages.LoginPage(client, login_url);
      }).then(function (page) {
        login_page = page;
      }).then(function () {
        return Q.all([
          login_page.set_email(EMAIL),
          login_page.set_pass(PASS),
          login_page.set_pass_confirm(PASS),
          login_page.set_name(NAME)
        ]);
      }).then(function () {
        return login_page.click_sign_up();
      }).then(function () {
        return client.waitUntil(wait_until_load, CONST.PAGELOAD_TIMEOUT);
      });
    };

    var login = function (url) {
      var login_page;

      return Q().then(function () {
        return new cpages.LoginPage(client, url);
      }).then(function (page) {
        login_page = page;
      }).then(function () {
        return Q.all([
          login_page.set_email(EMAIL),
          login_page.set_pass(PASS)
        ]);
      }).then(function () {
        return login_page.click_sign_in();
      }).then(function () {
        return client.waitUntil(wait_until_load, CONST.PAGELOAD_TIMEOUT);
      });
    };

    var sign_up_login = function (url) {
      return Q().then(function () {
        return sign_up(url);
      });
      /// going to login url when currently login redirects
      // .then(function () {
      //   return login(url);
      // });
    };

    var logout = function () {
      return Q().then(function () {
          return client.url(url('/'))
            .waitUntil(wait_until_load, CONST.PAGELOAD_TIMEOUT)
            .getHTML('html');
        }).then(function (res) {
          var home_page = new pages.HomePage(res);
          return client.url(url(home_page.logout_url()))
            .waitUntil(wait_until_load, CONST.PAGELOAD_TIMEOUT)
            .getHTML('html');
        }).then(function (res) {
          var home_page = new pages.HomePage(res);
          home_page.login_url();
        });
    };

    describe("auth system", function () {


      beforeEach(function () {
        return _before_test_case();
      });

      afterEach(function () {
        return _after_test_case();
      });

      it("logs in", function () {
        return Q().then(function () {
          return client.url(url('/'))
            .waitUntil(wait_until_load, CONST.PAGELOAD_TIMEOUT)
            .getHTML('html');
        }).then(function (res) {
          var home_page = new pages.HomePage(res);
          var login_url = home_page.login_url();
          return sign_up_login(url(login_url));
        }).then(function () {
          return logout();
          // todo: test logging back in
        });
      });
    });

    describe("crud tests", function () {
      var ITEM = {
        title: "Ball",
        desc: "World Cup 2014 edition",
        cat: "Soccer"
      };

      var ITEM_UPDATE = {
        title: "Russian hockey stick",
        desc: "infested with termites (a-la The Simspons)",
        cat: "Hockey"
      };


      var _create = function () {
        var create_page;
        var create_url;
        return Q().then(function () {
          return sign_up_login();
        }).then(function () {
          return client.url(url('/'))
            .waitUntil(wait_until_load, CONST.PAGELOAD_TIMEOUT)
            .getHTML('html');
        }).then(function (res) {
          var home_page = new pages.HomePage(res);
          create_url = url(home_page.create_url());
          // return client.url(create_url)
          //   .waitUntil(wait_until_load, CONST.PAGELOAD_TIMEOUT)
          //   .getHTML('html');
          return new cpages.CreatePage(client, create_url);
        }).then(function (page) {
          create_page = page;
          // todo: move wait_until_load into client_pages
          return client.waitUntil(
            wait_until_load, CONST.PAGELOAD_TIMEOUT);
        }).then(function () {
          return Q.all([
            create_page.set_title(ITEM.title),
            create_page.set_desc(ITEM.desc),
            create_page.set_cat(ITEM.cat)
          ]);
        }).then(function () {
          return create_page.click_submit();
        }).then(function () {
          return client.waitUntil(
            wait_for_url(url('#/')), CONST.PAGELOAD_TIMEOUT);
        }).then(function (res) {
          return client.waitUntil(
            wait_until_load, CONST.PAGELOAD_TIMEOUT);
        });
      };

      var _get_item_page = function (item_title) {
        return Q().then(function () {
          return client.url(url('/'))
            .waitUntil(wait_until_load, CONST.PAGELOAD_TIMEOUT)
            .getHTML('html');
        }).then(function (res) {
          var home_page = new pages.HomePage(res);
          var items = home_page.items();
          var item = util.arr_elem(
            items.filter(function (item) {
              return item.title === item_title;
            }));
          return client.url(url(item.url))
            .waitUntil(wait_until_load, CONST.PAGELOAD_TIMEOUT)
            .getHTML('html');
        }).then(function (res) {
          return new pages.ItemPage(res);
        });
      };

      var _test_read = function (expected_vals) {
        return Q().then(function () {
          return _get_item_page(expected_vals.title);
        }).then(function (item_page) {
          assert.equal(item_page.title(), expected_vals.title);
          assert.equal(item_page.description(), expected_vals.desc);
        });
      };

      beforeEach(function () {
        return _before_test_case();
      });

      afterEach(function () {
        return _after_test_case();
      });

      it('creates', function () {
        return _create();
      });

      it('reads', function () {
        return Q().then(function () {
          return _create();
        }).then(function () {
          return _test_read(ITEM);
        });
      });

      it('updates', function () {
        var edit_page;
        return Q().then(function () {
          return _create();
        }).then(function () {
          return _get_item_page(ITEM.title);
        }).then(function (item_page) {
          return new cpages.EditPage(client, url(item_page.edit_url()));
        }).then(function (page) {
          edit_page = page;
          return Q.all([
            edit_page.set_title(ITEM_UPDATE.title),
            edit_page.set_desc(ITEM_UPDATE.desc),
            edit_page.set_cat(ITEM_UPDATE.cat)
          ]);
        }).then(function () {
          return edit_page.click_submit();
        }).then(function () {
          return client.waitUntil(
            wait_for_url(url('#/')), CONST.PAGELOAD_TIMEOUT);
        }).then(function (res) {
          return client.waitUntil(
            wait_until_load, CONST.PAGELOAD_TIMEOUT);
        }).then(function () {
          return _test_read(ITEM_UPDATE);
        });
      });

      it('deletes', function () {
        return Q().then(function () {
          return _create();
        }).then(function () {
          return _get_item_page(ITEM.title);
        }).then(function (item_page) {
          return new cpages.DeletePage(
            client, url(item_page.delete_url()));
        }).then(function (delete_page) {
          return delete_page.click_submit();
        }).then(function () {
          return client.waitUntil(
            wait_for_url(url('#/')), CONST.PAGELOAD_TIMEOUT);
        }).then(function (res) {
          return client.waitUntil(
            wait_until_load, CONST.PAGELOAD_TIMEOUT);
        }).then(function () {
          return client.url(url('/'))
            .waitUntil(wait_until_load, CONST.PAGELOAD_TIMEOUT)
            .getHTML('html');
        }).then(function (res) {
          var home_page = new pages.HomePage(res);
          var items = home_page.items();
          assert.equal(
            0, items.filter(function (item) {
              return item.title === ITEM.title;
            }).length, "item present in list after delete");
        });
      });

    });
  });
});
