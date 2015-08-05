var _ = require('lodash');
var express = require('express');

var models = require('./models');

var app = express();

app.use('/static', express.static('core/client'));

app.get('/', function (req, res) {
  // todo: sendfile is deprecated
  // replacement, sendFile, doesn't accept relative paths
  res.sendfile('core/client/index.html');
});

app.get('/api/categories', function(req, res) {
  console.log("top of categories api function");
  models.Category.findAll({ include: [{ all: true }]})
    .then(function (categories) {
      res.json(_.map(categories, function (category) {
        return category.dataValues;
      }));
    });
});

app.get('/api/items', function(req, res) {
  models.Item.findAll({ include: [{ all: true }]})
    .then(function (items) {
      res.json(_.map(items, function (item) {
        return item.dataValues;
      }));
    });
});

module.exports = app;

