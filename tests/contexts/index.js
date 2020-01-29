const credentialsContext = require('credentials-context');
const invalidContexts = {
  veresOne: {
    url: 'https://w3id.org/veres-one/v1',
    value: require('./veresOnev1.json')
  },
  did: {
    url: 'https://w3id.org/did/v0.11',
    value: require('./didv0.json')
  },
  valid: {
    url: 'https://www.w3.org/2018/credentials/v1',
    value: credentialsContext.contexts.get('https://www.w3.org/2018/credentials/v1')
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
