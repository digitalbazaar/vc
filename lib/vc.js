/**
 * A JavaScript implementation of Verifiable Credentials.
 *
 * @author Dave Longley
 * @author David I. Lehn
 *
 * @license BSD 3-Clause License
 * Copyright (c) 2017-2021 Digital Bazaar, Inc.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 * Redistributions of source code must retain the above copyright notice,
 * this list of conditions and the following disclaimer.
 *
 * Redistributions in binary form must reproduce the above copyright
 * notice, this list of conditions and the following disclaimer in the
 * documentation and/or other materials provided with the distribution.
 *
 * Neither the name of the Digital Bazaar, Inc. nor the names of its
 * contributors may be used to endorse or promote products derived from
 * this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS
 * IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED
 * TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A
 * PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
 * HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED
 * TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 * PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
 * LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
 * NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */
'use strict';

const jsonld = require('@digitalcredentials/jsonld');
const jsigs = require('@digitalcredentials/jsonld-signatures');
const {AuthenticationProofPurpose} = jsigs.purposes;
const CredentialIssuancePurpose = require('./CredentialIssuancePurpose');
const defaultDocumentLoader = jsigs.extendContextLoader(
  require('./documentLoader'));
const {constants: {CREDENTIALS_CONTEXT_V1_URL}} =
  require('credentials-context');

// Z and T can be lowercase
// RFC3339 regex
const dateRegex = new RegExp('^(\\d{4})-(0[1-9]|1[0-2])-' +
    '(0[1-9]|[12][0-9]|3[01])T([01][0-9]|2[0-3]):' +
    '([0-5][0-9]):([0-5][0-9]|60)' +
    '(\\.[0-9]+)?(Z|(\\+|-)([01][0-9]|2[0-3]):' +
    '([0-5][0-9]))$', 'i');

module.exports = {
  issue,
  createPresentation,
  signPresentation,
  verify,
  verifyCredential,
  CredentialIssuancePurpose,
  defaultDocumentLoader,
  // export for testing:
  _checkCredential,
  _checkPresentation,
  dateRegex
};

/**
 * @typedef {object} VerifyPresentationResult
 * @property {boolean} verified - True if verified, false if not.
 * @property {object} presentationResult
 * @property {Array} credentialResults
 * @property {object} error
 */

/**
 * @typedef {object} VerifyCredentialResult
 * @property {boolean} verified - True if verified, false if not.
 * @property {object} statusResult
 * @property {Array} results
 * @property {object} error
 */

/**
 * Issues a verifiable credential (by taking a base credential document,
 * and adding a digital signature to it).
 *
 * @param {object} [options={}] - The options to use.
 *
 * @param {object} options.credential - Base credential document.
 * @param {LinkedDataSignature} options.suite - Signature suite (with private
 *   key material), passed in to sign().
 *
 * Either pass in a ProofPurpose, or a default one will be created:
 * @param {ProofPurpose} [options.purpose]
 *
 * Other optional params passed to `sign()`:
 * @param {object} [options.documentLoader] - A document loader.
 * @param {object} [options.expansionMap] - An expansion map.
 *
 * @throws {Error} If missing required properties.
 *
 * @returns {Promise<VerifiableCredential>} Resolves on completion.
 */
async function issue({
  credential, suite, expansionMap,
  purpose = new CredentialIssuancePurpose(),
  documentLoader = defaultDocumentLoader
} = {}) {
  // check to make sure the `suite` has required params
  // Note: verificationMethod defaults to publicKey.id, in suite constructor
  if(!suite) {
    throw new TypeError('"suite" parameter is required for issuing.');
  }
  if(!suite.verificationMethod) {
    throw new TypeError('"suite.verificationMethod" property is required.');
  }

  if(!credential) {
    throw new TypeError('"credential" parameter is required for issuing.');
  }

  // Set the issuance date to now(), if missing
  if(!credential.issuanceDate) {
    const now = (new Date()).toJSON();
    credential.issuanceDate = `${now.substr(0, now.length - 5)}Z`;
  }

  // run common credential checks
  _checkCredential(credential);

  return jsigs.sign(credential, {purpose, documentLoader, suite, expansionMap});
}

/**
 * Verifies a verifiable presentation:
 *   - Checks that the presentation is well-formed
 *   - Checks the proofs (for example, checks digital signatures against the
 *     provided public keys).
 *
 * @param {object} [options={}] - The options to use.
 *
 * @param {VerifiablePresentation} options.presentation - Verifiable
 *   presentation, signed or unsigned, that may contain within it a
 *   verifiable credential.
 *
 * @param {LinkedDataSignature|LinkedDataSignature[]} suite - One or more
 *   signature suites that are supported by the caller's use case. This is
 *   an explicit design decision -- the calling code must specify which
 *   signature types (ed25519, RSA, etc) are allowed.
 *   Although it is expected that the secure resolution/fetching of the public
 *   key material (to verify against) is to be handled by the documentLoader,
 *   the suite param can optionally include the key directly.
 *
 * @param {boolean} [options.unsignedPresentation=false] - By default, this
 *   function assumes that a presentation is signed (and will return an error if
 *   a `proof` section is missing). Set this to `true` if you're using an
 *   unsigned presentation.
 *
 * Either pass in a proof purpose,
 * @param {AuthenticationProofPurpose} [options.presentationPurpose] - Optional
 *   proof purpose (a default one will be created if not passed in).
 *
 * or a default purpose will be created with params:
 * @param {string} [options.challenge] - Required if purpose is not passed in.
 * @param {string} [options.controller]
 * @param {string} [options.domain]
 *
 * @param {Function} [options.documentLoader]
 * @param {Function} [options.checkStatus]
 *
 * @returns {Promise<VerifyPresentationResult>} The verification result.
 */
async function verify(options = {}) {
  const {presentation} = options;
  try {
    if(!presentation) {
      throw new TypeError(
        'A "presentation" property is required for verifying.');
    }
    return _verifyPresentation(options);
  } catch(error) {
    return {
      verified: false,
      results: [{presentation, verified: false, error}],
      error
    };
  }
}

/**
 * Verifies a verifiable credential:
 *   - Checks that the credential is well-formed
 *   - Checks the proofs (for example, checks digital signatures against the
 *     provided public keys).
 *
 * @param {object} [options={}]
 *
 * @param {object} options.credential - Verifiable credential.
 *
 * @param {LinkedDataSignature|LinkedDataSignature[]} suite - One or more
 *   signature suites that are supported by the caller's use case. This is
 *   an explicit design decision -- the calling code must specify which
 *   signature types (ed25519, RSA, etc) are allowed.
 *   Although it is expected that the secure resolution/fetching of the public
 *   key material (to verify against) is to be handled by the documentLoader,
 *   the suite param can optionally include the key directly.
 *
 * @param {CredentialIssuancePurpose} [options.purpose] - Optional
 *   proof purpose (a default one will be created if not passed in).
 * @param {Function} [options.documentLoader]
 * @param {Function} [options.checkStatus] - Optional function for checking
 *   credential status if `credentialStatus` is present on the credential.
 *
 * @returns {Promise<VerifyCredentialResult>} The verification result.
 */
async function verifyCredential(options = {}) {
  const {credential} = options;
  try {
    if(!credential) {
      throw new TypeError(
        'A "credential" property is required for verifying.');
    }
    return _verifyCredential(options);
  } catch(error) {
    return {
      verified: false,
      results: [{credential, verified: false, error}],
      error
    };
  }
}

/**
 * Verifies a verifiable credential.
 *
 * @private
 * @param {object} [options={}]
 *
 * @param {object} options.credential - Verifiable credential.
 * @param {LinkedDataSignature|LinkedDataSignature[]} suite - See the definition
 *   in the `verify()` docstring, for this param.
 *
 * @throws {Error} If required parameters are missing (in `_checkCredential`).
 *
 * @param {CredentialIssuancePurpose} [options.purpose]
 * @param {Function} [options.documentLoader]
 * @param {Function} [options.checkStatus] - Optional function for checking
 *   credential status if `credentialStatus` is present on the credential.
 *
 * @returns {Promise<VerifyCredentialResult>} The verification result.
 */
async function _verifyCredential(options = {}) {
  const {credential, checkStatus} = options;

  // run common credential checks
  _checkCredential(credential);

  // if credential status is provided, a `checkStatus` function must be given
  if(credential.credentialStatus && typeof options.checkStatus !== 'function') {
    throw new TypeError(
      'A "checkStatus" function must be given to verify credentials with ' +
      '"credentialStatus".');
  }

  const documentLoader = options.documentLoader || defaultDocumentLoader;

  const {controller} = options;
  const purpose = options.purpose || new CredentialIssuancePurpose({
    controller
  });

  const result = await jsigs.verify(
    credential, {purpose, documentLoader, ...options});

  // if verification has already failed, skip status check
  if(!result.verified) {
    return result;
  }

  if(credential.credentialStatus) {
    result.statusResult = await checkStatus(options);
    if(!result.statusResult.verified) {
      result.verified = false;
    }
  }

  return result;
}

/**
 * Creates an unsigned presentation from a given verifiable credential.
 *
 * @param {object} options - Options to use.
 * @param {object|Array<object>} [options.verifiableCredential] - One or more
 *   verifiable credential.
 * @param {string} [options.id] - Optional VP id.
 * @param {string} [options.holder] - Optional presentation holder url.
 *
 * @throws {TypeError} If verifiableCredential param is missing.
 * @throws {Error} If the credential (or the presentation params) are missing
 *   required properties.
 *
 * @returns {Presentation} The credential wrapped inside of a
 *   VerifiablePresentation.
 */
function createPresentation({verifiableCredential, id, holder} = {}) {
  const presentation = {
    '@context': [CREDENTIALS_CONTEXT_V1_URL],
    type: ['VerifiablePresentation']
  };
  if(verifiableCredential) {
    const credentials = [].concat(verifiableCredential);
    // ensure all credentials are valid
    for(const credential of credentials) {
      _checkCredential(credential);
    }
    presentation.verifiableCredential = credentials;
  }
  if(id) {
    presentation.id = id;
  }
  if(holder) {
    presentation.holder = holder;
  }

  _checkPresentation(presentation);

  return presentation;
}

/**
 * Signs a given presentation.
 *
 * @param {object} [options={}] - Options to use.
 *
 * Required:
 * @param {Presentation} options.presentation
 * @param {LinkedDataSignature} options.suite - passed in to sign()
 *
 * Either pass in a ProofPurpose, or a default one will be created with params:
 * @param {ProofPurpose} [options.purpose]
 * @param {string} [options.domain]
 * @param {string} options.challenge - Required.
 *
 * @param {Function} [options.documentLoader]
 *
 * @returns {Promise<{VerifiablePresentation}>} A VerifiablePresentation with
 *   a proof.
 */
async function signPresentation(options = {}) {
  const {presentation, domain, challenge} = options;
  const purpose = options.purpose || new AuthenticationProofPurpose({
    domain,
    challenge
  });

  const documentLoader = options.documentLoader || defaultDocumentLoader;

  return jsigs.sign(presentation, {purpose, documentLoader, ...options});
}

/**
 * Verifies that the VerifiablePresentation is well formed, and checks the
 * proof signature if it's present. Also verifies all the VerifiableCredentials
 * that are present in the presentation, if any.
 *
 * @param {object} [options={}]
 * @param {VerifiablePresentation} options.presentation
 *
 * @param {LinkedDataSignature|LinkedDataSignature[]} options.suite - See the
 *   definition in the `verify()` docstring, for this param.
 *
 * @param {boolean} [options.unsignedPresentation=false] - By default, this
 *   function assumes that a presentation is signed (and will return an error if
 *   a `proof` section is missing). Set this to `true` if you're using an
 *   unsigned presentation.
 *
 * Either pass in a proof purpose,
 * @param {AuthenticationProofPurpose} [options.presentationPurpose]
 *
 * or a default purpose will be created with params:
 * @param {string} [options.challenge] - Required if purpose is not passed in.
 * @param {string} [options.controller]
 * @param {string} [options.domain]
 *
 * @param {Function} [options.documentLoader]
 * @param {Function} [options.checkStatus]
 *
 * @throws {Error} If presentation is missing required params.
 *
 * @returns {Promise<VerifyPresentationResult>} The verification result.
 */
async function _verifyPresentation(options = {}) {
  const {presentation, unsignedPresentation} = options;

  _checkPresentation(presentation);

  const documentLoader = options.documentLoader || defaultDocumentLoader;

  // FIXME: verify presentation first, then each individual credential
  // only if that proof is verified

  // if verifiableCredentials are present, verify them, individually
  let credentialResults;
  let verified = true;
  const credentials = jsonld.getValues(presentation, 'verifiableCredential');
  if(credentials.length > 0) {
    // verify every credential in `verifiableCredential`
    credentialResults = await Promise.all(credentials.map(credential => {
      return verifyCredential({credential, documentLoader, ...options});
    }));

    for(const [i, credentialResult] of credentialResults.entries()) {
      credentialResult.credentialId = credentials[i].id;
    }

    const allCredentialsVerified = credentialResults.every(r => r.verified);
    if(!allCredentialsVerified) {
      verified = false;
    }
  }

  if(unsignedPresentation) {
    // No need to verify the proof section of this presentation
    return {verified, results: [presentation], credentialResults};
  }

  const {controller, domain, challenge} = options;
  if(!options.presentationPurpose && !challenge) {
    throw new Error(
      'A "challenge" param is required for AuthenticationProofPurpose.');
  }

  const purpose = options.presentationPurpose ||
    new AuthenticationProofPurpose({controller, domain, challenge});

  const presentationResult = await jsigs.verify(
    presentation, {purpose, documentLoader, ...options});

  return {
    presentationResult,
    verified: verified && presentationResult.verified,
    credentialResults,
    error: presentationResult.error
  };
}

/**
 * @param {string|object} obj - Either an object with an id property
 *   or a string that is an id.
 * @returns {string|undefined} Either an id or undefined.
 * @private
 *
 */
function _getId(obj) {
  if(typeof obj === 'string') {
    return obj;
  }

  if(!('id' in obj)) {
    return;
  }

  return obj.id;
}

/**
 * @param {object} presentation - An object that could be a presentation.
 * @throws {Error}
 * @private
 */
function _checkPresentation(presentation) {
  // normalize to an array to allow the common case of context being a string
  const context = Array.isArray(presentation['@context']) ?
    presentation['@context'] : [presentation['@context']];

  // ensure first context is 'https://www.w3.org/2018/credentials/v1'
  if(context[0] !== CREDENTIALS_CONTEXT_V1_URL) {
    throw new Error(
      `"${CREDENTIALS_CONTEXT_V1_URL}" needs to be first in the ` +
      'list of contexts.');
  }

  const types = jsonld.getValues(presentation, 'type');

  // check type presence
  if(!types.includes('VerifiablePresentation')) {
    throw new Error('"type" must include "VerifiablePresentation".');
  }
}

/**
 * @param {object} credential - An object that could be a VerifiableCredential.
 * @throws {Error}
 * @private
 */
function _checkCredential(credential) {
  // ensure first context is 'https://www.w3.org/2018/credentials/v1'
  if(credential['@context'][0] !== CREDENTIALS_CONTEXT_V1_URL) {
    throw new Error(
      `"${CREDENTIALS_CONTEXT_V1_URL}" needs to be first in the ` +
      'list of contexts.');
  }

  // check type presence and cardinality
  if(!credential.type) {
    throw new Error('"type" property is required.');
  }

  if(!jsonld.getValues(credential, 'type').includes('VerifiableCredential')) {
    throw new Error('"type" must include `VerifiableCredential`.');
  }

  if(!credential.credentialSubject) {
    throw new Error('"credentialSubject" property is required.');
  }

  // If credentialSubject.id is present and is not a URI, reject it
  if(credential.credentialSubject.id) {
    _validateUriId({
      id: credential.credentialSubject.id, propertyName: 'credentialSubject.id'
    });
  }

  if(!credential.issuer) {
    throw new Error('"issuer" property is required.');
  }

  // check issuanceDate cardinality
  if(jsonld.getValues(credential, 'issuanceDate').length > 1) {
    throw new Error('"issuanceDate" property can only have one value.');
  }

  // check issued is a date
  if(!credential.issuanceDate) {
    throw new Error('"issuanceDate" property is required.');
  }

  if('issuanceDate' in credential) {
    if(!dateRegex.test(credential.issuanceDate)) {
      throw new Error(
        `"issuanceDate" must be a valid date: ${credential.issuanceDate}`);
    }
  }

  // check issuer cardinality
  if(jsonld.getValues(credential, 'issuer').length > 1) {
    throw new Error('"issuer" property can only have one value.');
  }

  // check issuer is a URL
  if('issuer' in credential) {
    const issuer = _getId(credential.issuer);
    if(!issuer) {
      throw new Error(`"issuer" id is required.`);
    }
    _validateUriId({id: issuer, propertyName: 'issuer'});
  }

  if('credentialStatus' in credential) {
    if(!credential.credentialStatus.id) {
      throw new Error('"credentialStatus" must include an id.');
    }
    if(!credential.credentialStatus.type) {
      throw new Error('"credentialStatus" must include a type.');
    }
  }

  // check evidences are URLs
  jsonld.getValues(credential, 'evidence').forEach(evidence => {
    const evidenceId = _getId(evidence);
    if(evidenceId) {
      _validateUriId({id: evidenceId, propertyName: 'evidence'});
    }
  });

  // check expires is a date
  if('expirationDate' in credential &&
      !dateRegex.test(credential.expirationDate)) {
    throw new Error(
      `"expirationDate" must be a valid date: ${credential.expirationDate}`);
  }
}

function _validateUriId({id, propertyName}) {
  try {
    new URL(id);
  } catch(e) {
    const error = new TypeError(`"${propertyName}" must be a URI: "${id}".`);
    error.cause = e;
    throw error;
  }
}
