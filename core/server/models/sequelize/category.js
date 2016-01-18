var Sqlize = require('sequelize');

module.exports = [
  'Category', {
    id: {type: Sqlize.INTEGER, primaryKey: true},
    name: {
      type: Sqlize.STRING(80), allowNull: false, unique: true,
      validate: {notIn: [["item"]]}
    }
  }
];
