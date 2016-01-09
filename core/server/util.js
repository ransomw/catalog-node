var _ = require('lodash');
var cutil = require('../common/util');

var util = {};
// maybe useful for promise chaining? feels hacky
util.null_wrap = function (fn) {
  return function () {
    var i;
    for (i = 0; i < arguments.length; i += 1) {
      if (arguments[i] === null) {
        return null;
      }
    }
    return fn.apply(null, arguments);
  };
};

// as suggested on mdn's parseInt page
util.filter_int = function (val) {
  if(/^(\-|\+)?([0-9]+)$/.test(val))
    return Number(val);
  return NaN;
};

module.exports = _.merge(cutil, util);
