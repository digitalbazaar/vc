/*!
 * Copyright (c) 2019 Digital Bazaar, Inc. All rights reserved.
 */
module.exports = {
  'https://www.w3.org/2018/credentials/v1': require('./credentials-v1'),
  'https://www.w3.org/2018/credentials/examples/v1': require('./vc-examples-v1'),
  'https://www.w3.org/ns/odrl.jsonld': require('./odrl'),
  'https://w3id.org/security/v2': require('./security-v2'),
  'https://w3id.org/security/v1': require('./security-v1')
}
