
// maybe useful for promise chaining? feels hacky
module.exports.null_wrap = function (fn) {
  return function (res) {
    if (res === null) {
      return null;
    }
    return fn(res);
  };
};

// as suggested on mdn's parseInt page
module.exports.filter_int = function (val) {
  if(/^(\-|\+)?([0-9]+)$/.test(val))
    return Number(val);
  return NaN;
};
