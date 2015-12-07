var app = require('../index');
var auth = require('./auth').router;
var api = require('./api');

app.get('/', function (req, res) {
  res.render('index', {client_url_path: app.locals.client_url_path});
});

app.use('', auth);
app.use('/api', api);
