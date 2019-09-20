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
   * @param {object} controller - the description of the controller, if it
   *   is not to be dereferenced via a `documentLoader`. Required.
   *
   * @param {string|Date|number} [date] - the expected date for
   *   the creation of the proof.
   * @param {number} [maxTimestampDelta=Infinity] - a maximum number of seconds
   *   that the date on the signature can deviate from.
   *
   * @throws {TypeError} If controller is missing, or is not an object.
   */
  constructor({controller, date, maxTimestampDelta} = {}) {
    if(!controller) {
      throw new TypeError('"controller" property is required for proof purpose.')
    }
    super({controller, date, maxTimestampDelta});
  }

  /**
   * Validates the purpose of a proof. This method is called during
   * proof verification, after the proof value has been checked against the
   * given verification method (e.g. in the case of a digital signature, the
   * signature has been cryptographically verified against the public key).
   *
   * @param proof
   * @param verificationMethod
   * @param documentLoader
   * @param expansionMap
   *
   * @throws {Error} If verification method not authorized by controller
   * @throws {Error} If proof's created timestamp is out of range
   *
   * @returns {Promise<{valid: boolean, error: Error}>}
   */
  // async validate(proof, {verificationMethod, documentLoader, expansionMap}) {
  //   try {
  //     return super.validate(
  //       proof, { verificationMethod, documentLoader, expansionMap });
  //   } catch(error) {
  //     return {valid: false, error};
  //   }
  // }
}

module.exports = CredentialIssuancePurpose;
