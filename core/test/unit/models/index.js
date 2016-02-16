/*global require, module */
var fs = require('fs');

var _ = require('lodash');
var Q = require('q');
var tmp = require('tmp');

var util = require('../../../common/util');
var Models = require('../../../server/models');
var PERSISTANCE_TYPES = require('../../../server/models/const')
      .PERSISTANCE_TYPES;
var ITEMS_DATA = util.freeze(
  require('../../../server/models/lots_of_items.json'));

tmp.setGracefulCleanup();

var models_test = function (models, t) {

  var TEST_DATA = {
    USER_EMAIL: 'a@a.org',
    USER_PASS: 'lka9FQzxc', // would be salted
    USER_NAME: 'alice',
    ITEM: {
      title: "Ball",
      description: "World Cup 2014 edition",
      cat: "Soccer"
    },
    ITEM_UPDATE: {
      title: "Russian hockey stick",
      description: "infested with termites (a-la The Simspons)",
      cat: "Hockey"
    }
  };

  var db_file = tmp.fileSync();
  var get_db;
  t.ok(models.User, "has user model");
  t.ok(models.Category, "has category model not found");
  t.ok(models.Item, "has item model");
  t.equal(typeof models.get_db, 'function', "has get_db function");
  t.equal(typeof models.get_model, 'function', "has get_model function");
  get_db = (function (sqlite_path) {
    return function () {
      return models.get_db({
        sqlite_path: sqlite_path
      });
    };
  }(db_file.name));

  var init_db_p = Q().then(function () {
    return models.lots_of_items({
      sqlite_path: db_file.name
    });
  }).then(function () {
    t.ok(models.get_model(get_db(), models.User),
         "gets user model");
    t.ok(models.get_model(get_db(), models.Category),
         "gets category model");
    t.ok(models.get_model(get_db(), models.Item),
         "gets item model");
  });

  var test_user_p = Q.all([init_db_p]).then(function () {
    var user_model = models.get_model(get_db(), models.User);
    t.equal(typeof user_model.findOne, 'function',
            "user model has findOne function");
    return user_model.findOne({where: {email: TEST_DATA.USER_EMAIL}});
  }).then(function (no_user_res) {
    t.equal(no_user_res, null,
            "returns null on no user model found");
  }).then(function () {
    return models.get_model(get_db(), models.User)
      .create({
        name: TEST_DATA.USER_NAME,
        email: TEST_DATA.USER_EMAIL,
        password: TEST_DATA.USER_PASS
      });
  }).then(function (new_user) {
    t.ok(new_user, "create returns user object");
    t.ok(new_user.null, "new user object has null attr set");
    if (new_user.get('id')) {
      t.equal(new_user.get('id'), new_user.null,
              "new user id prop matches null attr if set");
    }
  }).then(function () {
    return models.get_model(get_db(), models.User)
      .findOne({where: {email: TEST_DATA.USER_EMAIL}});
  }).then(function (user) {
    var user_id;
    t.ok(user, "got defined result for user lookup by email");
    t.notEqual(user, null,
               "got non-null result for user lookup by email");
    t.equal(user.get('name'), TEST_DATA.USER_NAME,
            "correctly stored user name");
    t.equal(user.get('email'), TEST_DATA.USER_EMAIL,
            "correctly stored user email");
    t.equal(user.get('password'), TEST_DATA.USER_PASS,
            "correctly stored user password");
    user_id = user.get('id');
    t.ok(user_id, "user id prop exists");
    return user_id;
  }).then(function (user_id) {
    var user_model = models.get_model(get_db(), models.User);
    t.equal(typeof user_model.findById, 'function',
            "user model has findById function");
    return user_model.findById(user_id);
  }).then(function (user) {
    var user_json;
    t.ok(user, "got defined result for user lookup by id");
    t.notEqual(user, null,
               "got non-null result for user lookup by id");
    t.equal(typeof user.toJSON, 'function',
            "toJSON function defined on user model");
    user_json = user.toJSON();
    t.ok(user_json, "user json is defined");
    t.notEqual(user_json, null, "user json is non-null");
    return user;
  });

  var get_category = function (cat_name, opt_args) {
    var opts = opt_args || {};
    var cat_data = util.arr_elem(ITEMS_DATA.filter(function (cat) {
      return cat_name === cat.name;
    }));
    return Q().then(function () {
      return models.get_model(get_db(), models.Category)
        .findAll({where: {name: cat_data.name}});
    }).then(function (cats) {
      if (opts.run_asserts) {
        t.ok(Array.isArray(cats),
             "category model findAll name query returns array");
        t.equal(cats.length, 1,
                "got expected number of categories");
        t.deepEqual(cats.map(function (cat) {
          return cat.toJSON().name;
        }).sort(), [cat_data].map(function (cat) {
          return cat.name;
        }).sort(), "category inst.s toJSON exists "+
                    "and inst.s have correct names");
      }
      return cats[0];
    });
  };

  var test_category_p = Q.all([
    init_db_p,
    // to ensure consistent output
    test_user_p
  ]).then(function () {
    var cat_model = models.get_model(get_db(), models.Category);
    t.equal(typeof cat_model.findAll, 'function',
            "category model has findAll function");
    return cat_model.findAll({ include: [{ all: true }]});
  }).then(function (cats) {
    t.ok(Array.isArray(cats),
         "category model findAll include all returns array");
    t.equal(cats.length, ITEMS_DATA.length,
            "got expected number of categories");
    t.deepEqual(cats.map(function (cat) {
      return cat.toJSON().name;
    }).sort(), ITEMS_DATA.map(function (cat) {
      return cat.name;
    }).sort(), "category inst.s toJSON exists "+
                "and inst.s have correct names");
  }).then(function () {
    return get_category(ITEMS_DATA[0].name, {run_asserts: true});
  });

  var test_item = function (item, test_data) {
    var item_json = item.toJSON();
    t.equal(item_json.title, test_data.title,
            "correct item title");
    t.equal(item_json.description, test_data.description,
            "correct item description");
  };

  var test_item_p = (function () {
    var item_id;
    return Q.all([
      init_db_p,
      // to ensure consistent output
      test_user_p,
      test_category_p
    ]).then(function () {
      return get_category(TEST_DATA.ITEM.cat);
    }).then(function (cat) {
      var cat_json = cat.toJSON();
      var item_model = models.get_model(get_db(), models.Item);
      t.equal(typeof item_model.create, 'function',
              "item model has create function");
      return item_model.create(_.merge(
        {}, {category_id: cat_json.id},
        _.omit(TEST_DATA.ITEM, ['cat'])));
    }).then(function (new_item) {
      t.ok(new_item, "creates item");
    }).then(function () {
      return models.get_model(get_db(), models.Item)
        .findAll({where: {title: TEST_DATA.ITEM.title}});
    }).then(function (items) {
      var item = util.arr_elem(items);
      t.ok(item, "finds item by title");
      test_item(item, TEST_DATA.ITEM);
    }).then(function () {
      return get_category(TEST_DATA.ITEM.cat);
    }).then(function (cat) {
      return models.get_model(get_db(), models.Item)
        .findAll({where: {title: TEST_DATA.ITEM.title,
                          category_id: cat.id}});
    }).then(function (items) {
      var item = util.arr_elem(items);
      var item_json = item.toJSON();
      t.ok(item, "finds item by title and category id");
      test_item(item, TEST_DATA.ITEM);
      t.ok(item_json.id, "item json has id attr");
      item_id = item_json.id;
    }).then(function () {
      var item_model = models.get_model(get_db(), models.Item);
      t.equal(typeof item_model.findById, 'function',
              "item model has findById function");
      return Q.all([
        item_model.findById(item_id),
        get_category(TEST_DATA.ITEM_UPDATE.cat)
      ]);
    }).spread(function (item, cat) {
      t.ok(item, "finds item by id");
      t.equal(typeof item.updateAttributes, 'function',
              "item inst. has updateAttributes function");
      return item.updateAttributes(_.merge(
        {}, {category_id: cat.id},
        _.omit(TEST_DATA.ITEM_UPDATE, ['cat'])));
    }).then(function (updated_item) {
      t.notEqual(updated_item, null,
                 "updateAttributes returns non-null value");
    }).then(function () {
      return models.get_model(get_db(), models.Item)
        .findById(item_id);
    }).then(function (item) {
      test_item(item, TEST_DATA.ITEM_UPDATE);
    }).then(function () {
      return models.get_model(get_db(), models.Item)
        .findById(item_id);
    }).then(function (item) {
      t.equal(typeof item.destroy, 'function',
              "item inst. has destroy function");
      return item.destroy();
    }).then(function (res) {
      t.notEqual(res, null,
                 "destroy returns non-null value");
    }).then(function () {
      return models.get_model(get_db(), models.Item)
        .findAll({where: {title: TEST_DATA.ITEM.title}});
    }).then(function (items) {
      t.ok(Array.isArray(items),
           "item model findAll returns array");
      t.equal(items.length, 0,
              "item lookup by name fails after destroy");
    });
  }());

  Q.all([
    test_user_p,
    test_category_p,
    test_item_p
  ]).then(function () {
    t.end();
  }, function (err) {
    t.end(err);
  }).finally(function () {
    fs.closeSync(db_file.fd);
    fs.unlinkSync(db_file.name);
  });

};

var make_models_test = function (p_type) {
  var models;
  return function (t) {
    try {
      models = new Models(p_type);
      models_test(models, t);
    } catch (err) {
      t.end(err);
    }
  };
};

module.exports = function (t) {
  _.values(
    PERSISTANCE_TYPES
    // _.pick(PERSISTANCE_TYPES, ['BOOKSHELF'])
    // _.pick(PERSISTANCE_TYPES, ['SEQUELIZE'])
  ).forEach(function (p_type) {
    t.test(p_type, make_models_test(p_type));
  });
};
