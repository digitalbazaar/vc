/*!
 * Copyright (c) 2019-2024 Digital Bazaar, Inc. All rights reserved.
 */
import * as vc from '../lib/index.js';
import {assertionController} from './mocks/assertionController.js';
import chai from 'chai';
import {documentLoader} from './testDocumentLoader.js';
import {invalidContexts} from './contexts/index.js';
import {setupSuites} from './mocks/suites.js';
import {signCredential} from './helpers.js';
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
  derived, suites,
  suiteName, keyDoc,
  keyType, version,
  credentialFactory
}) {
  const title = `VC ${version} Suite ${suiteName} KeyType ${keyType}`;
  const mandatoryPointers = (version === '1.0') ?
    ['/issuer', '/issuanceDate'] : ['/issuer'];
  const selectivePointers = ['/credentialSubject'];
  const generateDefaults = {
    suites,
    issuer: keyDoc.controller,
    mandatoryPointers,
    selectivePointers,
    derived
  };
  const verifySuite = suites.verify();
  const issuerSuite = suites.issue({mandatoryPointers});
  describe(title, async function() {
    describe('verify API (credentials)', () => {
      it('should verify a vc', async () => {
        const {verifiableCredential} = await signCredential({
          credential: credentialFactory(),
          suites,
          issuer: keyDoc.controller,
          mandatoryPointers,
          selectivePointers,
          derived
        });
        const result = await vc.verifyCredential({
          credential: verifiableCredential,
          controller: assertionController,
          suite: verifySuite,
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
            suite: issuerSuite,
            documentLoader
          });
          const result = await vc.verifyCredential({
            credential: verifiableCredential,
            controller: assertionController,
            suite: verifySuite,
            documentLoader
          });
          should.exist(
            result.error,
            'Expected verification to fail for base proof.');
          // it might be a bit much to expect every library to return a
          // uniform error for this
          result.verified.should.be.false;
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
        const verifiableCredential = await signCredential({
          credential,
          suites,
          issuer: keyDoc.controller,
          mandatoryPointers,
          derived
        });
        const result = await vc.verifyCredential({
          credential: verifiableCredential,
          controller: assertionController,
          suite: verifySuite,
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
          const {verifiableCredential} = await signCredential({
            credential: credentialFactory(),
            ...generateDefaults
          });
          //FIXME this should be handled with 2 different document loaders
          //one with the context resolving to a valid context and the
          //other with a context resolving to null
          verifiableCredential['@context'].push(invalidContexts.nullDoc.url);
          const results = await vc.verifyCredential({
            suite: verifySuite,
            credential: verifiableCredential,
            documentLoader
          });
          results.verified.should.be.a('boolean');
          results.verified.should.be.false;
        });
        it('fails to verify if a context contains an invalid id', async () => {
          const {verifiableCredential} = await signCredential({
            credential: credentialFactory(),
            ...generateDefaults
          });
          //FIXME this should be handled with 2 different document loaders
          verifiableCredential['@context'].push(invalidContexts.invalidId.url);
          const results = await vc.verifyCredential({
            suite: verifySuite,
            credential: verifiableCredential,
            documentLoader
          });
          results.verified.should.be.a('boolean');
          results.verified.should.be.false;
        });
        it('fails to verify if a context has a null version', async () => {
          const {verifiableCredential} = await signCredential({
            credential: credentialFactory(),
            ...generateDefaults
          });
          //FIXME this should be handled with 2 different document loaders
          verifiableCredential['@context'].push(
            invalidContexts.nullVersion.url);
          const results = await vc.verifyCredential({
            suite: verifySuite,
            credential: verifiableCredential,
            documentLoader
          });
          results.verified.should.be.a('boolean');
          results.verified.should.be.false;
        });
        it('fails to verify if a context has a null @id', async () => {
          const {verifiableCredential} = await signCredential({
            credential: credentialFactory(),
            ...generateDefaults
          });
          //FIXME this should be handled with 2 different document loaders
          verifiableCredential['@context'].push(invalidContexts.nullId.url);
          const results = await vc.verifyCredential({
            suite: verifySuite,
            credential: verifiableCredential,
            documentLoader
          });
          results.verified.should.be.a('boolean');
          results.verified.should.be.false;
        });
        it('fails to verify if a context has a null @type', async () => {
          const {verifiableCredential} = await signCredential({
            credential: credentialFactory(),
            ...generateDefaults
          });
          //FIXME this should be handled with 2 different document loaders
          verifiableCredential['@context'].push(invalidContexts.nullType.url);
          const results = await vc.verifyCredential({
            suite: verifySuite,
            credential: verifiableCredential,
            documentLoader
          });
          results.verified.should.be.a('boolean');
          results.verified.should.be.false;
        });
        it('fails to verify if a context links to a missing doc', async () => {
          const {verifiableCredential} = await signCredential({
            credential: credentialFactory(),
            ...generateDefaults
          });
          //FIXME this should be handled with 2 different document loaders
          verifiableCredential['@context'].push('https://fsad.digitalbazaar.com');
          const results = await vc.verifyCredential({
            suite: verifySuite,
            credential: verifiableCredential,
            documentLoader
          });
          results.verified.should.be.a('boolean');
          results.verified.should.be.false;
        });
        it('fails to verify if a context has an invalid url', async () => {
          const {verifiableCredential} = await signCredential({
            credential: credentialFactory(),
            ...generateDefaults
          });
          verifiableCredential['@context'].push('htps://fsad.digitalbazaar.');
          const results = await vc.verifyCredential({
            suite: verifySuite,
            credential: verifiableCredential,
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
              suite: issuerSuite,
              documentLoader
            });
            const result = await vc.verifyCredential({
              credential: verifiableCredential,
              controller: assertionController,
              suite: verifySuite,
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
            suite: issuerSuite,
            documentLoader
          });
          const result = await vc.verifyCredential({
            credential: verifiableCredential,
            controller: assertionController,
            suite: verifySuite,
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
            const proofId = `urn:uuid:${uuid()}`;
            // setup ecdsa-sd-2023 suite for signing selective disclosure VCs
            const sdSignSuite = suites.issue({mandatoryPointers});
            sdSignSuite.proof = {id: proofId};
            // setup ecdsa-sd-2023 suite for deriving selective disclosure VCs
            const sdDeriveSuite = suites.derive(
              {selectivePointers: ['/credentialSubject']});
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
              suite: verifySuite,
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
