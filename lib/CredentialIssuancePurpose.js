/*!
 * Copyright (c) 2019-2020 Digital Bazaar, Inc. All rights reserved.
 */
'use strict';
const {AssertionProofPurpose} = require('jsonld-signatures').purposes;

/**
 * Creates a proof purpose that will validate whether or not the verification
 * method in a proof was authorized by its declared controller for the
 * proof's purpose.
 */
class CredentialIssuancePurpose extends AssertionProofPurpose {
  /**
   * @param {object} [controller] - the description of the controller, if it
   *   is not to be dereferenced via a `documentLoader`.
   * @param {string|Date|number} [date] - the expected date for
   *   the creation of the proof.
   * @param {number} [maxTimestampDelta=Infinity] - a maximum number of seconds
   *   that the date on the signature can deviate from.
   */
  constructor({controller, date, maxTimestampDelta} = {}) {
    super({controller, date, maxTimestampDelta});
  }
}

module.exports = CredentialIssuancePurpose;
