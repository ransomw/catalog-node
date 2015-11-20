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

var lots_of_items = function () {
  return sqlize.sync({force: true}).then(function () {
    return Category.create({
      name: "Soccer"
    });
  }).then(function (catSoccer) {
    return Item.create({
      title: "Two shinguards",
      description: "Prevent injuries resulting from kicks to the shin",
      category_id: catSoccer.null
    }).then(function () {
      return Item.create({
        title: "Shinguards",
        description: "Prevent injuries resulting from kicks to the shin",
        category_id: catSoccer.null
      });
    }).then(function () {
      return Item.create({
        title: "Jersey",
        description: "World Cup 2014 commemorative jersey",
        category_id: catSoccer.null
      });
    }).then(function () {
      return Item.create({
        title: "Soccer Cleats",
        description: "Nike cleats",
        category_id: catSoccer.null
      });
    }).done();
  }).then(function () {
    return Category.create({
      name: "Basketball"
    });
  }).then(function () {
    return Category.create({
      name: "Baseball"
    });
  }).then(function (catBaseball) {
    return Item.create({
      title: "Bat",
      description: "Louisville slugger",
      category_id: catBaseball.null
    }).done();
  }).then(function () {
    return Category.create({
      name: "Frisbee"
    });
  }).then(function (catFrisbee) {
    return Item.create({
      title: "Frisbee",
      description: "A flying disc",
      category_id: catFrisbee.null
    }).done();
  }).then(function () {
    return Category.create({
      name: "Snowboarding"
    });
  }).then(function (catSnowboarding) {
    return Item.create({
      title: "Goggles",
      description: "Keep the snow out of your eyes",
      category_id: catSnowboarding.null
    }).then(function () {
      return Item.create({
        title: "Snowboard",
        description: "Type-A vintage",
        category_id: catSnowboarding.null
      });
    }).done();
  }).then(function () {
    return Category.create({
      name: "Rock Climbing"
    });
  }).then(function () {
    return Category.create({
      name: "Foosball"
    });
  }).then(function () {
    return Category.create({
      name: "Skating"
    });
  }).then(function () {
    return Category.create({
      name: "Hockey"
    });
  }).then(function (catHockey) {
    return Item.create({
      title: "Stick",
      description: "A hockey stick",
      category_id: catHockey.null
    });
  });
};

module.exports = {
  sqlize: sqlize,
  User: User,
  Category: Category,
  Item: Item,
  lots_of_items: lots_of_items
};
