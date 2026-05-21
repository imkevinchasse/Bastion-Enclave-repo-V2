# Security Manifesto & Threat Model

## 1. Threat Model Disclaimer (The "Sovereign" Limitation)
Bastion provides advanced client-side cryptographic hardening for browser-based vault management. 

**CRITICAL LIMITATION**: This application runs in a web browser (PWA). It is fundamentally *not* a sovereign-trusted execution environment. The security model assumes a competent, non-malicious host platform.
- **Extensions**: Malicious or buggy browser extensions can inspect the DOM, hook `window.crypto`, and gain access to plaintext secrets in heap memory or intercept clipboard operations.
- **CDN/Vercel**: The host environment (Vercel) and the delivery pipeline are not part of the trust boundary.
- **XSS**: Cross-Site Scripting (XSS) is the single most critical failure mode.

**Conclusion**: Do not use this application under the assumption that it provides "air-gapped" or "sovereign-grade" protection against a compromised host or active adversarial browser runtime. 

## 2. Invariants
- Secrets (sessionPassword) must NOT be persisted in plaintext.
- The `VaultState` must be encrypted at rest (localStorage) using Argon2id/AES-GCM.
- Rollback protection (high-water mark versioning) is mandatory for security state.
- Cryptographic roundtrips must be verified by `tests/crypto.test.ts`.

## 3. Persistent Risks
- Root secret (entropy) in memory during active session.
- Browser vulnerability (extensions/hooking) as a primary attack vector.

## 4. Supply Chain & Surface Area Minimization
- **Removed Cloud AI Dependencies**: All cloud-dependent AI SDKs (e.g., Gemini API) have been removed to eliminate telemetric risks and fulfill the "offline-first, zero-telemetry" promise.
- **Surface Area Reduction**: Unused code modules (e.g., `bastion-core` Rust CLI components) have been removed to reduce the attack surface.
- **Protocol Baseline Verification**: Introduced Known-Answer Test (KAT) vectors in `/tests/kat.test.ts` to ensure strict, deterministic compliance between the TypeScript reference implementation and future cross-language implementations.
