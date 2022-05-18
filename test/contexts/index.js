import {
  contexts as credentialsContexts,
  constants as credentialConstants
} from 'credentials-context';
import {
  contexts as didContexts,
  constants as didConstants
} from 'did-context';
import {
  contexts as v1Contexts,
  constants as v1Constants
} from 'veres-one-context';

import {createRequire} from 'node:module';
const requireJson = createRequire(import.meta.url);

const {CREDENTIALS_CONTEXT_V1_URL} = credentialConstants;
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
  invalidId: {
    url: 'https://invalid-id.org',
    value: requireJson('./invalid_id.json')
  },
  nullVersion: {
    url: 'https://null-version.org',
    value: requireJson('./null_version.json')
  },
  nullId: {
    url: 'https://null-id.org',
    value: requireJson('./null_id.json')
  },
  nullType: {
    url: 'https://null-type.org',
    value: requireJson('./null_type.json')
  },
  nullDoc: {
    url: 'https://null-doc.org',
    value: null
  }
};
