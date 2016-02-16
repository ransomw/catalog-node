/*global require, module */
const base = require('./base');


const models = Object.freeze({
  Base: {
    bookshelf: base.model
  },
  User: {
    extends: 'Base',
    bookshelf: [{
      tableName: 'users'
    }, {}]

  },
  Category: {
    extends: 'Base',
    bookshelf: [{
      tableName: 'categories'
    }, {}]
  },
  Item: {
    extends: 'Base',
    bookshelf: [{
      tableName: 'items'
    }, {}]
  }
});

var exports = {};

exports.get_db = require('./get_db');
exports.models = models;

module.exports = exports;
