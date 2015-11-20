var assert = require('chai').assert;
var _ = require('lodash');

module.exports.set_eq = function (arr1, arr2) {
  var sarr1 = _.uniq(arr1);
  var sarr2 = _.uniq(arr2);
  return sarr1.length === sarr2.length &&
    _.intersection(sarr1, sarr2).length === sarr1.length;
};

module.exports.arr_elem = function(arr) {
  assert.equal(arr.length, 1,
               "expected exactly one element");
  return arr[0];
};
