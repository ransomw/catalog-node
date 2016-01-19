var Q = require('q');
var tape = require('tape');
var tap_spec = require('tap-spec');

var model_tests = require('./models');

var run_tests = function () {
  var deferred = Q.defer();
  tape.createStream()
    .pipe(tap_spec())
    .pipe(process.stdout);
  tape.test('model tests', model_tests);
  tape.onFinish(function () {
    deferred.resolve();
  });
  return deferred.promise;
};

var exports = {};

exports.run_tests = run_tests;

module.exports = exports;
