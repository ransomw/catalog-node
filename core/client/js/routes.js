var _ = require('lodash');

var CONST = require('./constants');
var util = require('./util');

var get_defs = (function () {
  var defs = null;
  return function () {
    if (defs === null) {

      // circular import better than multiple sources of truth (?)
      var ctrl_name = (function () {
        var controllers = require('./controllers');
        var controller_names = _.keys(controllers);
        util.freeze(controller_names);
        return function (name) {
          if (controller_names.indexOf(name) === -1) {
            throw new Error("invalid controller name '" +
                            name + "' " + controller_names.toString());
          }
          return name;
        };
      }());

      // todo: move template extension to get_when_args
      defs = [
        {url: '/',
         name: 'home',
         template: 'home.html',
         controller: ctrl_name('home')
        },
        {url: '/catalog/item/new',
         name: 'item-create',
         template: 'item_add_edit.html',
         controller: ctrl_name('item_create_update')
        },
        {url: '/catalog/:title/edit',
         name: 'item-edit',
         template: 'item_add_edit.html',
         controller: ctrl_name('item_create_update')
        },
        {url: '/catalog/:title/delete',
         name: 'item-delete',
         template: 'item_delete.html',
         controller: ctrl_name('item_delete')
        },
        {url: '/catalog/:catName/:itemTitle',
         name: 'item-read',
         template: 'item.html',
         controller: ctrl_name('item_read')
        }
      ];

      util.freeze(defs);
    }
    return defs;
  };
}());

/* arguments for angular's $routeProvider.when */
var get_when_args = function () {
  return get_defs().map(function (def) {
    return [def.url, {
      templateUrl: CONST.PARTIAL_BASE + def.template,
      controller: def.controller
    }];
  });
};

// mutable state ftl T_-
var reverse = function (name, params_arg) {
  var params = params_arg || {};
  var def = util.arr_elem(get_defs().filter(function (def) {
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

module.exports.get_when_args = get_when_args;
module.exports.reverse = reverse;
