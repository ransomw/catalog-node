var _ = require('lodash');
var assert = require('chai').assert;

var cutil = require('../../common/util');

module.exports.arr_elem = cutil.arr_elem;

// todo: replace w/ lodash
module.exports.spread = function (arr, fn) {
  arr.map(function (sub_arr) {
    return fn.apply(null, sub_arr);
  });
};

module.exports.sort_items_updated_at = function (i1, i2) {
  var t1 = new Date(i1.updatedAt);
  var t2 = new Date(i2.updatedAt);
  return t1.getTime() - t2.getTime();
};

module.exports.freeze = cutil.freeze;
