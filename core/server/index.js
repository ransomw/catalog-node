var path = require('path');
var _ = require('lodash');
var session = require('express-session');
var exphbs  = require('express-handlebars');
var bodyParser = require('body-parser');

var express = require('./express_ext');
var config_defaults = require('./config');
var CONST = require('./const');
var routes = require('./routes');

var VIEWS_DIR = path.join(process.cwd(), 'core', 'server', 'views');

var make_app = function (config_arg) {

  var config = config_arg || {};

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

  var unallowed_config = _.difference(
    _.keys(config), _.keys(config_defaults));
  if (unallowed_config.length !== 0) {
    throw new Error("unallowed config keys: " + unallowed_config);
  }


  app.locals.config = _.merge(_.cloneDeep(config_defaults), config);
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

  routes.register_routes(app);

  return app;
};

// var app = make_app();

var exports = {};

exports.make_app = make_app;

module.exports = exports;
