var _ = require('lodash');
var util = require('./util');
var CCONST = require('../../common/const');

var API_ENDPOINTS = _.mapValues(CCONST.API_ENDPOINTS, function(endpoint) {
  return CCONST.API_BASE + endpoint;
});
util.freeze(API_ENDPOINTS);

var AUTH_ENDPOINTS = _.mapValues(
  CCONST.AUTH_ENDPOINTS, function(endpoint) {
    return CCONST.AUTH_BASE + endpoint;
  });
util.freeze(AUTH_ENDPOINTS);

var CONST = {};

CONST.API_ENDPOINTS = API_ENDPOINTS;
CONST.AUTH_ENDPOINTS = AUTH_ENDPOINTS;
CONST.APP_NAME = 'node-catalog';
CONST.PARTIAL_BASE = CCONST.CLIENT_STATIC_URL + '/partials/';

util.freeze(CONST);

module.exports = CONST;
