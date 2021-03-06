/*global require, module */
var CONST = require('../const');
var auth = require('./auth').router;
var api = require('./api');

var register_routes = function (app) {
  app.get('/', function (req, res) {
    var index_template;
    var client_config = app.locals.config.CLIENT;
    if (client_config === CONST.CLIENTS.ANGULAR) {
      index_template = 'angular';
    } else if (client_config === CONST.CLIENTS.EMBER) {
      index_template = 'ember';
    } else {
      throw new Error("unknown client type '"+
                      client_config + "'");
    }
    res.render(index_template,
               // todo: fewer duplicate strings between core/index.js
               //       and server-side templates
               {client_url_path: app.locals.client_url_path});
  });

  app.register_router(CONST.AUTH_BASE, auth);
  app.register_router(CONST.API_BASE, api.make_router());
};

var exports = {};

exports.register_routes = register_routes;

module.exports = exports;
