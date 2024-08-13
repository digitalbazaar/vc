/*!
 * Copyright (c) 2019-2024 Digital Bazaar, Inc. All rights reserved.
 */

// Example round trip.
// - generate example ECDSA did:key
// - setup 'ecdsa-rdfc-2019 DataIntegrityProof
// - setup document loader
// - sign credential
// - verify credential

import * as EcdsaMultikey from '@digitalbazaar/ecdsa-multikey';
import {cryptosuite as ecdsaRdfc2019Cryptosuite} from
  '@digitalbazaar/ecdsa-rdfc-2019-cryptosuite';
//import * as vc from '@digitalbazaar/vc';
import * as vc from '../lib/index.js';
import {DataIntegrityProof} from '@digitalbazaar/data-integrity';
import {driver} from '@digitalbazaar/did-method-key';

// setup document loader
import {CachedResolver} from '@digitalbazaar/did-io';
import {securityLoader} from '@digitalbazaar/security-document-loader';

//import {contexts as secContexts} from '@digitalbazaar/security-context';
import {contexts as diContexts} from '@digitalbazaar/data-integrity-context';

const loader = securityLoader();
//loader.addDocuments({documents: secContexts});
loader.addDocuments({documents: diContexts});
// example static context
loader.addStatic(
  'https://example.com/ex/v1',
  /* eslint-disable quotes, quote-props, max-len */
  {
    "@context": {
      "ExampleCredential": "https://example.com/ex#Example",
      "example": "https://example.com/ex#example"
    }
  }
  /* eslint-enable quotes, quote-props, max-len */
);
const resolver = new CachedResolver();
const didKeyDriverMultikey = driver();

didKeyDriverMultikey.use({
  multibaseMultikeyHeader: 'zDna',
  fromMultibase: EcdsaMultikey.from
});
resolver.use(didKeyDriverMultikey);
loader.setDidResolver(resolver);

const documentLoader = loader.build();

async function main({credential, documentLoader}) {
  // generate example ecdsa keypair

  const ecdsaKeyPair = await EcdsaMultikey.generate({curve: 'P-256'});

  const {
    didDocument/*, keyPairs, methodFor*/
  } = await didKeyDriverMultikey.fromKeyPair({
    verificationKeyPair: ecdsaKeyPair
  });
  ecdsaKeyPair.id = didDocument.assertionMethod[0];
  ecdsaKeyPair.controller = didDocument.id;

  // ensure issuer matches key controller
  credential.issuer = ecdsaKeyPair.controller;

  // setup ecdsa-rdfc-2019 signing suite
  const signingSuite = new DataIntegrityProof({
    signer: ecdsaKeyPair.signer(),
    // date: '2023-01-01T01:01:01Z',
    cryptosuite: ecdsaRdfc2019Cryptosuite
  });

  // setup documentLoader

  // sign credential
  const verifiableCredential = await vc.issue({
    credential,
    suite: signingSuite,
    documentLoader
  });

  // setup ecdsa-rdfc-2019 verifying suite
  const verifyingSuite = new DataIntegrityProof({
    cryptosuite: ecdsaRdfc2019Cryptosuite
  });

  // verify signed credential
  const verifyResult = await vc.verifyCredential({
    credential: verifiableCredential,
    suite: verifyingSuite,
    documentLoader
  });

  console.log('INPUT CREDENTIAL:');
  console.log(JSON.stringify(credential, null, 2));
  console.log('SIGNED CREDENTIAL:');
  console.log(JSON.stringify(verifiableCredential, null, 2));
  console.log('VERIFY RESULT:');
  console.log(JSON.stringify(verifyResult, null, 2));
}

// sample unsigned credential
const credential =
// Use plain JSON style for data
/* eslint-disable quotes, quote-props, max-len */
{
  "@context": [
    "https://www.w3.org/2018/credentials/v1",
    "https://example.com/ex/v1"
  ],
  "id": "https://example.com/credentials/1872",
  "type": ["VerifiableCredential", "ExampleCredential"],
  "issuer": "https://example.edu/issuers/565049",
  "issuanceDate": "2010-01-01T19:23:24Z",
  "credentialSubject": {
    "id": "did:example:ebfeb1f712ebc6f1c276e12ec21",
    "example": "Example Data"
  }
}
/* eslint-enable quotes, quote-props, max-len */
;

await main({
  credential,
  documentLoader
});
