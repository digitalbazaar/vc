## `@digitalbazaar/vc` Background Documentation

See also (related specs):

* [Verifiable Credentials Data Model](https://w3c.github.io/vc-data-model/)
* [Linked Data Proofs 1.0](https://w3c-ccg.github.io/ld-proofs/)

### Required Design Decisions

As a developer, in order to use this library, you will need to make the
following decisions, constrained by your use case:

1. [Which key type](#choosing-key-type) and suite to use?
2. What is your [Private Key Storage](#private-key-storage) strategy?
   (KMS, file system, secure wallet)
3. Where will you publish your Public Key? (What is your key resolving strategy)
   - This will influence what you'll use for [Key ID](#key-id)s
4. What is your Controller document strategy? (DID, embedded, web, ...)

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
