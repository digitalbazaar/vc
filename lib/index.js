/**
 * A JavaScript implementation of Verifiable Credentials.
 *
 * @author Dave Longley
 * @author David I. Lehn
 *
 * @license BSD 3-Clause License
 * Copyright (c) 2017-2023 Digital Bazaar, Inc.
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
import {
  assertCredentialContext,
  CREDENTIALS_CONTEXT_V1_URL,
  CREDENTIALS_CONTEXT_V2_URL,
  hasV1CredentialContext
} from './helpers.js';
import {documentLoader as _documentLoader} from './documentLoader.js';
import {CredentialIssuancePurpose} from './CredentialIssuancePurpose.js';
import jsigs from 'jsonld-signatures';
import jsonld from 'jsonld';

const {AssertionProofPurpose, AuthenticationProofPurpose} = jsigs.purposes;

export const defaultDocumentLoader = jsigs.extendContextLoader(_documentLoader);
export {CredentialIssuancePurpose};
// Z and T can be lowercase
// RFC3339 regex
export const dateRegex = new RegExp('^(\\d{4})-(0[1-9]|1[0-2])-' +
    '(0[1-9]|[12][0-9]|3[01])T([01][0-9]|2[0-3]):' +
    '([0-5][0-9]):([0-5][0-9]|60)' +
    '(\\.[0-9]+)?(Z|(\\+|-)([01][0-9]|2[0-3]):' +
    '([0-5][0-9]))$', 'i');
// destructure the credentials v2 context

/**
 * @typedef {object} LinkedDataSignature
 */

/**
 * @typedef {object} Presentation
 */

/**
 * @typedef {object} ProofPurpose
 */

/**
 * @typedef {object} VerifiableCredential
 */

/**
 * @typedef {object} VerifiablePresentation
 */

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
 *   key material or an API to use it), passed in to sign().
 *
 * @param {ProofPurpose} [options.purpose] - A ProofPurpose. If not specified,
 *   a default purpose will be created.
 *
 * Other optional params passed to `sign()`:
 * @param {object} [options.documentLoader] - A document loader.
 * @param {string|Date} [options.now] - A string representing date time in
 *   ISO 8601 format or an instance of Date. Defaults to current date time.
 *
 * @throws {Error} If missing required properties.
 *
 * @returns {Promise<VerifiableCredential>} Resolves on completion.
 */
export async function issue({
  credential, suite,
  purpose = new CredentialIssuancePurpose(),
  documentLoader = defaultDocumentLoader,
  now
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
  if(hasV1CredentialContext({credential}) && !credential.issuanceDate) {
    const now = (new Date()).toJSON();
    credential.issuanceDate = `${now.slice(0, now.length - 5)}Z`;
  }

  // run common credential checks
  _checkCredential({credential, now, mode: 'issue'});

  return jsigs.sign(credential, {purpose, documentLoader, suite});
}

/**
 * Derives a proof from the given verifiable credential, resulting in a new
 * verifiable credential. This method is usually used to generate selective
 * disclosure and / or unlinkable proofs.
 *
 * @param {object} [options={}] - The options to use.
 *
 * @param {object} options.verifiableCredential - The verifiable credential
 *   containing a base proof to derive another proof from.
 * @param {LinkedDataSignature} options.suite - Derived proof signature suite.
 *
 * Other optional params passed to `derive()`:
 * @param {object} [options.documentLoader] - A document loader.
 *
 * @throws {Error} If missing required properties.
 *
 * @returns {Promise<VerifiableCredential>} Resolves on completion.
 */
export async function derive({
  verifiableCredential, suite,
  documentLoader = defaultDocumentLoader
} = {}) {
  if(!verifiableCredential) {
    throw new TypeError('"credential" parameter is required for deriving.');
  }
  if(!suite) {
    throw new TypeError('"suite" parameter is required for deriving.');
  }

  // run common credential checks
  _checkCredential({credential: verifiableCredential, mode: 'issue'});

  return jsigs.derive(verifiableCredential, {
    purpose: new AssertionProofPurpose(),
    documentLoader,
    suite
  });
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
 * @param {LinkedDataSignature|LinkedDataSignature[]} options.suite - One or
 *   more signature suites that are supported by the caller's use case. This is
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
 * @param {string} [options.controller] - A controller.
 * @param {string} [options.domain] - A domain.
 *
 * @param {Function} [options.documentLoader] - A document loader.
 * @param {Function} [options.checkStatus] - Optional function for checking
 *   credential status if `credentialStatus` is present on the credential.
 * @param {string|Date} [options.now] - A string representing date time in
 *   ISO 8601 format or an instance of Date. Defaults to current date time.
 *
 * @returns {Promise<VerifyPresentationResult>} The verification result.
 */
export async function verify(options = {}) {
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
 * @param {object} [options={}] - The options.
 *
 * @param {object} options.credential - Verifiable credential.
 *
 * @param {LinkedDataSignature|LinkedDataSignature[]} options.suite - One or
 *   more signature suites that are supported by the caller's use case. This is
 *   an explicit design decision -- the calling code must specify which
 *   signature types (ed25519, RSA, etc) are allowed.
 *   Although it is expected that the secure resolution/fetching of the public
 *   key material (to verify against) is to be handled by the documentLoader,
 *   the suite param can optionally include the key directly.
 *
 * @param {CredentialIssuancePurpose} [options.purpose] - Optional
 *   proof purpose (a default one will be created if not passed in).
 * @param {Function} [options.documentLoader] - A document loader.
 * @param {Function} [options.checkStatus] - Optional function for checking
 *   credential status if `credentialStatus` is present on the credential.
 * @param {string|Date} [options.now] - A string representing date time in
 *   ISO 8601 format or an instance of Date. Defaults to current date time.
 *
 * @returns {Promise<VerifyCredentialResult>} The verification result.
 */
export async function verifyCredential(options = {}) {
  const {credential} = options;
  try {
    if(!credential) {
      throw new TypeError(
        'A "credential" property is required for verifying.');
    }
    return await _verifyCredential(options);
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
 * @param {object} [options={}] - The options.
 *
 * @param {object} options.credential - Verifiable credential.
 * @param {LinkedDataSignature|LinkedDataSignature[]} options.suite - See the
 *   definition in the `verify()` docstring, for this param.
 * @param {string|Date} [options.now] - A string representing date time in
 *   ISO 8601 format or an instance of Date. Defaults to current date time.
 *
 * @throws {Error} If required parameters are missing (in `_checkCredential`).
 *
 * @param {CredentialIssuancePurpose} [options.purpose] - A purpose.
 * @param {Function} [options.documentLoader] - A document loader.
 * @param {Function} [options.checkStatus] - Optional function for checking
 *   credential status if `credentialStatus` is present on the credential.
 *
 * @returns {Promise<VerifyCredentialResult>} The verification result.
 */
async function _verifyCredential(options = {}) {
  const {credential, checkStatus, now} = options;

  // run common credential checks
  _checkCredential({credential, now});

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
    credential, {...options, purpose, documentLoader});

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
 * @param {string|Date} [options.now] - A string representing date time in
 *   ISO 8601 format or an instance of Date. Defaults to current date time.
 *
 * @throws {TypeError} If verifiableCredential param is missing.
 * @throws {Error} If the credential (or the presentation params) are missing
 *   required properties.
 *
 * @returns {Presentation} The credential wrapped inside of a
 *   VerifiablePresentation.
 */
export function createPresentation({
  verifiableCredential, id, holder, now
} = {}) {
  const presentation = {
    '@context': [CREDENTIALS_CONTEXT_V2_URL],
    type: ['VerifiablePresentation']
  };
  if(verifiableCredential) {
    const credentials = [].concat(verifiableCredential);
    // ensure all credentials are valid
    for(const credential of credentials) {
      _checkCredential({credential, now});
    }
    presentation.verifiableCredential = credentials;
    if(hasV1CredentialContext({credential: credentials?.[0]})) {
      presentation['@context'][0] = CREDENTIALS_CONTEXT_V1_URL;
    }
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
 * @param {Presentation} options.presentation - A presentation.
 * @param {LinkedDataSignature} options.suite - passed in to sign()
 *
 * Either pass in a ProofPurpose, or a default one will be created with params:
 * @param {ProofPurpose} [options.purpose] - A ProofPurpose. If not specified,
 *   a default purpose will be created with the domain and challenge options.
 *
 * @param {string} [options.domain] - A domain.
 * @param {string} options.challenge - A required challenge.
 *
 * @param {Function} [options.documentLoader] - A document loader.
 *
 * @returns {Promise<{VerifiablePresentation}>} A VerifiablePresentation with
 *   a proof.
 */
export async function signPresentation(options = {}) {
  const {presentation, domain, challenge} = options;
  const purpose = options.purpose || new AuthenticationProofPurpose({
    domain,
    challenge
  });

  const documentLoader = options.documentLoader || defaultDocumentLoader;

  return jsigs.sign(presentation, {...options, purpose, documentLoader});
}

/**
 * Verifies that the VerifiablePresentation is well formed, and checks the
 * proof signature if it's present. Also verifies all the VerifiableCredentials
 * that are present in the presentation, if any.
 *
 * @param {object} [options={}] - The options.
 * @param {VerifiablePresentation} options.presentation - A
 *   VerifiablePresentation.
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
 * @param {AuthenticationProofPurpose} [options.presentationPurpose] - A
 *   ProofPurpose. If not specified, a default purpose will be created with
 *   the challenge, controller, and domain options.
 *
 * @param {string} [options.challenge] - A challenge. Required if purpose is
 *   not passed in.
 * @param {string} [options.controller] - A controller. Required if purpose is
 *   not passed in.
 * @param {string} [options.domain] - A domain. Required if purpose is not
 *   passed in.
 *
 * @param {Function} [options.documentLoader] - A document loader.
 * @param {Function} [options.checkStatus] - Optional function for checking
 *   credential status if `credentialStatus` is present on the credential.
 * @param {string|Date} [options.now] - A string representing date time in
 *   ISO 8601 format or an instance of Date. Defaults to current date time.
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
      return verifyCredential({...options, credential, documentLoader});
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
    presentation, {...options, purpose, documentLoader});

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

// export for testing
/**
 * @param {object} presentation - An object that could be a presentation.
 *
 * @throws {Error}
 * @private
 */
export function _checkPresentation(presentation) {
  // normalize to an array to allow the common case of context being a string
  const context = Array.isArray(presentation['@context']) ?
    presentation['@context'] : [presentation['@context']];
  assertCredentialContext({context});

  const types = jsonld.getValues(presentation, 'type');

  // check type presence
  if(!types.includes('VerifiablePresentation')) {
    throw new Error('"type" must include "VerifiablePresentation".');
  }
}

// these props of a VC must be an object with a type
// if present in a VC or VP
const mustHaveType = [
  'proof',
  'credentialStatus',
  'termsOfUse',
  'evidence'
];

// export for testing
/**
 * @param {object} options - The options.
 * @param {object} options.credential - An object that could be a
 *   VerifiableCredential.
 * @param {string|Date} [options.now] - A string representing date time in
 *   ISO 8601 format or an instance of Date. Defaults to current date time.
 * @param {string} [options.mode] - The mode of operation for this
 *   validation function, either `issue` or `verify`.
 *
 * @throws {Error}
 * @private
 */
export function _checkCredential({
  credential, now = new Date(), mode = 'verify'
} = {}) {
  if(typeof now === 'string') {
    now = new Date(now);
  }
  assertCredentialContext({context: credential['@context']});

  // check type presence and cardinality
  if(!credential.type) {
    throw new Error('"type" property is required.');
  }

  if(!jsonld.getValues(credential, 'type').includes('VerifiableCredential')) {
    throw new Error('"type" must include `VerifiableCredential`.');
  }

  _checkCredentialSubjects({credential});

  if(!credential.issuer) {
    throw new Error('"issuer" property is required.');
  }
  if(hasV1CredentialContext({credential})) {
    // check issued is a date
    if(!credential.issuanceDate) {
      throw new Error('"issuanceDate" property is required.');
    }

    // check issuanceDate cardinality
    if(jsonld.getValues(credential, 'issuanceDate').length > 1) {
      throw new Error('"issuanceDate" property can only have one value.');
    }
    // check if `now` is before `issuanceDate` on verification
    if(mode === 'verify') {
      let {issuanceDate} = credential;
      if(!dateRegex.test(issuanceDate)) {
        throw new Error(`"issuanceDate" must be a valid date: ${issuanceDate}`);
      }
      // check if `now` is before `issuanceDate`
      issuanceDate = new Date(issuanceDate);
      if(now < issuanceDate) {
        throw new Error(
          `The current date time (${now.toISOString()}) is before the ` +
          `"issuanceDate" (${issuanceDate.toISOString()}).`);
      }
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
    const {credentialStatus} = credential;
    if(Array.isArray(credentialStatus) ?
      credentialStatus.some(cs => !cs.id) : !credentialStatus.id) {
      throw new Error('"credentialStatus" must include an id.');
    }
    if(Array.isArray(credentialStatus) ?
      credentialStatus.some(cs => !cs.type) : !credentialStatus.type) {
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

  if('expirationDate' in credential) {
    const {expirationDate} = credential;
    // check if `expirationDate` property is a date
    if(!dateRegex.test(expirationDate)) {
      throw new Error(
        `"expirationDate" must be a valid date: ${expirationDate}`);
    }
    // check if `now` is after `expirationDate`
    if(now > new Date(expirationDate)) {
      throw new Error('Credential has expired.');
    }
  }
  // check if properties that require a type are
  // defined, objects, and objects with types
  for(const prop of mustHaveType) {
    if(prop in credential) {
      const _value = credential[prop];
      if(Array.isArray(_value)) {
        _value.forEach(entry => _checkTypedObject(entry, prop));
        continue;
      }
      _checkTypedObject(_value, prop);
    }
  }
}

/**
 * @private
 * Checks that a property is non-empty object with
 * property type.
 *
 * @param {object} obj - A potential object.
 * @param {string} name - The name of the property.
 *
 * @throws {Error} if the property is not an object with a type.
 *
 * @returns {undefined} - Returns on success.
 */
function _checkTypedObject(obj, name) {
  if(!isObject(obj)) {
    throw new Error(`property "${name}" must be an object.`);
  }
  if(_emptyObject(obj)) {
    throw new Error(`property "${name}" can not be an empty object.`);
  }
  if(!('type' in obj)) {
    throw new Error(`property "${name}" must have property type.`);
  }
}

/**
 * @private
 * Takes in a credential and checks the credentialSubject(s)
 *
 * @param {object} options - Options.
 * @param {object} options.credential - The credential to check.
 *
 * @throws {Error} error - Throws on errors in the credential subject.
 *
 * @returns {undefined} - Returns on success.
*/
function _checkCredentialSubjects({credential}) {
  if(!credential?.credentialSubject) {
    throw new Error('"credentialSubject" property is required.');
  }
  if(Array.isArray(credential?.credentialSubject)) {
    return credential?.credentialSubject.map(
      subject => _checkCredentialSubject({subject}));
  }
  return _checkCredentialSubject({subject: credential?.credentialSubject});
}

/**
 * @private
 *
 * Checks a credential subject is valid.
 *
 * @param {object} options - Options.
 * @param {object} options.subject - A potential credential subject.
 *
 * @throws {Error} If the credentialSubject is not valid.
 *
 * @returns {undefined} Returns on success.
 */
function _checkCredentialSubject({subject}) {
  if(isObject(subject) === false) {
    throw new Error('"credentialSubject" must be a non-null object.');
  }
  if(_emptyObject(subject)) {
    throw new Error('"credentialSubject" must make a claim.');
  }
  // If credentialSubject.id is present and is not a URI, reject it
  if(subject.id) {
    _validateUriId({
      id: subject.id, propertyName: 'credentialSubject.id'
    });
  }
}

/**
 * @private
 * Checks if parameter is an object.
 *
 * @param {object} obj - A potential object.
 *
 * @returns {boolean} - Returns false if not an object or null.
 */
function isObject(obj) {
  // return false for null even though it has type object
  if(obj === null) {
    return false;
  }
  // if something has type object and is not null return true
  if((typeof obj) === 'object') {
    return true;
  }
  // return false for strings, symbols, etc.
  return false;
}

/**
 * @private
 * Is it an empty object?
 *
 * @param {object} obj - A potential object.
 *
 * @returns {boolean} - Is it empty?
 */
function _emptyObject(obj) {
  // if the parameter is not an object return true
  // as a non-object is an empty object
  if(!isObject(obj)) {
    return true;
  }
  return Object.keys(obj).length === 0;
}

/**
 * @private
 *
 * Validates that an id a URL.
 *
 * @param {object} options - Options.
 * @param {string} options.id - the id.
 * @param {string} options.propertyName - The property name.
 *
 * @throws {Error} Throws if an id is not a URL.
 *
 * @returns {undefined} Returns on success.
 */
function _validateUriId({id, propertyName}) {
  let parsed;
  try {
    parsed = new URL(id);
  } catch(e) {
    const error = new TypeError(`"${propertyName}" must be a URI: "${id}".`);
    error.cause = e;
    throw error;
  }

  if(!parsed.protocol) {
    throw new TypeError(`"${propertyName}" must be a URI: "${id}".`);
  }
}
