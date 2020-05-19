const {contexts: credentialsContext, constants: {CREDENTIALS_CONTEXT_V1_URL}} =
  require('credentials-context');
const {contexts: didContext, constants: {DID_CONTEXT_URL}} =
  require('did-context');
const {contexts: contextV1, constants: {VERES_ONE_CONTEXT_V1_URL}} =
  require('veres-one-context');

const invalidContexts = {
  veresOne: {
    url: VERES_ONE_CONTEXT_V1_URL,
    value: contextV1.get(VERES_ONE_CONTEXT_V1_URL)
  },
  did: {
    url: DID_CONTEXT_URL,
    value: didContext.get(DID_CONTEXT_URL)
  },
  valid: {
    url: CREDENTIALS_CONTEXT_V1_URL,
    value: credentialsContext.get(CREDENTIALS_CONTEXT_V1_URL)
  },
  invalidId: {
    url: 'https://invalid-id.org',
    value: require('./invalid_id.json')
  },
  nullVersion: {
    url: 'https://null-version.org',
    value: require('./null_version.json')
  },
  nullId: {
    url: 'https://null-id.org',
    value: require('./null_id.json')
  },
  nullType: {
    url: 'https://null-type.org',
    value: require('./null_type.json')
  },
  nullDoc: {
    url: 'https://null-doc.org',
    value: null
  }
};
module.exports = invalidContexts;
