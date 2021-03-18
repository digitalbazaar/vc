/*!
 * Copyright (c) 2021 Digital Bazaar, Inc. All rights reserved.
 */
module.exports = {
  root: true,
  extends: [
    'eslint-config-digitalbazaar',
    // 'eslint-config-digitalbazaar/jsdoc'
  ],
  env: {
    node: true
  },
  parserOptions: {
    // this is required for dynamic import()
    ecmaVersion: 2020
  },
  ignorePatterns: ['node_modules', 'dist'],
  rules: {
    'jsdoc/check-examples': 0,
    'jsdoc/require-description-complete-sentence': 0
  }
};
