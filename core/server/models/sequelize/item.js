var _ = require('lodash');
var Sqlize = require('sequelize');

var User = require('./user');
var Category = require('./category');

module.exports = [
  'Item', {
    id: {type: Sqlize.INTEGER, primaryKey: true},
    title: {type: Sqlize.STRING(80), allowNull: false, unique: true},
    description: {type: Sqlize.STRING(250), allowNull: false},
    category_id: {
      type: Sqlize.INTEGER,
      references: {
        model: Category[0],
        key: 'id'
      },
      allowNull: false
    },
    user_id: {
      type: Sqlize.INTEGER,
      references: {
        model: User[0],
        key: 'id'
      }
    }
  }
];
