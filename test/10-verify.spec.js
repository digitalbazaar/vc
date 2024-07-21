/*!
 * Copyright (c) 2019-2024 Digital Bazaar, Inc. All rights reserved.
 */
import * as vc from '../lib/index.js';
import {assertionController} from './mocks/assertionController.js';
import chai from 'chai';
import {DataIntegrityProof} from '@digitalbazaar/data-integrity';
import {documentLoader} from './testDocumentLoader.js';
import {generateCredential} from './helpers.js';
import {invalidContexts} from './contexts/index.js';
import {setupSuites} from './mocks/suites.js';
import {v4 as uuid} from 'uuid';
import {versionedCredentials} from './mocks/credential.js';

const should = chai.should();
const suites = await setupSuites();

// run tests for each suite type
for(const [suiteName, suiteOptions] of suites) {
  // run tests on each version of VCs
  for(const [version, credentialFactory] of versionedCredentials) {
    _runSuite({
      credentialFactory, suiteName, version, ...suiteOptions
    });
  }
}

function _runSuite({
  derived, Suite,
  suiteName, issuer,
  keyPair, keyType,
  suite, version,
  credentialFactory, cryptosuite
}) {
  const title = `VC ${version.toFixed(1)} Suite ${suiteName} ` +
    `KeyType ${keyType}`;
  const generateDefaults = {
    credentialFactory,
    suite,
    issuer
  };
  describe(title, async function() {
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
      if(derived === true) {
        it('should not verify a base vc', async function() {
          const verifiableCredential = await vc.issue({
            credential: credentialFactory(),
            suite: new Suite({
              signer: keyPair.signer(),
              cryptosuite: cryptosuite.createSignCryptosuite({
                mandatoryPointers: ['/issuer']
              })
            }),
            documentLoader
          });
          const result = await vc.verifyCredential({
            credential: verifiableCredential,
            controller: assertionController,
            suite: new Suite({
              cryptosuite: cryptosuite.createVerifyCryptosuite()
            }),
            documentLoader
          });
          should.exist(
            result.error,
            'Expected verification to fail for base proof.');
          // it might be a bit much to expect every library to return a
          // uniform error for this
          result.verified.should.be.false;
        });
        it('should verify a derived vc', async () => {
          const {
            createDiscloseCryptosuite,
            createSignCryptosuite,
            createVerifyCryptosuite
          } = cryptosuite;
          const proofId = `urn:uuid:${uuid()}`;
          const mandatoryPointers = (version === 1.0) ?
            ['/issuer', '/issuanceDate'] : ['/issuer'];
          // setup ecdsa-sd-2023 suite for signing selective disclosure VCs
          const sdSignSuite = new DataIntegrityProof({
            signer: keyPair.signer(), cryptosuite: createSignCryptosuite({
              mandatoryPointers
            })
          });
          sdSignSuite.proof = {id: proofId};
          // setup ecdsa-sd-2023 suite for deriving selective disclosure VCs
          const sdDeriveSuite = new DataIntegrityProof({
            cryptosuite: createDiscloseCryptosuite({
              proofId,
              selectivePointers: [
                '/credentialSubject'
              ]
            })
          });
          // setup ecdsa-sd-2023 suite for verifying selective disclosure VCs
          const sdVerifySuite = new DataIntegrityProof({
            cryptosuite: createVerifyCryptosuite()
          });

          const verifiableCredential = await vc.issue({
            credential: credentialFactory(),
            suite: sdSignSuite,
            documentLoader
          });
          const derivedCredential = await vc.derive({
            verifiableCredential,
            suite: sdDeriveSuite,
            documentLoader
          });
          const result = await vc.verifyCredential({
            credential: derivedCredential,
            controller: assertionController,
            suite: sdVerifySuite,
            documentLoader
          });

          if(result.error) {
            throw result.error;
          }
          result.verified.should.be.true;
        });
      }

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
          const {credential} = await generateCredential(generateDefaults);
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
          const {credential} = await generateCredential(generateDefaults);
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
          const {credential} = await generateCredential(generateDefaults);
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
          const {credential} = await generateCredential(generateDefaults);
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
          const {credential} = await generateCredential(generateDefaults);
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
          const {credential} = await generateCredential(generateDefaults);
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
          const {credential} = await generateCredential(generateDefaults);
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
        if(derived === true) {
          it('should fail to verify a changed derived vc', async () => {
            const {
              createDiscloseCryptosuite,
              createSignCryptosuite,
              createVerifyCryptosuite
            } = cryptosuite;
            const proofId = `urn:uuid:${uuid()}`;
            const mandatoryPointers = (version === 1.0) ?
              ['/issuer', '/issuanceDate'] : ['/issuer'];
            // setup ecdsa-sd-2023 suite for signing selective disclosure VCs
            const sdSignSuite = new DataIntegrityProof({
              signer: keyPair.signer(),
              cryptosuite: createSignCryptosuite({
                mandatoryPointers
              })
            });
            sdSignSuite.proof = {id: proofId};
            // setup ecdsa-sd-2023 suite for deriving selective disclosure VCs
            const sdDeriveSuite = new DataIntegrityProof({
              cryptosuite: createDiscloseCryptosuite({
                proofId,
                selectivePointers: [
                  '/credentialSubject'
                ]
              })
            });
            // setup ecdsa-sd-2023 suite for verifying selective disclosure VCs
            const sdVerifySuite = new DataIntegrityProof({
              cryptosuite: createVerifyCryptosuite()
            });

            const verifiableCredential = await vc.issue({
              credential: credentialFactory(),
              suite: sdSignSuite,
              documentLoader
            });
            const derivedCredential = await vc.derive({
              verifiableCredential,
              suite: sdDeriveSuite,
              documentLoader
            });
            derivedCredential.credentialSubject.id = `urn:uuid:${uuid()}`;
            const result = await vc.verifyCredential({
              credential: derivedCredential,
              controller: assertionController,
              suite: sdVerifySuite,
              documentLoader
            });
            result.verified.should.be.a('boolean');
            result.verified.should.be.false;
          });

        }
      });
    });
  });
}
