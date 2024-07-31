/*!
 * Copyright (c) 2023 Digital Bazaar, Inc. All rights reserved.
 */
// Z and T must be uppercase
// xml schema date time RegExp
// @see https://www.w3.org/TR/xmlschema11-2/#dateTime
export const dateRegex = new RegExp(
  '-?([1-9][0-9]{3,}|0[0-9]{3})' +
  '-(0[1-9]|1[0-2])' +
  '-(0[1-9]|[12][0-9]|3[01])' +
  'T(([01][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9](\.[0-9]+)?|(24:00:00(\.0+)?))' +
  '(Z|(\\+|-)((0[0-9]|1[0-3]):[0-5][0-9]|14:00))?');

const CREDENTIALS_CONTEXT_V1_URL = 'https://www.w3.org/2018/credentials/v1';
const CREDENTIALS_CONTEXT_V2_URL = 'https://www.w3.org/ns/credentials/v2';

// mappings between credentials contexts and version numbers
const credentialsContextUrlToVersion = new Map([
  [CREDENTIALS_CONTEXT_V1_URL, 1.0],
  [CREDENTIALS_CONTEXT_V2_URL, 2.0]
]);
const credentialsVersionToContextUrl = new Map([
  [1.0, CREDENTIALS_CONTEXT_V1_URL],
  [2.0, CREDENTIALS_CONTEXT_V2_URL]
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
  if(!credentialsContextUrlToVersion.has(context[0])) {
    // throw if the first context is not a credentials context
    throw new Error(
      `"${CREDENTIALS_CONTEXT_V1_URL}" or "${CREDENTIALS_CONTEXT_V2_URL}"` +
      ' needs to be first in the list of contexts.');
  }
}

/**
 * Throws if a Date is not in the correct format.
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
  return credentialsContextUrlToVersion.get(firstContext);
}

/**
 * Turns the first context in a VC into a numbered version.
 *
 * @param {object} options - Options.
 * @param {number} options.version - A credentials context version.
 *
 * @returns {number} A number representing the version.
 */
export function getContextForVersion({version}) {
  return credentialsVersionToContextUrl.get(version);
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
