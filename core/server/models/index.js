var _ = require('lodash');
var Sqlize = require('sequelize');
var app = require('../index');

// todo: consider flask-like app context notion
var sqlite_path;


var connect_db = function () {
  sqlite_path = app.locals.config.SQLITE_PATH;
  return new Sqlize(null, null, null, {
    dialect: 'sqlite',
    storage: sqlite_path,
    logging: function (msg) { }
  });
};

// todo: defining model multiple times is allowed, but slow...
// consider keeping track of defined models internal to app,
// and redefine on new database connection
// also, see
// https://github.com/sequelize/sequelize/issues/931
var get_model = function(db_conn, model_def) {
  // todo: sort out why freezeTableName: true prevents initdb error
  model_def[2] = _.merge(model_def[2] || {},
                         {freezeTableName: true});
  return db_conn.define.apply(db_conn, model_def);
};

var get_db = function () {
  if (!app.locals.db_conn ||
      sqlite_path !== app.locals.config.SQLITE_PATH) {
    app.locals.db_conn = connect_db();
  }
  return app.locals.db_conn;
};

var _User = [
  'User',
  {
    id: {type: Sqlize.INTEGER, primaryKey: true},
    name: {type: Sqlize.STRING(250), allowNull: false},
    email: {type: Sqlize.STRING(250), allowNull: false, unique: true},
    password: {type: Sqlize.STRING(500), allowNull: true}
  }
];

// todo: for Udacity URL scheme spec, ensure no category is named 'item'
var _Category = [
  'Category', {
    id: {type: Sqlize.INTEGER, primaryKey: true},
    name: {type: Sqlize.STRING(80), allowNull: false, unique: true}
  }
];

var _Item = [
  'Item', {
    id: {type: Sqlize.INTEGER, primaryKey: true},
    title: {type: Sqlize.STRING(80), allowNull: false, unique: true},
    description: {type: Sqlize.STRING(250), allowNull: false},
    category_id: {
      type: Sqlize.INTEGER,
      references: {
        model: _Category[0],
        key: 'id'
      },
      allowNull: false
    },
    user_id: {
      type: Sqlize.INTEGER,
      references: {
        model: _User[0],
        key: 'id'
      }
    }
  }
];

var lots_of_items = function () {
  var sqlize = get_db();
  var User = get_model(sqlize, _User);
  var Category = get_model(sqlize, _Category);
  var Item = get_model(sqlize, _Item);
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

module.exports.User = _User;
module.exports.Category = _Category;
module.exports.Item = _Item;
module.exports.get_model = get_model;
module.exports.get_db = get_db;
module.exports.lots_of_items = lots_of_items;
