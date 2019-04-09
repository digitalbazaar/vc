/**
 * A JavaScript implementation of Verifiable Credentials.
 *
 * @author Dave Longley
 * @author David I. Lehn
 *
 * @license BSD 3-Clause License
 * Copyright (c) 2017-2019 Digital Bazaar, Inc.
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
const defaultDocumentLoader = require('./documentLoader');

// debuggers
const issueDebug = require('debug')('vc:issue');
// const verifyDebug = require('debug')('vc:verify');

// module.exports = {
//   issue,
//   verify,
//   verifyPresentation,
//   // export for testing:
//   _checkCredential
// };

/**
 * Issues a verifiable credential.
 *
 * @param {Object} [options={}]
 *
 * @param {Object} options.credential - Base credential document (required)
 * @param {LinkedDataSignature} options.suite - passed in to sign(), (required)
 *
 * Either pass in a ProofPurpose, or a default one will be created:
 * @param {ProofPurpose} [options.purpose]
 * @param {string} [options.controller]
 * @param {string} [options.domain]
 * @param {string} [options.challenge]
 *
 * @param {string|Date} [options.issuanceDate]
 *
 * Other optional params passed to `sign()`:
 * @param {function} [options.documentLoader]
 * @param {Object} [options.expansionMap]
 * @param {boolean} [options.compactProof]
 */
export async function issue(options = {}) {
  issueDebug('options: %O', options);

  const documentLoader = options.documentLoader || defaultDocumentLoader;

  const {controller, domain, challenge} = options;
  const purpose = options.purpose || new CredentialIssuancePurpose({
    controller,
    domain,
    challenge
  });

  // run common credential checks
  await _checkCredential({credential: options.credential});

  return jsigs.sign(options.credential, {purpose, documentLoader, ...options});
};

/**
 * Verify a credential.
 */
export async function verify(options = {}) {
  const {credential} = options;
  // run common credential checks
  try {
    await _checkCredential({credential});
  } catch(e) {
    return {
      verified: false,
      results: [{credential, verified: false, error: e}],
      error: e
    };
  }

  const {controller, domain, challenge} = options;
  const purpose = options.purpose || new CredentialIssuancePurpose({
    controller,
    domain,
    challenge
  });

  return jsigs.verify(credential, {purpose, ...options});
}

/**
 *
 * @param [options={}] {object}
 *
 * @param options.presentation {object} VC Presentation
 *
 * @returns {Promise<{credentialResult: *[], presentationResult: *, verified: boolean}>}
 */
export async function verifyPresentation(options = {}) {
  const {presentation} = options;

  // verify every credential in `verifiableCredential`
  const credentialResult = await Promise.all(presentation.verifiableCredential
    .map(credential => {
      return verify({credential, ...options});
    }));

  const allCredentialsVerified = credentialResult.every(r => r.verified);

  const presentationResult = await verify({credential: presentation, ...options});

  return {
    credentialResult,
    presentationResult,
    verified: (presentationResult.verified && allCredentialsVerified),
  };
}

function _getId(obj) {
  if(typeof obj === 'string') {
    return obj;
  }
  if(!('id' in obj)) {
    throw new Error('"id" not found.');
  }
  return obj.id;
}

export async function _checkCredential({credential}) {
  // check issuanceDate cardinality
  if(jsonld.getValues(credential, 'issuanceDate').length > 1) {
    throw new Error('"issuanceDate" property can only have one value.');
  }

  const dateRegex = new RegExp(
    '^[1-9][0-9]{3}-(0[1-9]|1[0-2])-([0-2][0-9]|3[0-1])T' +
    '([0-1][0-9]|2[0-3]):([0-5][0-9]):(([0-5][0-9])|60)' +
    '(\\.[0-9]+)?(Z|((\\+|-)([0-1][0-9]|2[0-3]):([0-5][0-9])))?$');

  // check issued is a date
  if(credential.issuanceDate) {
    if(!dateRegex.test(credential.issuanceDate)) {
      throw new Error(`"issuanceDate" must be a valid date: ${credential.issuanceDate}`);
    }
  }

  // check issuer cardinality
  if(jsonld.getValues(credential, 'issuer').length > 1) {
    throw new Error('"issuer" property can only have one value.');
  }

  // check issuer is a URL
  // FIXME
  if(credential.issuer) {
    const issuer = _getId(credential.issuer);
    if(!issuer.includes(':')) {
      throw new Error(`"issuer" property must be a URL: ${issuer}`);
    }
  }

  // check evidences are URLs
  // FIXME
  jsonld.getValues(credential, 'evidence').forEach(v => {
    const evidence = _getId(v);
    if(!evidence.includes(':')) {
      throw new Error(`"evidence" property must be a URL: ${evidence}`);
    }
  });

  // check expires is a date
  if(credential.expirationDate && !dateRegex.test(credential.expirationDate)) {
    throw new Error(`"expirationDate" must be a valid date: ${credential.expirationDate}`);
  }

  // check revocations
  jsonld.getValues(credential, 'revocation').forEach(v => {
    // check ids are URLs
    // FIXME
    const revocation = _getId(v);
    if(!revocation.includes(':')) {
      throw new Error(`"revocation" property must be a URL: ${revocation}`);
    }

    // check types are valid
    const knownTypes = ['RevocationList2017'];
    jsonld.getValues(v, 'type').forEach(t => {
      if(!knownTypes.includes(t)) {
        throw new Error(`Unknown revocation type: ${t}`);
      }
    });
  });
}
