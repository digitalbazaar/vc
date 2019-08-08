/*!
 * Copyright (c) 2019 Digital Bazaar, Inc. All rights reserved.
 */
'use strict';
const {AssertionProofPurpose} = require('jsonld-signatures').purposes;

/**
 * Creates a proof purpose that will validate whether or not the verification
 * method in a proof was authorized by its declared controller for the
 * proof's purpose.
 *
 * Required params:
 * - `controller`
 */
class CredentialIssuancePurpose extends AssertionProofPurpose {
}

module.exports = CredentialIssuancePurpose;
