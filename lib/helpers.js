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
 * Asserts that a context array's first item is a credentials context.
 *
 * @param {object} options - Options.
 * @param {Array} options.context - An array of contexts.
 *
 * @throws {Error} - Throws if the first context
 *   is not a credentials context.
 *
 * @returns {undefined}
 */
export function assertCredentialContext({context}) {
  // ensure first context is credentials context url
  if(credentialContextUrls.has(context[0]) === false) {
    // throw if the first context is not a credentials context
    throw new Error(
      `"${CREDENTIALS_CONTEXT_V1_URL}" or "${CREDENTIALS_CONTEXT_V2_URL}"` +
      ' needs to be first in the list of contexts.');
  }
}

/**
 * Turns the first context in a VC into a numbered version.
 *
 * @param {object} options - Options.
 * @param {object} options.credential - A VC.
 *
 * @returns {number} A number representing the version.
 */
function getContextVersion({credential} = {}) {
  const firstContext = credential?.['@context']?.[0];
  if(firstContext === CREDENTIALS_CONTEXT_V1_URL) {
    return 1.0;
  }
  if(firstContext === CREDENTIALS_CONTEXT_V2_URL) {
    return 2.0;
  }
  return 0;
}

/**
 * Checks if a VC is using a specific context version.
 *
 * @param {object} options - Options.
 * @param {object} options.credential - A VC.
 * @param {number} options.version - A VC Context version
 *
 * @returns {boolean} If the first context matches the version.
 */
export function checkContextVersion({credential, version}) {
  return getContextVersion({credential}) === version;
}
