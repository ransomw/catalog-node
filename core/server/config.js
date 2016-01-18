var M_CONST = require('./models/const');
var CONST = require('./const');

var exports = {};

exports.SQLITE_PATH = 'catalog.db';
exports.CLIENT = CONST.DEFAULT_CLIENT;
exports.PERSISTANCE_TYPE = M_CONST.PERSISTANCE_TYPES.SEQUELIZE;

module.exports = exports;

