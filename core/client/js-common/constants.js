var util = require('./util');

var ENDPOINTS = {
  categories: '/api/categories',
  items: '/api/items',
  item_new: '/api/item'
};
util.freeze(ENDPOINTS);

var CONST = {};

CONST.ENDPOINTS = ENDPOINTS;
CONST.APP_NAME = 'node-catalog';
CONST.PARTIAL_BASE = 'static/partials/';

util.freeze(CONST);

module.exports = CONST;
