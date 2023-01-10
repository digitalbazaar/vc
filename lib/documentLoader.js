/*!
 * Copyright (c) 2019-2022 Digital Bazaar, Inc. All rights reserved.
 */
// load locally embedded contexts
import {contexts} from './contexts/index.js';

export async function documentLoader(url) {
  const context = contexts.get(url);
  if(context !== undefined) {
    return {
      contextUrl: null,
      documentUrl: url,
      document: context
    };
  }
  throw new Error(`Document loader unable to load URL "${url}".`);
}
