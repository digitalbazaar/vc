/*!
 * Copyright (c) 2019-2023 Digital Bazaar, Inc. All rights reserved.
 */
import {
  contexts as credentialContexts
} from 'credentials-context';

export const contexts = new Map();

for(const [url, context] of credentialContexts.entries()) {
  contexts.set(url, context);
}
