var express = require('express');
var session = require('express-session');
var bodyParser = require('body-parser');
var config = require('./config');

var app = express();

// todo: route module and url tree ... or some other pattern?
//       search around
// todo: shared error codes in json responses between client and server

app.locals.config = config;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded());

// todo: not suitable for production
app.use(session({
  secret: 'super secret',
  cookie: {}
}));

app.use('/static', express.static('core/client'));

// circular imports a-la Flask
// http://flask.pocoo.org/docs/0.10/patterns/packages/

module.exports = app;

require('./routes');
// require('./models');
