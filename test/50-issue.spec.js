/*!
 * Copyright (c) 2019-2024 Digital Bazaar, Inc. All rights reserved.
 */
import * as vc from '../lib/index.js';
import {createSkewedTimeStamp, issueCredential} from './helpers.js';
import chai from 'chai';
import {documentLoader} from './testDocumentLoader.js';
import {setupSuites} from './mocks/suites.js';
import {v4 as uuid} from 'uuid';
import {versionedCredentials} from './mocks/credential.js';

const should = chai.should();
const suites = await setupSuites();

// run tests for each keyPair type
for(const [suiteName, suiteOptions] of suites) {
  // run tests on each version of VCs
  for(const [version, mockCredential] of versionedCredentials) {
    _runSuite({...suiteOptions, suiteName, version, mockCredential});
  }
}

function _runSuite({
  version,
  keyDoc,
  keyType,
  suiteName,
  suites,
  mockCredential,
  derived
}) {
  const mandatoryPointers = (version === '1.0') ?
    ['/issuer', '/issuanceDate'] : ['/issuer'];
  const selectivePointers = ['/credentialSubject'];
  const title = `VC ${version} Suite ${suiteName} KeyType ${keyType}`;

  describe(title, function() {
    describe('vc.issue()', function() {
      it('should issue a verifiable credential with proof', async () => {
        const credential = mockCredential();
        const {verifiableCredential} = await issueCredential({
          credential,
          derived,
          suites,
          mandatoryPointers,
          selectivePointers,
          issuer: keyDoc.controller,
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
        const {verifiableCredential} = await issueCredential({
          credential,
          derived,
          suites,
          mandatoryPointers,
          selectivePointers,
          issuer: keyDoc.controller,
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
      if(version === '1.0') {
        it('should issue an expired verifiable credential', async () => {
          const credential = mockCredential();
          credential.id = `urn:uuid:${uuid()}`;
          credential.expirationDate = '2020-05-31T19:21:25Z';
          const verifiableCredential = await issueCredential({
            credential,
            suites,
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
          const {verifiableCredential} = await issueCredential({
            credential,
            derived,
            suites,
            mandatoryPointers,
            selectivePointers,
            issuer: keyDoc.controller,
            documentLoader
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
      if(version === '2.0') {
        it('should issue "validUntil" in the future', async () => {
          const credential = mockCredential();
          credential.issuer = 'did:example:12345';
          // set validUntil one year in the future
          credential.validUntil = createSkewedTimeStamp({skewYear: 1});
          let error;
          let verifiableCredential;
          try {
            ({verifiableCredential} = await issueCredential({
              credential,
              derived,
              suites,
              mandatoryPointers,
              selectivePointers,
              issuer: keyDoc.controller,
              documentLoader
            }));
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
          // set validUntil one year in the past
          credential.validUntil = createSkewedTimeStamp({skewYear: -1});
          let error;
          let verifiableCredential;
          try {
            ({verifiableCredential} = await issueCredential({
              credential,
              derived,
              suites,
              mandatoryPointers,
              selectivePointers,
              issuer: keyDoc.controller,
              documentLoader
            }));
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
          credential.validFrom = createSkewedTimeStamp({skewYear: -1});
          let error;
          let verifiableCredential;
          try {
            ({verifiableCredential} = await issueCredential({
              credential,
              derived,
              suites,
              mandatoryPointers,
              selectivePointers,
              issuer: keyDoc.controller,
              documentLoader
            }));
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
          credential.validFrom = createSkewedTimeStamp({skewYear: 1});
          let error;
          let verifiableCredential;
          try {
            ({verifiableCredential} = await issueCredential({
              credential,
              derived,
              suites,
              mandatoryPointers,
              selectivePointers,
              issuer: keyDoc.controller,
              documentLoader
            }));
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
          credential.validFrom = createSkewedTimeStamp({skewYear: -1});
          credential.validUntil = createSkewedTimeStamp({skewYear: 1});
          let error;
          let verifiableCredential;
          try {
            ({verifiableCredential} = await issueCredential({
              credential,
              derived,
              suites,
              mandatoryPointers,
              selectivePointers,
              issuer: keyDoc.controller,
              documentLoader
            }));
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
          // ensure validFrom & validUntil are present
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
  });
}

