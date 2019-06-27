const chai = require('chai');
const {expect} = chai;
const {Ed25519KeyPair} = require('crypto-ld');
const jsigs = require('jsonld-signatures');
const jsonld = require('jsonld');
const uuid = require('uuid/v4');
const vc = require('..');
// const MultiLoader = require('./MultiLoader');
chai.should();

// const testContextLoader = () => {
//   // FIXME: used credentials-context module when available
//   const contexts = new Map([[
//     constants.CREDENTIALS_CONTEXT_URL,
//     require('./contexts/credentials-v1.jsonld')
//   ]]);
//   return async url => {
//     if(!contexts.has(url)) {
//       throw new Error('NotFoundError');
//     }
//     return {
//       contextUrl: null,
//       document: jsonld.clone(contexts.get(url)),
//       documentUrl: url
//     };
//   };
// };
//
// // documents are added to this documentLoader incrementally
// const testLoader = new MultiLoader({
//   documentLoader: [
//     // CREDENTIALS_CONTEXT_URL
//     testContextLoader(),
//     // DID_CONTEXT_URL and VERES_ONE_CONTEXT_URL
//     v1DocumentLoader
//   ]
// });

const contexts = require('../lib/contexts');

async function documentLoader(url) {
  const context = contexts[url];
  if(context) {
    return {
      contextUrl: null,
      documentUrl: url,
      document: context
    };
  }
  throw new Error(`${url} is not an authorized supported context url.`);
}

const assertionController = {
  '@context': 'https://w3id.org/security/v2',
  id: 'https://example.com/i/carol',
  assertionMethod: [
    // actual key is going to be added in the before() block below
  ]
};

let suite, keyPair, verifiedCredential;

const credential = {
  "@context": [
    "https://www.w3.org/2018/credentials/v1",
    "https://www.w3.org/2018/credentials/examples/v1"
  ],
  "id": "http://example.edu/credentials/1872",
  "type": ["VerifiableCredential", "AlumniCredential"],
  "issuer": "https://example.edu/issuers/565049",
  "issuanceDate": "2010-01-01T19:23:24Z",
  "credentialSubject": {
    "id": "did:example:ebfeb1f712ebc6f1c276e12ec21",
    "alumniOf": "<span lang='en'>Example University</span>"
  }
};

before(async () => {
  // Set up the key that will be signing and verifying
  keyPair = await Ed25519KeyPair.generate({
    id: 'https://example.edu/issuers/keys/1',
    controller: 'https://example.com/i/carol'
  });

  // Register the controller document and the key document with documentLoader
  contexts['https://example.com/i/carol'] = assertionController;
  contexts['https://example.edu/issuers/keys/1'] = keyPair.publicNode();

  // Add the key to the Controller doc (authorizes its use for assertion)
  assertionController.assertionMethod.push(keyPair.id);

  // Set up the signature suite, using the generated key
  suite = new jsigs.suites.Ed25519Signature2018({
    verificationMethod: 'https://example.edu/issuers/keys/1',
    key: keyPair
  });
});

describe('issue()', () => {
  it('should issue a verifiable credential with proof', async () => {
    verifiedCredential = await vc.issue({credential, suite});
    verifiedCredential.should.exist;
    verifiedCredential.should.be.an('object');
    verifiedCredential.should.have.property('proof');
    verifiedCredential.proof.should.be.an('object');
  });
});

describe('verify()', () => {
  it('should verify a vc', async () => {
    const result = await vc.verify(
      {credential: verifiedCredential, suite, documentLoader});
    // console.log(JSON.stringify(result, null, 2))
    result.verified.should.be.true;
    expect(result.error).to.not.exist;
  });
});

describe('verifies RFC3999 Dates', function() {
  it('verify a valid date', function() {
    const latest = new Date().toISOString();
    vc.dateRegex.test(latest).should.be.true;
  });
  it('should not verify an invalid date', function() {
    const invalid = '2017/09/27';
    vc.dateRegex.test(invalid).should.be.false;
  });
});

describe.skip('verify API', () => {
  it('verifies a valid presentation', async () => {
    const challenge = uuid();
    const domain = uuid();
    const {presentation} = await _generatePresentation({challenge, domain});
    const result = await vc.verifyPresentation({
      challenge,
      documentLoader: testLoader.documentLoader.bind(testLoader),
      domain,
      presentation,
    });
    result.verified.should.be.a('boolean');
    result.verified.should.be.true;
  });
  it('verifies a valid credential', async () => {
    const {credential} = await _generateCredential();
    const result = await vc.verify({
      credential,
      documentLoader: testLoader.documentLoader.bind(testLoader)
    });
    result.verified.should.be.a('boolean');
    result.verified.should.be.true;
  });
});

function _generateKeyId({did, key}) {
  // `did` + multibase base58 (0x7a / z) encoding + key fingerprint
  return `${did}#z${key.fingerprint()}`;
}

async function _generateCredential() {
  const mockCredential = jsonld.clone(mockData.credentials.alpha);
  const {authenticationKey, documentLoader} = await _generateDid();
  const {Ed25519Signature2018} = jsigs.suites;
  const {AuthenticationProofPurpose} = jsigs.purposes;
  testLoader.addLoader(documentLoader);
  const credential = await jsigs.sign(mockCredential, {
    compactProof: false,
    documentLoader: testLoader.documentLoader.bind(testLoader),
    suite: new Ed25519Signature2018({key: authenticationKey}),
    purpose: new AuthenticationProofPurpose({
      challenge: 'challengeString'
    })
  });
  return {credential, documentLoader};
}

async function _generatePresentation({challenge, domain}) {
  const mockPresentation = jsonld.clone(mockData.presentations.alpha);
  const {authenticationKey, documentLoader: dlp} = await _generateDid();
  testLoader.addLoader(dlp);
  const {Ed25519Signature2018} = jsigs.suites;
  const {AuthenticationProofPurpose} = jsigs.purposes;
  const {credential, documentLoader: dlc} = await _generateCredential();
  testLoader.addLoader(dlc);
  mockPresentation.verifiableCredential.push(credential);
  const presentation = await jsigs.sign(mockPresentation, {
    compactProof: false,
    documentLoader: testLoader.documentLoader.bind(testLoader),
    suite: new Ed25519Signature2018({key: authenticationKey}),
    purpose: new AuthenticationProofPurpose({challenge, domain})
  });
  return {presentation};
}

async function _generateDid() {
  const mockDoc = jsonld.util.clone(mockData.privateDidDocuments.alpha);
  const capabilityInvocationKey = await Ed25519KeyPair.generate();
  const keyFingerprint = `z${capabilityInvocationKey.fingerprint()}`;

  const did = `did:v1:test:nym:${keyFingerprint}`;
  // cryptonym dids are based on fingerprint of capabilityInvokation key
  mockDoc.id = did;
  capabilityInvocationKey.id = _generateKeyId(
    {did, key: capabilityInvocationKey});
  const controller = did;
  capabilityInvocationKey.controller = controller;
  mockDoc.capabilityInvocation[0] = {
    id: capabilityInvocationKey.id,
    type: capabilityInvocationKey.type,
    controller: capabilityInvocationKey.controller,
    publicKeyBase58: capabilityInvocationKey.publicKeyBase58
  };
  const authenticationKey = await Ed25519KeyPair.generate();
  authenticationKey.id = _generateKeyId(
    {did, key: authenticationKey});
  authenticationKey.controller = controller;
  mockDoc.authentication[0] = {
    id: authenticationKey.id,
    type: authenticationKey.type,
    controller: authenticationKey.controller,
    publicKeyBase58: authenticationKey.publicKeyBase58
  };
  const documentLoader = await _createDidDocumentLoader({record: mockDoc});
  return {
    authenticationKey, did, documentLoader, mockDoc, capabilityInvocationKey
  };
}

// delimiters for a DID URL
const splitRegex = /[;|\/|\?|#]/;
// all the keys extracted using the document loader are restricted by the
// `basisBlockHeight` of the operation being validated. This ensures that
// the signatures were valid at the time of signing.
async function _createDidDocumentLoader({record}) {
  return async function(url) {
    if(!url.startsWith('did:')) {
      throw new Error('NotFoundError');
    }
    const [did] = url.split(splitRegex);
    if(did !== record.id) {
      throw new Error('NotFoundError');
    }
    const didDocument = jsonld.util.clone(record);
    if(!url.includes('#')) {
      return {
        contextUrl: null,
        document: didDocument,
        documentUrl: url
      };
    }
    // try to find the specific object in the DID document
    const document = await _pluckDidNode(did, url, didDocument);
    return {
      contextUrl: null,
      document,
      documentUrl: url
    };
  };
}

async function _pluckDidNode(did, target, didDocument) {
  // flatten to isolate target
  jsonld.documentLoader = testLoader.documentLoader.bind(testLoader);
  const flattened = await jsonld.flatten(didDocument);
  // filter out non-DID nodes and find target
  let found = false;
  const filtered = [];
  for(const node of flattened) {
    const id = node['@id'];
    if(id === target) {
      filtered.push(node);
      found = true;
      break;
    }
  }
  // target not found
  if(!found) {
    const err = new Error('Not Found');
    err.httpStatusCode = 404;
    err.status = 404;
    throw err;
  }

  const context = [
    constants.DID_CONTEXT_URL,
    constants.VERES_ONE_CONTEXT_URL
  ];
  // frame target
  const framed = await jsonld.frame(
    filtered, {'@context': context, id: target}, {embed: '@always'});

  return Object.assign({'@context': context}, framed['@graph'][0]);
}
