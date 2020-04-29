const chai = require('chai');
const should = chai.should();

const {Ed25519KeyPair} = require('crypto-ld');
const jsigs = require('jsonld-signatures');
const jsonld = require('jsonld');
const {Ed25519Signature2018} = jsigs.suites;
const CredentialIssuancePurpose = require('../lib/CredentialIssuancePurpose');

const mockData = require('./mocks/mock.data');
const uuid = require('uuid/v4');
const vc = require('..');
const MultiLoader = require('./MultiLoader');
const realContexts = require('../lib/contexts');
const invalidContexts = require('./contexts');
const mockCredential = require('./mocks/credential');
const assertionController = require('./mocks/assertionController');
const mockDidDoc = require('./mocks/didDocument');
const mockDidKeys = require('./mocks/didKeys');
const {VeresOneDidDoc} = require('did-veres-one');

const contexts = Object.assign({}, realContexts);
contexts[mockDidDoc.id] = mockDidDoc;

const testContextLoader = () => {
  // FIXME: use credentials-context module when available
  for(const key in invalidContexts) {
    const {url, value} = invalidContexts[key];
    contexts[url] = value;
  }
  return async url => {
    if(!contexts[url]) {
      throw new Error('NotFoundError');
    }
    return {
      contextUrl: null,
      document: jsonld.clone(contexts[url]),
      documentUrl: url
    };
  };
};

// documents are added to this documentLoader incrementally
const testLoader = new MultiLoader({
  documentLoader: [
    // CREDENTIALS_CONTEXT_URL
    testContextLoader()
  ]
});

let suite, keyPair, verifiableCredential;
const documentLoader = testLoader.documentLoader.bind(testLoader);

before(async () => {
  // Set up the key that will be signing and verifying
  keyPair = await Ed25519KeyPair.generate({
    id: 'https://example.edu/issuers/keys/1',
    controller: 'https://example.edu/issuers/565049'
  });

  // Add the key to the Controller doc (authorizes its use for assertion)
  assertionController.assertionMethod.push(keyPair.id);
  // Also add the key for authentication (VP) purposes
  assertionController.authentication.push(keyPair.id);

  // Register the controller document and the key document with documentLoader
  contexts['https://example.edu/issuers/565049'] = assertionController;
  // FIXME this might require a security context.
  contexts['https://example.edu/issuers/keys/1'] = keyPair.publicNode();

  // Set up the signature suite, using the generated key
  suite = new jsigs.suites.Ed25519Signature2018({
    verificationMethod: 'https://example.edu/issuers/keys/1',
    key: keyPair
  });
});

describe('vc.issue()', () => {
  it('should issue a verifiable credential with proof', async () => {
    verifiableCredential = await vc.issue({
      credential: mockCredential,
      suite
    });
    verifiableCredential.should.exist;
    verifiableCredential.should.be.an('object');
    verifiableCredential.should.have.property('proof');
    verifiableCredential.proof.should.be.an('object');
  });

  it('should throw an error on missing verificationMethod', async () => {
    const suite = new jsigs.suites.Ed25519Signature2018({
      // Note no key id or verificationMethod passed to suite
      key: await Ed25519KeyPair.generate()
    });
    let error;
    try {
      await vc.issue({
        credential: mockCredential,
        suite
      });
    } catch(e) {
      error = e;
    }

    should.exist(error,
      'Should throw error when "verificationMethod" property missing');
    error.should.be.instanceof(TypeError);
    error.message.should
      .contain('"suite.verificationMethod" property is required.');
  });
});

describe('vc.createPresentation()', () => {
  it('should create an unsigned presentation', () => {
    const presentation = vc.createPresentation({
      verifiableCredential: mockCredential,
      id: 'ebc6f1c2',
      holder: 'did:ex:holder123'
    });

    presentation.type.should.eql(['VerifiablePresentation']);
    presentation.should.have.property('verifiableCredential');
    presentation.should.have.property('id', 'ebc6f1c2');
    presentation.should.have.property('holder', 'did:ex:holder123');
    presentation.should.not.have.property('proof');
  });
});

describe('vc.signPresentation()', () => {
  it('should create a signed VP', async () => {
    const presentation = vc.createPresentation({
      verifiableCredential: mockCredential,
      id: 'ebc6f1c2',
      holder: 'did:ex:holder123'
    });

    const vp = await vc.signPresentation({
      presentation,
      suite, // from before() block
      challenge: '12ec21'
    });

    vp.should.have.property('proof');
    vp.proof.should.have.property('type', 'Ed25519Signature2018');
    vp.proof.should.have.property('proofPurpose', 'authentication');
    vp.proof.should.have.property('verificationMethod',
      'https://example.edu/issuers/keys/1');
    vp.proof.should.have.property('challenge', '12ec21');
    vp.proof.should.have.property('created');
    vp.proof.should.have.property('jws');
  });
});

describe('verifies RFC3339 Dates', function() {
  it('verify a valid date', function() {
    const latest = new Date().toISOString();
    vc.dateRegex.test(latest).should.be.true;
  });
  it('verify a valid date with lowercase t', function() {
    const latest = new Date().toISOString().toLowerCase();
    vc.dateRegex.test(latest).should.be.true;
  });

  it('should not verify an invalid date', function() {
    const invalid = '2017/09/27';
    vc.dateRegex.test(invalid).should.be.false;
  });
  it('should not verify 2 digit years', function() {
    const invalid = '17-09-27T22:07:22.563z';
    vc.dateRegex.test(invalid).should.be.false;
  });

});

describe('verify API (credentials)', () => {
  it('should verify a vc', async () => {
    verifiableCredential = await vc.issue({
      credential: mockCredential,
      suite
    });
    const result = await vc.verifyCredential({
      credential: verifiableCredential,
      controller: assertionController,
      suite,
      documentLoader
    });

    if(result.error) {
      throw result.error;
    }
    result.verified.should.be.true;
  });

  it('should verify a vc with a positive status check', async () => {
    verifiableCredential = await vc.issue({
      credential: mockCredential,
      suite
    });
    const result = await vc.verifyCredential({
      credential: verifiableCredential,
      controller: assertionController,
      suite,
      documentLoader,
      checkStatus: async () => ({verified: true})
    });

    if(result.error) {
      throw result.error;
    }
    result.verified.should.be.true;
  });

  describe('negative tests', async () => {
    it('fails to verify if a context is null', async () => {
      const {credential, suite} = await _generateCredential();
      credential['@context'].push(invalidContexts.nullDoc.url);
      const results = await vc.verifyCredential({
        suite,
        credential,
        documentLoader
      });
      results.verified.should.be.a('boolean');
      results.verified.should.be.false;
    });
    it('fails to verify if a context contains an invalid id', async () => {
      const {credential, suite} = await _generateCredential();
      credential['@context'].push(invalidContexts.invalidId.url);
      const results = await vc.verifyCredential({
        suite,
        credential,
        documentLoader
      });
      results.verified.should.be.a('boolean');
      results.verified.should.be.false;
    });
    it('fails to verify if a context has a null version', async () => {
      const {credential, suite} = await _generateCredential();
      credential['@context'].push(invalidContexts.nullVersion.url);
      const results = await vc.verifyCredential({
        suite,
        credential,
        documentLoader
      });
      results.verified.should.be.a('boolean');
      results.verified.should.be.false;
    });
    it('fails to verify if a context has a null @id', async () => {
      const {credential, suite} = await _generateCredential();
      credential['@context'].push(invalidContexts.nullId.url);
      const results = await vc.verifyCredential({
        suite,
        credential,
        documentLoader
      });
      results.verified.should.be.a('boolean');
      results.verified.should.be.false;
    });
    it('fails to verify if a context has a null @type', async () => {
      const {credential, suite} = await _generateCredential();
      credential['@context'].push(invalidContexts.nullType.url);
      const results = await vc.verifyCredential({
        suite,
        credential,
        documentLoader
      });
      results.verified.should.be.a('boolean');
      results.verified.should.be.false;
    });
    it('fails to verify if a context links to a missing doc', async () => {
      const {credential, suite} = await _generateCredential();
      credential['@context'].push('https://fsad.digitalbazaar.com');
      const results = await vc.verifyCredential({
        suite,
        credential,
        documentLoader
      });
      results.verified.should.be.a('boolean');
      results.verified.should.be.false;
    });
    it('fails to verify if a context has an invalid url', async () => {
      const {credential, suite} = await _generateCredential();
      credential['@context'].push('htps://fsad.digitalbazaar.');
      const results = await vc.verifyCredential({
        suite,
        credential,
        documentLoader
      });
      results.verified.should.be.a('boolean');
      results.verified.should.be.false;
    });
    it('should fail to verify a vc with a negative status check', async () => {
      verifiableCredential = await vc.issue({
        credential: mockCredential,
        suite
      });
      const result = await vc.verifyCredential({
        credential: verifiableCredential,
        controller: assertionController,
        suite,
        documentLoader,
        checkStatus: async () => ({verified: false})
      });

      if(result.error) {
        throw result.error;
      }
      result.verified.should.be.true;
    });
  });
});

describe('verify API (presentations)', () => {
  it('verifies a valid signed presentation', async () => {
    const challenge = uuid();

    const {presentation, suite, documentLoader} =
      await _generatePresentation({challenge});

    const result = await vc.verify({
      challenge,
      suite,
      documentLoader,
      presentation
    });

    if(result.error) {
      const firstError = [].concat(result.error)[0];
      throw firstError;
    }
    result.verified.should.be.a('boolean');
    result.verified.should.be.true;
  });

  it('verifies an unsigned presentation', async () => {
    const {presentation, suite: vcSuite, documentLoader} =
      await _generatePresentation({unsigned: true});

    const result = await vc.verify({
      documentLoader,
      presentation,
      suite: vcSuite,
      unsignedPresentation: true
    });

    if(result.error) {
      const firstError = [].concat(result.error)[0];
      throw firstError;
    }
    result.verified.should.be.a('boolean');
    result.verified.should.be.true;
  });
});

async function _generateCredential() {
  const mockCredential = jsonld.clone(mockData.credentials.alpha);
  const {didDocument, documentLoader} = await _loadDid();
  mockCredential.issuer = didDocument.id;

  testLoader.addLoader(documentLoader);

  const assertionKey = didDocument.keys[mockDidKeys.ASSERTION_KEY_ID];

  const suite = new Ed25519Signature2018({key: assertionKey});
  const credential = await jsigs.sign(mockCredential, {
    compactProof: false,
    documentLoader: testLoader.documentLoader.bind(testLoader),
    suite,
    purpose: new CredentialIssuancePurpose()
  });

  return {credential, documentLoader, suite};
}

async function _generatePresentation({challenge, unsigned = false}) {
  const {didDocument, documentLoader: didLoader} = await _loadDid();
  testLoader.addLoader(didLoader);

  const {credential, documentLoader: dlc, suite: vcSuite} =
    await _generateCredential();
  testLoader.addLoader(dlc);

  const presentation = vc.createPresentation(
    {verifiableCredential: credential});

  if(unsigned) {
    return {presentation, suite: vcSuite,
      documentLoader: testLoader.documentLoader.bind(testLoader)};
  }

  const authenticationKey = didDocument.keys[mockDidKeys.AUTHENTICATION_KEY_ID];

  const vpSuite = new Ed25519Signature2018({key: authenticationKey});

  const vp = await vc.signPresentation({
    presentation, suite: vpSuite, challenge,
    documentLoader: testLoader.documentLoader.bind(testLoader)
  });

  return {presentation: vp, suite: [vcSuite, vpSuite],
    documentLoader: testLoader.documentLoader.bind(testLoader)};
}

async function _loadDid() {
  const didDocument = new VeresOneDidDoc({doc: mockDidDoc});
  await didDocument.importKeys(mockDidKeys.keys);
  const documentLoader = url => {
    if(url.includes('#')) {
      return {
        contextUrl: null, document: didDocument.keys[url], documentUrl: url
      };
    } else {
      return {
        contextUrl: null, document: didDocument.doc, documentUrl: url
      };
    }
  };
  return {
    didDocument, documentLoader
  };
}
