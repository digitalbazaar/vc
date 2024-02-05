/*!
* Copyright (c) 2019-2023 Digital Bazaar, Inc. All rights reserved.
*/
import {
  constants as credentialsConstants,
  contexts as credentialsContexts
} from 'credentials-context';
import {
  constants as credentialsV2Constants,
  contexts as credentialsV2Contexts,
} from '@digitalbazaar/credentials-v2-context';
import {
  constants as didConstants,
  contexts as didContexts
} from 'did-context';
import {
  constants as ed25519Constants,
  contexts as ed25519Contexts,
} from 'ed25519-signature-2018-context';
import {
  CONTEXT_V1 as odrlCtx,
  CONTEXT_URL_V1 as odrlCtxUrl
} from '@digitalbazaar/odrl-context';
import {
  constants as v1Constants,
  contexts as v1Contexts
} from 'veres-one-context';
import {
  CONTEXT_V1 as vcExamplesV1Ctx,
  CONTEXT_URL_V1 as vcExamplesV1CtxUrl
} from '@digitalbazaar/credentials-examples-context';
import {
  constants as vcExamplesV2Constants,
  contexts as vcExamplesV2Contexts
} from './examples-v2.js';
import {invalidId} from './invalid_id.js';
import {nullId} from './null_id.js';
import {nullType} from './null_type.js';
import {nullVersion} from './null_version.js';

const {CONTEXT_URL: ED25519_CONTEXT_URL} = ed25519Constants;
const {CREDENTIALS_CONTEXT_V1_URL} = credentialsConstants;
const {CONTEXT_URL: CREDENTIALS_CONTEXT_V2_URL} = credentialsV2Constants;
const {CREDENTIALS_V2_EXAMPLE_CONTEXT_URL} = vcExamplesV2Constants;
const {DID_CONTEXT_URL} = didConstants;
const {VERES_ONE_CONTEXT_V1_URL} = v1Constants;

export const validContexts = {
  veresOne: {
    url: VERES_ONE_CONTEXT_V1_URL,
    value: v1Contexts.get(VERES_ONE_CONTEXT_V1_URL)
  },
  did: {
    url: DID_CONTEXT_URL,
    value: didContexts.get(DID_CONTEXT_URL)
  },
  credentialsV1: {
    url: CREDENTIALS_CONTEXT_V1_URL,
    value: credentialsContexts.get(CREDENTIALS_CONTEXT_V1_URL)
  },
  credentialsV2: {
    url: CREDENTIALS_CONTEXT_V2_URL,
    value: credentialsV2Contexts.get(CREDENTIALS_CONTEXT_V2_URL)
  },
  ed25519Context: {
    url: ED25519_CONTEXT_URL,
    value: ed25519Contexts.get(ED25519_CONTEXT_URL)
  },
  odrl: {
    url: odrlCtxUrl,
    value: odrlCtx
  },
  examplesContext: {
    url: vcExamplesV1CtxUrl,
    value: vcExamplesV1Ctx
  },
  examplesV2Context: {
    url: CREDENTIALS_V2_EXAMPLE_CONTEXT_URL,
    value: vcExamplesV2Contexts.get(CREDENTIALS_V2_EXAMPLE_CONTEXT_URL)
  }
};

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
