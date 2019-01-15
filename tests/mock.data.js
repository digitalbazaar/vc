const constants = require('./constants');

const mock = {};
module.exports = mock;

const didContexts = [
  constants.DID_CONTEXT_URL,
  constants.VERES_ONE_CONTEXT_URL
];

const credentials = mock.credentials = {};

credentials.alpha = {
  "@context": "https://w3id.org/vc/v1",
  "id": "https://dmv.example.gov/credentials/3732",
  "type": ["Credential", "ProofOfAgeCredential"],
  "issuer": "https://dmv.example.gov/issuers/14",
  "issued": "2017-01-01T19:13:24Z",
  "claim": {
    "id": "did:example:ebfeb1f712ebc6f1c276e12ec21",
    "ageOver": 21
  }
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
