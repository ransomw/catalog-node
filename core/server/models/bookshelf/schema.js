/*global require, module */

const deepFreeze = require('deep-freeze');

const db_schema = deepFreeze({
  // the first type argument for strings is length
  users: {
    name: {
      type: 'string', type_args: [250],
      nullable: false
    },
    email: {
      type: 'string', type_args: [250],
      nullable: false, unique: true
    },
    password: {
      type: 'string', type_args: [500],
      nullable: false
    }
  },

  categories: {
    name: {
      type: 'string', type_args: [80],
      nullable: false, unique: true
    }
  },

  items: {
    title: {
      type: 'string', type_args: [80],
      nullable: false, unique: true
    },
    description: {
      type: 'string', type_args: [250],
      nullable: false
    },
    category_id: {
      type: 'integer',
      references: 'categories.id',
      nullable: false
    },
    user_id: {
      type: 'integer',
      references: 'users.id',
      nullable: true
    }
  }
});

var exports = {};

exports = db_schema;

module.exports = exports;
