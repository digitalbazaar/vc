/*!
 * Copyright (c) 2023 Digital Bazaar, Inc. All rights reserved.
 */
import * as credentialsContext from 'credentials-context';
import * as credentialsContextV2 from '@digitalbazaar/credentials-v2-context';

export const {constants: {CREDENTIALS_CONTEXT_V1_URL}} = credentialsContext;
export const {
  constants: {
    CONTEXT_URL: CREDENTIALS_CONTEXT_V2_URL
  }
} = credentialsContextV2;

const credentialContextUrls = new Set([
  CREDENTIALS_CONTEXT_V1_URL,
  CREDENTIALS_CONTEXT_V2_URL
]);

/**
 * The error thrown if the first context is not
 * a credentials context.
 */
export const ContextOrderError = new Error(
  `"${CREDENTIALS_CONTEXT_V1_URL}" or "${CREDENTIALS_CONTEXT_V2_URL}"` +
  ' needs to be first in the list of contexts.');

/**
 * Asserts that a context array's first item is a credentials context.
 *
 * @param {object} options - Options.
 * @param {Array} options.context - An array of contexts.
 *
 * @throws {ContextOrderError} - Throws if the first context
 *   is not a credentials context.
 *
 * @returns {undefined}
 */
export function assertCredentialContext({context}) {
  // ensure first context is credentials context url
  if(credentialContextUrls.has(context[0]) === false) {
    // throw if the first context is not a credentials context
    throw ContextOrderError;
  }
}

/**
 * Checks to see if a VC has a V1 context.
 *
 * @param {object} options - Options.
 * @param {object} options.credential - A VC.
 *
 * @returns {boolean} If the VC has a V1 context.
 */
export function hasV1CredentialContext({credential}) {
  return credential?.['@context']?.[0] === CREDENTIALS_CONTEXT_V1_URL;
}
