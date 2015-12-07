var path = require('path');
var express = require('express');
var session = require('express-session');
var exphbs  = require('express-handlebars');
var bodyParser = require('body-parser');
var config = require('./config');

var VIEWS_DIR = path.join(process.cwd(), 'core', 'server', 'views');

var app = express();

var hbs = exphbs.create({
  extname: '.hbs'
  // defaultLayout: 'main',
  // layoutsDir:  path.join(VIEWS_DIR, 'layouts'),
  // partialsDir: [
  //   path.join(VIEWS_DIR, 'partials')
  // ]
});


// todo: shared error codes in json responses between client and server

app.locals.config = config;
app.locals.client_url_path = '/static';

app.use(bodyParser.json());
app.use(bodyParser.urlencoded());

// todo: not suitable for production
app.use(session({
  secret: 'super secret',
  cookie: {}
}));

app.use(app.locals.client_url_path, express.static('core/client'));

app.engine('hbs', hbs.engine);
app.set('view engine', 'hbs');
// can't use multiple view dirs
// express-handlebars issue #138 already has a PR in, tho
app.set('views', VIEWS_DIR);

// circular imports a-la Flask
// http://flask.pocoo.org/docs/0.10/patterns/packages/

module.exports = app;

require('./routes');
// require('./models');
