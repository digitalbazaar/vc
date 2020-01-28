/*!
 * Copyright (c) 2019-2020 Digital Bazaar, Inc. All rights reserved.
 */
'use strict';
const jsonld = require('jsonld');
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

  /**
   * Validates the purpose of a proof. This method is called during
   * proof verification, after the proof value has been checked against the
   * given verification method (e.g. in the case of a digital signature, the
   * signature has been cryptographically verified against the public key).
   *
   * @param proof
   * @param {object} document - the document whose signature is being verified.
   * @param {LinkedDataSignature} suite - signature suite used in the proof.
   * @param {string} verificationMethod - key id URL to the paired public key.
   * @param [documentLoader]
   * @param [expansionMap]
   *
   * @throws {Error} If verification method not authorized by controller
   * @throws {Error} If proof's created timestamp is out of range
   *
   * @returns {Promise<{valid: boolean, error: Error}>}
   */
  async validate(proof,
    {document, suite, verificationMethod,
     documentLoader, expansionMap}) {
    try {
      const result = await super.validate(proof, {document, suite, verificationMethod,
        documentLoader, expansionMap});

      if(!result.valid) {
        throw result.error;
      }

      const issuer = jsonld.getValues(document,
        'https://www.w3.org/2018/credentials#issuer');

      if(!issuer || issuer.length === 0) {
        throw new Error('Credential issuer is required.');
      }

      if(result.controller.id !== issuer[0].id) {
        throw new Error(
          'Credential issuer must match the verification method controller.');
      }

      return {valid: true};
    } catch(error) {
      return {valid: false, error};
    }
  }
}

module.exports = CredentialIssuancePurpose;
