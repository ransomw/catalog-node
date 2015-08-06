var _ = require('lodash');
var express = require('express');

var models = require('./models');

var app = express();

var HTTP_RES_CODE = {
  client_err: 400,
  server_err: 500
};

app.use('/static', express.static('core/client'));

app.get('/', function (req, res) {
  // todo: sendfile is deprecated
  // replacement, sendFile, doesn't accept relative paths
  res.sendfile('core/client/index.html');
});


// todo: support querying using comparisons...
//       like ?createdAt__gt=val in URL and other typical querying stuff
//       like ordering and restricting to a particular count
var make_models_endpoint = function (model) {
  return function (req, res) {
    // todo: edit control flow such that there's a single find-all
    //       statement with an empty where object if the sequelize api
    //       permits this being equivalent to the include all usage
    var query_params = _.keys(req.query);
    if (query_params.length === 0) {
      model.findAll({ include: [{ all: true }]})
        .then(function (categories) {
          res.json(_.map(categories, function (category) {
            return category.dataValues;
          }));
        });
    } else {
      var category_params = _.keys(model.tableAttributes);
      var invalid_params = _.difference(query_params, category_params);
      if (invalid_params.length !== 0) {
        res.status(HTTP_RES_CODE.client_err)
          .json({error: "invalid query string parameters",
                 data: invalid_params});
      } else {
        model.findAll({where: req.query})
          .then(function (categories) {
            res.json(_.map(categories, function (category) {
              return category.dataValues;
            }));
          });
      }
    }
  };
};

app.get('/api/categories', make_models_endpoint(models.Category));
app.get('/api/items', make_models_endpoint(models.Item));

module.exports = app;

