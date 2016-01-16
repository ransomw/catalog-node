var Q = require('q');
var _ = require('lodash');

var db = require('./db');

var _User = require('./user');
var _Category = require('./category');
var _Item = require('./item');

var items_data = require('./lots_of_items.json');

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

/* exposed model api
 *
 * .findOne({where: {field: val}})
 *   - returns null when record not found
 * .create({field: val, ...})
 * .findById(id)
 *
 * exposed model instance api
 *
 * .get('field')
 */

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

  var make_make_p_item = function (cat_id) {
    return function (item_data) {
      return Q().then(function () {
        return Item.create({
          title: item_data.title,
          description: item_data.description,
          category_id: cat_id
        });
      });
    };
  };

  var make_p_cat = function (cat_data) {
    return Q().then(function () {
      return Category.create({
        name: cat_data.name
      });
    }).then(function (new_cat) {
      return Q.all(cat_data.items.map(make_make_p_item(new_cat.null)));
    });
  };

  return sqlize.sync({force: true}).then(function () {
    return Q.all(items_data.map(make_p_cat));
  });
};
