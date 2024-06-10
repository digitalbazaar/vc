/* eslint-disable quotes, quote-props, max-len */
import constants from '../constants.js';
import {createRequire} from 'node:module';
import {versionedCredentials} from './credential.js';

const require = createRequire(import.meta.url);

export const mock = {};

const didContexts = [
  constants.DID_CONTEXT_URL,
  constants.VERES_ONE_CONTEXT_URL
];

/**
 * @private
 * stores an initial count used to toggle between VC versions.
 *
 *
 * @returns {Function} - A VC generator function.
 */
const _mixedCredential = () => {
  let count = 0;
  // return a generator function.
  return () => {
    if((count % 2) === 0) {
      count++;
      return versionedCredentials.get(1.0)();
    }
    count ++;
    return versionedCredentials.get(2.0)();
  };
};

export const credentials = mock.credentials = {};
credentials.mixed = _mixedCredential();
credentials.language = {
  multiple: require('./credential-issuer-multi-language-description-ok.json'),
  single: require('./credential-issuer-name-language-en-ok.json')
};
credentials.alpha = {
  "@context": [
    constants.CREDENTIALS_CONTEXT_URL, {
      "ex1": "https://example.com/examples/v1",
      "AlumniCredential": "ex1:AlumniCredential",
      "alumniOf": "ex1:alumniOf"
    }
  ],
  "id": "http://example.edu/credentials/58473",
  "type": ["VerifiableCredential", "AlumniCredential"],
  "credentialSubject": {
    "id": "did:example:ebfeb1f712ebc6f1c276e12ec21",
    "alumniOf": "Example University"
  }
};

const presentations = mock.presentations = {};

presentations.alpha = {
  "@context": [constants.CREDENTIALS_CONTEXT_URL],
  "type": ["VerifiablePresentation"],
  "verifiableCredential": [],
};

const privateDidDocuments = mock.privateDidDocuments = {};

privateDidDocuments.alpha = {
  "@context": didContexts,
  "id": "did:v1:test:nym:z279yHL6HsxRzCPU78DAWgZVieb8xPK1mJKJBbP8T2CezuFY",
  "authentication": [
    {
      "id": "did:v1:test:nym:z279yHL6HsxRzCPU78DAWgZVieb8xPK1mJKJBbP8T2CezuFY#z279jeddPcVScp2qcA476nxuQnZGnmBHcXSKWgNusrT1u1V1",
      "type": "Ed25519VerificationKey2018",
      "controller": "did:v1:test:nym:z279yHL6HsxRzCPU78DAWgZVieb8xPK1mJKJBbP8T2CezuFY",
      "publicKeyBase58": "2vXXVcAkogFwWGBHsyU1KCJrsFJLtuE8xnzyVNwmhhdq"
    }
  ],
  "capabilityDelegation": [
    {
      "id": "did:v1:test:nym:z279yHL6HsxRzCPU78DAWgZVieb8xPK1mJKJBbP8T2CezuFY#z279odRyQVywHaU723iXRVncxmd4ELNzCL5gGfcQgDVg6mhV",
      "type": "Ed25519VerificationKey2018",
      "controller": "did:v1:test:nym:z279yHL6HsxRzCPU78DAWgZVieb8xPK1mJKJBbP8T2CezuFY",
      "publicKeyBase58": "6uKsWVfFUShCv9qiCgHisBNeJpW3UhsVinEUHjzRuTrK"
    }
  ],
  "capabilityInvocation": [
    {
      "id": "did:v1:test:nym:z279yHL6HsxRzCPU78DAWgZVieb8xPK1mJKJBbP8T2CezuFY#z279yHL6HsxRzCPU78DAWgZVieb8xPK1mJKJBbP8T2CezuFY",
      "type": "Ed25519VerificationKey2018",
      "controller": "did:v1:test:nym:z279yHL6HsxRzCPU78DAWgZVieb8xPK1mJKJBbP8T2CezuFY",
      "publicKeyBase58": "GZDzPsdkB4ca1ELMHs4bd4Lj2sS53g77di1C4YhQobQN"
    }
  ]
};
