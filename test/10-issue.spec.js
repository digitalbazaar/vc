/*!
 * Copyright (c) 2019-2024 Digital Bazaar, Inc. All rights reserved.
 */
import * as Bls12381Multikey from '@digitalbazaar/bls12-381-multikey';
import * as EcdsaMultikey from '@digitalbazaar/ecdsa-multikey';
import * as vc from '../lib/index.js';
import {
  documentLoader,
  remoteDocuments,
} from './testDocumentLoader.js';
import {assertionController} from './mocks/assertionController.js';
import chai from 'chai';
import {createSkewedTimeStamp} from './helpers.js';
import {credentials} from './mocks/mock.data.js';
import {Ed25519Signature2018} from '@digitalbazaar/ed25519-signature-2018';
import {
  Ed25519VerificationKey2018
} from '@digitalbazaar/ed25519-verification-key-2018';
import {v4 as uuid} from 'uuid';
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
          // set validUntil one year in the future
          credential.validUntil = createSkewedTimeStamp({skewYear: 1});
          let error;
          let verifiableCredential;
          try {
            verifiableCredential = await vc.issue({
              credential,
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
          // set validUntil one year in the past
          credential.validUntil = createSkewedTimeStamp({skewYear: -1});
          let error;
          let verifiableCredential;
          try {
            verifiableCredential = await vc.issue({
              credential,
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
          credential.validFrom = createSkewedTimeStamp({skewYear: -1});
          let error;
          let verifiableCredential;
          try {
            verifiableCredential = await vc.issue({
              credential,
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
          credential.validFrom = createSkewedTimeStamp({skewYear: 1});
          let error;
          let verifiableCredential;
          try {
            verifiableCredential = await vc.issue({
              credential,
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
          credential.validFrom = createSkewedTimeStamp({skewYear: -1});
          credential.validUntil = createSkewedTimeStamp({skewYear: 1});
          let error;
          let verifiableCredential;
          try {
            verifiableCredential = await vc.issue({
              credential,
              suite,
              documentLoader
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
        it('should issue a VC with multiple languages', async function() {
          const credential = structuredClone(
            credentials.features.multiple.languages);
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
        it('should issue a VC with multiple languages & directions',
          async function() {
            const credential = structuredClone(
              credentials.features.multiple.directions);
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
        it('should issue a VC with a single language', async function() {
          const credential = structuredClone(
            credentials.features.single.language);
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
        it('should issue a VC with a single language & direction',
          async function() {
            const credential = structuredClone(
              credentials.features.single.direction);
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
      }
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
  });
}
