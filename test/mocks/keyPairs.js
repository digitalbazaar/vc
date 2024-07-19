/*!
 * Copyright (c) 2019-2024 Digital Bazaar, Inc. All rights reserved.
 */
import * as bbs2023Cryptosuite from '@digitalbazaar/bbs-2023-cryptosuite';
import * as Bls12381Multikey from '@digitalbazaar/bls12-381-multikey';
import * as EcdsaMultikey from '@digitalbazaar/ecdsa-multikey';
import * as ecdsaRdfc2019Cryptosuite from
  '@digitalbazaar/ecdsa-rdfc-2019-cryptosuite';
import * as ecdsaSd2023Cryptosuite from
  '@digitalbazaar/ecdsa-sd-2023-cryptosuite';
import * as EddsaMultikey from '@digitalbazaar/ed25519-multikey';
import * as eddsaRdfc2020Cryptosuite from
  '@digitalbazaar/eddsa-rdfc-2022-cryptosuite';
import {assertionController} from './assertionController.js';
import {DataIntegrityProof} from '@digitalbazaar/data-integrity';
import {Ed25519Signature2018} from '@digitalbazaar/ed25519-signature-2018';
import {
  Ed25519VerificationKey2018
} from '@digitalbazaar/ed25519-verification-key-2018';
import {remoteDocuments} from '../testDocumentLoader.js';

export async function setupKeyPairs() {
  return new Map([
    ['Ed25519VerificationKey2018', await ed25519KeyPair()],
    ['ecdsa-rdfc-2019', await ecdsaRdfc2019()],
    ['ecdsa-sd-2023', await ecdsaP256KeyPair()],
    ['eddsa-rdfc-2022', await eddsaRdfc2022()],
    ['bbs-2023', await bbs2023()]
  ]);
}

async function eddsaRdfc2022() {
  const keyId = 'https://example.edu/issuers/keys/5';
  // set up the ECDSA key pair that will be signing and verifying
  const keyPair = await EddsaMultikey.generate({
    id: keyId,
    controller: 'https://example.edu/issuers/565049'
  });
  const keyDoc = await keyPair.export({publicKey: true});
  registerKey({keyDoc});
  return {
    keyPair,
    cryptosuite: eddsaRdfc2020Cryptosuite,
    Suite: DataIntegrityProof,
    derived: false
  };
}

async function ecdsaRdfc2019() {
  // set up the ECDSA key pair that will be signing and verifying
  const keyPair = await EcdsaMultikey.generate({
    curve: 'P-256',
    id: 'https://example.edu/issuers/keys/4',
    controller: 'https://example.edu/issuers/565049'
  });
  const keyDoc = await keyPair.export({publicKey: true});
  registerKey({keyDoc});
  return {
    keyPair,
    cryptosuite: ecdsaRdfc2019Cryptosuite,
    Suite: DataIntegrityProof,
    derived: false
  };
}

// do ecdsa setup...
async function ecdsaP256KeyPair() {
  // set up the ECDSA key pair that will be signing and verifying
  const keyPair = await EcdsaMultikey.generate({
    curve: 'P-256',
    id: 'https://example.edu/issuers/keys/3',
    controller: 'https://example.edu/issuers/565049'
  });
  const keyDoc = await keyPair.export({publicKey: true});
  registerKey({keyDoc});
  return {
    keyPair,
    cryptosuite: ecdsaSd2023Cryptosuite,
    Suite: DataIntegrityProof,
    derived: false
  };
}

// do BBS setup...
async function bbs2023() {
  // set up the BBS key pair that will be signing and verifying
  const keyPair = await Bls12381Multikey.generateBbsKeyPair({
    algorithm: 'BBS-BLS12-381-SHA-256',
    id: 'https://example.edu/issuers/keys/2',
    controller: 'https://example.edu/issuers/565049'
  });
  const keyDoc = keyPair.export({publicKey: true});
  registerKey({keyDoc});
  return {
    keyDoc,
    keyPair,
    cryptosuite: bbs2023Cryptosuite,
    derived: true,
    Suite: DataIntegrityProof
  };
}

async function ed25519KeyPair() {
  // set up the Ed25519 key pair that will be signing and verifying
  const keyPair = await Ed25519VerificationKey2018.generate({
    id: 'https://example.edu/issuers/keys/1',
    controller: 'https://example.edu/issuers/565049'
  });

  // also add the key for authentication (VP) purposes
  // FIXME: this shortcut to reuse the same key and sign VPs as issuer can
  // confuse developers trying to learn from the test suite and it should
  // be changed
  assertionController.authentication.push(keyPair.id);
  // register the controller document and the key document with documentLoader
  remoteDocuments.set(
    'https://example.edu/issuers/565049', assertionController);
  const keyDoc = await keyPair.export({publicKey: true});
  registerKey({keyDoc});
  const suite = new Ed25519Signature2018({
    verificationMethod: 'https://example.edu/issuers/keys/1',
    key: keyPair
  });
  return {
    keyDoc,
    keyPair,
    suite,
    cryptosuite: Ed25519Signature2018,
    Suite: Ed25519Signature2018,
    derived: false
  };
}

function registerKey({keyDoc}) {
  // add the key to the controller doc (authorizes its use for assertion)
  assertionController.assertionMethod.push(keyDoc.id);
  // register the key document with documentLoader
  remoteDocuments.set(keyDoc.id, keyDoc);
}
