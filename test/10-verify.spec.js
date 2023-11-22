/*!
 * Copyright (c) 2019-2023 Digital Bazaar, Inc. All rights reserved.
 */
import chai from 'chai';
const should = chai.should();

const {Ed25519VerificationKey2018} =
  require('@digitalbazaar/ed25519-verification-key-2018');
const jsigs = require('@digitalcredentials/jsonld-signatures');
const jsonld = require('jsonld');
const {Ed25519Signature2018} = require('@digitalbazaar/ed25519-signature-2018');
const {Ed25519Signature2020} =
  require('@digitalcredentials/ed25519-signature-2020');
const CredentialIssuancePurpose = require('../lib/CredentialIssuancePurpose');
const {securityLoader} =
  require('@digitalcredentials/security-document-loader');

const mockData = require('./mocks/mock.data');
const {v4: uuid} = require('uuid');
const vc = require('..');
const MultiLoader = require('./MultiLoader');
const realContexts = require('../lib/contexts');
const invalidContexts = require('./contexts');
const mockCredential = require('./mocks/credential');
const legacyOBv3Credential = require('./mocks/credential-legacy-obv3');
const mockVC2018 = require('./mocks/credential-2018');
const assertionController = require('./mocks/assertionController');
const mockDidDoc = require('./mocks/didDocument');
const mockDidKeys = require('./mocks/didKeys');
const {VeresOneDidDoc} = require('did-veres-one');

const testContextLoader = extendContextLoader(async url => {
  const remoteDocument = remoteDocuments.get(url);
  if(remoteDocument) {
    return {
      contextUrl: null,
      document: jsonld.clone(remoteDocument),
      documentUrl: url
    };
  }
  return defaultDocumentLoader(url);
});

// documents are added to this documentLoader incrementally
const testLoader = new MultiLoader({
  documentLoader: [
    // CREDENTIALS_CONTEXT_URL
    testContextLoader
  ]
});

const documentLoader = testLoader.documentLoader.bind(testLoader);

// do ed25519 setup...
let suite;
let keyPair;
before(async () => {
  // set up the Ed25519 key pair that will be signing and verifying
  keyPair = await Ed25519VerificationKey2018.generate({
    id: 'https://example.edu/issuers/keys/1',
    controller: 'https://example.edu/issuers/565049'
  });

  // add the key to the controller doc (authorizes its use for assertion)
  assertionController.assertionMethod.push(keyPair.id);
  // also add the key for authentication (VP) purposes
  // FIXME: this shortcut to reuse the same key and sign VPs as issuer can
  // confuse developers trying to learn from the test suite and it should
  // be changed
  assertionController.authentication.push(keyPair.id);

  // register the controller document and the key document with documentLoader
  remoteDocuments.set(
    'https://example.edu/issuers/565049', assertionController);
  remoteDocuments.set(
    'https://example.edu/issuers/keys/1',
    await keyPair.export({publicKey: true}));

  // set up the signature suite, using the generated key
  suite = new Ed25519Signature2018({
    verificationMethod: 'https://example.edu/issuers/keys/1',
    key: keyPair
  });
});

// do ecdsa setup...
let ecdsaKeyPair;
before(async () => {
  // set up the ECDSA key pair that will be signing and verifying
  ecdsaKeyPair = await EcdsaMultikey.generate({
    curve: 'P-256',
    id: 'https://example.edu/issuers/keys/2',
    controller: 'https://example.edu/issuers/565049'
  });

  // add the key to the controller doc (authorizes its use for assertion)
  assertionController.assertionMethod.push(ecdsaKeyPair.id);
  // register the key document with documentLoader
  remoteDocuments.set(
    'https://example.edu/issuers/keys/2',
    await ecdsaKeyPair.export({publicKey: true}));
});

for(const [version, mockCredential] of versionedCredentials) {
  describe(`Verifiable Credential Data Model ${version}`, async function() {
    describe('vc.issue()', () => {
      it('should issue a verifiable credential with proof', async () => {
        const credential = jsonld.clone(mockCredential);
        const verifiableCredential = await vc.issue({
          credential,
          suite,
          documentLoader
        });
        verifiableCredential.should.exist;
        verifiableCredential.should.be.an('object');
        verifiableCredential.should.have.property('proof');
        verifiableCredential.proof.should.be.an('object');
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
  it('should add "issuanceDate" to verifiable credentials', async () => {
    const credential = jsonld.clone(mockCredential);
    delete credential.issuanceDate;
    const now = new Date();
    const expectedIssuanceDate = `${now.toISOString().slice(0, -5)}Z`;
    const verifiableCredential = await vc.issue({
      credential,
      suite,
      documentLoader,
      now
    });
    verifiableCredential.should.exist;
    verifiableCredential.should.be.an('object');
    verifiableCredential.should.have.property('proof');
    verifiableCredential.proof.should.be.an('object');
    verifiableCredential.should.have.property(
      'issuanceDate',
      expectedIssuanceDate
    );
  });
});

describe('vc.createPresentation()', () => {
  it('should create an unsigned presentation', () => {
    const presentation = vc.createPresentation({
      verifiableCredential: credentials.v2,
      id: 'test:ebc6f1c2',
      holder: 'did:ex:holder123'
    });

    presentation.type.should.eql(['VerifiablePresentation']);
    presentation.should.have.property('verifiableCredential');
    presentation.should.have.property('id', 'test:ebc6f1c2');
    presentation.should.have.property('holder', 'did:ex:holder123');
    presentation.should.not.have.property('proof');
  });
});

describe('vc.signPresentation()', () => {
  it('should create a signed VP', async () => {
    const presentation = vc.createPresentation({
      verifiableCredential: credentials.v2,
      id: 'test:ebc6f1c2',
      holder: 'did:ex:holder123'
    });
    const vp = await vc.signPresentation({
      presentation,
      suite, // from before() block
      challenge: '12ec21',
      documentLoader
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
  it('should verify an OBv3 vc', async () => {
    const result = await vc.verifyCredential({
      credential: legacyOBv3Credential,
      suite: new Ed25519Signature2020(),
      documentLoader: securityLoader().build()
    });

    if(result.error) {
      throw result.error;
    }
    result.verified.should.be.true;

    result.results[0].log.should.eql([
      {id: 'expiration', valid: true},
      {id: 'valid_signature', valid: true},
      {id: 'issuer_did_resolves', valid: true},
      {id: 'revocation_status', valid: true}
    ]);
  });

  it('should verify a 2018 signed VC', async () => {
    const result = await vc.verifyCredential({
      credential: mockVC2018,
      suite: [new Ed25519Signature2020(), new Ed25519Signature2018()],
      documentLoader: securityLoader().build()
    });

    if(result.error) {
      console.log(result.error);
      throw result.error;
    }
    result.verified.should.be.true;

    result.results[0].log.should.eql([
      {id: 'expiration', valid: true},
      {id: 'valid_signature', valid: true},
      {id: 'issuer_did_resolves', valid: true},
      {id: 'revocation_status', valid: true}
    ]);
  });

  it('should verify a derived vc', async () => {
    const proofId = `urn:uuid:${uuid()}`;
    // setup ecdsa-sd-2023 suite for signing selective disclosure VCs
    const ecdsaSdSignSuite = new DataIntegrityProof({
      signer: ecdsaKeyPair.signer(), cryptosuite: createSignCryptosuite({
        mandatoryPointers: [
          '/issuanceDate',
          '/issuer'
        ]
      })
    });
    ecdsaSdSignSuite.proof = {id: proofId};
    // setup ecdsa-sd-2023 suite for deriving selective disclosure VCs
    const ecdsaSdDeriveSuite = new DataIntegrityProof({
      cryptosuite: createDiscloseCryptosuite({
        proofId,
        selectivePointers: [
          '/credentialSubject'
        ]
      })
    });
    // setup ecdsa-sd-2023 suite for verifying selective disclosure VCs
    const ecdsaSdVerifySuite = new DataIntegrityProof({
      cryptosuite: createVerifyCryptosuite()
    });

    const verifiableCredential = await vc.issue({
      credential: {...credentials.v1},
      suite: ecdsaSdSignSuite,
      documentLoader
    });
    const derivedCredential = await vc.derive({
      verifiableCredential,
      suite: ecdsaSdDeriveSuite,
      documentLoader
    });
    const result = await vc.verifyCredential({
      credential: derivedCredential,
      controller: assertionController,
      suite: ecdsaSdVerifySuite,
      documentLoader
    });

    if(result.error) {
      throw result.error;
    }
    result.verified.should.be.true;
  });

  it('should verify a vc with a positive status check', async () => {
    const credential = jsonld.clone(mockCredential);
    credential['@context'].push({
      '@context': {
        id: '@id',
        type: '@type',
        TestStatusList: {
          '@id': 'https://example.edu/TestStatusList',
          '@type': '@id'
        }
      }
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

    if(result.error) {
      throw result.error;
    }
    result.verified.should.be.true;

    result.results[0].log.should.eql([
      {id: 'expiration', valid: true},
      {id: 'valid_signature', valid: true},
      {id: 'issuer_did_resolves', valid: true},
      {id: 'revocation_status', valid: true}
    ]);
  });

        presentation.type.should.eql(['VerifiablePresentation']);
        presentation.should.have.property('verifiableCredential');
        presentation.should.have.property('id', 'test:ebc6f1c2');
        presentation.should.have.property('holder', 'did:ex:holder123');
        presentation.should.not.have.property('proof');
      });
    });

    describe('vc.signPresentation()', () => {
      it('should create a signed VP', async () => {
        const presentation = vc.createPresentation({
          verifiableCredential: mockCredential,
          id: 'test:ebc6f1c2',
          holder: 'did:ex:holder123'
        });
        const vp = await vc.signPresentation({
          presentation,
          suite, // from before() block
          challenge: '12ec21',
          documentLoader
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
          suite,
          documentLoader
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

      it('should verify a derived vc', async () => {
        const proofId = `urn:uuid:${uuid()}`;
        const mandatoryPointers = (version === '1.0') ?
          ['/issuer', '/issuanceDate'] : ['/issuer'];
        // setup ecdsa-sd-2023 suite for signing selective disclosure VCs
        const ecdsaSdSignSuite = new DataIntegrityProof({
          signer: ecdsaKeyPair.signer(), cryptosuite: createSignCryptosuite({
            mandatoryPointers
          })
        });
        ecdsaSdSignSuite.proof = {id: proofId};
        // setup ecdsa-sd-2023 suite for deriving selective disclosure VCs
        const ecdsaSdDeriveSuite = new DataIntegrityProof({
          cryptosuite: createDiscloseCryptosuite({
            proofId,
            selectivePointers: [
              '/credentialSubject'
            ]
          })
        });
        // setup ecdsa-sd-2023 suite for verifying selective disclosure VCs
        const ecdsaSdVerifySuite = new DataIntegrityProof({
          cryptosuite: createVerifyCryptosuite()
        });

        const verifiableCredential = await vc.issue({
          credential: {...mockCredential},
          suite: ecdsaSdSignSuite,
          documentLoader
        });
        const derivedCredential = await vc.derive({
          verifiableCredential,
          suite: ecdsaSdDeriveSuite,
          documentLoader
        });
        const result = await vc.verifyCredential({
          credential: derivedCredential,
          controller: assertionController,
          suite: ecdsaSdVerifySuite,
          documentLoader
        });

        if(result.error) {
          throw result.error;
        }
        result.verified.should.be.true;
      });

      it('should verify a vc with a positive status check', async () => {
        const credential = jsonld.clone(mockCredential);
        credential['@context'].push({
          '@context': {
            id: '@id',
            type: '@type',
            TestStatusList: {
              '@id': 'https://example.edu/TestStatusList',
              '@type': '@id'
            }
          }
        });
        credential.credentialStatus = {
          id: 'https://example.edu/status/24',
          type: 'TestStatusList'
        };
        const verifiableCredential = await vc.issue({
          credential,
          suite,
          documentLoader
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

      if(result.error) {
        throw result.error;
      }
      result.verified.should.be.false;

      result.results[0].log.should.eql([
        {id: 'expiration', valid: true},
        {id: 'valid_signature', valid: true},
        {id: 'issuer_did_resolves', valid: true},
        {id: 'revocation_status', valid: false}
      ]);
    });
    it('should not run "checkStatus" on a vc without a ' +
      '"credentialStatus" property', async () => {
      const credential = jsonld.clone(mockCredential);
      const verifiableCredential = await vc.issue({
        credential,
        suite,
        documentLoader
      });
      const result = await vc.verifyCredential({
        credential: verifiableCredential,
        controller: assertionController,
        suite,
        documentLoader,
        // ensure any checkStatus call will fail verification
        checkStatus: async () => ({verified: false})
      });
      if(result.error) {
        throw result.error;
      }
      result.verified.should.be.true;
    });
    it('should fail to verify a changed derived vc', async () => {
      const proofId = `urn:uuid:${uuid()}`;
      // setup ecdsa-sd-2023 suite for signing selective disclosure VCs
      const ecdsaSdSignSuite = new DataIntegrityProof({
        signer: ecdsaKeyPair.signer(), cryptosuite: createSignCryptosuite({
          mandatoryPointers: [
            '/issuanceDate',
            '/issuer'
          ]
        })
      });
      ecdsaSdSignSuite.proof = {id: proofId};
      // setup ecdsa-sd-2023 suite for deriving selective disclosure VCs
      const ecdsaSdDeriveSuite = new DataIntegrityProof({
        cryptosuite: createDiscloseCryptosuite({
          proofId,
          selectivePointers: [
            '/credentialSubject'
          ]
        })
      });
      // setup ecdsa-sd-2023 suite for verifying selective disclosure VCs
      const ecdsaSdVerifySuite = new DataIntegrityProof({
        cryptosuite: createVerifyCryptosuite()
      });

            if(result.error) {
              throw result.error;
            }
            result.verified.should.be.false;
          });
        it('should not run "checkStatus" on a vc without a ' +
          '"credentialStatus" property', async () => {
          const credential = jsonld.clone(mockCredential);
          const verifiableCredential = await vc.issue({
            credential,
            suite,
            documentLoader
          });
          const result = await vc.verifyCredential({
            credential: verifiableCredential,
            controller: assertionController,
            suite,
            documentLoader,
            // ensure any checkStatus call will fail verification
            checkStatus: async () => ({verified: false})
          });
          if(result.error) {
            throw result.error;
          }
          result.verified.should.be.true;
        });
        it('should fail to verify a changed derived vc', async () => {
          const proofId = `urn:uuid:${uuid()}`;
          const mandatoryPointers = (version === '1.0') ?
            ['/issuer', '/issuanceDate'] : ['/issuer'];
          // setup ecdsa-sd-2023 suite for signing selective disclosure VCs
          const ecdsaSdSignSuite = new DataIntegrityProof({
            signer: ecdsaKeyPair.signer(), cryptosuite: createSignCryptosuite({
              mandatoryPointers
            })
          });
          ecdsaSdSignSuite.proof = {id: proofId};
          // setup ecdsa-sd-2023 suite for deriving selective disclosure VCs
          const ecdsaSdDeriveSuite = new DataIntegrityProof({
            cryptosuite: createDiscloseCryptosuite({
              proofId,
              selectivePointers: [
                '/credentialSubject'
              ]
            })
          });
          // setup ecdsa-sd-2023 suite for verifying selective disclosure VCs
          const ecdsaSdVerifySuite = new DataIntegrityProof({
            cryptosuite: createVerifyCryptosuite()
          });

          const verifiableCredential = await vc.issue({
            credential: {...mockCredential},
            suite: ecdsaSdSignSuite,
            documentLoader
          });
          const derivedCredential = await vc.derive({
            verifiableCredential,
            suite: ecdsaSdDeriveSuite,
            documentLoader
          });
          derivedCredential.credentialSubject.id = `urn:uuid:${uuid()}`;
          const result = await vc.verifyCredential({
            credential: derivedCredential,
            controller: assertionController,
            suite: ecdsaSdVerifySuite,
            documentLoader
          });
          result.verified.should.be.a('boolean');
          result.verified.should.be.false;
        });
      });
    });

    describe('verify API (presentations)', () => {
      it('verifies a valid signed presentation', async () => {
        const challenge = uuid();

        const {presentation, suite, documentLoader} =
          await _generatePresentation({challenge, mockCredential});

    console.log(JSON.stringify(presentation, null, 2));
    console.log(vcSuite);

    const result = await vc.verify({
      documentLoader,
      presentation,
      suite: vcSuite,
      unsignedPresentation: true
    });

    describe('test for multiple credentials', async () => {
      const credentialsCount = [5, 25, 50, 100];

      for(const count of credentialsCount) {
        it(`cause error when credentials are tampered [${count}]`, async () => {
          const challenge = uuid();
          const {presentation, suite: vcSuite, documentLoader} =
            await _generatePresentation({
              challenge,
              credentialsCount: count,
              mockCredential
            });

          // tampering with the first two credentials id
          presentation.verifiableCredential[0].id = 'test:some_fake_id';
          presentation.verifiableCredential[1].id = 'test:some_other_fake_id';

          const result = await vc.verify({
            documentLoader,
            presentation,
            suite: vcSuite,
            unsignedPresentation: true
          });
          const credentialResults = result.credentialResults;
          const credentialOne = result.credentialResults[0];
          const credentialTwo = result.credentialResults[1];
          const firstErrorMsg = result.credentialResults[0].error.errors[0]
            .message;

          result.verified.should.be.a('boolean');
          result.verified.should.be.false;

          credentialOne.verified.should.be.a('boolean');
          credentialOne.verified.should.be.false;
          credentialOne.credentialId.should.be.a('string');
          credentialOne.credentialId.should.equal('test:some_fake_id');

          credentialTwo.verified.should.be.a('boolean');
          credentialTwo.verified.should.be.false;
          credentialTwo.credentialId.should.be.a('string');
          credentialTwo.credentialId.should.equal('test:some_other_fake_id');

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
            await _generatePresentation({
              challenge,
              credentialsCount: count,
              mockCredential
            });
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
      if(version === '1.0') {
        it('should reject if "now" is before "issuanceDate"', () => {
          const credential = jsonld.clone(mockCredential);
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
  it('should reject if "credentialSubject" is empty', () => {
    const credential = jsonld.clone(credentials.v1);
    credential.credentialSubject = {};
    credential.issuer = 'did:example:12345';
    credential.issuanceDate = '2022-10-31T19:21:25Z';
    let error;
    try {
      vc._checkCredential({credential});
    } catch(e) {
      error = e;
    }
    should.exist(error,
      'Should throw error when "credentialSubject" is empty.');
    error.message.should.contain(
      '"credentialSubject" must make a claim.');
  });
  it('should reject if a "credentialSubject" is empty', () => {
    const credential = jsonld.clone(credentials.v1);
    credential.credentialSubject = [{}, {id: 'did:key:zFoo'}];
    credential.issuer = 'did:example:12345';
    credential.issuanceDate = '2022-10-31T19:21:25Z';
    let error;
    try {
      vc._checkCredential({credential});
    } catch(e) {
      error = e;
    }
    should.exist(error,
      'Should throw error when "credentialSubject" is empty.');
    error.message.should.contain(
      '"credentialSubject" must make a claim.');
  });

      it('should accept multiple credentialSubjects', () => {
        const credential = jsonld.clone(mockCredential);
        credential.credentialSubject = [
          {id: 'did:key:zFoo'},
          {name: 'did key'}
        ];
        credential.issuer = 'did:example:12345';
        if(version === '1.0') {
          credential.issuanceDate = '2022-10-31T19:21:25Z';
        }
        let error;
        try {
          vc._checkCredential({credential});
        } catch(e) {
          error = e;
        }
        should.not.exist(error,
          'Should not throw error when multiple credentialSubjects.');
      });
    });

  });
}

async function _generateCredential(_mockCredential) {
  const mockCredential = jsonld.clone(_mockCredential);
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
  challenge, unsigned = false, credentialsCount = 1, mockCredential
}) {
  const {didDocument, documentLoader: didLoader} = await _loadDid();
  testLoader.addLoader(didLoader);
  const credentials = [];

  // generate multiple credentials
  for(let i = 0; i < credentialsCount; i++) {
    const {credential} = await _generateCredential(mockCredential);
    credentials.push(credential);
  }

  const {documentLoader: dlc, suite: vcSuite} = await _generateCredential(
    mockCredential);
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
