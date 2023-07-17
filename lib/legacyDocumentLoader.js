/*!
 * Copyright (c) 2023 Digital Credentials Consortium. All rights reserved.
 */
'use strict';

const obCtx = require('@digitalcredentials/open-badges-context');

module.exports = function wrapWithLegacyLoader(existingLoader) {
  return async function documentLoader(url) {
    if(url === 'https://purl.imsglobal.org/spec/ob/v3p0/context.json') {
      return {
        contextUrl: null,
        documentUrl: url,
        document: obCtx.contexts.get(obCtx.CONTEXT_URL_V3_BETA)
      };
    }

    return existingLoader(url);
  };
};
