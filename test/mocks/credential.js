/*!
* Copyright (c) 2019-2023 Digital Bazaar, Inc. All rights reserved.
*/
import {klona} from 'klona';

export const versionedCredentials = new Map([
  [1.0, () => klona({
    '@context': [
      'https://www.w3.org/2018/credentials/v1',
      'https://www.w3.org/2018/credentials/examples/v1'
    ],
    id: 'http://example.edu/credentials/1872',
    type: ['VerifiableCredential', 'AlumniCredential'],
    issuer: 'https://example.edu/issuers/565049',
    issuanceDate: '2010-01-01T19:23:24Z',
    credentialSubject: {
      id: 'did:example:ebfeb1f712ebc6f1c276e12ec21',
      alumniOf: '<span lang="en">Example University</span>'
    }
  })],
  [2.0, () => klona({
    '@context': [
      'https://www.w3.org/ns/credentials/v2',
      'https://www.w3.org/ns/credentials/examples/v2'
    ],
    id: 'http://example.edu/credentials/1872',
    type: ['VerifiableCredential', 'AlumniCredential'],
    issuer: 'https://example.edu/issuers/565049',
    credentialSubject: {
      id: 'did:example:ebfeb1f712ebc6f1c276e12ec21',
      alumniOf: '<span lang="en">Example University</span>'
    }
  })]
]);
