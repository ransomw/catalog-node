var util = require('./util');

var API_ENDPOINTS = {
  categories: '/categories',
  items: '/items',
  item: '/item'
};

util.freeze(API_ENDPOINTS);

var AUTH_ENDPOINTS = {
  login: '/login',
  logout: '/logout',
  user: '/user'
};

util.freeze(AUTH_ENDPOINTS);

var CLIENTS = {
  ANGULAR: 'angular',
  EMBER: 'ember'
};

util.freeze(CLIENTS);

var CONST = {};

CONST.CLIENTS = CLIENTS;
CONST.DEFAULT_CLIENT = CLIENTS.ANGULAR;
CONST.CLIENT_STATIC_URL = '/static';
CONST.CLIENT_STATIC_DIR = 'client_build';
CONST.API_ENDPOINTS = API_ENDPOINTS;
CONST.API_BASE = '/api';
CONST.AUTH_ENDPOINTS = AUTH_ENDPOINTS;
CONST.AUTH_BASE = '/auth';

util.freeze(CONST);

module.exports = CONST;
