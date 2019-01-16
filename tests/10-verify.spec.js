const chai = require('chai');
const constants = require('./constants');
const {documentLoader: v1dl} = require('did-veres-one');
const {Ed25519KeyPair} = require('crypto-ld');
const jsigs = require('jsonld-signatures');
const jsonld = require('jsonld');
const mockData = require('./mock.data');
const vc = require('..');
chai.should();

const contexts = new Map();
contexts.set(
  'https://w3id.org/credentials/v1',
  require('./contexts/credentials-v1.jsonld'));

const contextLoader = async url => {
  let document;
  try {
    ({document} = await v1dl(url));
  } catch(e) {
    if(contexts.has(url)) {
      document = jsonld.clone(contexts.get(url));
    }
  }
  if(!document) {
    throw new Error('NotFoundError');
  }
  return {
    contextUrl: null,
    document,
    documentUrl: url
  };
};

describe('verify API', () => {
  it('verifies a valid credential', async () => {
    const mockCredential = jsonld.clone(mockData.credentials.alpha);
    const {authenticationKey, did, mockDoc, capabilityInvocationKey} =
      await _generateDid();
    const {Ed25519Signature2018} = jsigs.suites;
    const {AuthenticationProofPurpose} = jsigs.purposes;
    const documentLoader = await _createDidDocumentLoader({record: mockDoc});
    const credential = await jsigs.sign(mockCredential, {
      // FIXME: `sec` terms are not in the vc-v1 context, should they be?
      compactProof: true,
      documentLoader,
      suite: new Ed25519Signature2018({key: authenticationKey}),
      purpose: new AuthenticationProofPurpose({
        challenge: 'challengeString'
      })
    });
    console.log('CREDENTIAL', JSON.stringify(credential, null, 2));
    const result = await vc.verify({
      credential,
      documentLoader
    });
    console.log('RESULT', JSON.stringify(result, null, 2));
    result.verified.should.be.a('boolean');
    result.verified.should.be.true;
  });
});

function _generateKeyId({did, key}) {
  // `did` + multibase base58 (0x7a / z) encoding + key fingerprint
  return `${did}#z${key.fingerprint()}`;
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
  return {authenticationKey, did, mockDoc, capabilityInvocationKey};
}

// delimiters for a DID URL
const splitRegex = /[;|\/|\?|#]/;
// all the keys extracted using the document loader are restricted by the
// `basisBlockHeight` of the operation being validated. This ensures that
// the signatures were valid at the time of signing.
async function _createDidDocumentLoader({record}) {
  return async function(url) {
    if(!url.startsWith('did:')) {
      return contextLoader(url);
    }
    const [did] = url.split(splitRegex);
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
  jsonld.documentLoader = contextLoader;
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
