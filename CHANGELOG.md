# @digitalcredentials/vc ChangeLog

## 8.0.0 - 2024-08-03
### Changed
 - **BREAKING**: Switch dependencies to:
   - `@digitalcredentials/jsonld`
   - `@digitalcredentials/jsonld-signatures`
   - `@digitalcredentials/http-client`

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

## 7.0.0 -

### Added
- **BREAKING**: Default issuance now uses VC 2.0 context.
- Support for VC 2.0 credentials issuance and verification.
- Support for VP 2.0 presentations issuance and verification.
- Test vectors for VC 2.0 VCs.

## 6.3.0 - 2023-xx-xx

### Changed
- Change `engines.node` to `>=18` to support newer keys & suites.

## 6.2.0 - 2023-11-14

### Added
- Allow `credentialStatus` arrays in credential status check.

## 6.1.0 - 2023-11-13

### Added
- Add `derive()` API for deriving new verifiable credentials from
  existing ones, for the purpose of selective disclosure or
  unlinkable presentation.

## 6.0.2 - 2023-08-04

### Fixed
- Ensure that `issuanceDate` is only checked on verification,
  not issuance.

## 6.0.1 - 2023-03-17

### Fixed
- Fix bug with option overrides for verifying presentations.

## 6.0.0 - 2023-01-17

### Removed
- **BREAKING**: Remove ODRL and VC examples contexts from `./lib/contexts/` and
  from the default document loader. The contexts are now available in
  [`@digitalbazaar/odrl-context`](https://github.com/digitalbazaar/odrl-context)
  and
  [`@digitalbazaar/credentials-examples-context`](https://github.com/digitalbazaar/credentials-examples-context).

### Changed
- Update dependencies.
  - **BREAKING**: Remove support for `expansionMap`. (Removed in dependencies.)

## 5.0.0 - 2022-08-24

### Changed
- **BREAKING**: Use `jsonld-signatures@11` and `jsonld@8` to get new `safe`
  mode (and on by default when using `canonize`) feature.

## 4.0.0 - 2022-06-23

### Changed
- **BREAKING**: Check if credential has expired when `expirationDate` property
  exists.

### Added
- Add optional param `now` to `verifyCredential()`, `createPresentation()`,
  `verify()`, and `issue()`.

## 3.0.0 - 2022-06-15

### Changed
- **BREAKING**: Convert to module (ESM).
- **BREAKING**: Require Node.js >=14.
- Update dependencies.
  - **BREAKING**: `did-veres-one@15.0.0` used in tests.
- Lint module.

## 2.1.0 - 2021-12-20

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
