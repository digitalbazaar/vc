/*!
 * Copyright (c) 2019 Digital Bazaar, Inc. All rights reserved.
 */
module.exports = {
  '@context': [
    {
      '@version': 1.1
    },
    'https://w3id.org/security/v2',
    {
      'cred': 'https://www.w3.org/2018/credentials#',
      'xsd': 'http://www.w3.org/2001/XMLSchema#',

      'id': '@id',
      'type': '@type',

      'JsonSchemaValidator2018': 'cred:JsonSchemaValidator2018',
      'ManualRefreshService2018': 'cred:ManualRefreshService2018',
      'VerifiableCredential': 'cred:VerifiableCredential',
      'VerifiablePresentation': 'cred:VerifiablePresentation',

      'credentialSchema': {'@id': 'cred:credentialSchema', '@type': '@id'},
      'credentialStatus': {'@id': 'cred:credentialStatus', '@type': '@id'},
      'credentialSubject': {'@id': 'cred:credentialSubject', '@type': '@id'},
      'evidence': {'@id': 'cred:evidence', '@type': '@id'},
      'expirationDate': {'@id': 'cred:expirationDate', '@type': 'xsd:dateTime'},
      'issuanceDate': {'@id': 'cred:issuanceDate', '@type': 'xsd:dateTime'},
      'issuer': {'@id': 'cred:issuer', '@type': '@id'},
      'refreshService': {'@id': 'cred:refreshService', '@type': '@id'},
      'serviceEndpoint': {'@id': 'cred:serviceEndpoint', '@type': '@id'},
      'termsOfUse': {'@id': 'cred:termsOfUse', '@type': '@id'},
      'verifiableCredential': {
        '@id': 'cred:verifiableCredential', '@type': '@id', '@container': '@graph'
      }
    }
  ]
}
