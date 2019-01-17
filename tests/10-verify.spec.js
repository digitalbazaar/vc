const chai = require('chai');
const constants = require('./constants');
const {documentLoader: v1DocumentLoader} = require('did-veres-one');
const {Ed25519KeyPair} = require('crypto-ld');
const jsigs = require('jsonld-signatures');
const jsonld = require('jsonld');
const mockData = require('./mock.data');
const uuid = require('uuid/v4');
const vc = require('..');
const MultiLoader = require('./MultiLoader');
chai.should();

const testContextLoader = () => {
  // FIXME: used credentials-context module when available
  const contexts = new Map([[
    constants.CREDENTIALS_CONTEXT_URL,
    require('./contexts/credentials-v1.jsonld')
  ]]);
  return async url => {
    if(!contexts.has(url)) {
      throw new Error('NotFoundError');
    }
    return {
      contextUrl: null,
      document: jsonld.clone(contexts.get(url)),
      documentUrl: url
    };
  };
};

// documents are added to this documentLoader incrementally
const testLoader = new MultiLoader({
  documentLoader: [
    // CREDENTIALS_CONTEXT_URL
    testContextLoader(),
    // DID_CONTEXT_URL and VERES_ONE_CONTEXT_URL
    v1DocumentLoader
  ]
});

describe('verify API', () => {
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
