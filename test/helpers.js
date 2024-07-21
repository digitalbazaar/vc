/*!
 * Copyright (c) 2019-2024 Digital Bazaar, Inc. All rights reserved.
 */
import {CredentialIssuancePurpose} from '../lib/CredentialIssuancePurpose.js';
import {
  documentLoader as defaultLoader
} from './testDocumentLoader.js';
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

export async function generateCredential({
  credentialFactory,
  suite,
  issuer,
  documentLoader = defaultLoader
}) {
  const mockCredential = credentialFactory();
  mockCredential.issuer = issuer;
  mockCredential.id = `http://example.edu/credentials/${uuid()}`;
  const credential = await jsigs.sign(mockCredential, {
    compactProof: false,
    documentLoader,
    suite,
    purpose: new CredentialIssuancePurpose()
  });
  return {credential};
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
