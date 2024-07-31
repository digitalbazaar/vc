/*!
 * Copyright (c) 2019-2023 Digital Bazaar, Inc. All rights reserved.
 */
import * as vc from '../lib/index.js';
import {
  invalidContexts,
  validContexts
} from './contexts/index.js';
import dataIntegrityContext from '@digitalbazaar/data-integrity-context';
import jsigs from 'jsonld-signatures';
import {klona} from 'klona';
import multikeyContext from '@digitalbazaar/multikey-context';
import {MultiLoader} from './MultiLoader.js';

export const remoteDocuments = new Map();
remoteDocuments.set(
  dataIntegrityContext.constants.CONTEXT_URL,
  dataIntegrityContext.contexts.get(
    dataIntegrityContext.constants.CONTEXT_URL));
remoteDocuments.set(
  multikeyContext.constants.CONTEXT_URL,
  multikeyContext.contexts.get(
    multikeyContext.constants.CONTEXT_URL));

// add the invalid contexts to the loader
for(const key in invalidContexts) {
  const {url, value} = invalidContexts[key];
  remoteDocuments.set(url, value);
}
// add the valid contexts to the loader
for(const [url, document] of validContexts) {
  remoteDocuments.set(url, document);
}
const {extendContextLoader} = jsigs;
const {defaultDocumentLoader} = vc;

const testDocumentLoader = extendContextLoader(async url => {
  const doc = remoteDocuments.get(url);
  if(doc) {
    return {
      contextUrl: null,
      document: klona(doc),
      documentUrl: url
    };
  }
  return defaultDocumentLoader(url);
});

// documents are added to this documentLoader incrementally
export const testLoader = new MultiLoader({
  documentLoader: [
    testDocumentLoader
  ]
});
export const documentLoader = testLoader.documentLoader.bind(testLoader);
