/*!
 * Copyright (c) 2019-2024 Digital Bazaar, Inc. All rights reserved.
 */
import * as vc from '../lib/index.js';
import chai from 'chai';
import {documentLoader} from './testDocumentLoader.js';
import {setupKeyPairs} from './mocks/keyPairs.js';
import {v4 as uuid} from 'uuid';
import {versionedCredentials} from './mocks/credential.js';

const keyPairs = await setupKeyPairs();
chai.should();

// run tests for each keyPair type
for(const [keyType, {suite, keyPair}] of keyPairs) {
  // run tests on each version of VCs
  for(const [version, mockCredential] of versionedCredentials) {
    _runSuite({keyType, suite, keyPair, version, mockCredential});
  }
}

for(const [version, mockCredential] of versionedCredentials) {
  describe(`VC ${version}`, function() {
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
  });
}

function _runSuite({keyType, suite, version, mockCredential}) {
  describe(`VC ${version} keyType ${keyType}`, function() {
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
  });
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

