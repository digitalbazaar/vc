import {
  constants as credentialConstants,
  contexts as credentialsContexts
} from 'credentials-context';
import {
  contexts as credentialsV2Contexts,
  constants as credentialV2Constants
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
import {invalidId} from './invalid_id.js';
import {nullId} from './null_id.js';
import {nullType} from './null_type.js';
import {nullVersion} from './null_version.js';

const {CONTEXT_URL: ED25519_CONTEXT_URL} = ed25519Constants;
const {CREDENTIALS_CONTEXT_V1_URL} = credentialConstants;
const {CONTEXT_URL: CREDENTIALS_CONTEXT_V2_URL} = credentialV2Constants;
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
