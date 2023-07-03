/*!
 * Copyright (c) 2019-2023 Digital Bazaar, Inc. All rights reserved.
 */
import {
  contexts as credentialContexts
} from 'credentials-context';
import {
  contexts as credentialsV2Contexts
} from '@digitalbazaar/credentials-v2-context';

export const contexts = new Map();

// adds the contexts to the contexts map
const addContexts = contexts => {
  for(const [url, context] of contexts.entries()) {
    contexts.set(url, context);
  }
};

addContexts(credentialContexts);
addContexts(credentialsV2Contexts);
