# Verifiable Credentials JS Library _(vc-js)_

[![Build Status](https://travis-ci.org/digitalbazaar/vc-js.png?branch=master)](https://travis-ci.org/digitalbazaar/vc-js)
[![NPM Version](https://img.shields.io/npm/v/vc-js.svg?style=flat-square)](https://npm.im/vc-js)

> A Javascript library for issuing and verifying Verifiable Credentials

## Table of Contents

- [Security](#security)
- [Background](#background)
- [Install](#install)
- [Usage](#usage)
- [Testing](#testing)
- [Contribute](#contribute)
- [Commercial Support](#commercial-support)
- [License](#license)

## Security

As with most security- and cryptography-related tools, the overall security of
your system will largely depend on your design decisions.

### Required Design Decisions

As a developer, in order to use this library, you will need to make the
following decisions, constrained by your use case:

1. [Which key type](#choosing-key-type) and suite to use?
2. What is your [Private Key Storage](#private-key-storage) strategy?
   (KMS, file system, secure wallet)
3. Where will you publish your Public Key? (What is your key resolving strategy)
   - This will influence what you'll use for [Key ID](#key-id)s
4. What is your Controller document strategy? (DID, embedded, web, ...)

## Background

See also (related specs):

* [Verifiable Credentials Data Model](https://w3c.github.io/vc-data-model/)
* [Linked Data Proofs 1.0](https://w3c-dvcg.github.io/ld-proofs/)

#### Choosing Key Type

In order to create or verify Verifiable Credentials, you will most likely need
cryptographic key material, such as public/private key pairs. (There are other
advanced use cases, such as biometrics, that do not involve keys directly, but
those are out of scope for the moment.)

Which key type to use?

TODO: Add design considerations for choosing key types / cryptographic
algorithms for signing your credentials. For now:

* Use **Ed25519** keys if you can
* Use **EcdsaSepc256k1** keys if you must (for example, if you're developing for
  a Bitcoin-based or Ethereum-based ledger)
* You _can_ use RSA keys to sign, if your use case requires it.

#### Key ID

TODO: Add discussion on typical key ID strategies

* `'did:example:123' + '#' + keyPair.fingerprint()` (Ledger DID based)
* `'did:key:' + keyPair.fingerprint()` ([`did:key` method](https://github.com/digitalbazaar/did-method-key/pull/1/files) based)
* `https://example.com/publicKey.json`
* `urn:123`


#### Controller Document

TODO: Explain controller document

* `did:example:123` (Controller's DID on a ledger)
* Embedded / `did:key` method
* `https://example.com/controller.json` (published on the web)

```js
const controllerDoc = {
  '@context': 'https://w3id.org/security/v2',
  id: controllerId,
  assertionMethod: [keyPair.id]
};
```

## Install

- Node.js 8.3+ required.
- Node.js 10.12.0+ is highly recommended due to RSA key generation speed.

To install locally (for development):

```
git clone https://github.com/digitalbazaar/vc-js.git
cd vc-js
npm install
```

## Usage

### CLI

To use on the command line, see
[`vc-js-cli`](https://github.com/digitalbazaar/vc-js-cli).

### Generating Keys and Suites

See [Choosing Key Type](#choosing-key-type) background discussion for
explanation.

To generate an **Ed25519** key pair and corresponding signature suite (see
[`crypto-ld`](https://github.com/digitalbazaar/crypto-ld/)) docs for advanced
parameters, such as generating from a deterministic key seed):

```js
const {Ed25519KeyPair, suites: {Ed25519Signature2018}} = require('jsonld-signatures');

const keyPair = await Ed25519KeyPair.generate();
keyPair.id = 'https://example.edu/issuers/keys/1'; // See Key ID section
keyPair.controller = 'https://example.com/i/carol'; // See Controller Document section

const suite = new Ed25519Signature2018({
  verificationMethod: keyPair.id,
  key: keyPair
});
```

To generate a **Ecdsa** key pair and corresponding suite:

```js
const Secp256k1KeyPair = require('secp256k1-key-pair');
const EcdsaSepc256k1Signature2019 = require('ecdsa-secp256k1-signature-2019');

const keyPair = await Secp256k1KeyPair.generate();
keyPair.id = 'https://example.edu/issuers/keys/1'; // See Key ID section
keyPair.controller = 'https://example.com/i/carol'; // See Controller Document section

const suite = new EcdsaSepc256k1Signature2019({
  verificationMethod: keyPair.id,
  key: keyPair
});
```

### Custom documentLoader

Pre-requisites:

* You have an existing valid JSON-LD `@context`.
* Your custom context is resolvable at an address.

```js
// jsonld-signatures has a secure context loader
// be requiring this first you ensure security
// contexts are loaded from jsonld-signatures
// and not an insecure source.
const {extendContextLoader} = require('jsonld-signatures');
const vc = require('vc-js');
// vc-js exports its own secure documentLoader.
const {defaultDocumentLoader} = vc;
// a valid json-ld @context.
const myCustomContext = require('./myCustomContext');

const documentLoader = extendContextLoader(async url => {
  if(url === 'did:test:context:foo') {
    return {
      contextUrl: null,
      documentUrl: url,
      document: myCustomContext
    };
  }
  return defaultDocumentLoader(url);
});

// you can now use your custom documentLoader
// with multiple vc methods such as:

const vp = await vc.createPresentation({
  verifiableCredential,
  suite,
  documentLoader
});

// or
const signedVC = await vc.issue({credential, suite, documentLoader});

// or
const result = await vc.verify({credential, suite, documentLoader});

```

### Issuing a Verifiable Credential

Pre-requisites:

* You have a private key (with id and controller) and corresponding suite
* If you're using a custom `@context`, make sure it's resolvable
* (Recommended) You have a strategy for where to publish your Controller
  Document and Public Key

```js
const vc = require('vc-js');

// Sample unsigned credential
const credential = {
  "@context": [
    "https://www.w3.org/2018/credentials/v1",
    "https://www.w3.org/2018/credentials/examples/v1"
  ],
  "id": "https://example.com/credentials/1872",
  "type": ["VerifiableCredential", "AlumniCredential"],
  "issuer": "https://example.edu/issuers/565049",
  "issuanceDate": "2010-01-01T19:23:24Z",
  "credentialSubject": {
    "id": "did:example:ebfeb1f712ebc6f1c276e12ec21",
    "alumniOf": "Example University"
  }
};

const signedVC = await vc.issue({credential, suite});
console.log(JSON.stringify(signedVC, null, 2));
```

### Creating a Verifiable Presentation

Pre-requisites:

* You have the requisite private keys (with id and controller) and
  corresponding suites
* If you're using a custom `@context`, make sure it's resolvable
* (Recommended) You have a strategy for where to publish your Controller
  Documents and Public Keys

#### Creating an Unsigned Presentation

To create a presentation out of one or more verifiable credentials, you can
use the `createPresentation()` convenience function. Alternatively, you can
create the presentation object manually (don't forget to set the `@context` and
`type` properties).

To create a verifiable presentation with a custom `@context` field use a [custom documentLoader](#custom-documentLoader)

```js
const verifiableCredential = [vc1, vc2]; // either array or single object

// optional `id` and `holder`
const id = 'ebc6f1c2';
const holder = 'did:ex:12345';

const presentation = vc.createPresentation({
  verifiableCredential, id, holder
});

console.log(JSON.stringify(presentation, null, 2));
// ->
{
  "@context": [
    "https://www.w3.org/2018/credentials/v1"
  ],
  "type": [
    "VerifiablePresentation"
  ],
  "id": "ebc6f1c2",
  "holder": "did:ex:12345",
  "verifiableCredential": [
    // vc1:
    {
      "@context": [
        "https://www.w3.org/2018/credentials/v1",
        "https://www.w3.org/2018/credentials/examples/v1"
      ],
      "id": "http://example.edu/credentials/1872",
      "type": [
        "VerifiableCredential",
        "AlumniCredential"
      ],
      "issuer": "https://example.edu/issuers/565049",
      "issuanceDate": "2010-01-01T19:23:24Z",
      "credentialSubject": {
        "id": "did:example:ebfeb1f712ebc6f1c276e12ec21",
        "alumniOf": "<span lang=\"en\">Example University</span>"
      },
      "proof": {
        "type": "Ed25519Signature2018",
        "created": "2020-02-03T17:23:49Z",
        "jws": "eyJhbGciOiJFZERTQSIsImI2NCI6ZmFsc2UsImNyaXQiOlsiYjY0Il19..AUQ3AJ23WM5vMOWNtYKuqZBekRAOUibOMH9XuvOd39my1sO-X9R4QyAXLD2ospssLvIuwmQVhJa-F0xMOnkvBg",
        "proofPurpose": "assertionMethod",
        "verificationMethod": "https://example.edu/issuers/keys/1"
      }
    },
    // vc2 goes here ...
  ]
}
```

Note that this creates an _unsigned_ presentation (which may be valid
for some use cases).

#### Signing the Presentation

Once you've created the presentation (either via `createPresentation()` or
manually), you can sign it using `signPresentation()`:

```js
const vp = await vc.signPresentation({presentation, suite, challenge});

console.log(JSON.stringify(vp, null, 2));
// ->
{
  "@context": [
    "https://www.w3.org/2018/credentials/v1"
  ],
  "type": [
    "VerifiablePresentation"
  ],
  "verifiableCredential": [
    {
      "@context": [
        "https://www.w3.org/2018/credentials/v1",
        "https://www.w3.org/2018/credentials/examples/v1"
      ],
      "id": "http://example.edu/credentials/1872",
      "type": [
        "VerifiableCredential",
        "AlumniCredential"
      ],
      "issuer": "https://example.edu/issuers/565049",
      "issuanceDate": "2010-01-01T19:23:24Z",
      "credentialSubject": {
        "id": "did:example:ebfeb1f712ebc6f1c276e12ec21",
        "alumniOf": "<span lang=\"en\">Example University</span>"
      },
      "proof": {
        "type": "Ed25519Signature2018",
        "created": "2020-02-03T17:23:49Z",
        "jws": "eyJhbGciOiJFZERTQSIsImI2NCI6ZmFsc2UsImNyaXQiOlsiYjY0Il19..AUQ3AJ23WM5vMOWNtYKuqZBekRAOUibOMH9XuvOd39my1sO-X9R4QyAXLD2ospssLvIuwmQVhJa-F0xMOnkvBg",
        "proofPurpose": "assertionMethod",
        "verificationMethod": "https://example.edu/issuers/keys/1"
      }
    }
  ],
  "id": "ebc6f1c2",
  "holder": "did:ex:holder123",
  "proof": {
    "type": "Ed25519Signature2018",
    "created": "2019-02-03T17:23:49Z",
    "challenge": "12ec21",
    "jws": "eyJhbGciOiJFZERTQSIsImI2NCI6ZmFsc2UsImNyaXQiOlsiYjY0Il19..ZO4Lkq8-fOruE4oUvuMaxepGX-vLD2gPyNIsz-iA7X0tzC3_96djaBYDxxl6wD1xKrx0h60NjI9i9p_MxoXkDQ",
    "proofPurpose": "authentication",
    "verificationMethod": "https://example.edu/issuers/keys/1"
  }
}
```

### Verifying a Verifiable Presentation

Pre-requisites:

* If you're using a custom `@context`, make sure it's resolvable
* You're using the correct public keys and corresponding suites
* Your Controller Documents are reachable via a `documentLoader`

To verify a verifiable presentation:

```js
// challenge has been received from the requesting party - see 'challenge'
// section below

const result = await vc.verify({presentation, challenge, suite});
// {valid: true}
```

By default, `verify()` will throw an error if the `proof` section is missing.
To verify an unsigned presentation, you must set the `unsignedPresentation`
flag:

```js
const result = await vc.verify({
  presentation, suite, unsignedPresentation: true
});
// {valid: true}
```

#### `challenge` parameter

Verifiable Presentations are typically used for authentication purposes.
A `challenge` param (similar to a `nonce` in OAuth2/OpenID Connect) is provided
by the party that's receiving the VP, and serves to prevent presentation replay
attacks. The workflow is:

1. Receiving party asks for the VerifiablePresentation, and provides a
  `challenge` parameter.
2. The client code creating the VP passes in that challenge (from the requesting
  party), and it gets included in the VP.
3. The client code passes the VP to the receiving party, which then checks to
  make sure the `challenge` is the same as the one it provided in the request
  in 1).

### Verifying a Verifiable Credential

For most situations, Verifiable Credentials will be wrapped in a Verifiable
Presentation and the entire VP should be verified. However, this library
provides a utility function to verify a Verifiable Credential on its own.

Pre-requisites:

* If you're using a custom `@context`, make sure it's resolvable
* You're using the correct public key and corresponding suite
* Your Controller Document is reachable via a `documentLoader`

To verify a verifiable credential:

```js
const result = await vc.verifyCredential({credential, suite});
// {valid: true}
```

To verify a verifiable credential with a custom `@context` field use a [custom documentLoader](#custom-documentLoader)

## Testing

To run Mocha tests:

```
npm run mocha
```

To run the VC Test Suite:

```
npm run fetch-vc-test-suite
npm test
```

## Contribute

See [the contribute file](https://github.com/digitalbazaar/bedrock/blob/master/CONTRIBUTING.md)!

PRs accepted.

Small note: If editing the Readme, please conform to the
[standard-readme](https://github.com/RichardLitt/standard-readme) specification.

## Commercial Support

Commercial support for this library is available upon request from
Digital Bazaar: support@digitalbazaar.com

## License

[New BSD License (3-clause)](LICENSE) © Digital Bazaar
