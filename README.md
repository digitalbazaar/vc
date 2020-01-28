# Verifiable Credentials JS Library _(vc-js)_

[![Build Status](https://travis-ci.org/digitalbazaar/vc-js.png?branch=master)](https://travis-ci.org/digitalbazaar/vc-js)

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

#### Private Key Storage

Where to store the private keys?

TODO: Add a brief discussion of where to store the private keys. Point to
several recommended Wallet or KMS libraries.

Use `await keyPair.export()`

#### Publishing the Public Key

TODO: Explain `documentLoader` / key resolvers, and where to put the public
key so that the verifier can get to it.

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

### Issuing a Verifiable Credential

Pre-requisites:

* You have a private key (with id and controller) and corresponding suite
* If you're using a custom `@context`, make sure it's resolvable
* (Recommended) You have a strategy for where to publish your Controller
  Document and Public Key

TODO: Add section about `documentLoader`

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

TODO: Add section about `documentLoader`

To create a verifiable presentation out of one or more verifiable credentials:

```js
const verifiableCredential = [vc1, vc2];

const verifiablePresentation = await vc.createPresentation({
  verifiableCredential,
  suite
});
console.log(JSON.stringify(verifiablePresentation, null, 2));
```

### Verifying a Verifiable Credential

Pre-requisites:

* If you're using a custom `@context`, make sure it's resolvable
* You're using the correct public key and corresponding suite
* Your Controller Document is reachable via a `documentLoader`

TODO: Add section about `documentLoader`

To verify a verifiable credential:

```js
const result = await vc.verify({credential, suite});
// {valid: true}
```

### Verifying a Verifiable Presentation

Pre-requisites:

* If you're using a custom `@context`, make sure it's resolvable
* You're using the correct public keys and corresponding suites
* Your Controller Documents are reachable via a `documentLoader`

TODO: Add section about `documentLoader`

To verify a verifiable presentation:

```js
const result = await vc.verify({presentation, suite});
// {valid: true}
```

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
