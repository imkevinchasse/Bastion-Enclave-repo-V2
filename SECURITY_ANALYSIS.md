# Security Analysis: Bastion Enclave

**Date:** 2026-05-18
**Target:** Bastion Enclave (Sovereign-V3.5 / Codename: THE_ONE)
**Scope:** Architecture, Cryptography, Implementation, and Attack Surface.

---

## 1. Executive Summary

Bastion Enclave is architected with a strong "Zero-Knowledge" and "Client-Side First" philosophy. It demonstrates excellent cryptographic maturity by utilizing modern, memory-hard key derivation functions (Argon2id) and authenticated encryption (AES-256-GCM). However, the application operates within the inherently high-risk browser environment, which introduces significant trade-offs regarding the application's attack surface, particularly when enabling features explicitly designed for headless agent automation (`AgentBridge`, Semantic DOM Hooks).

## 2. Architectural Strengths

*   **Memory-Hard KDF (Argon2id):** The use of Argon2id with 128MB memory costs (V4 specification) significantly increases the cost of brute-force attacks compared to legacy PBKDF2/Bcrypt approaches.
*   **Authenticated Encryption (AES-256-GCM):** The implementation utilizes authenticated encryption to ensure both confidentiality and strict integrity (tamper-resistance) of the vault data.
*   **Guardrail Invariants:** The `Guardrail` service enforces physical laws (Identity, Causality, Temporal) on vault state transitions. This is a robust defense against state-corruption bugs that could lead to logic-based vulnerabilities.
*   **Offline Capability:** By minimizing dependency on remote network communication, the attack surface related to MITM attacks or malicious server responses is virtually eliminated for the core cryptographic loop.

## 3. Vulnerability Analysis & Attack Surface

### 3.1. Browser as an Untrusted Execution Environment
As a Progressive Web App (PWA), Bastion Enclave inherits all vulnerabilities of the host browser.
*   **XSS & Hooked Injection:** Malicious scripts running in the same origin (e.g., via a compromised dependency or cross-site scripting) can interact with `window.__BASTION_AGENT_API__` or use the Semantic DOM (`data-agent-id` selectors) to exfiltrate data, perform unauthorized cryptographic operations, or manipulate the vault.
*   **Malicious Browser Extensions:** Extensions have privileged access to the DOM and can easily inject code to intercept user interaction with the enclave.

### 3.2. Agent-First Paradox (Deprecated Surface)
Bastion previously provided explicit hooks for headless agent interaction.
*   **Risk (Historical):** Documenting stable DOM identifiers (`data-agent-id`) and an injectable JS bridge (`__BASTION_AGENT_API__`) made it easier to create autonomous malicious agents that could programmatically interact with the vault.
*   **Mitigation (Completed):** These features have been entirely removed (July 2026) to reduce the attack surface.

### 3.4. Cryptographic Practice (Anonymization)
*   ** SHA-1 Hashing:** When checking for compromised passwords, the application computes the SHA-1 hash of the password locally. To preserve user privacy while performing the check, the application only sends the first 5–6 hexadecimal characters of this hash to third-party services (k-anonymity protocol). This is standard practice in the security industry.

## 4. Known Limitations & Risks

| Risk Area | Risk Level | Description |
| :--- | :--- | :--- |
| **XSS / Content Injection** | MEDIUM | Compromise of the host page allows interaction with standard DOM elements. |
| **Browser Extension Spoofing** | MEDIUM | Privileged extensions can mimic agent behavior to exfiltrate vault state. |
| **Update Pipeline** | HIGH | `curl | bash` update pattern lacks cryptographic verification of the update payload (i.e., NO sig-check). |

## 5. Recommendations

1.  **Harden AgentBridge Security:**
    *   Do not leave `window.__BASTION_AGENT_API__` globally accessible by default. Initialize it only after a formal user authentication/authorization flow, and implement strict origin checking (e.g., require agent origin approval).
2.  **Verify Update Payloads:**
    *   Replace the `curl | bash` update mechanism. Use a cryptographically signed binary distribution or at least verify the SHA-256 checksum of the downloaded update before execution, comparing it against a known-good manifest signed by the Bastion development keys.
3.  **Strict CSP:**
    *   Implement a locked-down, production-grade Content Security Policy (CSP). The current rescue-mode CSP is overly permissive (`unsafe-inline`, `unsafe-eval`). This *must* be heavily restricted to `self` and verified CDN origins for production.
4. Sandbox AgentSelectors:
    *   (Removed: This recommendation was satisfied by the complete removal of the `data-agent-id` and `AgentBridge` features).

## 6. Serious & Secure Mitigation Strategies

To reach true production-grade security, the following architectural shifts are mandatory:

### 6.1. Capability-Based AgentBridge Auth
Instead of a global, always-on API bridge, transition to an ephemeral, capability-based model:
*   **Implementation:** `window.__BASTION_AGENT_API__` MUST be `undefined` by default.
*   **The Auth Gate:** When the user initiates an automation workflow, the system generates a high-entropy, short-lived (e.g., 5-minute) capability token, stored only in the user's local memory.
*   **Binding:** The AgentBridge MUST immediately verify the existence of this token upon initialization. Requests lacking validation in the `context` parameter of the bridge MUST be rejected.

### 6.2. Cryptographically Signed Update Manifests
Eliminate the reliance on transport-layer (HTTPS) security for updates:
*   **Implementation:** Bastion update files (the `ZIP` or `Installer`) MUST be accompanied by a `manifest.json.sig` file.
*   **The Verification Chain:** Before `install.sh` executes the update, a lightweight verification utility (WASM-based for browser, binary-based for CLI) MUST verify the `manifest.json.sig` against a hardcoded Ed25519 public key embedded in the Bastion binary. 
*   **Immutable Pinning:** The manifest MUST contain the SHA-256 hashes of the files. The installation MUST fail if hashes do not match the manifest, or if signature verification fails.

### 6.3. Trusted Types API Enforcement
To mitigate XSS-to-AgentBridge exploitation, restrict the DOM's ability to execute injected strings:
*   **Implementation:** Enable the [Trusted Types API](https://developer.mozilla.org/en-US/docs/Web/API/Trusted_Types_API).
*   **Policy:** Define a strict policy that prevents the browser from accepting raw strings as sources for `innerHTML`, `script.src`, or other dangerous DOM sinks. All DOM modifications involving sensitive agent-interaction code MUST be passed through a strict type-check function, rendering simple `innerHTML` injection attacks useless.

### 6.4. Hardware-Backed Vault Isolation
If the environment permits, transition toward hardware-backed keys:
*   **Implementation:** Support WebAuthn to derive/wrap the master vault key using a platform-provided Hardware Security Module (TPM in desktops, Secure Enclave in mobile/macOS).
*   **Result:** The master secret is no longer manipulatable in standard browser memory; browser vulnerabilities only allow access to the *enabled* vault, not the raw encryption keys required for offline data exfiltration.

