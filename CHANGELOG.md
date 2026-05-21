# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added
- **Security Manifesto**: Created `SECURITY_MANIFESTO.md` detailing the threat model and limitations.
- **Crypto Test Suite**: Added `/tests/crypto.test.ts` to verify cryptographic roundtrips.
- **Rollback Protection**: Implemented `highWaterMarkVersion` in `VaultState` and updated `App.tsx` logic to detect and block version rollbacks.
- **Field-Level Encryption**: Implemented `prepareForSerialization` and `processAfterUnpack` in `cryptoService.ts` to encrypt `entropy` and `locker` keys, preventing plaintext exposure in `localStorage` and memory dumps.

### Fixed
- **Version Mismatch**: Synchronized protocol version 5 across UI labels (`App.tsx`) and `invariants.ts`.
- **Type Safety**: Fixed `TS2345` and `TS2741` errors in crypto usage across `AuthScreen.tsx`, `Sandbox.tsx`, and `cryptoService.ts` by ensuring correct `Uint8Array` usage.
