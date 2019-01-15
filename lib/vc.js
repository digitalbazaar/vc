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
(function() {

const jsonld = require('jsonld');
const jsigs = require('jsonld-signatures');
const util = require('./util');

// debuggers
const issueDebug = require('debug')('vc:issue');
const verifyDebug = require('debug')('vc:verify');

// determine if in-browser or using node.js
const _nodejs = (
  typeof process !== 'undefined' && process.versions && process.versions.node);
const _browser = !_nodejs &&
  (typeof window !== 'undefined' || typeof self !== 'undefined');

// attaches API to the given object
/* eslint-disable indent */
const wrapper = function(api) {

/**
 * The default document loader for external documents.
 *
 * @param url the URL to load.
 * @param callback(err, remoteDoc) called once the operation completes.
 */
Object.defineProperty(api, 'documentLoader', {
  get: () => jsonld.documentLoader,
  set: v => jsonld.documentLoader = v
});

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
api.verify = async (options) => {
  const {credential, documentLoader} = options;

  /* TODO implement options that are still relevant
  verifyDebug('options: %O', options);
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
  */

  // run common credential checks
  await _checkCredential({credential, documentLoader});

  // verifyDebug('jsigs options: %O', opts);

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

function _getId(obj) {
  if(typeof obj === 'string') {
    return obj;
  }
  if(!('id' in obj)) {
    throw new Error('"id" not found.');
  }
  return obj.id;
}

async function _checkCredential({credential, documentLoader}) {
  // FIXME: use frame and structural schema check
  jsonld.documentLoader = documentLoader;

  const c = await jsonld.compact(credential, 'https://w3id.org/vc/v1');
  verifyDebug('compact credential: %O', c);

  // check issued cardinality
  if(jsonld.getValues(c, 'issued').length > 1) {
    throw new Error('"issued" property can only have one value.');
  }

  const dateRegex = new RegExp('^[1-9][0-9]{3}-(0[1-9]|1[0-2])-([0-2][0-9]|3[0-1])T([0-1][0-9]|2[0-3]):([0-5][0-9]):(([0-5][0-9])|60)(\\.[0-9]+)?(Z|((\\+|-)([0-1][0-9]|2[0-3]):([0-5][0-9])))?$');

  // check issued is a date
  if(c.issued) {
    if(!dateRegex.test(c.issued)) {
      throw new Error(`"issued" must be a valid date: ${c.issued}`);
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
  if(c.expires) {
    if(!dateRegex.test(c.expires)) {
      throw new Error(`"expires" must be a valid date: ${c.expires}`);
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

// end of API `wrapper` factory
return api;
};

// external APIs:

// used to generate a new API instance
const factory = function() {
  return wrapper(function() {
    return factory();
  });
};

if(!_nodejs && (typeof define === 'function' && define.amd)) {
  // export AMD API
  define([], function() {
    // now that module is defined, wrap main API instance
    wrapper(factory);
    return factory;
  });
} else {
  // wrap the main API instance
  wrapper(factory);

  if(typeof require === 'function' &&
    typeof module !== 'undefined' && module.exports) {
    // export CommonJS/nodejs API
    module.exports = factory;
  }

  /* eslint-disable */
  if(_browser) {
    // export simple browser API
    if(typeof vcjs === 'undefined') {
      vcjs = vcjs_js = factory;
    } else {
      vcjs_js = factory;
    }
  }
}

return factory;

})();
