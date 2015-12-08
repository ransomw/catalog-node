var _ = require('lodash');

var db = require('./db');

var _User = require('./user');
var _Category = require('./category');
var _Item = require('./item');

// not certain what the "right" level of abstraction is:
// can database connections live outside an app?
// a specific use-case might help decoupling...
// ...maybe a cli to the database?

// https://github.com/sequelize/sequelize/issues/931
var get_model = function(db_conn, model_def) {
  // freezeTableName: true prevents initdb error
  model_def[2] = _.merge(model_def[2] || {},
                         {freezeTableName: true});
  return db_conn.define.apply(db_conn, model_def);
};

module.exports.User = _User;
module.exports.Category = _Category;
module.exports.Item = _Item;
module.exports.get_model = get_model;
module.exports.get_db = db.get_db;

module.exports.lots_of_items = function () {
  var sqlize = db.get_db();
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

