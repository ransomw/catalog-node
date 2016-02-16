/*global require, module */
const Q = require('q');
const _ = require('lodash');
const bookshelf = require('bookshelf');

const model = [{

  updateAttributes: function (updates, opts) {
    var self = this;
    if (typeof opts !== 'undefined') {
      throw new Error("options for updateAttributes unimplemented");
    }
    self.set(updates);
    return Q().then(function () {
      return self.save();
    });
  }

}, {

  create: function (values) {
    var model_inst = this.forge(values);
    return Q().then(function () {
      return model_inst.save();
    }).then(function (model_inst_saved) {
      model_inst_saved.null = model_inst_saved.get('id');
      return model_inst_saved;
    });
  },

  findOne: function (opts) {
    var self = this;
    var where_arg = opts.where;
    var unknown_opts = _.difference(_.keys(opts), ['where']);
    if (unknown_opts.length !== 0) {
      throw new Error("findOne got unknown options '" +
                      unknown_opts + "'");
    }
    if (typeof where_arg === 'undefined') {
      throw new Error("findOne w/o 'where' option unimplemented " +
                      "got opts '" + _.keys(opts) + "'");
    }
    return Q().then(function () {
      return self.where(where_arg).fetch();
    });
  },

  findById: function (model_id) {
    var self = this;
    return Q().then(function () {
      return self.where({id: model_id}).fetch();
    });
  },

  findAll: function (opts) {
    var self = this;
    var arg_include = opts.include;
    var arg_where = opts.where;
    var unknown_opts = _.difference(_.keys(opts), ['where', 'include']);
    var p_fetch;
    if (unknown_opts.length !== 0) {
      throw new Error("findOne got unknown options '" +
                      unknown_opts + "'");
    }
    if (arg_include && arg_where) {
      throw new Error("findAll got both include and where options");
    }
    if (arg_include) {
      if (!_.isEqual(arg_include, [{ all: true }])) {
        throw new Error("unexpected include option value");
      }
      p_fetch = self.fetchAll();
    } else if (arg_where) {
      p_fetch = self.where(arg_where).fetchAll();
    } else {
      throw new Error("findAll got neither include nor where option");
    }
    return Q().then(function () {
      return p_fetch;
    }).then(function (collection) {
      return collection.map(function (model) {return model;});
    });
  }

}];

const collection = {
};

var exports = {};

exports.model = model;

module.exports = exports;
