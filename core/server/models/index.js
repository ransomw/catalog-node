var Sqlize = require('sequelize');

var sqlize = new Sqlize(null, null, null, {
  dialect: 'sqlite',
  storage: 'catalog.db'
});

var User = sqlize.define('User', {
  id: {type: Sqlize.INTEGER, primaryKey: true},
  name: {type: Sqlize.STRING(250), allowNull: false},
  email: {type: Sqlize.STRING(250), allowNull: false, unique: true},
  password: {type: Sqlize.STRING(500), allowNull: true}
});

// todo: for Udacity URL scheme spec, ensure no category is named 'item'
var Category = sqlize.define('Category', {
  id: {type: Sqlize.INTEGER, primaryKey: true},
  name: {type: Sqlize.STRING(80), allowNull: false, unique: true}
});

var Item = sqlize.define('Item', {
  id: {type: Sqlize.INTEGER, primaryKey: true},
  title: {type: Sqlize.STRING(80), allowNull: false, unique: true},
  description: {type: Sqlize.STRING(250), allowNull: false},
  category_id: {
    type: Sqlize.INTEGER,
    references: {
      model: Category,
      key: 'id'
    },
    allowNull: false
  },
  user_id: {
    type: Sqlize.INTEGER,
    references: {
      model: User,
      key: 'id'
    }
  }
});

module.exports = {
  sqlize: sqlize,
  User: User,
  Category: Category,
  Item: Item
};
