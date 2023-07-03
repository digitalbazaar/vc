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
  constants as v1Constants,
  contexts as v1Contexts
} from 'veres-one-context';

import {invalidId} from './invalid_id.js';
import {nullId} from './null_id.js';
import {nullType} from './null_type.js';
import {nullVersion} from './null_version.js';

const {CREDENTIALS_CONTEXT_V1_URL} = credentialConstants;
const {CONTEXT_URL: CREDENTIALS_CONTEXT_V2_URL} = credentialV2Constants;
const {DID_CONTEXT_URL} = didConstants;
const {VERES_ONE_CONTEXT_V1_URL} = v1Constants;

export const invalidContexts = {
  veresOne: {
    url: VERES_ONE_CONTEXT_V1_URL,
    value: v1Contexts.get(VERES_ONE_CONTEXT_V1_URL)
  },
  did: {
    url: DID_CONTEXT_URL,
    value: didContexts.get(DID_CONTEXT_URL)
  },
  valid: {
    url: CREDENTIALS_CONTEXT_V1_URL,
    value: credentialsContexts.get(CREDENTIALS_CONTEXT_V1_URL)
  },
  valid2: {
    url: CREDENTIALS_CONTEXT_V2_URL,
    value: credentialsV2Contexts.get(CREDENTIALS_CONTEXT_V2_URL)
  },
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
