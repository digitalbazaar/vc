/*!
 * Copyright (c) 2019-2024 Digital Bazaar, Inc. All rights reserved.
 */
import * as bbs2023Cryptosuite from '@digitalbazaar/bbs-2023-cryptosuite';
import * as Bls12381Multikey from '@digitalbazaar/bls12-381-multikey';
import * as EcdsaMultikey from '@digitalbazaar/ecdsa-multikey';
import * as ecdsaSd2023Cryptosuite from
  '@digitalbazaar/ecdsa-sd-2023-cryptosuite';
import {assertionController} from './mocks/assertionController.js';
import {DataIntegrityProof} from '@digitalbazaar/data-integrity';
import {Ed25519Signature2018} from '@digitalbazaar/ed25519-signature-2018';
import {
  Ed25519VerificationKey2018
} from '@digitalbazaar/ed25519-verification-key-2018';
import {remoteDocuments} from '../testDocumentLoader.js';

export async function setupKeyPairs() {
  return new Map([
    ['Ed25519VerificationKey2018', await ed25519KeyPair()],
    ['EcdsaP256KeyPair', await ecdsaP256KeyPair()],
    ['bbs-2023', await bbsKeyPair()]
  ]);
}

async function ed25519KeyPair() {
  // set up the Ed25519 key pair that will be signing and verifying
  const keyPair = await Ed25519VerificationKey2018.generate({
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
  return {
    keyPair,
    suite,
    derived: false
  };
}

// do ecdsa setup...
async function ecdsaP256KeyPair() {
  // set up the ECDSA key pair that will be signing and verifying
  const keyPair = await EcdsaMultikey.generate({
    curve: 'P-256',
    id: 'https://example.edu/issuers/keys/2',
    controller: 'https://example.edu/issuers/565049'
  });

  // add the key to the controller doc (authorizes its use for assertion)
  assertionController.assertionMethod.push(keyPair.id);
  // register the key document with documentLoader
  remoteDocuments.set(
    'https://example.edu/issuers/keys/2',
    await keyPair.export({publicKey: true}));
  return {
    keyPair
  };
}

// do BBS setup...
async function bbsKeyPair() {
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
}
