var _ = require('lodash');
var freeze = require('deep-freeze');

var PERSISTANCE_TYPES = {
  SEQUELIZE: 'sequelize',
  BOOKSHELF: 'bookshelf'
};
freeze(PERSISTANCE_TYPES);

var CONST = {};
CONST.PERSISTANCE_TYPES = PERSISTANCE_TYPES;
freeze(CONST);

var exports;

exports = CONST;

module.exports = exports;
