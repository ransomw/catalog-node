var _ = require('lodash');
var Sqlize = require('sequelize');
// unlike Flask, there's no application context stack
// Koa might have something similar?
var app = require('../index');

var sqlite_path;

var connect_db = function () {
  sqlite_path = app.locals.config.SQLITE_PATH;
  return new Sqlize(null, null, null, {
    dialect: 'sqlite',
    storage: sqlite_path,
    logging: function (msg) { }
  });
};


var get_db = function () {
  if (!app.locals.db_conn ||
      sqlite_path !== app.locals.config.SQLITE_PATH) {
    app.locals.db_conn = connect_db();
  }
  return app.locals.db_conn;
};

module.exports.get_db = get_db;
