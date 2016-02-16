/*global require, module */
var Q = require('q');
var _ = require('lodash');

var iface_sequelize = require('./sequelize');
var iface_bookshelf = require('./bookshelf');

var items_data = require('./lots_of_items.json');

var CONST = require('./const');

// https://github.com/sequelize/sequelize/issues/931
var get_sequlize_model = function(db_conn, model_def) {
  // freezeTableName: true prevents initdb error
  model_def[2] = _.merge(model_def[2] || {},
                         {freezeTableName: true});
  return db_conn.define.apply(db_conn, model_def);
};

// db_conn: a bookshelf instance
var get_bookshelf_model = function(db_conn, model_def) {
  const models = iface_bookshelf.models;
  var base_model;
  if (model_def.extends) {
    if (typeof model_def.extends !== 'string') {
    throw new Error("expected bookshelf model_def.extends " +
                    "to be a string if present");
    }
    if (typeof models[model_def.extends] === 'undefined') {
      throw new Error("'" + model_def.extends + "' model " +
                      "definition not found");
    }
    base_model = get_bookshelf_model(
      db_conn, models[model_def.extends]);
    return base_model.extend.apply(base_model, model_def.bookshelf);
  }
  return db_conn.Model.extend.apply(db_conn.Model, model_def.bookshelf);
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

/*
 * p_type: persistance type
 */
var Models = function (p_type) {
  if (_.values(CONST.PERSISTANCE_TYPES).indexOf(p_type) === -1) {
    throw new Error("unknown persistance type '" + p_type + "'");
  }
  if (p_type === CONST.PERSISTANCE_TYPES.SEQUELIZE) {
    // todo: check interface keys with a set equality utility function
    _.merge(this, iface_sequelize);
    this.get_model = get_sequlize_model;
  } else if (p_type === CONST.PERSISTANCE_TYPES.BOOKSHELF) {
    _.merge(this,
            _.pick(iface_bookshelf, ['get_db']),
            _.pick(iface_bookshelf.models, [
              'User',
              'Category',
              'Item'
            ])
           );
    this.get_model = get_bookshelf_model;
  } else {
    throw new Error("unimplemented persistance type '" + p_type + "'");
  }
};

// var exports = {};

// // todo: check interface keys with a set equality utility function
// _.merge(exports, iface_sequelize);

// exports.get_model = get_model;

Models.prototype.lots_of_items = function (opt_args) {
  var self = this;
  var opts = opt_args || {};
  var db_inst = self.get_db(opts);
  var User = self.get_model(db_inst, self.User);
  var Category = self.get_model(db_inst, self.Category);
  var Item = self.get_model(db_inst, self.Item);

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

  return Q().then(function () {
    return db_inst.sync({force: true});
  }).then(function () {
    return Q.all(items_data.map(make_p_cat));
  });
};

module.exports = Models;
