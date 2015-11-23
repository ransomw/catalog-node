var assert = require('chai').assert;
var _ = require('lodash');
var Q = require('q');

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

// fn may return a value or a promise
module.exports.promise_seq_do = function (arr, fn) {
  return arr.reduce(function (p_chain, arr_elem) {
    return p_chain.then(function () {
      return fn(arr_elem);
    });
  }, Q());
};

// probably slow...
module.exports.promise_seq_map = function (arr, fn) {
  var curr_res_arr;
  return arr.reduce(function (p_chain, arr_elem) {
    return p_chain.then(function (res_arr) {
      curr_res_arr = res_arr;
      return fn(arr_elem);
    }).then(function (next_res) {
      curr_res_arr.push(next_res);
      return curr_res_arr;
    });
  }, Q([]));
};
