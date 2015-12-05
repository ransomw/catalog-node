
// as suggested on mdn's parseInt page
module.exports.filter_int = function (val) {
  if(/^(\-|\+)?([0-9]+)$/.test(val))
    return Number(val);
  return NaN;
};
