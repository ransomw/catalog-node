var _ = require('lodash');
var Sqlize = require('sequelize');

// consider managing multiple database connections in this module
var db_state = {
  sqlite_path: undefined,
  conn: undefined
};

var connect_db = function (sqlite_path) {
  db_state.sqlite_path = sqlite_path;
  return new Sqlize(null, null, null, {
    dialect: 'sqlite',
    storage: db_state.sqlite_path,
    logging: function (msg) { }
  });
};


var get_db = function (opt_args) {
  var opts = opt_args || {};
  var sqlite_path;
  if (typeof opts.sqlite_path === 'undefined') {
    throw new Error("undefined sqlite path");
  } else if (typeof opts.sqlite_path !== 'string') {
    throw new Error("sqlite path should be string");
  } else {
    sqlite_path = opts.sqlite_path;
  }
  if (!db_state.conn || db_state.sqlite_path !== sqlite_path) {
    db_state.conn = connect_db(sqlite_path);
  }
  return db_state.conn;
};

var exports = {};

exports.get_db = get_db;

module.exports = exports;
