# @digitalcredentials/vc ChangeLog

## 9.0.1 - TBD

### Fixed
- run status check before running expiry check because expiry check throws error that had prevented the status check from running

## 9.0.1 - 2024-09-30

### Fixed
- add signature checks to the log before running other verification checks whose errors might prevent that logging

## 9.0.0 - 2024-09-17

### Changed
- **BREAKING**: The dependency `@digitalcredentials/jsonld-signatures@12.0.0` (via `@digitalcredentials/ed25519-signature-2020`)
  now requires `expo-crypto` for React Native sha256 digest hashing, instead of
  `@sphereon/isomorphic-webcrypto@2.5.0-unstable.0`.
  - **IMPORTANT**: This means that IF you're using this library inside a React Native project, you MUST include `expo-crypto`
    in your project's `dependencies`.

## 8.0.1 - 2024-09-04

### Fixed
- Fix stray Error object in `CredentialIssuancePurpose`.

## 8.0.0 - 2024-08-04

### Added
- Add support for VC 2.0 Verifiable Credentials issuance and verification.
- Add support for VC 2.0 Verifiable Presentations issuance and verification.
- Add support for VC 2.0 `validFrom` and `validUntil`.
- Add Test vectors for VC 2.0 VCs & VPs.
- Allow `credentialStatus` arrays in credential status check.
- Add `derive()` API for deriving new verifiable credentials from
  existing ones, for the purpose of selective disclosure or
  unlinkable presentation.
- Add optional param `now` to `verifyCredential()`, `createPresentation()`,
  `verify()`, and `issue()`.

### Changed
- **BREAKING**: Switch dependencies to:
  - `@digitalcredentials/jsonld`
  - `@digitalcredentials/jsonld-signatures`
  - `@digitalcredentials/http-client`
- **BREAKING**: Default issuance now uses VC 2.0 context.
- **BREAKING**: DateTime validator is now an xml schema DateTime validator.
- Change `engines.node` to `>=18` to support newer keys & suites.
- Update dependencies.
  - **BREAKING**: Remove support for `expansionMap`. (Removed in dependencies.)
- **BREAKING**: Use `jsonld-signatures@11` and `jsonld@8` to get new `safe`
  mode (and on by default when using `canonize`) feature.
- **BREAKING**: Check if credential has expired when `expirationDate` property
  exists.
- **BREAKING**: Convert to module (ESM).
- **BREAKING**: Require Node.js >=14.
- Update dependencies.
  - **BREAKING**: `did-veres-one@15.0.0` used in tests.
- Lint module.

### Fixed
- Ensure that `issuanceDate` is only checked on verification,
  not issuance.
- Fix bug with option overrides for verifying presentations.

### Removed
- **BREAKING**: Remove ODRL and VC examples contexts from `./lib/contexts/` and
  from the default document loader. The contexts are now available in
  [`@digitalbazaar/odrl-context`](https://github.com/digitalbazaar/odrl-context)
  and
  [`@digitalbazaar/credentials-examples-context`](https://github.com/digitalbazaar/credentials-examples-context).

## 7.0.0 - 2024-02-07
### Changed
* Switch to DigitalBazaar's `jsonld`, `http-client` and `rdf-canonize` libs
* Switch to Sphereon's fork of `isomorphic-webcrypto`

## 6.0.1 - 2024-01-23
### Changed
- Update to use latest OBv3 context in tests
- Add a test for verifying a 2018-signed VC.

## 6.0.0 - 2023-06-16
### Changed
- **BREAKING**: Add a fallback/override for legacy OBv3 VCs.

## 5.0.0 - 2022-11-03

### Changed
- **BREAKING**: Remove check if `issuanceDate` is not in the future as this is
  a fully expected use-case (to issue credentials that become valid at some
  point in time).

## 4.2.0 - 2022-10-19

### Fixed
- **BREAKING**: For `verify()` and `verifyCredential()`, if an error is encountered,
  re-throw it (do not return it as part of the results log).

## 4.1.1 - 2022-07-06

### Fixed
- Remove use of `URL.protocol` (not implemented in React Native).

## 4.1.0 - 2022-07-06

### Added
- Add fine grained verification event `log` parameter to `verifyCredential()`
  results.

## 4.0.0 - 2022-07-06

### Changed
- **BREAKING**: Check if credential has expired when `expirationDate` property
  exists.

### Added
- Add optional param `now` to `verifyCredential()`, `createPresentation()`,
  `verify()`, and `issue()`.

### Fixed
- Check if credential has expired if `expirationDate` property exists.

## 3.0.0 - 2022-xx-xx

Version skipped to match upstream.

## 2.1.0 - 2021-xx-xx

### Changed
- Sync VC example context from vc-data-model spec source.

## 1.1.2 - 2022-02-02

### Changed
- Refactor _validateUriId (remove protocol check - unsupported by RN).

## 1.1.1 - 2021-09-25

### Changed
- Fix validation of `credentialSubject.id`, `issuer` and `evidence` --
  if it's not a URI, reject the credential.
- **BREAKING**: No longer pass in custom parameters to `issue()`.

### Added
- If `issuanceDate` is not set, default to `now()` on issuing.

## 1.0.1 - 2021-09-20

### Changed
- Remove use of runtime `esm` compiler for TypeScript and ReactNative compat.

## 1.0.0 - 2021-04-22

### Changed
- **BREAKING**: Rename library to `@digitalbazaar/vc`.
- Update dependencies.

### Removed
- **BREAKING**: Remove typescript def generation support.
- **BREAKING**: No longer shipping browser bundles.
- **BREAKING**: Move binaries from `bin/` to `@digitalbazaar/vc-js-cli`.

## 0.6.4 - 2020-05-22

### Added
- The results from verifying a presentation now includes `credentialId` which
  makes it possible to correlate success/failure messages with credentials.

## 0.6.3 - 2020-05-14

### Fixed
- Improve error reporting when `suite` parameter is missing.

## 0.6.2 - 2020-05-04

### Fixed
- Accept string value for a single VP context.

## 0.6.1 - 2020-05-01

### Fixed
- Fix reporting of `credentialResults` in `verify` output.

## 0.6.0 - 2020-04-29

### Added
- Add `checkStatus` option. This is a function that can be passed that
  will be executed when a VC has a `credentialStatus` attribute.

## 0.5.0 - 2020-03-26

### Changed
- `verifiableCredential` param is now optional in `createPresentation()`.
- **BREAKING**: `verify()` now only verifies presentations, not credentials,
  (since that will be the most common use case). For credentials, a separate
  `verifyCredential()` method has been added.
- **BREAKING**: Rename `verify()`'s `purpose` parameter to
  `presentationPurpose`.

## 0.4.1 - 2020-02-20

### Changed
- Multiple types for a VerifiableCredential no longer required (fix).
- Multiple `@context`s for a VC no longer required (fix).

## 0.4.0 - 2020-02-14

### Changed
- **BREAKING**: For VerifiablePresentations, break the async
  `createPresentation()` API into two separate calls:
  a **sync** `createPresentation()` and an async `signPresentation()`.
- **BREAKING**: Change default proof purpose for VerifiablePresentations
  from `assertionMethod` to `authentication`.
- **BREAKING**: A `challenge` param is required when verifying a VP.

### Added
- Add support for optionally verifying unsigned presentations.

## 0.3.0 - 2020-01-28

### Changed
- Update docs.
- Evidence IDs are now optional.
- Update webpack build.
- Cleanups.
- Use `credentials-context` package.
- Update dependencies.
- **BREAKING**: Add further checks for controller, suite and assertionMethod

### Removed
- **BREAKING**: Node.js v6 support.

## 0.2.0 - 2019-08-07

### Added
- Export `defaultDocumentLoader` in main vc.js.

## 0.1.0 - 2019-08-07

### Added
- Initial version. See git history for changes.
