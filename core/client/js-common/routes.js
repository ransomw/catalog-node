var _ = require('lodash');

var CONST = require('./constants');
var util = require('./util');

var defs = [
  {url: '/',
   name: 'home',
   template: 'home.html',
   controller: 'HomeCtrl'
  },
  {url: '/catalog/item/new',
   name: 'item-create',
   template: 'item_add_edit.html',
   controller: 'CUItemCtrl' // C for Create, U for Update
  },
  {url: '/catalog/:title/edit',
   name: 'item-edit',
   template: 'item_add_edit.html',
   controller: 'CUItemCtrl' // C for Create, U for Update
  },
  {url: '/catalog/:title/delete',
   name: 'item-delete',
   template: 'item_delete.html',
   controller: 'DItemCtrl' // D for Delete
  },
  {url: '/catalog/:catName/:itemTitle',
   name: 'item-read',
   template: 'item.html',
   controller: 'RItemCtrl' // R for Read
  }
];

util.freeze(defs);

/* arguments for angular's $routeProvider.when */
var make_when_args = function (def) {
  return [def.url, {
    templateUrl: CONST.PARTIAL_BASE + def.template,
    controller: def.controller
  }];
};

// mutable state ftl T_-
var reverse = function (name, params_arg) {
  var params = params_arg || {};
  var def = util.arr_elem(defs.filter(function (def) {
    return def.name === name;
  }));
  var url_to_reverse = def.url.slice();
  var rem_params;
  util.spread(_.pairs(params), function (param, val) {
    var param_re = new RegExp(':'+param);
    if (url_to_reverse.match(param_re) === null) {
      throw new Error("invalid param: '" + param + "'");
    }
    url_to_reverse = url_to_reverse.replace(param_re, val);
  });
  rem_params = url_to_reverse.match(/(\:\w+)/);
  if (rem_params !== null) {
    throw new Error("missing parameters: " + rem_params.join(", "));
  }
  return url_to_reverse;
};

module.exports.defs = defs;
module.exports.make_when_args = make_when_args;
module.exports.reverse = reverse;
