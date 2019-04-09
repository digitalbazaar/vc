// require('credentials-context/contexts/credentials/v1');
'use strict';

// load locally embedded contexts
const contexts = require('./contexts');

module.exports = async function documentLoader(url) {
  const context = contexts[url];
  if(context !== undefined) {
    return {
      contextUrl: null,
      documentUrl: url,
      document: context
    };
  }
  throw new Error(`${url} is not an authorized supported context url.`)
}
