/*!
 * Copyright (c) 2019-2024 Digital Bazaar, Inc. All rights reserved.
 */
import * as bbs2023Cryptosuite from '@digitalbazaar/bbs-2023-cryptosuite';
import * as Bls12381Multikey from '@digitalbazaar/bls12-381-multikey';
import * as EcdsaMultikey from '@digitalbazaar/ecdsa-multikey';
import * as ecdsaSd2023Cryptosuite from
  '@digitalbazaar/ecdsa-sd-2023-cryptosuite';
import * as vc from '../lib/index.js';
import {
  documentLoader,
  remoteDocuments,
  testLoader
} from './testDocumentLoader.js';
import {assertionController} from './mocks/assertionController.js';
import chai from 'chai';
import {CredentialIssuancePurpose} from '../lib/CredentialIssuancePurpose.js';
import {DataIntegrityProof} from '@digitalbazaar/data-integrity';
import {Ed25519Signature2018} from '@digitalbazaar/ed25519-signature-2018';
import {
  Ed25519VerificationKey2018
} from '@digitalbazaar/ed25519-verification-key-2018';
import {invalidContexts} from './contexts/index.js';
import jsigs from 'jsonld-signatures';
import {klona} from 'klona';
import {mock as mockData} from './mocks/mock.data.js';
import {v4 as uuid} from 'uuid';
import {VeresOneDriver} from 'did-veres-one';
import {versionedCredentials} from './mocks/credential.js';

const should = chai.should();

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

// do BBS setup...
let bbsKeyPair;
before(async () => {
  // set up the BBS key pair that will be signing and verifying
  bbsKeyPair = await Bls12381Multikey.generateBbsKeyPair({
    algorithm: 'BBS-BLS12-381-SHA-256',
    id: 'https://example.edu/issuers/keys/3',
    controller: 'https://example.edu/issuers/565049'
  });

  // add the key to the controller doc (authorizes its use for assertion)
  assertionController.assertionMethod.push(bbsKeyPair.id);
  // register the key document with documentLoader
  remoteDocuments.set(
    'https://example.edu/issuers/keys/3',
    await bbsKeyPair.export({publicKey: true}));
});

// run tests on each version of VCs
for(const [version, mockCredential] of versionedCredentials) {
  describe(`Verifiable Credentials Data Model ${version}`, async function() {
    describe('vc.issue()', () => {
      it('should issue a verifiable credential with proof', async () => {
        const credential = mockCredential();
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
      it('should issue a verifiable credential with out id', async () => {
        const credential = mockCredential();
        delete credential.id;
        const verifiableCredential = await vc.issue({
          credential,
          suite,
          documentLoader
        });
        verifiableCredential.should.exist;
        verifiableCredential.should.be.an('object');
        verifiableCredential.should.have.property('proof');
        verifiableCredential.proof.should.be.an('object');
        should.not.exist(verifiableCredential.id, 'Expected no "vc.id".');
      });
      it('should throw an error on missing verificationMethod', async () => {
        const suite = new Ed25519Signature2018({
          // Note no key id or verificationMethod passed to suite
          key: await Ed25519VerificationKey2018.generate()
        });
        let error;
        try {
          await vc.issue({
            credential: mockCredential(),
            suite
          });
        } catch(e) {
          error = e;
        }

        should.exist(error,
          'Should throw error when "verificationMethod" property is missing');
        error.should.be.instanceof(TypeError);
        error.message.should
          .contain('"suite.verificationMethod" property is required.');
      });
      if(version === 1.0) {
        it('should issue an expired verifiable credential', async () => {
          const keyPair = await Ed25519VerificationKey2018.generate();
          const fp = Ed25519VerificationKey2018
            .fingerprintFromPublicKey({
              publicKeyBase58: keyPair.publicKeyBase58
            });
          keyPair.id = `did:key:${fp}#${fp}`;
          const credential = mockCredential();
          credential.id = `urn:uuid:${uuid()}`;
          credential.issuer = `did:key:${fp}`;
          credential.expirationDate = '2020-05-31T19:21:25Z';
          const verifiableCredential = await vc.issue({
            credential,
            suite: new Ed25519Signature2018({
              key: keyPair
            }),
            // set `now` to expiration date, allowing the credential
            // to be issued
            // without failing the expired check
            now: (new Date('2020-05-31T19:21:25Z')),
            documentLoader
          });
          verifiableCredential.should.exist;
          verifiableCredential.should.be.an('object');
          verifiableCredential.should.have.property('proof');
          verifiableCredential.proof.should.be.an('object');
        });
        it('should add "issuanceDate" to verifiable credentials', async () => {
          const credential = mockCredential();
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
      }
      if(version === 2.0) {
        it('should issue "validUntil" in the future', async () => {
          const credential = mockCredential();
          credential.issuer = 'did:example:12345';
          credential.validUntil = '2025-10-31T19:21:25Z';
          const now = '2022-06-30T19:21:25Z';
          let error;
          let verifiableCredential;
          try {
            verifiableCredential = await vc.issue({
              credential,
              now,
              suite,
              documentLoader
            });
          } catch(e) {
            error = e;
          }
          should.not.exist(error,
            'Should not throw error when issuing "validUntil" in future');
          verifiableCredential.should.exist;
          verifiableCredential.should.be.an('object');
          verifiableCredential.should.have.property('proof');
          verifiableCredential.proof.should.be.an('object');
          // ensure validUntil is present and has correct timestamp
          verifiableCredential.should.have.property(
            'validUntil',
            credential.validUntil
          );
        });
        it('should issue "validUntil" in the past', async () => {
          const credential = mockCredential();
          credential.issuer = 'did:example:12345';
          credential.validUntil = '2022-10-31T19:21:25Z';
          const now = '2025-06-30T19:21:25Z';
          let error;
          let verifiableCredential;
          try {
            verifiableCredential = await vc.issue({
              credential,
              now,
              suite,
              documentLoader
            });
          } catch(e) {
            error = e;
          }
          should.not.exist(error,
            'Should not throw error when issuing with "validUntil" in past');
          verifiableCredential.should.exist;
          verifiableCredential.should.be.an('object');
          verifiableCredential.should.have.property('proof');
          verifiableCredential.proof.should.be.an('object');
          // ensure validUntil is present and has correct timestamp
          verifiableCredential.should.have.property(
            'validUntil',
            credential.validUntil
          );
        });
        it('should issue "validFrom" in the past', async () => {
          const credential = mockCredential();
          credential.issuer = 'did:example:12345';
          credential.validFrom = '2022-06-30T19:21:25Z';
          const now = '2022-10-30T19:21:25Z';
          let error;
          let verifiableCredential;
          try {
            verifiableCredential = await vc.issue({
              credential,
              now,
              suite,
              documentLoader
            });
          } catch(e) {
            error = e;
          }
          should.not.exist(error,
            'Should not throw error when issuing "validFrom" in past');
          verifiableCredential.should.exist;
          verifiableCredential.should.be.an('object');
          verifiableCredential.should.have.property('proof');
          verifiableCredential.proof.should.be.an('object');
          // ensure validFrom is present and has correct timestamp
          verifiableCredential.should.have.property(
            'validFrom',
            credential.validFrom
          );
        });
        it('should issue "validFrom" in the future', async () => {
          const credential = mockCredential();
          credential.issuer = 'did:example:12345';
          credential.validFrom = '2022-10-30T19:21:25Z';
          const now = '2022-06-30T19:21:25Z';
          let error;
          let verifiableCredential;
          try {
            verifiableCredential = await vc.issue({
              credential,
              now,
              suite,
              documentLoader
            });
          } catch(e) {
            error = e;
          }
          should.not.exist(error,
            'Should not throw error when issuing "validFrom" in future');
          verifiableCredential.should.exist;
          verifiableCredential.should.be.an('object');
          verifiableCredential.should.have.property('proof');
          verifiableCredential.proof.should.be.an('object');
          // ensure validFrom is present and has correct timestamp
          verifiableCredential.should.have.property(
            'validFrom',
            credential.validFrom
          );
        });
        it('should issue both "validFrom" and "validUntil"', async () => {
          const credential = mockCredential();
          credential.issuer = 'did:example:12345';
          credential.validFrom = '2022-05-30T19:21:25Z';
          credential.validUntil = '2025-05-30T19:21:25Z';
          const now = '2022-06-30T19:21:25Z';
          let error;
          let verifiableCredential;
          try {
            verifiableCredential = await vc.issue({
              credential,
              suite,
              documentLoader,
              now
            });
          } catch(e) {
            error = e;
          }
          should.not.exist(
            error,
            'Should not throw when issuing VC with both "validFrom" and' +
              '"validUntil"'
          );
          verifiableCredential.should.exist;
          verifiableCredential.should.be.an('object');
          verifiableCredential.should.have.property('proof');
          verifiableCredential.proof.should.be.an('object');
          // ensure validUntil & validAfter are present
          // and have correct timestamps
          verifiableCredential.should.have.property(
            'validFrom',
            credential.validFrom
          );
          verifiableCredential.should.have.property(
            'validUntil',
            credential.validUntil
          );
        });
      }
    });

    describe('vc.createPresentation()', () => {
      it('should create an unsigned presentation', () => {
        const presentation = vc.createPresentation({
          verifiableCredential: mockCredential(),
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
          verifiableCredential: mockCredential(),
          id: 'test:ebc6f1c2',
          holder: 'did:ex:holder123',
          version
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
          credential: mockCredential(),
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

      it('should verify an ECDSA-SD derived vc', async () => {
        const {
          createDiscloseCryptosuite,
          createSignCryptosuite,
          createVerifyCryptosuite
        } = ecdsaSd2023Cryptosuite;
        const proofId = `urn:uuid:${uuid()}`;
        const mandatoryPointers = (version === 1.0) ?
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
          credential: mockCredential(),
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

      it('should verify a BBS derived vc', async () => {
        const {
          createDiscloseCryptosuite,
          createSignCryptosuite,
          createVerifyCryptosuite
        } = bbs2023Cryptosuite;
        const mandatoryPointers = (version === 1.0) ?
          ['/issuer', '/issuanceDate'] : ['/issuer'];

        // setup bbs-2023 suite for signing unlinkable VCs
        const bbsSignSuite = new DataIntegrityProof({
          signer: bbsKeyPair.signer(), cryptosuite: createSignCryptosuite({
            mandatoryPointers
          })
        });
        // setup bbs-2023 suite for deriving unlinkable VC proofs
        const bbsDeriveSuite = new DataIntegrityProof({
          cryptosuite: createDiscloseCryptosuite({
            selectivePointers: [
              '/credentialSubject'
            ]
          })
        });
        // setup bbs-2023 suite for verifying unlinkable VC proofs
        const bbsVerifySuite = new DataIntegrityProof({
          cryptosuite: createVerifyCryptosuite()
        });

        const credential = mockCredential();
        delete credential.id;
        delete credential.credentialSubject.id;
        const verifiableCredential = await vc.issue({
          credential,
          suite: bbsSignSuite,
          documentLoader
        });
        const derivedCredential = await vc.derive({
          verifiableCredential,
          suite: bbsDeriveSuite,
          documentLoader
        });
        const result = await vc.verifyCredential({
          credential: derivedCredential,
          controller: assertionController,
          suite: bbsVerifySuite,
          documentLoader
        });

        if(result.error) {
          throw result.error;
        }
        result.verified.should.be.true;
      });

      it('should verify a vc with a positive status check', async () => {
        const credential = mockCredential();
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

      describe('negative test', async () => {
        it('fails to verify if a context resolves to null', async () => {
          const {credential, suite} = await _generateCredential(mockCredential);
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
          const {credential, suite} = await _generateCredential(mockCredential);
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
          const {credential, suite} = await _generateCredential(mockCredential);
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
          const {credential, suite} = await _generateCredential(mockCredential);
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
          const {credential, suite} = await _generateCredential(mockCredential);
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
          const {credential, suite} = await _generateCredential(mockCredential);
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
          const {credential, suite} = await _generateCredential(mockCredential);
          credential['@context'].push('htps://fsad.digitalbazaar.');
          const results = await vc.verifyCredential({
            suite,
            credential,
            documentLoader
          });
          results.verified.should.be.a('boolean');
          results.verified.should.be.false;
        });
        it('should fail to verify a vc with a negative status check',
          async () => {
            const credential = mockCredential();
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
              checkStatus: async () => ({verified: false})
            });

            if(result.error) {
              throw result.error;
            }
            result.verified.should.be.false;
          });
        it('should not run "checkStatus" on a vc without a ' +
          '"credentialStatus" property', async () => {
          const credential = mockCredential();
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
        it('should fail to verify a changed ECDSA-SD derived vc', async () => {
          const {
            createDiscloseCryptosuite,
            createSignCryptosuite,
            createVerifyCryptosuite
          } = ecdsaSd2023Cryptosuite;
          const proofId = `urn:uuid:${uuid()}`;
          const mandatoryPointers = (version === 1.0) ?
            ['/issuer', '/issuanceDate'] : ['/issuer'];
          // setup ecdsa-sd-2023 suite for signing selective disclosure VCs
          const ecdsaSdSignSuite = new DataIntegrityProof({
            signer: ecdsaKeyPair.signer(),
            cryptosuite: createSignCryptosuite({
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
            credential: mockCredential(),
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
        it('should fail to verify a changed BBS derived vc', async () => {
          const {
            createDiscloseCryptosuite,
            createSignCryptosuite,
            createVerifyCryptosuite
          } = bbs2023Cryptosuite;
          const mandatoryPointers = (version === 1.0) ?
            ['/issuer', '/issuanceDate'] : ['/issuer'];

          // setup bbs-2023 suite for signing unlinkable VCs
          const bbsSignSuite = new DataIntegrityProof({
            signer: bbsKeyPair.signer(), cryptosuite: createSignCryptosuite({
              mandatoryPointers
            })
          });
          // setup bbs-2023 suite for deriving unlinkable VC proofs
          const bbsDeriveSuite = new DataIntegrityProof({
            cryptosuite: createDiscloseCryptosuite({
              selectivePointers: [
                '/credentialSubject'
              ]
            })
          });
          // setup bbs-2023 suite for verifying unlinkable VC proofs
          const bbsVerifySuite = new DataIntegrityProof({
            cryptosuite: createVerifyCryptosuite()
          });

          const verifiableCredential = await vc.issue({
            credential: mockCredential(),
            suite: bbsSignSuite,
            documentLoader
          });
          const derivedCredential = await vc.derive({
            verifiableCredential,
            suite: bbsDeriveSuite,
            documentLoader
          });
          derivedCredential.credentialSubject.id = `urn:uuid:${uuid()}`;
          const result = await vc.verifyCredential({
            credential: derivedCredential,
            controller: assertionController,
            suite: bbsVerifySuite,
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
          await _generatePresentation({challenge, mockCredential, version});

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
        const {
          presentation,
          suite: vcSuite,
          documentLoader
        } = await _generatePresentation({
          unsigned: true,
          mockCredential,
          version
        });

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

    describe(`VerifiablePresentations Version ${version} w/ multiple VCs`,
      async () => {
        const credentialsCount = [5, 25, 50, 100];
        for(const count of credentialsCount) {
          it(`should error when credentials are tampered [${count}]`,
            async () => {
              const challenge = uuid();
              const {presentation, suite: vcSuite, documentLoader} =
                await _generatePresentation({
                  challenge,
                  credentialsCount: count,
                  mockCredential,
                  version
                });
              // tampering with the first two credentials id
              presentation.verifiableCredential[0].id = 'test:some_fake_id';
              presentation.verifiableCredential[1].id =
                'test:some_other_fake_id';
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
              credentialTwo.credentialId.should.equal(
                'test:some_other_fake_id');
              for(let i = 2; i < credentialResults.length; ++i) {
                const credential = credentialResults[i];
                credential.verified.should.be.a('boolean');
                credential.verified.should.be.true;
                should.exist(credential.credentialId);
                credential.credentialId.should.be.a('string');
              }
              firstErrorMsg.should.contain('Invalid signature.');
            });
          it(`should not error when credentials are correct [${count}]`,
            async () => {
              const challenge = uuid();
              const {presentation, suite: vcSuite, documentLoader} =
                await _generatePresentation({
                  challenge,
                  credentialsCount: count,
                  mockCredential,
                  version
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
          if(version === 2.0) {
            it(`should not error when credentials have mixed contexts ` +
              `[${count}]`, async () => {
              const challenge = uuid();
              const {presentation, suite: vcSuite, documentLoader} =
                await _generatePresentation({
                  challenge,
                  credentialsCount: count,
                  mockCredential: mockData.credentials.mixed,
                  version
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
        }
      });

    describe('_checkCredential', () => {
      it('should reject a credentialSubject.id that is not a URI', () => {
        const credential = klona(mockData.credentials.alpha);
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
        const credential = klona(mockData.credentials.alpha);
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
        const credential = klona(mockData.credentials.alpha);
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
        const credential = klona(mockData.credentials.alpha);
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
      if(version === 1.0) {
        it('should reject if "now" is before "issuanceDate"', () => {
          const credential = mockCredential();
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
      }
      if(version === 2.0) {
        it('should reject "validFrom" in the future', () => {
          const credential = mockCredential();
          credential.issuer = 'did:example:12345';
          credential.validFrom = '2022-10-30T19:21:25Z';
          const now = '2022-06-30T19:21:25Z';
          let error;
          try {
            vc._checkCredential({credential, now});
          } catch(e) {
            error = e;
          }
          should.exist(error,
            'Should throw error when "validFrom" in future');
        });
        it('should accept "validFrom" in the past', () => {
          const credential = mockCredential();
          credential.issuer = 'did:example:12345';
          credential.validFrom = '2022-06-30T19:21:25Z';
          const now = '2022-10-30T19:21:25Z';
          let error;
          try {
            vc._checkCredential({credential, now});
          } catch(e) {
            error = e;
          }
          should.not.exist(error,
            'Should not throw error when "validFrom" in past');
        });
        it('should reject "validUntil" in the past', () => {
          const credential = mockCredential();
          credential.issuer = 'did:example:12345';
          credential.validUntil = '2022-06-31T19:21:25Z';
          const now = '2025-10-30T19:21:25Z';
          let error;
          try {
            vc._checkCredential({credential, now});
          } catch(e) {
            error = e;
          }
          should.exist(error,
            'Should throw error when "validUntil" in the past');
        });
        it('should accept "validUntil" in the future', () => {
          const credential = mockCredential();
          credential.issuer = 'did:example:12345';
          credential.validUntil = '2025-10-31T19:21:25Z';
          const now = '2022-06-30T19:21:25Z';
          let error;
          try {
            vc._checkCredential({credential, now});
          } catch(e) {
            error = e;
          }
          should.not.exist(error,
            'Should not throw error when "validUntil" in the future');
        });
        it('should accept if now is between "validFrom" & "validUntil"', () => {
          const credential = mockCredential();
          credential.issuer = 'did:example:12345';
          credential.validFrom = '2022-05-30T19:21:25Z';
          credential.validUntil = '2025-05-30T19:21:25Z';
          const now = '2022-06-30T19:21:25Z';
          let error;
          try {
            vc._checkCredential({credential, now});
          } catch(e) {
            error = e;
          }
          should.not.exist(error,
            'Should NOT throw when now is between "validFrom" & "validUntil"');
        });
        it('should accept if "validFrom" & "validUntil" are the same time',
          () => {
            const credential = jsonld.clone(mockCredential);
            credential.issuer = 'did:example:12345';
            const now = '2022-06-30T19:21:25Z';
            credential.validFrom = now;
            credential.validUntil = now;
            let error;
            try {
              vc._checkCredential({credential, now});
            } catch(e) {
              error = e;
            }
            should.not.exist(error, 'Should NOT throw when now equals' +
            '"validFrom" & "validUntil"');
          });
        it('should reject if now is after "validFrom" & "validUntil"', () => {
          const credential = mockCredential();
          credential.issuer = 'did:example:12345';
          credential.validFrom = '2022-05-30T19:21:25Z';
          credential.validUntil = '2023-05-30T19:21:25Z';
          const now = '2024-06-30T19:21:25Z';
          let error;
          try {
            vc._checkCredential({credential, now});
          } catch(e) {
            error = e;
          }
          should.exist(error,
            'Should throw when now is after "validFrom" & "validUntil"');
        });
        it('should reject if now is before "validFrom" & "validUntil"', () => {
          const credential = mockCredential();
          credential.issuer = 'did:example:12345';
          credential.validFrom = '2024-05-30T19:21:25Z';
          credential.validUntil = '2025-05-30T19:21:25Z';
          const now = '2023-06-30T19:21:25Z';
          let error;
          try {
            vc._checkCredential({credential, now});
          } catch(e) {
            error = e;
          }
          should.exist(error,
            'Should throw when now is before "validFrom" & "validUntil"');
        });
      }
      it('should reject if "credentialSubject" is empty', () => {
        const credential = mockCredential();
        credential.credentialSubject = {};
        credential.issuer = 'did:example:12345';
        if(version === 1.0) {
          credential.issuanceDate = '2022-10-31T19:21:25Z';
        }
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
        const credential = mockCredential();
        credential.credentialSubject = [{}, {id: 'did:key:zFoo'}];
        credential.issuer = 'did:example:12345';
        if(version === 1.0) {
          credential.issuanceDate = '2022-10-31T19:21:25Z';
        }
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
        const credential = mockCredential();
        credential.credentialSubject = [
          {id: 'did:key:zFoo'},
          {name: 'did key'}
        ];
        credential.issuer = 'did:example:12345';
        if(version === 1.0) {
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
  const mockCredential = _mockCredential();
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
  challenge,
  unsigned = false,
  credentialsCount = 1,
  mockCredential,
  version
}) {
  const {didDocument, documentLoader: didLoader} = await _loadDid();
  testLoader.addLoader(didLoader);
  const credentials = [];

  // generate multiple credentials
  for(let i = 0; i < credentialsCount; i++) {
    const {credential} = await _generateCredential(mockCredential);
    credentials.push(credential);
  }

  const {
    documentLoader: dlc,
    suite: vcSuite} = await _generateCredential(mockCredential);
  testLoader.addLoader(dlc);

  const presentation = vc.createPresentation({
    verifiableCredential: credentials,
    version
  });

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

  return {
    presentation: vp,
    suite: [vcSuite, vpSuite],
    documentLoader: testLoader.documentLoader.bind(testLoader)
  };
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
