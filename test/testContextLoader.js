/*!
 * Copyright (c) 2019-2023 Digital Bazaar, Inc. All rights reserved.
 */
import * as vc from '../lib/index.js';
import {
  invalidContexts,
  validContexts
} from './contexts/index.js';
import jsigs from 'jsonld-signatures';
import jsonld from 'jsonld';
import {MultiLoader} from './MultiLoader.js';

export const contexts = new Map();

// add the invalid contexts to the loader
for(const key in invalidContexts) {
  const {url, value} = invalidContexts[key];
  contexts.set(url, value);
}
// add the valid contexts to the loader
for(const key in validContexts) {
  const {url, value} = validContexts[key];
  contexts.set(url, value);
}
const {extendContextLoader} = jsigs;
const {defaultDocumentLoader} = vc;

const testContextLoader = extendContextLoader(async url => {
  const context = contexts.get(url);
  if(context) {
    return {
      contextUrl: null,
      document: jsonld.clone(context),
      documentUrl: url
    };
  }
  return defaultDocumentLoader(url);
});

// documents are added to this documentLoader incrementally
export const testLoader = new MultiLoader({
  documentLoader: [
    testContextLoader
  ]
});
export const documentLoader = testLoader.documentLoader.bind(testLoader);

