/*!
 * Copyright (c) 2023 Digital Credentials Consortium. All rights reserved.
 */

import obCtx from '@digitalcredentials/open-badges-context';

export default function wrapWithLegacyLoader(existingLoader) {
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
}
