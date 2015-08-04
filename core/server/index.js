var express = require('express');

var app = express();

app.use('/static', express.static('core/client'));

app.get('/', function (req, res) {
  // todo: sendfile is deprecated
  // replacement, sendFile, doesn't accept relative paths
  res.sendfile('core/client/index.html');
});

module.exports = app;

