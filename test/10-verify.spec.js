/*!
 * Copyright (c) 2019-2024 Digital Bazaar, Inc. All rights reserved.
 */
import * as vc from '../lib/index.js';
import {
  documentLoader,
  testLoader
} from './testDocumentLoader.js';
import {assertionController} from './mocks/assertionController.js';
import chai from 'chai';
import {CredentialIssuancePurpose} from '../lib/CredentialIssuancePurpose.js';
import {invalidContexts} from './contexts/index.js';
import jsigs from 'jsonld-signatures';
import {setupKeyPairs} from './mocks/keyPairs.js';
import {v4 as uuid} from 'uuid';
import {versionedCredentials} from './mocks/credential.js';

chai.should();
const keyPairs = await setupKeyPairs();

// run tests for each keyPair type
for(const [keyType, {suite, keyPair, cryptosuite}] of keyPairs) {
  // run tests on each version of VCs
  for(const [version, credentialFactory] of versionedCredentials) {
    _runSuite({
      keyType, suite,
      keyPair, version,
      credentialFactory, cryptosuite
    });
  }
}

function _runSuite({
  cryptosuite, keyType,
  suite, version,
  keyPair, credentialFactory
}) {
  const issuer = keyPair.id;
  describe(`VC ${version} keyType ${keyType}`, async function() {
    describe('verify API (credentials)', () => {
      it('should verify a vc', async () => {
        const verifiableCredential = await vc.issue({
          credential: credentialFactory(),
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
          credential: credentialFactory(),
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

        const credential = credentialFactory();
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
        const credential = credentialFactory();
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
          const {credential} = await _generateCredential({
            credentialFactory,
            suite,
            issuer
          });
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
          const {credential} = await _generateCredential(credentialFactory);
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
          const {credential, suite} = await _generateCredential(credentialFactory);
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
          const {credential, suite} = await _generateCredential(credentialFactory);
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
          const {credential, suite} = await _generateCredential(credentialFactory);
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
          const {credential, suite} = await _generateCredential(credentialFactory);
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
          const {credential, suite} = await _generateCredential(credentialFactory);
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
            const credential = credentialFactory();
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
          const credential = credentialFactory();
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
            credential: credentialFactory(),
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
        it('should fail to verify a changed derived vc', async () => {
          const {
            createDiscloseCryptosuite,
            createSignCryptosuite,
            createVerifyCryptosuite
          } = cryptosuite;
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
            credential: credentialFactory(),
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
  });
}

async function _generateCredential({credentialFactory, suite, issuer}) {
  const credentialFactory = credentialFactory();
  mockCredential.issuer = issuer;
  mockCredential.id = `http://example.edu/credentials/${uuid()}`;
  const credential = await jsigs.sign(mockCredential, {
    compactProof: false,
    documentLoader: testLoader.documentLoader.bind(testLoader),
    suite,
    purpose: new CredentialIssuancePurpose()
  });
  return {credential};
}
