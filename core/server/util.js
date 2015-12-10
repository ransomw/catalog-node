
// maybe useful for promise chaining? feels hacky
module.exports.null_wrap = function (fn) {
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
module.exports.filter_int = function (val) {
  if(/^(\-|\+)?([0-9]+)$/.test(val))
    return Number(val);
  return NaN;
};
