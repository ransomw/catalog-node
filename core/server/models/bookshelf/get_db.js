/*global require, module */
const Q = require('q');
const _ = require('lodash');

const knex = require('knex');
const bookshelf = require('bookshelf');

const schema = require('./schema');

const db_state = {
  sqlite_path: undefined,
  conn: undefined
};

const _make_sync = function (knex_inst) {
  return function (opts) {

    const drop_table = function (table_name) {
      return Q().then(function () {
        return knex_inst.schema.hasTable(table_name);
      }).then(function (exists) {
        if (exists) {
          return knex_inst.schema.dropTable(table_name);
        }
        return undefined;
      });
    };
    var drop_tables = function () {
      var drop_table_promises = [
        'users',
        'categories',
        'items'
      ].map(drop_table);
      return Q.all(drop_table_promises);
    };

    const apply_schema = function (table, col_defs) {
      _.mapKeys(col_defs, function (col_def, col_name) {
        var fn_add_col = table[col_def.type];
        var type_args = col_def.type_args || [];
        var chainable;
        if (typeof fn_add_col !== 'function') {
          throw new Error("unexpected column type '" +
                          col_def.type + "'");
        }
        chainable = fn_add_col.apply(
          table,
          [col_name].concat(type_args));
        if (col_def.references) {
          chainable = chainable.references(col_def.references);
        }
        // note that undefined indicates false for nullable and unique
        if (col_def.nullable) {
          chainable = chainable.nullable();
        } else {
          chainable = chainable.notNullable();
        }
        if (col_def.unique) {
          chainable = chainable.unique();
        }
      });
    };

    const create_tables = function () {
      return Q().then(function () {
        return knex_inst.schema
          .createTable('users', function (table) {
            table.increments('id').primary();
            apply_schema(table, schema.users);
          });
      }).then(function () {
        return knex_inst.schema
          .createTable('categories', function (table) {
            table.increments('id').primary();
            // TODO: validation: category name may not be 'item'
            apply_schema(table, schema.categories);
          });
      }).then(function () {
        return knex_inst.schema
          .createTable('items', function (table) {
            table.increments('id').primary();
            apply_schema(table, schema.items);
          });
      });
    };

    var unknown_opts = _.difference(_.keys(opts), ['force']);
    if (unknown_opts.length !== 0) {
      throw new Error("sync got unknown options '" +
                      unknown_opts + "'");
    }
    if (opts.force !== true) {
      throw new Error("sync w/o {force: true} option unimplemented" +
                      "got opts '" + opts + "'");
    }

    return Q().then(function () {
      return drop_tables();
    }).then(function () {
      return create_tables();
    }).then(function () {});
  };
};

const connect_db = function (sqlite_path) {
  var knex_inst;
  var bookshelf_inst;
  db_state.sqlite_path = sqlite_path;
  knex_inst = knex({
    client: 'sqlite',
    connection: {
      filename: sqlite_path
    }
  });
  bookshelf_inst = bookshelf(knex_inst);
  bookshelf_inst.sync = _make_sync(knex_inst);
  return bookshelf_inst;
};

const get_db = function (opt_args) {
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

module.exports = get_db;
