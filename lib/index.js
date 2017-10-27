/**
 * vc-js library.
 *
 * @author David I. Lehn
 *
 * Copyright 2017 Digital Bazaar, Inc.
 */
if(require('semver').gte(process.version, '8.0.0')) {
  module.exports = require('./vc');
} else {
  module.exports = require('../dist/node6/lib/vc');
}
