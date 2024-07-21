/*!
 * Copyright (c) 2019-2024 Digital Bazaar, Inc. All rights reserved.
 */
import * as vc from '../lib/index.js';
import chai from 'chai';
import {createSkewedTimeStamp} from './helpers.js';
import {versionedCredentials} from './mocks/credential.js';

const should = chai.should();

for(const [version, mockCredential] of versionedCredentials) {
  _runSuite({version, mockCredential});
}

function _runSuite({mockCredential, version}) {
  describe(`VC ${version}`, function() {
    describe('_checkCredential', function() {
      it('should reject a credentialSubject.id that is not a URI', () => {
        const credential = mockCredential();
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
        const credential = mockCredential();
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

      it('should reject credentialStatus id that is not a URI', () => {
        const credential = mockCredential();
        credential.credentialStatus = {
          id: 'not-a-url',
          type: 'urn:type'
        };
        let error;
        try {
          vc._checkCredential({credential});
        } catch(e) {
          error = e;
        }
        should.exist(error,
          'Should throw error when "credentialStatus.id" is not a URI');
        error.should.be.instanceof(TypeError);
        error.message.should
          .contain('"credentialStatus.id" must be a URI');
      });

      it('should accept "credentialStatus" with no "id"', () => {
        const credential = mockCredential();
        credential.credentialStatus = {
          type: 'urn:type'
        };
        let error;
        try {
          vc._checkCredential({credential});
        } catch(e) {
          error = e;
        }
        should.not.exist(error,
          'Should not throw error when "credentialStatus.id" is absent');
      });

      it('should reject an evidence id that is not a URI', () => {
        const credential = mockCredential();
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

      if(version === '1.0') {
        it('should reject if "expirationDate" has passed', () => {
          const credential = mockCredential();
          credential.issuer = 'did:example:12345';
          // set expirationDate to an expired date.
          credential.expirationDate = '2020-05-31T19:21:25Z';
          let error;
          try {
            vc._checkCredential({credential, mode: 'verify'});
          } catch(e) {
            error = e;
          }
          should.exist(error,
            'Should throw error when "expirationDate" has passed');
          error.message.should
            .contain('Credential has expired.');
        });
        it('should reject if "now" is before "issuanceDate"', () => {
          const credential = mockCredential();
          credential.issuer = 'did:example:12345';
          credential.issuanceDate = createSkewedTimeStamp({skewYear: 1});
          const now = new Date();
          let error;
          try {
            vc._checkCredential({credential, now});
          } catch(e) {
            error = e;
          }
          should.exist(error,
            'Should throw error when "now" is before "issuanceDate"');
          error.message.should.contain(
            `The current date time (${now.toISOString()}) is before the ` +
              `"issuanceDate" (${credential.issuanceDate}).`);
        });
      }
      if(version === '2.0') {
        it('should reject "validFrom" in the future', () => {
          const credential = mockCredential();
          credential.issuer = 'did:example:12345';
          credential.validFrom = createSkewedTimeStamp({skewYear: 1});
          const now = new Date();
          let error;
          try {
            vc._checkCredential({credential, now});
          } catch(e) {
            error = e;
          }
          should.exist(error,
            'Should throw error when "validFrom" in future');
          error.message.should.contain(
            `The current date time (${now.toISOString()}) is before ` +
              `"validFrom" (${credential.validFrom})`);
        });
        it('should accept "validFrom" in the past', () => {
          const credential = mockCredential();
          credential.issuer = 'did:example:12345';
          credential.validFrom = createSkewedTimeStamp({skewYear: -1});
          let error;
          try {
            vc._checkCredential({credential});
          } catch(e) {
            error = e;
          }
          should.not.exist(error,
            'Should not throw error when "validFrom" in past');
        });
        it('should reject "validUntil" in the past', () => {
          const credential = mockCredential();
          credential.issuer = 'did:example:12345';
          credential.validUntil = createSkewedTimeStamp({skewYear: -1});
          const now = new Date();
          let error;
          try {
            vc._checkCredential({credential, now});
          } catch(e) {
            error = e;
          }
          should.exist(error,
            'Should throw error when "validUntil" in the past');
          error.message.should.contain(
            `The current date time (${now.toISOString()}) is after ` +
              `"validUntil" (${credential.validUntil})`);
        });
        it('should accept "validUntil" in the future', () => {
          const credential = mockCredential();
          credential.issuer = 'did:example:12345';
          credential.validUntil = createSkewedTimeStamp({skewYear: 1});
          let error;
          try {
            vc._checkCredential({credential});
          } catch(e) {
            error = e;
          }
          should.not.exist(error,
            'Should not throw error when "validUntil" in the future');
        });
        it('should accept if now is between "validFrom" & "validUntil"', () => {
          const credential = mockCredential();
          credential.issuer = 'did:example:12345';
          credential.validFrom = createSkewedTimeStamp({skewYear: -1});
          credential.validUntil = createSkewedTimeStamp({skewYear: 1});
          let error;
          try {
            vc._checkCredential({credential});
          } catch(e) {
            error = e;
          }
          should.not.exist(error,
            'Should NOT throw when now is between "validFrom" & "validUntil"');
        });
        it('should accept if "validFrom" & "validUntil" are the same time',
          () => {
            const credential = mockCredential();
            credential.issuer = 'did:example:12345';
            const now = createSkewedTimeStamp({skewYear: 0});
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
          credential.validFrom = createSkewedTimeStamp({skewYear: -2});
          credential.validUntil = createSkewedTimeStamp({skewYear: -1});
          const now = new Date();
          let error;
          try {
            vc._checkCredential({credential, now});
          } catch(e) {
            error = e;
          }
          should.exist(error,
            'Should throw when now is after "validFrom" & "validUntil"');
          error.message.should.contain(
            `The current date time (${now.toISOString()}) is after ` +
              `"validUntil" (${credential.validUntil}).`);
        });
        it('should reject if now is before "validFrom" & "validUntil"', () => {
          const credential = mockCredential();
          credential.issuer = 'did:example:12345';
          credential.validFrom = createSkewedTimeStamp({skewYear: 1});
          credential.validUntil = createSkewedTimeStamp({skewYear: 2});
          const now = new Date();
          let error;
          try {
            vc._checkCredential({credential});
          } catch(e) {
            error = e;
          }
          should.exist(error,
            'Should throw when now is before "validFrom" & "validUntil"');
          error.message.should.contain(
            `The current date time (${now.toISOString()}) is before ` +
              `"validFrom" (${credential.validFrom}).`
          );
        });
      }
      it('should reject if "credentialSubject" is empty', () => {
        const credential = mockCredential();
        credential.credentialSubject = {};
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
        should.exist(error,
          'Should throw error when "credentialSubject" is empty.');
        error.message.should.contain(
          '"credentialSubject" must make a claim.');
      });
      it('should reject if a "credentialSubject" is empty', () => {
        const credential = mockCredential();
        credential.credentialSubject = [{}, {id: 'did:key:zFoo'}];
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

