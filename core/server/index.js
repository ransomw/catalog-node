var path = require('path');
var express = require('./express_ext');
var session = require('express-session');
var exphbs  = require('express-handlebars');
var bodyParser = require('body-parser');
var config = require('./config');
var CONST = require('./const');

var VIEWS_DIR = path.join(process.cwd(), 'core', 'server', 'views');

var make_app = function () {

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
  app.locals.client_url_path = CONST.CLIENT_STATIC_URL;

  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({extended: true}));

  app.use(session({
    secret: 'super secret', // todo: not suitable for production
    cookie: {},
    resave: false,
    saveUninitialized: false
  }));

  app.use(app.locals.client_url_path,
          express.static(CONST.CLIENT_STATIC_DIR));

  app.engine('hbs', hbs.engine);
  app.set('view engine', 'hbs');
  // can't use multiple view dirs
  // express-handlebars issue #138 already has a PR in, tho
  app.set('views', VIEWS_DIR);

  return app;
};

// circular imports a-la Flask
// http://flask.pocoo.org/docs/0.10/patterns/packages/

module.exports = make_app();

require('./routes');
// require('./models');
