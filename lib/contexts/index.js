/*!
 * Copyright (c) 2019-2020 Digital Bazaar, Inc. All rights reserved.
 */
'use strict';

const {contexts, constants: contextConstants} = require('credentials-context');

const exportedContexts = module.exports = {
  'https://www.w3.org/2018/credentials/examples/v1':
    require('./vc-examples-v1'),
  'https://www.w3.org/ns/odrl.jsonld': require('./odrl')
};

for(const c in contextConstants) {
  const contextUrl = contextConstants[c];
  exportedContexts[contextUrl] = contexts.get(contextUrl);
}
