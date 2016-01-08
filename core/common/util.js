var assert = require('chai').assert;

/* https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/freeze */
var deepFreeze = function (obj) {
  var propNames = Object.getOwnPropertyNames(obj);
  propNames.forEach(function(name) {
    var prop = obj[name];
    if (typeof prop == 'object' && prop !== null && !Object.isFrozen(prop))
      deepFreeze(prop);
  });
  return Object.freeze(obj);
};

module.exports.arr_elem = function(arr) {
  assert(Array.isArray(arr),
            "arr_elem expects array argument");
  assert.equal(arr.length, 1,
               "expected exactly one element");
  return arr[0];
};

// module.exports.freeze = deepFreeze;
module.exports.freeze = require('deep-freeze');
