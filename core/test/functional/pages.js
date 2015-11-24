var path = require('path');
var _ = require('lodash');
var htmlparser = require('htmlparser2');
var soupselect = require('soupselect');
var select = soupselect.select;
var assert = require('chai').assert;

var TEST_DIR = global.M_ARGS.test_dir;
var util = require(path.join(TEST_DIR, 'util'));

// todo: a dom 'subclass' with soup-select 'methods' might be cleaner

////////
//// convenience

var get_text = function (dom_elem) {
  var text_children = dom_elem.children.filter(function (child_elem) {
    return child_elem.type === 'text';
  });
  if (text_children.length > 1) {
    throw new Error("expect at most one text child per tag... " +
                    "dbl. check htmlparser2 docs");
  }
  if (text_children.length === 0) {
    return null;
  }
  return text_children[0].data.trim();
};

// takes either a string or a regex
var has_text = function (matcher) {
  return function (dom_elem) {
    var el_text = get_text(dom_elem);
    if (typeof matcher === 'string') {
      return el_text === matcher;
    } else {
      return el_text.match(matcher) !== null;
    };
  };
};

var select_one = function (dom, tag_name) {
  return util.arr_elem(select(dom, tag_name));
};

var select_first = function (dom, tag_name) {
  return select(dom, tag_name)[0];
};

///////////
//// pages
///

var PageObj = function (html_str) {
  var self = this;
  var parser_handler = new htmlparser.DefaultHandler(
    function (err, dom) {
      if (err) {
        throw new Error("html parse error: " + err.toString());
      } else {
        self.dom = dom;
      }
    });
  var parser = new htmlparser.Parser(parser_handler);
  parser.parseComplete(html_str);
};

PageObj.prototype.sels_with_text = function(selector, text_matcher) {
  return select(this.dom, selector)
    .filter(has_text(text_matcher));
};

PageObj.prototype.sel_with_text = function(selector, text_matcher) {
  return util.arr_elem(this.sels_with_text(selector, text_matcher));
};

///

var NavMixin = function () {};

NavMixin.prototype.brand = function () {
  var dom = this.dom;
  return get_text(select(dom, 'a .navbar-brand')[0]);
};

NavMixin.prototype.login_url = function () {
  var dom = this.dom;
  var a_login = util.arr_elem(
    select(dom, 'a').filter(has_text('Login')));
  return a_login.attribs.href;
};

NavMixin.prototype.logout_url = function () {
  var dom = this.dom;
  var a_logout = util.arr_elem(
    select(dom, 'a').filter(has_text('Logout')));
  return a_logout.attribs.href;
};


///

var CatsMixin = function () {};

CatsMixin.prototype.cats = function () {
  var cats_div = util.arr_elem(
    select(this.dom, 'h3')
      .filter(has_text('Categories'))).parent;
  return select(cats_div, 'li').map(function (li_el) {
    var a_el = select_one(li_el, 'a');
    // todo: use url rather than on_click for items filtering
    return {'name': get_text(a_el)};
  });
};

var HomePage = function (html_str) {
  PageObj.call(this, html_str);
  NavMixin.call(this);
  CatsMixin.call(this);
};

HomePage.prototype = Object.create(PageObj.prototype);
_.merge(HomePage.prototype, NavMixin.prototype);
_.merge(HomePage.prototype, CatsMixin.prototype);

HomePage.prototype.items = function () {
  var items_div = this.sel_with_text('h3', 'Latest Items').parent;
  return select(items_div, 'li').map(function (li_el) {
    var a_el = select_one(li_el, 'a');
    var cat = get_text(select_one(li_el, 'span'))
          .replace(/(\(|\))/g, '');
    var url = a_el.attribs.href;
    return {'title': get_text(a_el),
            'cat': cat,
            'url': url};
  });
};

var ItemsPage = function (html_str) {
  PageObj.call(this, html_str);
  NavMixin.call(this);
  CatsMixin.call(this);
};

ItemsPage.prototype = Object.create(PageObj.prototype);
_.merge(ItemsPage.prototype, NavMixin.prototype);
_.merge(ItemsPage.prototype, CatsMixin.prototype);

ItemsPage.prototype._items_h = function () {
  return this.sel_with_text('h3', /Items/);
};

ItemsPage.prototype._items_div = function () {
  return this._items_h().parent;
};

ItemsPage.prototype.items = function () {
  return select(this._items_div(), 'li').map(function (li_el) {
    var a_el = select_one(li_el, 'a');
    var url = a_el.attribs.href;
    return {'title': get_text(a_el),
            'url': url};
  });
};

ItemsPage.prototype.item_list_header_text = function () {
  return get_text(this._items_h());
};

var ItemPage = function (html_str) {
  PageObj.call(this, html_str);
  NavMixin.call(this);
};

ItemPage.prototype = Object.create(PageObj.prototype);
_.merge(ItemPage.prototype, NavMixin.prototype);

ItemPage.prototype._get_main_div = function () {
  return select_first(this.dom, 'h3').parent;
};

ItemPage.prototype.title = function () {
  return get_text(select_first(this._get_main_div(), 'h3'));
};

ItemPage.prototype.description = function () {
  var desc_text = get_text(select_first(this._get_main_div(), 'p'));
  var desc_match = desc_text.match(/^Description: (.*)/);
  assert.isNotNull(desc_match, "item description not present");
  return desc_match[1];
};

ItemPage.prototype.edit_url = function () {
  return this.sel_with_text('a', /^Edit$/).attribs.href;
};

ItemPage.prototype.delete_url = function () {
  return this.sel_with_text('a', /^Delete$/).attribs.href;
};

ItemPage.prototype.has_edit_link = function () {
  return this.sels_with_text('a', /^Edit$/).length !== 0;
};

ItemPage.prototype.has_delete_link = function () {
  return this.sels_with_text('a', /^Delete$/).length !== 0;
};

module.exports.HomePage = HomePage;
module.exports.ItemsPage = ItemsPage;
module.exports.ItemPage = ItemPage;
