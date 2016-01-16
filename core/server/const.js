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

CONST.HTTP_RES_CODE = HTTP_RES_CODE;

// CONST.CLIENT_STATIC_URL = CCONST.CLIENT_STATIC_URL;
// CONST.CLIENT_STATIC_DIR = CCONST.CLIENT_STATIC_DIR;
// CONST.API_ENDPOINTS = CCONST.API_ENDPOINTS;
// CONST.API_BASE = CCONST.API_BASE;
// CONST.AUTH_ENDPOINTS = CCONST.AUTH_ENDPOINTS;
// CONST.AUTH_BASE = CCONST.AUTH_BASE;

module.exports = util.freeze(_.merge(_.cloneDeep(CCONST),
                                     _.cloneDeep(CONST)));
