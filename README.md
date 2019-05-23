# Verifiable Credentials JS Library _(vc-js)_

[![Build Status](https://travis-ci.org/digitalbazaar/vc-js.png?branch=master)](https://travis-ci.org/digitalbazaar/vc-js)

> A Javascript library for issuing and verifying Verifiable Credentials

## Table of Contents

- [Security](#security)
- [Background](#background)
- [Install](#install)
- [Usage](#usage)
- [API](#api)
- [Testing](#testing)
- [Contribute](#contribute)
- [Commercial Support](#commercial-support)
- [License](#license)

## Security

TBD

## Background

TBD

See also (related specs):

* [Verifiable Credentials Data Model](https://w3c.github.io/vc-data-model/)
* [Linked Data Signatures 1.0](https://w3c-dvcg.github.io/ld-signatures/)

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

Use on the command line, or see the API section below.

### Issuing Credentials

To issue a Verifiable Credential, you need the following:

* A URL for the public key
* A local PEM encoded private key file
* The input credential (`cred.json` in the example)

```bash
./bin/vc-js issue --issuer "https://example.com/keys/1" --private-key example.pem < cred.json
```

### Verifying Credentials

## API

### Issuing a Verifiable Credential - `issue()`

```js
const vc = require('vc-js');

// generate a publicKey / privateKeyBase58 (not shown here)

const suite = new Ed25519Signature2018({
  verificationMethod: publicKey.id,
  key: new Ed25519KeyPair({privateKeyBase58})
});

vc.issue({ credential, suite })
    .then(issuedVc => console.log)
    .catch(console.error);
```

### Creating a Verifiable Presentation - `createPresentation()`

To create a Verifiable Presentation out of one or more Verifiable Credentials:

```js
const vc = require('vc-js');

const verifiableCredential = [vc1, vc2];

const suite = new Ed25519Signature2018({
  verificationMethod: publicKey.id,
  key: new Ed25519KeyPair({privateKeyBase58})
});

vc.createPresentation({ verifiableCredential, suite })
    .then(vp => console.log)
    .catch(console.error);
```

### Verifying - `verify()`

To verify a Verifiable Credential:

```js
const vc = require('vc-js');

vc.verify({ credential, suite })
    .then(result => console.log)
    .catch(console.error);
```

To verify a Verifiable Presentation:

```js
const vc = require('vc-js');

vc.verify({ presentation, suite })
    .then(result => console.log)
    .catch(console.error);
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
