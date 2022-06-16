/*!
 * Copyright (c) 2021-2022 Digital Bazaar, Inc. All rights reserved.
 */
module.exports = {
  root: true,
  env: {
    node: true
  },
  extends: [
    'digitalbazaar',
    'digitalbazaar/jsdoc',
    'digitalbazaar/module'
  ],
  rules: {
    'jsdoc/require-description-complete-sentence': 0,
    'unicorn/prefer-node-protocol': 'error'
  }
};
