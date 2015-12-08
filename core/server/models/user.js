var _ = require('lodash');
var Sqlize = require('sequelize');

module.exports = [
  'User',
  {
    id: {type: Sqlize.INTEGER, primaryKey: true},
    name: {type: Sqlize.STRING(250), allowNull: false},
    email: {type: Sqlize.STRING(250), allowNull: false, unique: true},
    password: {type: Sqlize.STRING(500), allowNull: true}
  },
  {
    instanceMethods: {
      toJSON: function () {
        var json = this.constructor.super_.prototype
              .toJSON.apply(this, arguments);
        return _.omit(json, ['password']);
      }
    }
  }
];
