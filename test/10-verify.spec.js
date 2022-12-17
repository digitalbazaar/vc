/*!
 * Copyright (c) 2019-2022 Digital Bazaar, Inc. All rights reserved.
 */
import chai from 'chai';
const should = chai.should();

import {
  Ed25519VerificationKey2018
} from '@digitalbazaar/ed25519-verification-key-2018';
import jsigs from 'jsonld-signatures';
import jsonld from 'jsonld';
import {Ed25519Signature2018} from '@digitalbazaar/ed25519-signature-2018';
import {CredentialIssuancePurpose} from '../lib/CredentialIssuancePurpose.js';

import {mock as mockData} from './mocks/mock.data.js';
import {v4 as uuid} from 'uuid';
import * as vc from '../lib/index.js';
import {MultiLoader} from './MultiLoader.js';
import {contexts as realContexts} from '../lib/contexts/index.js';
import {invalidContexts} from './contexts/index.js';
import {credential as mockCredential} from './mocks/credential.js';
import {assertionController} from './mocks/assertionController.js';
import {VeresOneDriver} from 'did-veres-one';

const contexts = Object.assign({}, realContexts);
const testContextLoader = () => {
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

let suite;
let keyPair;
const documentLoader = testLoader.documentLoader.bind(testLoader);

before(async () => {
  // Set up the key that will be signing and verifying
  keyPair = await Ed25519VerificationKey2018.generate({
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
  contexts['https://example.edu/issuers/keys/1'] =
    keyPair.export({publicKey: true});

  // Set up the signature suite, using the generated key
  suite = new Ed25519Signature2018({
    verificationMethod: 'https://example.edu/issuers/keys/1',
    key: keyPair
  });
});

describe('vc.issue()', () => {
  it('should issue a verifiable credential with proof', async () => {
    const credential = jsonld.clone(mockCredential);
    const verifiableCredential = await vc.issue({
      credential,
      suite
    });
    verifiableCredential.should.exist;
    verifiableCredential.should.be.an('object');
    verifiableCredential.should.have.property('proof');
    verifiableCredential.proof.should.be.an('object');
  });

  it('should issue an expired verifiable credential', async () => {
    const keyPair = await Ed25519VerificationKey2018.generate();
    const fp = Ed25519VerificationKey2018
      .fingerprintFromPublicKey({publicKeyBase58: keyPair.publicKeyBase58});
    keyPair.id = `did:key:${fp}#${fp}`;
    const credential = jsonld.clone(mockCredential);
    credential.id = `urn:uuid:${uuid()}`;
    credential.issuer = `did:key:${fp}`;
    credential.expirationDate = '2020-05-31T19:21:25Z';
    const verifiableCredential = await vc.issue({
      credential,
      suite: new Ed25519Signature2018({
        key: keyPair
      }),
      // set `now` to expiration date, allowing the credential to be issued
      // without failing the expired check
      now: (new Date('2020-05-31T19:21:25Z'))
    });
    verifiableCredential.should.exist;
    verifiableCredential.should.be.an('object');
    verifiableCredential.should.have.property('proof');
    verifiableCredential.proof.should.be.an('object');
  });

  it('should throw an error on missing verificationMethod', async () => {
    const suite = new Ed25519Signature2018({
      // Note no key id or verificationMethod passed to suite
      key: await Ed25519VerificationKey2018.generate()
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

describe('verify API (credentials)', () => {
  it('should verify a vc', async () => {
    const verifiableCredential = await vc.issue({
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
    const verifiableCredential = await vc.issue({
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

  describe('negative test', async () => {
    it('fails to verify if a context resolves to null', async () => {
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
      const verifiableCredential = await vc.issue({
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

describe('test for multiple credentials', async () => {
  const credentialsCount = [5, 25, 50, 100];

  for(const count of credentialsCount) {
    it('cause error when credentials are tampered', async () => {
      const challenge = uuid();
      const {presentation, suite: vcSuite, documentLoader} =
        await _generatePresentation({challenge, credentialsCount: count});

      // tampering with the first two credentials id
      presentation.verifiableCredential[0].id = 'some fake id';
      presentation.verifiableCredential[1].id = 'some other fake id';

      const result = await vc.verify({
        documentLoader,
        presentation,
        suite: vcSuite,
        unsignedPresentation: true
      });
      const credentialResults = result.credentialResults;
      const credentialOne = result.credentialResults[0];
      const credentialTwo = result.credentialResults[1];
      const firstErrorMsg = result.credentialResults[0].error.errors[0].message;

      result.verified.should.be.a('boolean');
      result.verified.should.be.false;

      credentialOne.verified.should.be.a('boolean');
      credentialOne.verified.should.be.false;
      credentialOne.credentialId.should.be.a('string');
      credentialOne.credentialId.should.equal('some fake id');

      credentialTwo.verified.should.be.a('boolean');
      credentialTwo.verified.should.be.false;
      credentialTwo.credentialId.should.be.a('string');
      credentialTwo.credentialId.should.equal('some other fake id');

      for(let i = 2; i < credentialResults.length; ++i) {
        const credential = credentialResults[i];
        credential.verified.should.be.a('boolean');
        credential.verified.should.be.true;
        should.exist(credential.credentialId);
        credential.credentialId.should.be.a('string');
      }

      firstErrorMsg.should.contain('Invalid signature.');
    });

    it('should not cause error when credentials are correct', async () => {
      const challenge = uuid();
      const {presentation, suite: vcSuite, documentLoader} =
        await _generatePresentation({challenge, credentialsCount: count});

      const result = await vc.verify({
        documentLoader,
        presentation,
        suite: vcSuite,
        unsignedPresentation: true
      });
      const credentialResults = result.credentialResults;

      result.verified.should.be.a('boolean');
      result.verified.should.be.true;

      for(const credential of credentialResults) {
        credential.verified.should.be.a('boolean');
        credential.verified.should.be.true;
        should.exist(credential.credentialId);
        credential.credentialId.should.be.a('string');
      }
    });
  }
});

describe('_checkCredential', () => {
  it('should reject a credentialSubject.id that is not a URI', () => {
    const credential = jsonld.clone(mockData.credentials.alpha);
    credential.issuer = 'http://example.edu/credentials/58473';
    credential.credentialSubject.id = '12345';
    let error;
    try {
      vc._checkCredential({credential});
    } catch(e) {
      error = e;
    }
    should.exist(error,
      'Should throw error when "credentialSubject.id" is not a URI');
    error.should.be.instanceof(TypeError);
    error.message.should
      .contain('"credentialSubject.id" must be a URI');
  });

  it('should reject an issuer that is not a URI', () => {
    const credential = jsonld.clone(mockData.credentials.alpha);
    credential.issuer = '12345';
    let error;
    try {
      vc._checkCredential({credential});
    } catch(e) {
      error = e;
    }
    should.exist(error,
      'Should throw error when "credentialSubject.id" is not a URI');
    error.should.be.instanceof(TypeError);
    error.message.should
      .contain('"issuer" must be a URI');
  });

  it('should reject an evidence id that is not a URI', () => {
    const credential = jsonld.clone(mockData.credentials.alpha);
    credential.issuer = 'did:example:12345';
    credential.evidence = '12345';
    let error;
    try {
      vc._checkCredential({credential});
    } catch(e) {
      error = e;
    }
    should.exist(error,
      'Should throw error when "evidence" is not a URI');
    error.should.be.instanceof(TypeError);
    error.message.should
      .contain('"evidence" must be a URI');
  });

  it('should reject if "expirationDate" has passed', () => {
    const credential = jsonld.clone(mockData.credentials.alpha);
    credential.issuer = 'did:example:12345';
    // set expirationDate to an expired date.
    credential.expirationDate = '2020-05-31T19:21:25Z';
    let error;
    try {
      vc._checkCredential({credential});
    } catch(e) {
      error = e;
    }
    should.exist(error,
      'Should throw error when "expirationDate" has passed');
    error.message.should
      .contain('Credential has expired.');
  });

  it('should reject if "now" is before "issuanceDate"', () => {
    const credential = jsonld.clone(mockData.credentials.alpha);
    credential.issuer = 'did:example:12345';
    credential.issuanceDate = '2022-10-31T19:21:25Z';
    const now = '2022-06-30T19:21:25Z';
    let error;
    try {
      vc._checkCredential({credential, now});
    } catch(e) {
      error = e;
    }
    should.exist(error,
      'Should throw error when "now" is before "issuanceDate"');
    error.message.should.contain(
      'The current date time (2022-06-30T19:21:25.000Z) is before the ' +
      '"issuanceDate" (2022-10-31T19:21:25.000Z).');
  });
});

async function _generateCredential() {
  const mockCredential = jsonld.clone(mockData.credentials.alpha);
  const {didDocument, documentLoader} = await _loadDid();
  mockCredential.issuer = didDocument.didDocument.id;
  mockCredential.id = `http://example.edu/credentials/${uuid()}`;
  testLoader.addLoader(documentLoader);

  const assertionKey = didDocument.methodFor({purpose: 'assertionMethod'});

  const suite = new Ed25519Signature2018({key: assertionKey});
  const credential = await jsigs.sign(mockCredential, {
    compactProof: false,
    documentLoader: testLoader.documentLoader.bind(testLoader),
    suite,
    purpose: new CredentialIssuancePurpose()
  });

  return {credential, documentLoader, suite};
}

async function _generatePresentation({
  challenge, unsigned = false, credentialsCount = 1
}) {
  const {didDocument, documentLoader: didLoader} = await _loadDid();
  testLoader.addLoader(didLoader);
  const credentials = [];

  // generate multiple credentials
  for(let i = 0; i < credentialsCount; i++) {
    const {credential} = await _generateCredential();
    credentials.push(credential);
  }

  const {documentLoader: dlc, suite: vcSuite} = await _generateCredential();
  testLoader.addLoader(dlc);

  const presentation = vc.createPresentation(
    {verifiableCredential: credentials});

  if(unsigned) {
    return {presentation, suite: vcSuite,
      documentLoader: testLoader.documentLoader.bind(testLoader)};
  }

  const authenticationKey = didDocument.methodFor({purpose: 'authentication'});

  const vpSuite = new Ed25519Signature2018({key: authenticationKey});

  const vp = await vc.signPresentation({
    presentation, suite: vpSuite, challenge,
    documentLoader: testLoader.documentLoader.bind(testLoader)
  });

  return {presentation: vp, suite: [vcSuite, vpSuite],
    documentLoader: testLoader.documentLoader.bind(testLoader)};
}

async function _loadDid() {
  const driver = new VeresOneDriver({mode: 'test'});
  const didDocument = await driver.generate({
    seed: new Uint8Array(32)
  });
  const documentLoader = url => {
    let document;
    if(url.includes('#')) {
      // FIXME: code path not yet tested
      throw new Error('FIXME');
      document = didDocument.keyPairs.get(url);
    } else if(url === didDocument.didDocument.id) {
      document = didDocument.didDocument;
    }
    if(document) {
      return {contextUrl: null, document, documentUrl: url};
    }
    throw new Error(`"${url}" not authorized to be resolved.`);
  };
  return {
    didDocument, documentLoader
  };
}
