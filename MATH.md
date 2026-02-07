
# Bastion Enclave :: Mathematical Proofs

This document details the exact mathematical formulas and cryptographic primitives used in the **Sovereign-V3.5** protocol.

---

## 1. The Chaos Engine (Deterministic Entropy)

The Chaos Engine transforms a Master Seed and Context into a password without storage.

### 1.1. Key Derivation (Flux)
We generate a pseudo-random stream of bytes ($Flux$) using PBKDF2-HMAC-SHA512.

$$
Flux = \text{PBKDF2}(PRF=\text{HMAC-SHA512}, P=E, S=Salt, c=210,000, dkLen=L \times 4)
$$

Where:
*   $E$: Entropy (32-byte Hex String of Master Seed).
*   $Salt$: $\text{"BASTION\_GENERATOR\_V2::"} \parallel S \parallel \text{"::"} \parallel U \parallel \text{"::v"} \parallel V$
*   $dkLen$: Derived Key Length (4x the password length to allow for rejection sampling).

### 1.2. Unbiased Rejection Sampling
Standard modulo arithmetic (`byte % N`) introduces bias if $256$ is not perfectly divisible by the character set size $N$. 

**Proof of Bias:**
Let $N = 62$ (Alphanumeric).
$256 = 4 \times 62 + 8$.
Bytes $[0, 7]$ map to indices $[0, 7]$ **5 times** ($0, 62, 124, 186, 248$).
Bytes $[8, 61]$ map to indices $[8, 61]$ **4 times**.
Result: The first 8 characters are $1.25x$ more likely to appear.

**Bastion Correction:**
We define a limit $L_{limit}$ to discard the "remainder" portion of the byte space.

$$
L_{limit} = 256 - (256 \pmod N)
$$

**Algorithm:**
For each byte $b \in Flux$:
$$
\text{Action}(b) = 
\begin{cases} 
\text{Use } (b \pmod N) & \text{if } b < L_{limit} \\
\text{Discard} & \text{if } b \ge L_{limit}
\end{cases}
$$

This ensures every chosen index has exactly equal probability $\frac{1}{N}$.

---

## 2. Sovereign-V3.5 Protocol (Vault Encryption)

### 2.1. Argon2id Key Derivation
To protect the vault against GPU brute-force, we use memory-hard derivation.

$$
K_{master} = \text{Argon2id}(P, S, t, m, p)
$$

*   $P$: User Password (UTF-8).
*   $S$: 16-byte Random Salt.
*   $t$: 3 Iterations.
*   $m$: 64 MiB ($2^{16}$ KB).
*   $p$: 1 Parallelism.
*   $K_{master}$: 32-byte (256-bit) AES Key.

### 2.2. Deterministic Framing (Traffic Analysis Resistance)
The plaintext JSON $J$ is wrapped in a binary frame $F$ aligned to 64-byte blocks.

$$
Len = \text{ByteLength}(J)
$$
$$
Header = \text{LittleEndianInt32}(Len)
$$
$$
Total = 4 + Len
$$
$$
Pad_{bytes} = (64 - (Total \pmod{64})) \pmod{64}
$$
$$
F = Header \parallel J \parallel \text{Zeros}(Pad_{bytes})
$$

### 2.3. Authenticated Encryption
$$
C, Tag = \text{AES-GCM}(K_{master}, IV, F)
$$
*   $IV$: 12-byte Random Initialization Vector.
*   $Tag$: 16-byte GCM Authentication Tag.

---

## 3. Threshold Cryptography (Secret Sharing)

We use Shamir's Secret Sharing over a Prime Field $\mathbb{F}_p$.

### 3.1. The Field
We use the secp256k1 order prime to prevent geometric attacks and ensure large keyspace coverage.

$$
p = 2^{256} - 2^{32} - 977
$$

### 3.2. Polynomial Construction
To split a secret integer $S$ into $n$ shares with threshold $k$:

$$
f(x) = S + \sum_{i=1}^{k-1} a_i x^i \pmod p
$$

Where $a_i$ are cryptographically random coefficients $a_i \in [0, p-1]$.

### 3.3. Share Generation
The shares are coordinate pairs $(x, y)$ where:
$$
y = f(x) \pmod p \quad \text{for } x \in \{1, \dots, n\}
$$

### 3.4. Reconstruction (Lagrange Interpolation)
Given $k$ shares $(x_j, y_j)$, we compute the secret $S = f(0)$:

$$
S = \sum_{j=0}^{k-1} y_j \ell_j(0) \pmod p
$$

Where $\ell_j(x)$ are the Lagrange basis polynomials:

$$
\ell_j(x) = \prod_{\substack{m=0 \\ m \neq j}}^{k-1} \frac{x - x_m}{x_j - x_m}
$$

Setting $x=0$:

$$
\ell_j(0) = \prod_{\substack{m=0 \\ m \neq j}}^{k-1} \frac{-x_m}{x_j - x_m} \pmod p
$$

---

## 4. k-Anonymity (Breach Scanner)

To check a password without revealing it to the server.

1.  **Client-Side Hashing:**
    $$ H = \text{SHA-1}(Password) $$
    Result is a 40-character Hex string.

2.  **Prefix Extraction:**
    $$ Prefix = H[0 \dots 4] $$
    $$ Suffix = H[5 \dots 39] $$

3.  **Anonymity Set:**
    Client sends $Prefix$ to server.
    Server returns list of all suffixes $\{S_1, S_2, \dots, S_N\}$ sharing that prefix.

4.  **Local Matching:**
    Client checks if $Suffix \in \{S_1, \dots, S_N\}$.

**Privacy Proof:**
The server sees only the first 5 characters of the hash. The keyspace reduction is $16^5 = 1,048,576$.
Given the size of the SHA-1 space ($16^{40}$), the server receives a bucket containing roughly $\frac{\text{Total Breached Passwords}}{10^6}$ entries. It cannot determine which specific hash in the bucket belongs to the user.
