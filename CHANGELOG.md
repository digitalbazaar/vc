# vc-js ChangeLog

## 0.4.0 - TBD

### Changed
- **BREAKING**: For VerifiablePresentations, the async `createPresentation()`
  API is broken out into two separate calls: a **sync** `createPresentation()`
  and an async `signPresentation()`.
- **BREAKING**: Default proof purpose is changed VerifiablePresentations from
  `assertionMethod` to `authentication`.

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
