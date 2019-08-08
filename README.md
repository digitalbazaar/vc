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

TODO: Add design considerations for choosing key types / cryptographic 
algorithms for signing your credentials. For now:

* Use **Ed25519**keys if you can
* Use **EcdsaSepc256k1** keys if you must (for example, if you're developing for 
  a Bitcoin-based or Ethereum-based ledger) 
* You _can_ use RSA keys to sign, if your use case requires it.

TODO: Add a brief discussion of where to store the private keys. Point to
several recommended Wallet or KMS libraries.

## Background

TBD

See also (related specs):

* [Verifiable Credentials Data Model](https://w3c.github.io/vc-data-model/)
* [Linked Data Proofs 1.0](https://w3c-dvcg.github.io/ld-proofs/)

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

In order to create or verify Verifiable Credentials, you will most likely need
cryptographic key material, such as public/private key pairs. (There are other
advanced use cases, such as biometrics, that do not involve keys directly, but
those are out of scope for the moment.)

Which key type to use? See the [Security](#security) section for discussion.

Where to store the private keys? See the [Security](#security) section for 
discussion.

To generate an **Ed25519** key pair and corresponding signature suite (see 
[`crypto-ld`](https://github.com/digitalbazaar/crypto-ld/)) docs for advanced
parameters, such as generating from a deterministic key seed):

```js
const {Ed25519KeyPair, suites: {Ed25519Signature2018}} = require('jsonld-signatures');

const keyPair = await Ed25519KeyPair.generate();
keyPair.id = '...'; // See Key IDs section below
keyPair.controller = '...'; // See Controller Documents section below

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
keyPair.id = '...'; // See Key IDs section below
keyPair.controller = '...'; // See Controller Documents section below

const suite = new EcdsaSepc256k1Signature2019({
  verificationMethod: keyPair.id,
  key: keyPair
});
```

### Key IDs

### Controller Documents

### Issuing a Verifiable Credential

```js
const vc = require('vc-js');

const signedVC = await vc.issue({credential, suite});
console.log(JSON.stringify(signedVC, null, 2));
```

### Creating a Verifiable Presentation

To create a verifiable presentation out of one or more verifiable credentials:

```js
const verifiableCredential = [vc1, vc2];

const vp = await vc.createPresentation({verifiableCredential, suite});
console.log(JSON.stringify(vp, null, 2));
```

### Verifying a Verifiable Credential

To verify a verifiable credential:

```js
const result = await vc.verify({credential, suite});
// {valid: true}
```

### Verifying a Verifiable Presentation

To verify a verifiable presentation:

```js
const result = await vc.verify({presentation, suite})
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
