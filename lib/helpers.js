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
// Z and T must be uppercase
// xml schema date time RegExp
// @see https://www.w3.org/TR/xmlschema11-2/#dateTime
export const dateRegex = new RegExp(
  '-?([1-9][0-9]{3,}|0[0-9]{3})' +
  '-(0[1-9]|1[0-2])' +
  '-(0[1-9]|[12][0-9]|3[01])' +
  'T(([01][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9](\.[0-9]+)?|(24:00:00(\.0+)?))' +
  '(Z|(\\+|-)((0[0-9]|1[0-3]):[0-5][0-9]|14:00))?');

// entries should be in ascending version order
// so v1 is entry 0
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
 * Throws if a Date is not an RFC3339 date.
 *
 * @param {object} options - Options.
 * @param {object} options.credential - A VC.
 * @param {string} options.prop - A prop in the object.
 *
 * @throws {Error} Throws if the date is not a proper date string.
 * @returns {undefined}
 */
export function assertDateString({credential, prop}) {
  const value = credential[prop];
  if(!dateRegex.test(value)) {
    throw new Error(`"${prop}" must be a valid date: ${value}`);
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
  return [...credentialContextUrls].indexOf(firstContext) + 1;
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
