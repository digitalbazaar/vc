/**
 * A JavaScript implementation of Verifiable Credentials.
 *
 * @author Dave Longley
 * @author David I. Lehn
 *
 * @license BSD 3-Clause License
 * Copyright (c) 2017-2020 Digital Bazaar, Inc.
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

const jsonld = require('jsonld');
const jsigs = require('jsonld-signatures');
const {AuthenticationProofPurpose} = require('jsonld-signatures').purposes;
const CredentialIssuancePurpose = require('./CredentialIssuancePurpose');
const defaultDocumentLoader = jsigs.extendContextLoader(
  require('./documentLoader'));

// Z and T can be lowercase
// RFC3339 regex
const dateRegex = new RegExp('^(\\d{4})-(0[1-9]|1[0-2])-' +
    '(0[1-9]|[12][0-9]|3[01])T([01][0-9]|2[0-3]):' +
    '([0-5][0-9]):([0-5][0-9]|60)' +
    '(\\.[0-9]+)?(Z|(\\+|-)([01][0-9]|2[0-3]):' +
    '([0-5][0-9]))$', 'i');

module.exports = {
  issue,
  verify,
  createPresentation,
  signPresentation,
  CredentialIssuancePurpose,
  defaultDocumentLoader,
  // export for testing:
  _checkCredential,
  _checkPresentation,
  _verifyPresentation,
  dateRegex
};

/**
 * Issues a verifiable credential (by taking a base credential document,
 * and adding a digital signature to it).
 *
 * @param {object} [options={}]
 *
 * Required:
 * @param {object} options.credential - Base credential document
 * @param {LinkedDataSignature} options.suite - Signature suite (with private
 *   key material), passed in to sign().
 *
 * Either pass in a ProofPurpose, or a default one will be created:
 * @param {ProofPurpose} [options.purpose]
 *
 * Other optional params passed to `sign()`:
 * @param {function} [options.documentLoader]
 * @param {object} [options.expansionMap]
 * @param {boolean} [options.compactProof]
 *
 * @throws {Error} If missing required properties.
 *
 * @returns {Promise<VerifiableCredential>}
 */
async function issue(options = {}) {
  const documentLoader = options.documentLoader || defaultDocumentLoader;

  const {suite} = options;
  const purpose = options.purpose || new CredentialIssuancePurpose();

  // check to make sure the `suite` has required params
  // Note: verificationMethod defaults to publicKey.id, in suite constructor
  if(!suite || !suite.verificationMethod) {
    throw new TypeError('"suite.verificationMethod" property is required.')
  }

  // run common credential checks
  const {credential} = options;
  if(!credential) {
    throw new TypeError('"credential" property is required for issuing.');
  }
  _checkCredential(credential);

  return jsigs.sign(credential, {purpose, documentLoader, suite, ...options});
}

/**
 * Verifies a verifiable credential or verifiable presentation:
 *   - Checks that the presentation or credential is well-formed
 *   - Checks the proofs (for example, checks digital signatures against the
 *     provided public keys).
 *
 * @param {object} [options={}]
 *
 * Required, one of:
 * @param {object} [options.credential] - Verifiable credential
 * @param {object} [options.presentation] - Verifiable presentation
 *
 * @param {LinkedDataSignature|LinkedDataSignature[]} suite - One or more
 *   signature suites that are supported by the caller's use case. This is
 *   an explicit design decision -- the calling code must specify which
 *   signature types (ed25519, RSA, etc) are allowed.
 *   Although it is expected that the secure resolution/fetching of the public
 *   key material (to verify against) is to be handled by the documentLoader,
 *   the suite param can optionally include the key directly.
 *
 * @param {boolean} [options.unsignedPresentation=false] By default, this
 *   function assumes that a presentation is signed (and will return an error if
 *   a `proof` section is missing). Set this to `true` if you're using an
 *   unsigned presentation.
 *
 * @param {ProofPurpose} [options.purpose] - Optional proof purpose (a default
 *   one will be created if not passed in -- a CredentialIssuancePurpose
 *   instance in the case of credentials, and an AuthenticationProofPurpose in
 *   case of presentations).
 * @param {function} [options.documentLoader]
 *
 * @returns {Promise<{verified: boolean, results: *[], error: Error}>}
 */
async function verify(options = {}) {
  const {credential, presentation} = options;

  try {
    if(!credential && !presentation) {
      throw new TypeError(
        'A "credential" or "presentation" property is required for verifying.');
    }
    if(credential) {
      return _verifyCredential(options);
    }
    return _verifyPresentation(options);
  } catch(error) {
    return {
      verified: false, error
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
 * @throws {TypeError} If a VP is passed instead of a credential.
 *
 * @param {CredentialIssuancePurpose} [options.purpose]
 * @param {Function} [options.documentLoader]
 *
 * @returns {Promise<{verified: boolean, results: *[], error: Error}>}
 */
async function _verifyCredential(options = {}) {
  const {credential} = options;

  // check if developer mistakenly passed in a VP as 'credential'
  if(jsonld.hasValue(credential, 'type', 'VerifiablePresentation')) {
    throw new TypeError('Use "presentation" property when verifying VPs.');
  }

  // run common credential checks
  try {
    _checkCredential(credential);
  } catch(error) {
    return {
      verified: false,
      results: [{credential, verified: false, error}],
      error
    };
  }

  const documentLoader = options.documentLoader || defaultDocumentLoader;

  const {controller} = options;
  const purpose = options.purpose || new CredentialIssuancePurpose({
    controller
  });

  return jsigs.verify(credential, {purpose, documentLoader, ...options});
}

/**
 * Creates an unsigned presentation from a given verifiable credential.
 *
 * @param {object|Array<object>} verifiableCredential - One or more
 *   verifiable credential
 * @param {string} [id] - Optional VP id
 * @param {string} [holder] - Optional presentation holder url.
 *
 * @throws {TypeError} If verifiableCredential param is missing.
 * @throws {Error} If the credential (or the presentation params) are missing
 *   required properties.
 *
 * @returns {Presentation}
 */
function createPresentation({verifiableCredential, id, holder} = {}) {
  if(!verifiableCredential) {
    throw new TypeError('"verifiableCredential" parameter is required.');
  }

  const presentation = {
    '@context': ['https://www.w3.org/2018/credentials/v1'],
    type: ['VerifiablePresentation'],
    verifiableCredential: [].concat(verifiableCredential)
  };
  if(id) {
    presentation.id = id;
  }
  if(holder) {
    presentation.holder = holder;
  }

  _checkPresentation(presentation);

  for(const credential of presentation.verifiableCredential) {
    _checkCredential(credential);
  }

  return presentation;
}

/**
 * Signs a given presentation.
 *
 * @param {object} [options={}]
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
 * @param {function} [options.documentLoader]
 *
 * @returns {Promise<{VerifiablePresentation}>}
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
 * that are present in the presentation.
 *
 * @param {object} [options={}]
 * @param {VerifiablePresentation} options.presentation
 *
 * @param {LinkedDataSignature|LinkedDataSignature[]} suite - See the definition
 *   in the `verify()` docstring, for this param.
 *
 * @param {boolean} [options.unsignedPresentation=false] By default, this
 *   function assumes that a presentation is signed (and will return an error if
 *   a `proof` section is missing). Set this to `true` if you're using an
 *   unsigned presentation.
 *
 * Either pass in a ProofPurpose,
 * @param {ProofPurpose} [options.purpose]
 *
 * or a default purpose will be created with params:
 * @param {string} [options.challenge] - Required if purpose is not passed in.
 * @param {string} [options.controller]
 * @param {string} [options.domain]
 *
 * @param {function} [options.documentLoader]
 *
 * @throws {Error} If presentation is missing required params.
 *
 * @returns {Promise<{verified: boolean, results: *[], error: Error}>}
 */
async function _verifyPresentation(options = {}) {
  const {presentation, unsignedPresentation} = options;

  _checkPresentation(presentation);

  const documentLoader = options.documentLoader || defaultDocumentLoader;

  const credentials = [].concat(presentation.verifiableCredential);

  // verify every credential in `verifiableCredential`
  const vcResult = await Promise.all(credentials.map(credential => {
    return verify({credential, documentLoader, ...options});
  }));

  const allCredentialsVerified = vcResult.every(r => r.verified);

  if(!allCredentialsVerified) {
    return {verified: false, error: vcResult.map(r => r.error).flat()}
  }

  if(unsignedPresentation) {
    // No need to verify the proof section of this presentation
    return {verified: true, results: [presentation]};
  }

  const {controller, domain, challenge} = options;
  if(!options.purpose && !challenge) {
    throw new Error(
      'A challenge param is required for AuthenticationProofPurpose.');
  }

  const purpose = options.purpose ||
    new AuthenticationProofPurpose({controller, domain, challenge});

  const presentationResult = await jsigs.verify(
    presentation, {purpose, documentLoader, ...options});

  return {
    verified: (presentationResult.verified && allCredentialsVerified),
    results: [].concat([presentationResult, vcResult]),
    error: presentationResult.error
  };
}

/**
 * @param {String|object} obj
 * @returns {String|undefined}
 * @private
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
 * @param presentation
 * @throws {Error}
 * @private
 */
function _checkPresentation(presentation) {
  // ensure first context is 'https://www.w3.org/2018/credentials/v1'
  if(presentation['@context'][0] !== 'https://www.w3.org/2018/credentials/v1') {
    throw new Error(
      'https://www.w3.org/2018/credentials/v1 needs to be first in the ' +
      'list of contexts.');
  }

  const types = jsonld.getValues(presentation, 'type');

  // check type presence
  if(!types.includes('VerifiablePresentation')) {
    throw new Error('"type" must include "VerifiablePresentation".');
  }

  if(!presentation['verifiableCredential']) {
    throw new Error('"verifiableCredential" property is required.');
  }
}

/**
 * @param credential
 * @throws {Error}
 * @private
 */
function _checkCredential(credential) {
  // ensure first context is 'https://www.w3.org/2018/credentials/v1'
  if(credential['@context'][0] !== 'https://www.w3.org/2018/credentials/v1') {
    throw new Error(
      'https://www.w3.org/2018/credentials/v1 needs to be first in the ' +
      'list of contexts.');
  }

  // check type presence and cardinality
  if(!credential['type']) {
    throw new Error('"type" property is required.');
  }

  if(!Array.isArray(credential['type']) ||
      !credential['type'].includes('VerifiableCredential')) {
    throw new Error(
      '"type" must include `VerifiableCredential`.');
  }

  if(!credential['credentialSubject']) {
    throw new Error('"credentialSubject" property is required.');
  }

  if(!credential['issuer']) {
    throw new Error('"issuer" property is required.');
  }

  // check issuanceDate cardinality
  if(jsonld.getValues(credential, 'issuanceDate').length > 1) {
    throw new Error('"issuanceDate" property can only have one value.');
  }

  // check issued is a date
  if(!credential['issuanceDate']) {
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
  // FIXME
  if('issuer' in credential) {
    const issuer = _getId(credential.issuer);
    if(!issuer) {
      throw new Error(`"issuer" id is required.`);
    }
    if(!issuer.includes(':')) {
      throw new Error(`"issuer" id must be a URL: ${issuer}`);
    }
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
  // FIXME
  jsonld.getValues(credential, 'evidence').forEach(evidence => {
    const evidenceId = _getId(evidence);
    if(evidenceId && !evidenceId.includes(':')) {
      throw new Error(`"evidence" id must be a URL: ${evidence}`);
    }
  });

  // check expires is a date
  if('expirationDate' in credential &&
      !dateRegex.test(credential.expirationDate)) {
    throw new Error(
      `"expirationDate" must be a valid date: ${credential.expirationDate}`);
  }
}
