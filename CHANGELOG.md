# @digitalbazaar/vc ChangeLog

## 3.0.0 - 2022-xx-xx

### Changed
- **BREAKING**: Convert to module (ESM).
- **BREAKING**: Require Node.js >=14.
- Update dependencies.
  - **BREAKING**: `did-veres-one@15.0.0` used in tests.
- Lint module.

## 2.1.0 - 2021-12-20

### Changed
- Sync VC example context from vc-data-model spec source.

## 2.0.0 - 2021-10-20

### Changed
- Fix validation of `credentialSubject.id`, `issuer` and `evidence` --
  if it's not a URI, reject the credential.
- **BREAKING**: No longer pass in custom parameters to `issue()`.

### Added
- If `issuanceDate` is not set, default to `now()` on issuing.

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
