/*!
 * Copyright (c) 2019-2024 Digital Bazaar, Inc. All rights reserved.
 */
import * as vc from '../lib/index.js';
import {CredentialIssuancePurpose} from '../lib/CredentialIssuancePurpose.js';
import {DataIntegrityProof} from '@digitalbazaar/data-integrity';
import {
  documentLoader as defaultLoader
} from './testDocumentLoader.js';
import {Ed25519Signature2018} from '@digitalbazaar/ed25519-signature-2018';
import jsigs from 'jsonld-signatures';
import {v4 as uuid} from 'uuid';

/**
 * Creates an ISO DateTime skewed by a number of years
 *
 * @param {object} options - Options to use.
 * @param {Date} [options.date = new Date()] - An optional  date to use.
 * @param {number} options.skewYear - A number to skew the year.
 *
 * @returns {string} Returns an ISO DateTime String.
 */
export function createSkewedTimeStamp({date = new Date(), skewYear}) {
  date.setFullYear(date.getFullYear() + skewYear);
  const isoString = date.toISOString();
  return `${isoString.substring(0, isoString.length - 5)}Z`;
}

export async function issueCredential({
  credential,
  suites,
  mandatoryPointers,
  selectivePointers = [],
  issuer,
  derived,
  now,
  documentLoader = defaultLoader,
}) {
  credential.issuer = issuer;
  const verifiableCredential = await vc.issue({
    credential,
    documentLoader,
    suite: suites.issue({mandatoryPointers}),
    now
  });
  if(!derived) {
    return {verifiableCredential};
  }
  const derivedCredential = await vc.derive({
    verifiableCredential,
    documentLoader,
    suite: suites.derive({selectivePointers})
  });
  return {
    verifiableCredential: derivedCredential,
    baseCredential: verifiableCredential
  };
}

export async function signCredential({
  credential,
  suites,
  mandatoryPointers,
  selectivePointers = [],
  issuer,
  derived,
  documentLoader = defaultLoader,
  purpose = new CredentialIssuancePurpose()
}) {
  credential.issuer = issuer;
  credential.id = `http://example.edu/credentials/${uuid()}`;
  const verifiableCredential = await jsigs.sign(credential, {
    compactProof: false,
    documentLoader,
    suite: suites.issue({mandatoryPointers}),
    purpose
  });
  if(!derived) {
    return {verifiableCredential};
  }
  const derivedCredential = await jsigs.derive(verifiableCredential, {
    compactProof: false,
    documentLoader,
    suite: suites.derive({selectivePointers}),
    purpose
  });
  return {
    verifiableCredential: derivedCredential,
    baseCredential: verifiableCredential
  };
}

export function createVerifySuite({Suite, cryptosuite, derived}) {
  if(!derived) {
    return new Suite({cryptosuite});
  }
  return new Suite({
    cryptosuite: cryptosuite.createVerifyCryptosuite()
  });
}
export function createIssuerSuite({
  Suite, cryptosuite, signer,
  derived, mandatoryPointers = ['/issuer']
}) {
  if(!derived) {
    return new Suite({signer, cryptosuite});
  }
  return new Suite({
    signer,
    cryptosuite: cryptosuite.createSignCryptosuite({mandatoryPointers})
  });
}

export function createDiSuites({signer, cryptosuite}) {
  return {
    issue() {
      return new DataIntegrityProof({
        signer,
        cryptosuite
      });
    },
    verify() {
      return new DataIntegrityProof({
        cryptosuite
      });
    },
    derive() {
      throw new Error(
        `cryptosuite ${cryptosuite.name} should have not derive proof`);
    }
  };
}

export function createSdSuites({signer, cryptosuite}) {
  return {
    issue({mandatoryPointers}) {
      return new DataIntegrityProof({
        signer,
        cryptosuite: cryptosuite.createSignCryptosuite({mandatoryPointers})
      });
    },
    verify() {
      return new DataIntegrityProof({
        cryptosuite: cryptosuite.createVerifyCryptosuite()
      });
    },
    derive({selectivePointers}) {
      return new DataIntegrityProof({
        cryptosuite: cryptosuite.createDiscloseCryptosuite({selectivePointers})
      });
    }
  };
}

export function createEd25519SigSuites({keyPair}) {
  return {
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
  };
}

export function createSuites({derived, cryptosuite, keyPair, suiteName}) {
  if(suiteName === 'Ed25519Signature2018') {
    return createEd25519SigSuites({keyPair});
  }
  if(derived) {
    return createSdSuites({cryptosuite, signer: keyPair.signer()});
  }
  return createDiSuites({cryptosuite, signer: keyPair.signer()});
}
