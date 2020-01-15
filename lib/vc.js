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
  CredentialIssuancePurpose,
  defaultDocumentLoader,
  // export for testing:
  _checkCredential,
  _checkPresentation,
  _verifyPresentation,
  dateRegex
};

/**
 * Issues a verifiable credential.
 *
 * @param {Object} [options={}]
 *
 * Required:
 * @param {Object} options.credential - Base credential document
 * @param {LinkedDataSignature} options.suite - passed in to sign()
 *
 * Either pass in a ProofPurpose, or a default one will be created:
 * @param {ProofPurpose} [options.purpose]
 * @param {string} [options.controller]
 * @param {string} [options.domain]
 *
 * @param {string|Date} [options.issuanceDate]
 *
 * Other optional params passed to `sign()`:
 * @param {function} [options.documentLoader]
 * @param {Object} [options.expansionMap]
 * @param {boolean} [options.compactProof]
 *
 * @throws {Error}
 *
 * @returns {Promise<object>}
 */
async function issue(options = {}) {
  const documentLoader = options.documentLoader || defaultDocumentLoader;

  const {controller, domain} = options;
  const purpose = options.purpose || new CredentialIssuancePurpose({
    controller,
    domain
  });

  // run common credential checks
  const {credential} = options;
  if(!credential) {
    throw new TypeError('"credential" property is required for issuing.');
  }
  _checkCredential(credential);

  return jsigs.sign(credential, {purpose, documentLoader, ...options});
}

/**
 * Verifies a verifiable credential or verifiable presentation.
 *
 * @param {object} [options={}]
 *
 * Required, one of:
 * @param {object} [options.credential] - Verifiable credential
 * @param {object} [options.presentation] - Verifiable presentation
 *
 * @throws {TypeError} If neither credential or presentation is passed.
 * @throws {TypeError} If a verifiable presentation is passed as a credential.
 *
 * @param {CredentialIssuancePurpose} [options.purpose]
 * @param {function} [options.documentLoader]
 *
 * @returns {Promise<{verified: boolean, results: *[], error: Error}>}
 */
async function verify(options = {}) {
  const {credential, presentation} = options;

  if(!credential && !presentation) {
    throw new TypeError(
      'A "credential" or "presentation" property is required for verifying.');
  }

  if(credential) {
    return _verifyCredential(options);
  }

  return _verifyPresentation(options);
}

/**
 * Verifies a verifiable credential.
 *
 * @private
 * @param {Object} [options={}]
 *
 * @param {Object} options.credential - Verifiable credential.
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

  const {controller, domain} = options;
  const purpose = options.purpose || new CredentialIssuancePurpose({
    controller,
    domain
  });

  return jsigs.verify(credential, {purpose, documentLoader, ...options});
}

/**
 * Creates a verifiable presentation from a given verifiable credential.
 *
 * @param {object} [options={}]
 *
 * Required:
 * @param {string|Array<string>} options.type - One or more specific
 *   presentation types (in addition to 'VerifiablePresentation').
 * @param {LinkedDataSignature} options.suite - passed in to sign()
 *
 * Either pass in a `presentation` or a `verifiableCredential`
 * @param {object} [options.presentation]
 * @param {object|Array<object>} [options.verifiableCredential] - One or more
 *   verifiable credentials
 *
 * Either pass in a ProofPurpose, or a default one will be created:
 * @param {ProofPurpose} [options.purpose]
 * @param {string} [options.controller]
 * @param {string} [options.domain]
 * @param {string} [options.challenge]
 *
 * Optional:
 * @param {string} [options.id] - Optional VP id
 * @param {function} [options.documentLoader]
 *
 * @returns {Promise<{object}>}
 */
async function createPresentation(options = {}) {
  if(!options.presentation && !options.verifiableCredential) {
    throw new TypeError(
      '"presentation" or "verifiableCredential" parameter is required.');
  }

  const {type, id} = options;

  if(!type) {
    throw new TypeError(
      'A presentation requires one or more specific "type" values.');
  }

  let types = [].concat(type);
  if(!types.includes('VerifiablePresentation')) {
    types = ['VerifiablePresentation'].concat(types);
  }

  const presentation = options.presentation || {
    '@context': options.verifiableCredential['@context'],
    type: types,
    verifiableCredential: [].concat(options.verifiableCredential)
  };
  if(id) {
    presentation.id = id;
  }

  _checkPresentation(presentation);

  for(const c of presentation.verifiableCredential) {
    const credential = JSON.parse(JSON.stringify(c));
    credential['@context'] = presentation['@context'];
    _checkCredential(credential);
  }

  const documentLoader = options.documentLoader || defaultDocumentLoader;

  const {controller, domain, challenge} = options;
  const purpose = options.purpose || new CredentialIssuancePurpose({
    controller,
    domain,
    challenge
  });

  return jsigs.sign(presentation, {purpose, documentLoader, ...options});
}

/**
 * @param [options={}] - {object}.
 *
 * @param options.presentation - {object} VC Presentation.
 *
 * @returns {Promise<{verified: boolean, results: *[], error: Error}>}
 */
async function _verifyPresentation(options = {}) {
  const {presentation} = options;

  if(!presentation) {
    throw new TypeError('"presentation" property is required for verifying.');
  }

  // run common presentation checks
  try {
    _checkPresentation(presentation);
  } catch(error) {
    return {
      verified: false,
      results: [{presentation, verified: false, error}],
      error
    };
  }

  const documentLoader = options.documentLoader || defaultDocumentLoader;

  // verify every credential in `verifiableCredential`
  const credentialResult = await Promise.all(
    [].concat(presentation.verifiableCredential).map(c => {
      const credential = JSON.parse(JSON.stringify(c));
      credential['@context'] = presentation['@context'];
      return verify({credential, documentLoader, ...options});
    }));

  const allCredentialsVerified = credentialResult.every(r => r.verified);

  const {controller, domain, challenge} = options;
  const purpose = options.purpose || new CredentialIssuancePurpose({
    controller,
    domain,
    challenge
  });

  const presentationResult = jsigs.verify(
    presentation, {purpose, documentLoader, ...options});

  return {
    verified: (presentationResult.verified && allCredentialsVerified),
    results: [].concat([presentationResult, credentialResult]),
    error: presentationResult.error
  };
}

/**
 * @param {String|Object} obj
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
  // check context cardinality
  if(jsonld.getValues(presentation, '@context').length < 2) {
    throw new Error(
      '"@context" property needs to be an array of two or more contexts.');
  }

  // ensure first context is 'https://www.w3.org/2018/credentials/v1'
  if(presentation['@context'][0] !== 'https://www.w3.org/2018/credentials/v1') {
    throw new Error(
      'https://www.w3.org/2018/credentials/v1 needs to be first in the ' +
      'list of contexts.');
  }

  // check type presence and cardinality
  if(!presentation['type']) {
    throw new Error('"type" property is required.');
  }

  if(!Array.isArray(presentation['type']) ||
    presentation['type'].length < 2 ||
    !presentation['type'].includes('VerifiablePresentation')) {
    throw new Error(
      '"type" must be `VerifiablePresentation` plus specific type.');
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
  // check context cardinality
  if(jsonld.getValues(credential, '@context').length < 2) {
    throw new Error(
      '"@context" property needs to be an array of two or more contexts.');
  }

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
      credential['type'].length < 2 ||
      !credential['type'].includes('VerifiableCredential')) {
    throw new Error(
      '"type" must be `VerifiableCredential` plus specific type.');
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
