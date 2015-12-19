var app = require('../index');
var CONST = require('../const');
var auth = require('./auth').router;
var api = require('./api');

app.get('/', function (req, res) {
  res.render('index', {client_url_path: app.locals.client_url_path});
});

app.use(CONST.AUTH_BASE, auth);
app.use(CONST.API_BASE, api);
