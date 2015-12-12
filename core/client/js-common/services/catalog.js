var request = require('superagent');
var CONST = require('../constants');
var Q = require('q');

var make_req_end_cb = function (deferred) {
  return function (err, res) {
    if (res.ok) {
      deferred.resolve(res.body);
    } else {
      // reject with error object when appropriate (?)
      deferred.reject(res.text);
    }
  };
};

var make_get_models = function (endpoint) {
  return function (query) {
    var deferred = Q.defer();
    var req = request.get(endpoint)
          .accept('json');
    if (query) {
      req.query(query);
    }
    req.end(make_req_end_cb(deferred));
    return deferred.promise;
  };
};

var make_create_model = function (endpoint) {
  return function (model_data) {
    var deferred = Q.defer();
    request.post(endpoint)
      .send(model_data)
      .accept('json')
      .end(make_req_end_cb(deferred));
    return deferred.promise;
  };
};

var make_update_model = function (endpoint) {
  return function (model_data, model_id) {
    var deferred = Q.defer();
    request.post([endpoint, model_id].join('/'))
      .send(model_data)
      .accept('json')
      .end(make_req_end_cb(deferred));
    return deferred.promise;
  };
};

var make_delete_model = function (endpoint) {
  return function (model_id) {
    var deferred = Q.defer();
    request.del([endpoint, model_id].join('/'))
      .end(make_req_end_cb(deferred));
    return deferred.promise;
  };
};

var get_categories = make_get_models(CONST.ENDPOINTS.categories);
var get_items = make_get_models(CONST.ENDPOINTS.items);

var create_item = make_create_model(CONST.ENDPOINTS.item_new);
var update_item = make_update_model(CONST.ENDPOINTS.item_new);
var delete_item = make_delete_model(CONST.ENDPOINTS.item_new);

module.exports = function () {
  return {
    get_categories: get_categories,
    get_items: get_items,
    create_item: create_item,
    update_item: update_item,
    delete_item: delete_item
  };
};
