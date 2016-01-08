
// define controller names

var header = require('./header');
var home = require('./home');
var item_read = require('./item_read');
var item_create_update = require('./item_create_update');
var item_delete = require('./item_delete');


module.exports.header = header;
module.exports.home = home;
module.exports.item_read = item_read;
module.exports.item_create_update = item_create_update;
module.exports.item_delete = item_delete;

module.exports.MVAR = 'something';
