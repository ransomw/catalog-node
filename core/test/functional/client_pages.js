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
      self[prop] = (function(fn, prop) {
        return function () {
          var args = arguments;
          return Q().then(function () {
            return self.client.url();
          }).then(function (url_res) {
            assert.equal(
              url_res.value, self.url,
              "not at correct url when calling '" + prop + "' "
                // + " with args: " +
                // util.args_2_arr(args).toString()
            );
            return fn.apply(self, args);
          });
        };
      }(self[prop], prop));
    }
  }

  // assert(wait_until_load &&
  //        typeof wait_until_load === 'function',
  //        "implementation error: " +
  //        "must provide a function to determine whether page has loaded");

  return Q().then(function () {
    return self.at_url();
  }).then(function (at_url) {
    if (!at_url) {
      return self.client.url(self.url);
    }
    return undefined;
  }).then(function () {
    if (wait_until_load) {
      assert(typeof wait_until_load === 'function');
      return self.client.waitUntil(wait_until_load,
                                   CONST.PAGELOAD_TIMEOUT);
    }
    return undefined;
  }).then(function () {
    return self;
  });
};

// might be faster to call self.client.url() everywhere this is used...
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

PageObj.prototype._element_fn = function (fn_name, sel_or_el_obj) {
  var args = util.args_2_arr(arguments);
  var self = this;
  return Q().then(function () {
    if (typeof sel_or_el_obj === 'string') {
      return self.client.elements(sel_or_el_obj);
    } else {
      return {value: [sel_or_el_obj]};
    }
  }).then(function (res) {
    var val = util.arr_elem(res.value);
    return self.client[fn_name].apply(
      self.client,
      [val.ELEMENT].concat(args.slice(2)));
  });
};

PageObj.prototype.set_val = function (sel_or_el_obj, input_str) {
  var self = this;

  return Q().then(function () {
    return self._element_fn('elementIdClear', sel_or_el_obj);
  }).catch(function (err) {
    if (err.message !== 'invalid element state: ' +
        'Element must be user-editable in order to clear it.') {
      throw err;
    }
  }).then(function () {
    return self._element_fn('elementIdValue', sel_or_el_obj, input_str);
  });

  // return Q().then(function () {
  //   return self.client.elements(selector);
  // }).then(function (res) {
  //   var val = util.arr_elem(res.value);
  //   console.log("in set_val");
  //   console.log(val);
  //   if (selector === 'select[name="category"]') {
  //     debugger;
  //   }
  //   return self._element_fn('elementIdValue', selector, input_str);
  // });

};

PageObj.prototype.click = function (sel_or_el_obj) {
  return this._element_fn('elementIdClick', sel_or_el_obj);
};

PageObj.prototype.els_with_text = function (sel, search_text) {
  var self = this;
  return Q().then(function () {
    return self.client.elements(sel);
  }).then(function (els_res) {
    return Q.all(els_res.value.map(function (el_obj) {
      return Q().then(function () {
        return self.client.elementIdText(el_obj.ELEMENT);
      }).then(function (button_text_res) {
        return {
          el: el_obj,
          text: button_text_res.value.trim()
        };
      });
    }));
  }).then(function (el_text_objs) {
    return el_text_objs.filter(function (el_text_obj) {
      return el_text_obj.text === search_text;
    }).map(function (el_text_obj) {
      return el_text_obj.el;
    });
  });
};

PageObj.prototype.el_with_text = function (sel, search_text) {
  var self = this;
  return Q().then(function () {
    return self.els_with_text(sel, search_text);
  }).then(function (el_objs) {
    return util.arr_elem(el_objs);
  });
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


var CreateEditMixin = function () {};

CreateEditMixin.prototype.set_title = function (title_str) {
  return this.set_val('input[name="title"]', title_str);
};

CreateEditMixin.prototype.set_desc = function (desc_str) {
  return this.set_val('input[name="description"]', desc_str);
};

CreateEditMixin.prototype.set_cat = function (cat_str) {
  return this.set_val('select[name="category"]', cat_str);
};

var click_submit = function () {
  var self = this;
  return Q().then(function () {
    return self.el_with_text('button', "Submit");
  }).then(function (el_obj) {
    return self.click(el_obj);
  });
};

CreateEditMixin.prototype.click_submit = click_submit;

var CreatePage = function (client, url) {
  CreateEditMixin.call(this);
  return PageObj.call(this, client, url);
};

CreatePage.prototype = Object.create(PageObj.prototype);
_.merge(CreatePage.prototype, CreateEditMixin.prototype);

var EditPage = function (client, url) {
  CreateEditMixin.call(this);
  return PageObj.call(this, client, url);
};

EditPage.prototype = Object.create(PageObj.prototype);
_.merge(EditPage.prototype, CreateEditMixin.prototype);

var DeletePage = function (client, url) {
  return PageObj.call(this, client, url);
};

DeletePage.prototype = Object.create(PageObj.prototype);

DeletePage.prototype.click_submit = click_submit;

module.exports.LoginPage = LoginPage;
module.exports.CreatePage = CreatePage;
module.exports.EditPage = EditPage;
module.exports.DeletePage = DeletePage;
