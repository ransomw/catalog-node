/*global require, module */
const base = require('./base');
const schema = require('./schema');

const models = Object.freeze({
  Base: {
    bookshelf: base.model
  },
  User: {
    extends: 'Base',
    bookshelf: [{
      tableName: 'users'
    }, {
      tableAttributes: schema.users
    }]

  },
  Category: {
    extends: 'Base',
    bookshelf: [{
      tableName: 'categories'
    }, {
      tableAttributes: schema.categories
    }]
  },
  Item: {
    extends: 'Base',
    bookshelf: [{
      tableName: 'items'
    }, {
      tableAttributes: schema.items
    }]
  }
});

var exports = {};

exports.get_db = require('./get_db');
exports.models = models;

module.exports = exports;
