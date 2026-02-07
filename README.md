
# Bastion Enclave :: Cryptographic Specification

**Version:** 3.5.0  
**Protocol:** Sovereign-V3.5  
**Architecture:** Offline-First, Zero-Knowledge, Stateless  
**Philosophy:** [The Manifesto](SECURITY_MANIFESTO.md)
**Math:** [Mathematical Proofs](MATH.md)

---

> **"We choose constraint over scale, conviction over convenience, and permanence over growth."**

Bastion Enclave is an opinionated, offline-first password vault. It rejects the industry standard of "Cloud Sync" in favor of absolute client-side sovereignty. We do not ask for your trust; we prove our security through transparent architecture and immutable invariants.

---

## 1. The Chaos Engine™ (Deterministic Generation)

The Chaos Engine removes the need to store passwords by computing them mathematically on-the-fly. This process is stateless and deterministic: the same inputs will always yield the same output across all platforms (Web, Android, Java, Python).

### 1.1. Input Parameters
*   **$E$ (Entropy):** 32-byte (256-bit) cryptographically secure random master seed.
*   **$S$ (Service):** The name of the service (e.g., "GitHub").
*   **$U$ (Username):** The username/identity (e.g., "user@example.com").
*   **$V$ (Version):** Integer counter (starts at 1) for rotation.
*   **$L$ (Length):** Target length of the generated password.

### 1.2. Salt Construction (Domain Separation)
To prevent pre-computation attacks and collisions, we construct a context-aware salt using domain separation.

$$
Salt = \text{"BASTION\_GENERATOR\_V2::"} \parallel \text{lowercase}(S) \parallel \text{"::"} \parallel \text{lowercase}(U) \parallel \text{"::v"} \parallel V
$$

### 1.3. Key Derivation (The Flux)
We generate a pseudo-random stream of bytes (Flux) using PBKDF2.

$$
Flux = \text{PBKDF2-HMAC-SHA512}(P=E, S=Salt, c=210,000, dkLen=L \times 4)
$$

### 1.4. Unbiased Rejection Sampling
We strictly eliminate modulo bias ($byte \pmod N$) by discarding bytes that fall into the incomplete remainder range of the modulus operation. See `MATH.md` for the proof.

---

## 2. The Chaos Lock (Vault Storage)

The Vault State is serialized, framed, and then encrypted. The encryption key is derived from the user's Master Password via Argon2id.

### 2.1. Canonical Serialization (V3.5)
To ensure consistent signatures and prevent metadata leakage via field ordering, the JSON payload is serialized using a **Strict Canonical Order**.

1.  **Root keys** are ordered: `version`, `entropy`, `flags`, `lastModified`, `locker`, `contacts`, `notes`, `configs`.
2.  **Child objects** follow specific ordering definitions (e.g., Configs: `id`, `name`, `username`...).
3.  Unknown fields are sorted alphabetically at the end.

### 2.2. Deterministic Framing & Padding
Before encryption, the Canonical JSON is wrapped in a binary frame to mask the exact content length from traffic analysis.

1.  **Length Header:** 4 bytes (Little Endian integer) representing the length of the JSON payload.
2.  **Payload:** The UTF-8 bytes of the Canonical JSON.
3.  **Padding:** Null bytes (`0x00`) appended to align the total size (Header + Payload + Padding) to the nearest **64-byte block**.

### 2.3. Key Derivation (Argon2id)
For maximum resistance against GPU/ASIC brute-force attacks.

*   **Algorithm:** Argon2id
*   **Memory ($m$):** 64 MB (65536 KB)
*   **Iterations ($t$):** 3
*   **Parallelism ($p$):** 1 (WebAssembly Safe)
*   **Salt:** 16 random bytes
*   **Output:** 32 bytes (256 bits)

### 2.4. Encryption (AES-GCM)
We use Authenticated Encryption to ensure confidentiality and integrity.

$$
Ciphertext, Tag = \text{AES-256-GCM}(Key=Key_{master}, IV=IV, Plaintext=FramedData)
$$

### 2.5. Blob Format (Base64 Encoded)
The storage blob is a concatenation of protocol identifiers and cryptographic data.

$$
Blob = \text{Header} \parallel Salt_{vault} \parallel IV \parallel Ciphertext \parallel Tag
$$

*   **Header (V3.5):** `BSTN` + `0x04`.
*   **Salt:** 16 bytes.
*   **IV:** 12 bytes.

---

## 3. Secret Sharer (Shamir over Prime Field)

Used to split the Master Password or any secret into $n$ shards, requiring $k$ shards to reconstruct.
**Updated in v2.8:** Replaces GF(2^8) byte-splitting with Hybrid Encryption + Shamir over the secp256k1 Prime Field.

### 3.1. Field Definition
Arithmetic is performed modulo the prime $P$ (secp256k1 order):
$$ P = 2^{256} - 2^{32} - 977 $$

### 3.2. Hybrid Scheme (KEM-Style)
1.  **Session Key ($K$):** Random 256-bit integer $0 < K < P$.
2.  **Encryption:** Encrypt Secret ($S$) using $K$ with AES-256-GCM.
3.  **Polynomial:** $f(x) = K + a_1x + \dots + a_{k-1}x^{k-1} \pmod P$.
4.  **Sharding:** Points $(x, y)$ where $y_i = f(x_i) \pmod P$.
5.  **Distribution:** Each shard contains $(x, y)$ AND the encrypted payload.

---

## 4. Resonance Engine (Secure File Locker)

Implements a "Split-Horizon" security model where the Decryption Key and the Encrypted Payload are stored separately.

### 4.1. Process
1.  **Key Gen:** $Key_{file} = \text{CSPRNG}(32 \text{ bytes})$.
2.  **Encryption:** AES-256-GCM with a random 12-byte IV.
3.  **Storage:**
    *   **Payload:** Stored in browser `IndexedDB` or filesystem as an opaque blob.
    *   **Key:** Stored inside the encrypted Vault JSON (`Chaos Lock`).

### 4.2. Invariant
Possessing the file blob (Payload) without the Vault (Key) renders the file mathematically indistinguishable from random noise.

---

## 5. Agent Interface (OpenClaw Protocol)

Bastion V3.5 exposes a semantic interface for autonomous agents to read/write vault data without screen scraping.

### 5.1. Web Bridge
*   **Global Hook:** `window.__BASTION_AGENT_API__`
*   **Methods:** `ping()`, `getStatus()`, `getContext()`, `runDiagnostics()`.
*   **DOM Attributes:** Stable `data-agent-id` selectors on all interactive elements (e.g., `[data-agent-id="vault-search"]`).

### 5.2. Headless CLI
The Java and Python runtimes support a standard IO stream for server-side automation.
*   **Commands:** `unlock`, `add`, `search`, `save`.
*   **Persistence:** The `save` command outputs the full encrypted state JSON to STDOUT for the agent to persist.

---

## 6. Zero-Trace Memory Hygiene

To mitigate RAM scraping and cold-boot attacks, the application enforces strict memory discipline:

1.  **Ephemeral Decryption:** The Master Key exists in memory *only* during the transmutation or decryption operation.
2.  **Immediate Zeroization:** Critical buffers are overwritten with zeros immediately after use.
3.  **Volatile State:** The application state is held in volatile RAM. Closing the tab triggers process termination.
