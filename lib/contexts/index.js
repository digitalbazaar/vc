/*!
 * Copyright (c) 2019-2023 Digital Bazaar, Inc. All rights reserved.
 */
import {
  contexts as credentialsContexts
} from 'credentials-context';
import {
  contexts as credentialsV2Contexts
} from '@digitalbazaar/credentials-v2-context';

export const contexts = new Map();

// adds the _contexts to the contexts map
const addContexts = _contexts => {
  for(const [url, context] of _contexts.entries()) {
    contexts.set(url, context);
  }
};

addContexts(credentialsContexts);
addContexts(credentialsV2Contexts);
