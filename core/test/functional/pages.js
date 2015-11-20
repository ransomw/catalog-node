var path = require('path');
var htmlparser = require('htmlparser2');
var soupselect = require('soupselect');
var select = soupselect.select;


var TEST_DIR = global.M_ARGS.test_dir;
var util = require(path.join(TEST_DIR, 'util'));

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

///////////
//// pages

var HomePage = function (html_str) {
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

HomePage.prototype.brand = function () {
  var dom = this.dom;

  // return select(dom, 'a .navbar-brand')[0]
  //   .children[0].data.trim();


  return get_text(select(dom, 'a .navbar-brand')[0]);

};

HomePage.prototype.login_url = function () {
  var dom = this.dom;
  var a_login = util.arr_elem(
    select(dom, 'a').filter(has_text('Login')));
  return a_login.attribs.href;
};

HomePage.prototype.items = function () {
  var items_div = util.arr_elem(
    select(this.dom, 'h3')
      .filter(has_text('Latest Items'))).parent;
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

HomePage.prototype.cats = function () {
  var cats_div = util.arr_elem(
    select(this.dom, 'h3')
      .filter(has_text('Categories'))).parent;
  return select(cats_div, 'li').map(function (li_el) {
    var a_el = select_one(li_el, 'a');
    // todo: use url rather than on_click for items filtering
    return {'name': get_text(a_el)};
  });
};

module.exports.HomePage = HomePage;
