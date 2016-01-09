var _ = require('lodash');
var CCONST = require('../common/const');
var util = require('./util');

var HTTP_RES_CODE = {
  client_err: 400,
  auth_err: 401,
  server_err: 500
};

util.freeze(HTTP_RES_CODE);

var CONST = {};

CONST.HTTP_RES_CODE = {
  client_err: 400,
  auth_err: 401,
  server_err: 500
};

// CONST.CLIENT_STATIC_URL = CCONST.CLIENT_STATIC_URL;
// CONST.CLIENT_STATIC_DIR = CCONST.CLIENT_STATIC_DIR;
// CONST.API_ENDPOINTS = CCONST.API_ENDPOINTS;
// CONST.API_BASE = CCONST.API_BASE;
// CONST.AUTH_ENDPOINTS = CCONST.AUTH_ENDPOINTS;
// CONST.AUTH_BASE = CCONST.AUTH_BASE;

// todo: b/c lodash 3 doesn't support immutability, this merge
//       overwrites server constants with common constants
//       it'd be better to overwrite common with server-specific
// in the meantime, make certain no keys are in common
var common_keys = _.intersection(_.keys(CONST), _.keys(CCONST));
if (common_keys.length !== 0) {
  throw new Error("programming error: " +
                  "server attempting to overwrite constants '" +
                  common_keys.toString());
}
module.exports = util.freeze(_.merge(CONST, CCONST));
