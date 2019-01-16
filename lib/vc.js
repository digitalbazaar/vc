/**
 * A JavaScript implementation of Verifiable Claims.
 *
 * @author Dave Longley
 * @author David I. Lehn
 *
 * @license BSD 3-Clause License
 * Copyright (c) 2017 Digital Bazaar, Inc.
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
const util = require('./util');

// debuggers
const issueDebug = require('debug')('vc:issue');
const verifyDebug = require('debug')('vc:verify');

const api = {};
module.exports = api;

/**
 * Issue a credential.
 *
 * FIXME ...
 */
api.issue = util.callbackify(async function(options) {
  issueDebug('options: %O', options);

  const opts = {
    creator: options.issuer,
    privateKeyPem: options.privateKeyPem,
    documentLoader: options.documentLoader
  };
  if('date' in options) {
    opts.date = options.date;
  }
  if('domain' in options) {
    opts.domain = options.domain;
  }
  if('nonce' in options) {
    opts.nonce = options.nonce;
  }
  if('algorithm' in options) {
    opts.algorithm = options.algorithm;
  } else {
    opts.algorithm = 'LinkedDataSignature2015';
  }

  // run common credential checks
  await _checkCredential({credential: options.credential});

  issueDebug('jsigs options: %O', opts);

  return jsigs.promises.sign(options.credential, opts);
});

/**
 * Verify a credential.
 */
api.verify = async ({credential, documentLoader}) => {
  // run common credential checks
  await _checkCredential({credential, documentLoader});

  const {AuthenticationProofPurpose} = jsigs.purposes;
  const {Ed25519Signature2018} = jsigs.suites;

  // FIXME: AuthenticationProofPurpose is being used temporarily
  return jsigs.verify(credential, {
    documentLoader,
    purpose: new AuthenticationProofPurpose({
      challenge: 'challengeString'
    }),
    suite: new Ed25519Signature2018(),
  });
};

api.verifyPresentation = async ({
  challenge, domain, presentation, documentLoader
}) => {
  const {AuthenticationProofPurpose} = jsigs.purposes;
  const {Ed25519Signature2018} = jsigs.suites;

  // verify every credential in `verifiableCredential`
  const credentialResult = await Promise.all(presentation.verifiableCredential
    .map(credential => {
      return api.verify({credential, documentLoader});
    }));
  const allCredentialsVerified = credentialResult.every(r => r.verified);
  const presentationResult = await jsigs.verify(presentation, {
    documentLoader,
    purpose: new AuthenticationProofPurpose({challenge, domain}),
    suite: new Ed25519Signature2018(),
  });
  return {
    credentialResult,
    presentationResult,
    verified: (presentationResult.verified && allCredentialsVerified),
  };
};

function _getId(obj) {
  if(typeof obj === 'string') {
    return obj;
  }
  if(!('id' in obj)) {
    throw new Error('"id" not found.');
  }
  return obj.id;
}

async function _checkCredential({credential: c}) {
  // check issued cardinality
  if(jsonld.getValues(c, 'issued').length > 1) {
    throw new Error('"issued" property can only have one value.');
  }

  const dateRegex = new RegExp(
    '^[1-9][0-9]{3}-(0[1-9]|1[0-2])-([0-2][0-9]|3[0-1])T' +
    '([0-1][0-9]|2[0-3]):([0-5][0-9]):(([0-5][0-9])|60)' +
    '(\\.[0-9]+)?(Z|((\\+|-)([0-1][0-9]|2[0-3]):([0-5][0-9])))?$');

  // check issued is a date
  if(c.issuanceDate) {
    if(!dateRegex.test(c.issuanceDate)) {
      throw new Error(`"issued" must be a valid date: ${c.issuanceDate}`);
    }
  }

  // check issuer cardinality
  if(jsonld.getValues(c, 'issuer').length > 1) {
    throw new Error('"issuer" property can only have one value.');
  }

  // check issuer is a URL
  // FIXME
  if(c.issuer) {
    const issuer = _getId(c.issuer);
    if(!issuer.includes(':')) {
      throw new Error(`"issuer" property must be a URL: ${issuer}`);
    }
  }

  // check evidences are URLs
  // FIXME
  jsonld.getValues(c, 'evidence').forEach(v => {
    const evidence = _getId(v);
    if(!evidence.includes(':')) {
      throw new Error(`"evidence" property must be a URL: ${evidence}`);
    }
  });

  // check expires is a date
  if(c.expirationDate) {
    if(!dateRegex.test(c.expirationDate)) {
      throw new Error(`"expires" must be a valid date: ${c.expirationDate}`);
    }
  }

  // check revocations
  jsonld.getValues(c, 'revocation').forEach(v => {
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

  // check revocations URLs
  // FIXME
  jsonld.getValues(c, 'revocation').forEach(v => {
    const revocation = _getId(v);
    if(!revocation.includes(':')) {
      throw new Error(`"revocation" property must be a URL: ${revocation}`);
    }
  });
}

function _setDefaults(options, {
  documentLoader = jsonld.documentLoader,
  ...defaults
}) {
  if(typeof options === 'function') {
    options = {};
  }
  options = options || {};
  return Object.assign({}, {documentLoader}, defaults, options);
}
