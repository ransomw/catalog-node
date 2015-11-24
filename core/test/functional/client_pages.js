var Q = require('q');
var _ = require('lodash');
var assert = require('chai').assert;
var path = require('path');

var TEST_DIR = global.M_ARGS.test_dir;
var util = require(path.join(TEST_DIR, 'util'));
var CONST = require(path.join(TEST_DIR, 'const'));

var PageObj = function (client, url, wait_until_load) {
  var self = this;
  var prop;
  assert(client && url);
  self.client = client;
  self.url = url;
  // check url before calling any function
  for (prop in self) {
    if (typeof self[prop] === 'function' &&
        prop !== 'at_url' &&
        prop !== 'wait_until_load') {
      // the closure is necessary
      self[prop] = (function(fn) {
        return function () {
          var args = arguments;
          return Q().then(function () {
            return self.at_url();
          }).then(function (at_url) {
            assert(at_url,
                   "not at correct url when calling '" + prop + "'");
            return fn.apply(self, args);
          });
        };
      }(self[prop]));
    }
  }
  assert(wait_until_load &&
         typeof wait_until_load === 'function',
         "implementation error: " +
         "must provide a function to determine whether page has loaded");
  return Q().then(function () {
    return self.at_url();
  }).then(function (at_url) {
    if (!at_url) {
      // console.log("navigating to " + self.url + " in PageObj");
      return self.client.url(self.url);
    }
    return undefined;
  }).then(function () {
    return self.client.waitUntil(wait_until_load,
                                 CONST.PAGELOAD_TIMEOUT);
  }).then(function () {
    return self;
  });
};

PageObj.prototype.at_url = function () {
  var self = this;
  return Q().then(function () {
    return self.client.url();
  }).then(function (res) {
    // console.log("at_url comparing '" + res.value +
    //             "' and '" + self.url + "'");
    return res.value === self.url;
  });
};

PageObj.prototype._element_fn = function (fn_name, selector) {
  var args = util.args_2_arr(arguments);
  var self = this;
  return Q().then(function () {
    return self.client.elements(selector);
  }).then(function (res) {
    var val = util.arr_elem(res.value);
    return self.client[fn_name].apply(
      self.client,
      [val.ELEMENT].concat(args.slice(2)));
  });
};

PageObj.prototype.set_val = function (selector, input_str) {
  return this._element_fn('elementIdValue', selector, input_str);
};

PageObj.prototype.click = function (selector) {
  return this._element_fn('elementIdClick', selector);
};

var LoginPage = function (client, url) {
  var wait_until_load = function () {
    var client = this;
    return Q().then(function () {
      return client.elements('button[name="sign-up"]');
    }).then(function (res) {
      return res.value.length > 0;
    });
  };

  return PageObj.call(this, client, url, wait_until_load);
};

LoginPage.prototype = Object.create(PageObj.prototype);

LoginPage.prototype.set_email = function (email_str) {
  return this.set_val('input[name="email"]', email_str);
};

LoginPage.prototype.set_pass = function (pass_str) {
  return this.set_val('input[name="password"]', pass_str);
};

LoginPage.prototype.set_pass_confirm = function (pass_confirm_str) {
  return this.set_val('input[name="password-confirm"]',
                      pass_confirm_str);
};

LoginPage.prototype.set_name = function (name_str) {
  return this.set_val('input[name="name"]', name_str);
};

LoginPage.prototype.click_sign_in = function () {
  return this.click('button[name="sign-in"]');
};

LoginPage.prototype.click_sign_up = function () {
  return this.click('button[name="sign-up"]');
};


module.exports.LoginPage = LoginPage;
