/*!
 * Copyright (c) 2019-2022 Digital Bazaar, Inc. All rights reserved.
 */
import {
  contexts as credential1Contexts
} from 'credentials-context';
import {
  contexts as credential2Contexts
} from '@digitalbazaar/credentials-v2-context';
import {
  CONTEXT as vcExamplesV1Context,
  CONTEXT_URL as vcExamplesV1ContextUrl
} from './vc-examples-v1.js';
import {
  CONTEXT as odrlContext,
  CONTEXT_URL as odrlContextUrl
} from './odrl.js';

export const contexts = {};

contexts[vcExamplesV1ContextUrl] = vcExamplesV1Context;
contexts[odrlContextUrl] = odrlContext;

for(const [url, context] of credential1Contexts.entries()) {
  contexts[url] = context;
}

for(const [url, context] of credential2Contexts.entries()) {
  contexts[url] = context;
}
