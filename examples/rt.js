/*!
 * Copyright (c) 2019-2024 Digital Bazaar, Inc. All rights reserved.
 */

// Example round trip.
// - generate example ECDSA did:key for VC
// - setup 'ecdsa-rdfc-2019 DataIntegrityProof
// - setup document loader including did:key and did:web resolvers
// - sign credential with did:key
// - verify credential
// - generate example ECDSA did:web doc for VP
// - create presentation
// - sign presentation with did:web
// - verify presentation

import * as DidKey from '@digitalbazaar/did-method-key';
import * as DidWeb from '@digitalbazaar/did-method-web';
import * as EcdsaMultikey from '@digitalbazaar/ecdsa-multikey';
import {
  cryptosuite as ecdsaRdfc2019Cryptosuite
} from '@digitalbazaar/ecdsa-rdfc-2019-cryptosuite';
//import * as vc from '@digitalbazaar/vc';
import * as vc from '../lib/index.js';
import {DataIntegrityProof} from '@digitalbazaar/data-integrity';
//import {
//  Ed25519VerificationKey2020
//} from '@digitalbazaar/ed25519-verification-key-2020';

// setup document loader
import {CachedResolver} from '@digitalbazaar/did-io';
import {securityLoader} from '@digitalbazaar/security-document-loader';

//import {contexts as secContexts} from '@digitalbazaar/security-context';
import {contexts as diContexts} from '@digitalbazaar/data-integrity-context';

// setup documentLoader
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
const didKeyDriverMultikey = DidKey.driver();
const didWebDriver = DidWeb.driver();

didKeyDriverMultikey.use({
  multibaseMultikeyHeader: 'zDna',
  fromMultibase: EcdsaMultikey.from
});
didWebDriver.use({
  multibaseMultikeyHeader: 'zDna',
  fromMultibase: EcdsaMultikey.from
  //name: 'Ed25519',
  //handler: Ed25519VerificationKey2020,
  //multibaseMultikeyHeader: 'z6Mk',
  //fromMultibase: Ed25519VerificationKey2020.from
});
resolver.use(didKeyDriverMultikey);
resolver.use(didWebDriver);
loader.setDidResolver(resolver);

const documentLoader = loader.build();

async function main({credential, documentLoader}) {
  console.log('CREDENTIAL:');
  console.log(JSON.stringify(credential, null, 2));

  // generate example ecdsa keypair for VC
  const vcEcdsaKeyPair = await EcdsaMultikey.generate({curve: 'P-256'});

  const {
    didDocument: vcDidDocument/*, keyPairs, methodFor*/
  } = await didKeyDriverMultikey.fromKeyPair({
    verificationKeyPair: vcEcdsaKeyPair
  });
  vcEcdsaKeyPair.id = vcDidDocument.assertionMethod[0];
  vcEcdsaKeyPair.controller = vcDidDocument.id;

  // ensure issuer matches key controller
  credential.issuer = vcEcdsaKeyPair.controller;

  // setup ecdsa-rdfc-2019 signing suite
  const vcSigningSuite = new DataIntegrityProof({
    signer: vcEcdsaKeyPair.signer(),
    // date: '2023-01-01T01:01:01Z',
    cryptosuite: ecdsaRdfc2019Cryptosuite
  });

  // sign credential
  const verifiableCredential = await vc.issue({
    credential,
    suite: vcSigningSuite,
    documentLoader
  });

  console.log('SIGNED CREDENTIAL:');
  console.log(JSON.stringify(verifiableCredential, null, 2));

  // setup VC ecdsa-rdfc-2019 verifying suite
  const vcVerifyingSuite = new DataIntegrityProof({
    cryptosuite: ecdsaRdfc2019Cryptosuite
  });

  // verify signed credential
  const verifyCredentialResult = await vc.verifyCredential({
    credential: verifiableCredential,
    suite: vcVerifyingSuite,
    documentLoader
  });

  console.log('VERIFY CREDENTIAL RESULT:');
  console.log(JSON.stringify(verifyCredentialResult, null, 2));
  if(verifyCredentialResult.error) {
    console.log('VP ERROR STACK:',
      verifyCredentialResult.error.errors[0].stack);
  }

  // setup example for did:web
  //const VP_DID = 'did:web:example.org:issuer:123';
  const VP_DID_URL = 'https://example.org/issuer/123';
  //const VP_DID_DOC_URL = VP_DID_URL + '/did.json';

  // generate example ed25519 keypair for VP signer
  const vpEcdsaKeyPair = await EcdsaMultikey.generate({curve: 'P-256'});
  const {
    didDocument: vpDidDocument, methodFor: vpMethodFor
  } = await didWebDriver.fromKeyPair({
    url: VP_DID_URL,
    verificationKeyPair: vpEcdsaKeyPair
  });
  const didWebKey = vpMethodFor({purpose: 'assertionMethod'});
  vcEcdsaKeyPair.id = didWebKey.id;
  vcEcdsaKeyPair.controller = vpDidDocument.id;
  // setup VP ecdsa-rdfc-2019 signing suite
  const vpSigningSuite = new DataIntegrityProof({
    signer: vcEcdsaKeyPair.signer(),
    // date: '2023-01-01T01:01:01Z',
    cryptosuite: ecdsaRdfc2019Cryptosuite
  });

  // add static verification method result
  // FIXME
  // The document loader usually would send did:web URLs to did-method-web
  // which would fetch the DID Document and calculate the result for this from
  // the fragment. Adding a static version here directly to avoid network
  // request for this example. This is fragile and for this example only.
  // Ideally did-method-web driver would support a document loader like
  // interface that could handle VP_DID or VP_DID_DOC_URL.
  const vpDidVm = structuredClone(vpDidDocument.verificationMethod[0]);
  vpDidVm['@context'] = 'https://w3id.org/security/multikey/v1';
  loader.addStatic(vpDidVm.id, vpDidVm);

  // presentation challenge
  const challenge = 'abc123';

  // presentation holder
  const holder = 'did:web:example.com:holder:456';

  const presentation = await vc.createPresentation({
    verifiableCredential,
    holder
  });

  console.log('PRESENTATION:');
  console.log(JSON.stringify(presentation, null, 2));

  // sign presentation
  // note this adds the proof to the input presentation
  const vp = await vc.signPresentation({
    presentation, suite: vpSigningSuite, challenge, documentLoader
  });

  console.log('SIGNED PRESENTATION:');
  console.log(JSON.stringify(vp, null, 2));

  // setup VP ecdsa-rdfc-2019 verifying suite
  const vpVerifyingSuite = new DataIntegrityProof({
    cryptosuite: ecdsaRdfc2019Cryptosuite
  });

  // verify signed presentation
  const verifyPresentationResult = await vc.verify({
    presentation: vp,
    challenge,
    suite: vpVerifyingSuite,
    documentLoader
  });

  console.log('VERIFY PRESENTATION RESULT:');
  console.log(JSON.stringify(verifyPresentationResult, null, 2));
  if(verifyPresentationResult.error) {
    console.log('VP ERROR STACK:',
      verifyPresentationResult.error.errors[0].stack);
  }
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
/* eslint-enable quotes, quote-props, max-len */;

await main({
  credential,
  documentLoader
});
