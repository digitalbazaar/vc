# vc-js ChangeLog

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
