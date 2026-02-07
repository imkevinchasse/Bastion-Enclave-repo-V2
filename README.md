name: Bastion Enclave
shorthand: Bastion
description: >
  Stateless, deterministic credential derivation protocol. Generates
  service-specific credentials from a single root secret and context metadata.
  All outputs are computed locally; no persistent storage, sync, cloud backup,
  or accounts. Trades convenience for deterministic, stateless, verifiable generation.
  Not a consumer password manager.

threat_model:
  protects_against:
    - Credential repository exfiltration (no static store exists)
    - Offline brute-force attacks (no traditional vault file)
    - Cross-service correlation (domain separation ensures independence)
  does_not_protect_against:
    - Active memory forensics (plaintext exists in RAM during derivation)
    - Host compromise (keylogging or screen scraping bypasses protocol)
    - Root secret loss (entropy loss results in permanent credential loss)
  assumptions:
    - Users can securely store and recall a high-entropy root secret
    - Host environment (browser/OS) is trusted; third-party scripts/fonts may introduce risk
    - Bastion Enclave is not appropriate if above assumptions are unacceptable

non_goals:
  - No sync, accounts, or recovery
  - No convenience optimizations
  - Not a replacement for commercial password managers

design_overview:
  description: >
    Inputs (root secret + service context) are processed through a
    deterministic, memory-hard derivation pipeline and mapped to a
    target character set via unbiased rejection sampling. State is purged
    upon termination.
  password_rotation_example: |
    password_v1 = derive(root_secret, "example.com", version=1)
    password_v2 = derive(root_secret, "example.com", version=2)

security_properties:
  - Deterministic regeneration across compliant implementations
  - No server-side attack surface
  - No secrets stored beyond user-held material
  - Uniform, unbiased output distribution

usage_constraints:
  - Losing the root secret is unrecoverable
  - Manual input of context is required for each derivation
  - Not suitable for casual users

open_source_auditability:
  license: MIT
  data_egress: Zero; no data leaves the local device
  telemetry: None
  external_dependencies: >
    Scripts/fonts (analytics, CDN packages) are not security-critical,
    but environment trust is assumed

audience:
  for:
    - Users valuing sovereignty over convenience
    - Engineers needing a stateless credential source
    - Users comfortable managing secrets
  not_for:
    - Users seeking sync, recovery, convenience, or UX guarantees


```text
root_secret = <your 256-bit root secret>
site = "example.com"

# Version 1
password_v1 = derive(root_secret, site, version=1)

# Version 2
password_v2 = derive(root_secret, site, version=2)

