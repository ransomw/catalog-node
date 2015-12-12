#! /bin/sh

# todo: make this a node script for portability

watchify --debug \
         core/client/js-common/main.js \
         -o core/client/js/bundle.js
