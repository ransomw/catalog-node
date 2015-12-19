var path = require('path');
var _ = require('lodash');
var Q = require('q');

var TEST_DIR = global.M_ARGS.test_dir;
var PROJ_ROOT = path.join(TEST_DIR, '../../..');
var cutil = require(PROJ_ROOT + '/core/common/util');

module.exports.set_eq = function (arr1, arr2) {
  var sarr1 = _.uniq(arr1);
  var sarr2 = _.uniq(arr2);
  return sarr1.length === sarr2.length &&
    _.intersection(sarr1, sarr2).length === sarr1.length;
};

module.exports.arr_elem = cutil.arr_elem;

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

// in case arguements needs to be sliced (or diced)
module.exports.args_2_arr = function(args) {
  var arr = [];
  var i;
  for (i = 0; i < args.length; i += 1) {
    arr[i] = args[i];
  }
  return arr;
};
