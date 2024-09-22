/*!
 * Copyright (c) 2019-2024 Digital Bazaar, Inc. All rights reserved.
 */
import * as bbs2023Cryptosuite from '@digitalbazaar/bbs-2023-cryptosuite';
import * as Bls12381Multikey from '@digitalbazaar/bls12-381-multikey';
import * as EcdsaMultikey from '@digitalbazaar/ecdsa-multikey';
import * as ecdsaSd2023Cryptosuite from
  '@digitalbazaar/ecdsa-sd-2023-cryptosuite';
import * as EddsaMultikey from '@digitalbazaar/ed25519-multikey';
import {createDiSuites, createSdSuites} from '../helpers.js';
import {assertionController} from './assertionController.js';
import {cryptosuite as ecdsaRdfc2019Cryptosuite} from
  '@digitalbazaar/ecdsa-rdfc-2019-cryptosuite';
import {Ed25519Signature2018} from '@digitalbazaar/ed25519-signature-2018';
import {
  Ed25519VerificationKey2018
} from '@digitalbazaar/ed25519-verification-key-2018';
import {cryptosuite as eddsaRdfc2020Cryptosuite} from
  '@digitalbazaar/eddsa-rdfc-2022-cryptosuite';
import {remoteDocuments} from '../testDocumentLoader.js';

export async function setupSuites() {
  return new Map([
    ['Ed25519Signature2018', await ed25519Sig2018()],
    ['ecdsa-rdfc-2019', await ecdsaRdfc2019()],
    ['ecdsa-sd-2023', await ecdsaSd2023()],
    ['eddsa-rdfc-2022', await eddsaRdfc2022()],
    ['bbs-2023', await bbs2023()]
  ]);
}

async function eddsaRdfc2022() {
  // set up the EDDSA key pair that will be signing and verifying
  const keyPair = await EddsaMultikey.generate({
    id: 'https://example.edu/issuers/keys/5',
    controller: 'https://example.edu/issuers/565049'
  });
  const keyDoc = await keyPair.export({publicKey: true});
  registerKey({keyDoc});
  return {
    keyDoc,
    keyPair,
    keyType: 'Ed25519',
    suiteName: 'eddsa-rdfc-2022',
    cryptosuite: eddsaRdfc2020Cryptosuite,
    suites: createDiSuites({
      signer: keyPair.signer(),
      cryptosuite: eddsaRdfc2020Cryptosuite
    }),
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
    cryptosuite: ecdsaRdfc2019Cryptosuite,
    keyDoc,
    keyPair,
    keyType: 'P-256',
    suiteName: 'ecdsa-rdfc-2019',
    suites: createDiSuites({
      signer: keyPair.signer(),
      cryptosuite: ecdsaRdfc2019Cryptosuite
    }),
    derived: false
  };
}

// do ecdsa-sd-2023 setup...
async function ecdsaSd2023() {
  // set up the ECDSA key pair that will be signing and verifying
  const keyPair = await EcdsaMultikey.generate({
    curve: 'P-256',
    id: 'https://example.edu/issuers/keys/3',
    controller: 'https://example.edu/issuers/565049'
  });
  const keyDoc = await keyPair.export({publicKey: true});
  registerKey({keyDoc});
  return {
    keyDoc,
    keyPair,
    suiteName: 'ecdsa-sd-2023',
    keyType: 'P-256',
    cryptosuite: ecdsaSd2023Cryptosuite,
    suites: createSdSuites({
      signer: keyPair.signer(),
      cryptosuite: ecdsaSd2023Cryptosuite
    }),
    derived: true
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
  const keyDoc = await keyPair.export({publicKey: true});
  registerKey({keyDoc});
  return {
    cryptosuite: bbs2023Cryptosuite,
    keyDoc,
    keyPair,
    suiteName: 'bbs-2023',
    keyType: 'Bls12381G2',
    derived: true,
    suites: createSdSuites({
      signer: keyPair.signer(),
      cryptosuite: bbs2023Cryptosuite
    })
  };
}

async function ed25519Sig2018() {
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
    cryptosuite: Ed25519Signature2018,
    keyDoc,
    keyPair,
    suite,
    suiteName: 'Ed25519Signature2018',
    keyType: 'Ed25519',
    suites: {
      issue() {
        return new Ed25519Signature2018({
          verificationMethod: 'https://example.edu/issuers/keys/1',
          key: keyPair
        });
      },
      verify() {
        return new Ed25519Signature2018();
      },
      derive() {
        throw new Error('Ed25519Signature2018 does not have a derive proof.');
      }
    },
    derived: false
  };
}

function registerKey({keyDoc}) {
  // add the key to the controller doc (authorizes its use for assertion)
  assertionController.assertionMethod.push(keyDoc.id);
  // register the key document with documentLoader
  remoteDocuments.set(keyDoc.id, keyDoc);
}
