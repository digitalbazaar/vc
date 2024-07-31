/*!
* Copyright (c) 2019-2023 Digital Bazaar, Inc. All rights reserved.
*/
import {
  contexts as credentialsContexts
} from '@digitalbazaar/credentials-context';
import {
  contexts as didContexts
} from 'did-context';
import {
  contexts as ed25519Contexts,
} from 'ed25519-signature-2018-context';
import {
  contexts as odrlContexts
} from '@digitalbazaar/odrl-context';
import {
  contexts as v1Contexts
} from 'veres-one-context';
import {
  contexts as vcExamplesV1Contexts
} from '@digitalbazaar/credentials-examples-context';
import {
  contexts as vcExamplesV2Contexts
} from './examples-v2.js';

import {invalidId} from './invalid_id.js';
import {nullId} from './null_id.js';
import {nullType} from './null_type.js';
import {nullVersion} from './null_version.js';

export const validContexts = new Map([
  ...credentialsContexts,
  ...didContexts,
  ...ed25519Contexts,
  ...odrlContexts,
  ...v1Contexts,
  ...vcExamplesV1Contexts,
  ...vcExamplesV2Contexts
]);

export const invalidContexts = {
  invalidId: {
    url: 'https://invalid-id.org',
    value: invalidId
  },
  nullVersion: {
    url: 'https://null-version.org',
    value: nullVersion
  },
  nullId: {
    url: 'https://null-id.org',
    value: nullId
  },
  nullType: {
    url: 'https://null-type.org',
    value: nullType
  },
  nullDoc: {
    url: 'https://null-doc.org',
    value: null
  }
};
