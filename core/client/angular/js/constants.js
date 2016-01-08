var _ = require('lodash');
var deepFreeze = require('deep-freeze');
// var COMMON_PATH = '../../../common';
// var CCONST = require(COMMON_PATH + '/const');
var CCONST = require('../../../common/const');

var API_ENDPOINTS = _.mapValues(CCONST.API_ENDPOINTS, function(endpoint) {
  return CCONST.API_BASE + endpoint;
});
deepFreeze(API_ENDPOINTS);

var AUTH_ENDPOINTS = _.mapValues(
  CCONST.AUTH_ENDPOINTS, function(endpoint) {
    return CCONST.AUTH_BASE + endpoint;
  });
deepFreeze(AUTH_ENDPOINTS);

var CONST = {};

CONST.API_ENDPOINTS = API_ENDPOINTS;
CONST.AUTH_ENDPOINTS = AUTH_ENDPOINTS;
CONST.APP_NAME = 'node-catalog';
CONST.PARTIAL_BASE = CCONST.CLIENT_STATIC_URL + '/partials/';

// CONST.COMMON_MODULE_PATH = COMMON_PATH;

deepFreeze(CONST);

module.exports = CONST;
