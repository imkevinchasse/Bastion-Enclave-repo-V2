import { VaultState, Resonance, VaultConfig } from "../types";
import { BastionSerializer } from "./serializer";

// KDF Constants (Transitioning from Argon2id to PBKDF2 for CSP compliance)
const KDF_CONFIG = {
  ITERATIONS: 100_000,
  HASH_LEN: 32 // 256 bits
};

// LEGACY SUPPORT INFRASTRUCTURE (For future migration handler)
const LEGACY_VERSIONS = {
  V4_KDF: { ITERATIONS: 100_000, DIGEST: "SHA-256" },
  V3: { ITERATIONS: 65536, PARALLELISM: 1 },
  PBKDF2: { ITERATIONS: 210_000, DIGEST: "SHA-512" }
};

const MAGIC_BYTES = new Uint8Array([0x42, 0x41, 0x53, 0x54, 0x49, 0x4f, 0x4e, 0x31]); // "BASTION1"

const HEADER_V4 = new Uint8Array([0x42, 0x53, 0x54, 0x4E, 0x05]); // Argon2id V4 + random framed

const GLYPHS = {
  ALPHA: "abcdefghijklmnopqrstuvwxyz",
  CAPS: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  NUM: "0123456789",
  SYM: "!@#$%^&*()_+-=[]{}|;:,.<>?",
};

const cryptoAPI = globalThis.crypto;

/* ===================== KDF HELPER ===================== */
async function deriveBitsPBKDF2(password: Uint8Array, salt: Uint8Array, iterations: number, length: number): Promise<Uint8Array> {
    const baseKey = await cryptoAPI.subtle.importKey(
        "raw",
        toArrayBuffer(password),
        { name: "PBKDF2" },
        false,
        ["deriveBits"]
    );
    return new Uint8Array(await cryptoAPI.subtle.deriveBits(
        {
            name: "PBKDF2",
            salt: toArrayBuffer(salt),
            iterations: iterations,
            hash: "SHA-256"
        },
        baseKey,
        length * 8 // bits
    ));
}

/* ===================== HELPERS ===================== */
function toArrayBuffer(view: ArrayBuffer | ArrayBufferView): ArrayBuffer {
  if (view instanceof ArrayBuffer) return view;
  return view.buffer.slice(view.byteOffset, view.byteOffset + view.byteLength) as ArrayBuffer;
}

/* ===================== CHAOS LOCK ===================== */
export class ChaosLock {
  static getUUID(): string {
    return cryptoAPI.randomUUID?.() ?? "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, c => {
      const r = (Math.random() * 16) | 0;
      const v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  static enc(str: string): Uint8Array {
    return new TextEncoder().encode(str);
  }

  static dec(view: Uint8Array): string {
    return new TextDecoder().decode(toArrayBuffer(view));
  }

  static concat(...arrays: Uint8Array[]): Uint8Array {
    const total = arrays.reduce((s, a) => s + a.length, 0);
    const out = new Uint8Array(total);
    let offset = 0;
    for (const a of arrays) {
      out.set(a, offset);
      offset += a.length;
    }
    return out;
  }

  static buf2hex(buf: ArrayBuffer | ArrayBufferView): string {
    const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(toArrayBuffer(buf));
    return [...bytes].map(b => b.toString(16).padStart(2, "0")).join("");
  }

  static hex2buf(hex: string): Uint8Array {
    const clean = hex.trim();
    if (clean.length % 2 !== 0) throw new Error("Invalid hex string length");
    if (!/^[0-9a-fA-F]+$/.test(clean)) throw new Error("Invalid hex characters detected");

    const out = new Uint8Array(clean.length / 2);
    for (let i = 0; i < out.length; i++) {
      out[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16);
    }
    return out;
  }

  static async computeHash(data: ArrayBuffer | ArrayBufferView): Promise<string> {
    const hash = await cryptoAPI.subtle.digest("SHA-256", toArrayBuffer(data));
    return this.buf2hex(hash);
  }

  static async generateKey(): Promise<string> {
    const key = await cryptoAPI.subtle.generateKey(
      { name: "AES-GCM", length: 256 },
      true,
      ["encrypt", "decrypt"]
    );
    return this.buf2hex(await cryptoAPI.subtle.exportKey("raw", key));
  }

  static getFileIdFromBlob(blob: Uint8Array): string {
    const idBytes = blob.slice(8, 44);
    return this.dec(idBytes).trim();
  }

  static initDeviceSecret(): void {
    if (!localStorage.getItem('bastion_device_secret')) {
      const secret = cryptoAPI.getRandomValues(new Uint8Array(32));
      localStorage.setItem('bastion_device_secret', this.buf2hex(secret));
    }
  }

  private static async deriveFinalKey(password: Uint8Array, salt: Uint8Array, useDeviceSecret: boolean = true): Promise<CryptoKey> {
    const derivedBytes = await deriveBitsPBKDF2(password, salt, KDF_CONFIG.ITERATIONS, KDF_CONFIG.HASH_LEN);

    let finalMaterial = derivedBytes;
    const deviceSecretHex = localStorage.getItem('bastion_device_secret');
    if (useDeviceSecret && deviceSecretHex) {
      const deviceSecret = this.hex2buf(deviceSecretHex);
      const toHash = this.concat(derivedBytes, deviceSecret);
      finalMaterial = new Uint8Array(await cryptoAPI.subtle.digest("SHA-256", toArrayBuffer(toHash)));
      
      // Wipe sensitive intermediates
      deviceSecret.fill(0);
      toHash.fill(0);
      derivedBytes.fill(0);
    }

    const key = await cryptoAPI.subtle.importKey(
      "raw",
      toArrayBuffer(finalMaterial),
      { name: "AES-GCM" },
      false,
      ["encrypt", "decrypt"]
    );

    // Wipe final material
    finalMaterial.fill(0);

    return key;
  }

  static generateNonce(): Uint8Array {
    const iv = new Uint8Array(12);
    // 96-bit cryptographically random nonce
    cryptoAPI.getRandomValues(iv);
    return iv;
  }

  static async encryptBinary(data: Uint8Array, password: Uint8Array, useDeviceSecret: boolean = true): Promise<Uint8Array> {
    const salt = cryptoAPI.getRandomValues(new Uint8Array(16));
    const iv = this.generateNonce();
    const key = await this.deriveFinalKey(password, salt, useDeviceSecret);
    const encrypted = new Uint8Array(await cryptoAPI.subtle.encrypt(
      { name: "AES-GCM", iv: toArrayBuffer(iv), additionalData: toArrayBuffer(ChaosLock.enc("BASTION_V4")), tagLength: 128 },
      key,
      toArrayBuffer(data)
    ));
    const result = this.concat(HEADER_V4, salt, iv, encrypted);
    encrypted.fill(0);
    return result;
  }

  static async decryptBinary(blob: Uint8Array, password: Uint8Array): Promise<{ data: Uint8Array; version: number }> {
    if (blob.length < 28) throw new Error("Blob too short");

    let offset = 0;
    let version = 1;

    if (blob[0] === 0x42 && blob[1] === 0x53 && blob[2] === 0x54 && blob[3] === 0x4E) {
      const vByte = blob[4];
      version = vByte === 0x05 ? 5 : vByte === 0x04 ? 4 : vByte === 0x03 ? 3 : vByte === 0x02 ? 2 : 1;
      offset = 5;
    }

    const salt = blob.slice(offset, offset + 16);
    const iv = blob.slice(offset + 16, offset + 28);
    const cipher = blob.slice(offset + 28);

    if (version !== 5) {
      const err = new Error(`Migration required: Vault version V${version}`);
      (err as any).code = 'MIGRATION_REQUIRED';
      (err as any).version = version;
      throw err;
    }

    try {
      const key = await this.deriveFinalKey(password, salt, true);
      const decrypted = await cryptoAPI.subtle.decrypt(
          { name: "AES-GCM", iv: toArrayBuffer(iv), additionalData: toArrayBuffer(ChaosLock.enc("BASTION_V4")), tagLength: 128 }, 
          key, 
          toArrayBuffer(cipher)
      );
      return { data: new Uint8Array(decrypted), version };
    } catch (e) {
      // [SOVEREIGN-V5 UPGRADE INFRASTRUCTURE]
      // Legacy V4 fallback (useDeviceSecret=false) removed for strict V5 enforcement.
      throw new Error("Decryption failed. Invalid password or corrupted data.");
    }
  }

  static async pack(state: VaultState, password: Uint8Array, useDeviceSecret: boolean = true): Promise<string> {
    // PRE-ENCRYPTION SECURITY PASS
    const processedState = await this.prepareForSerialization(state, password, useDeviceSecret);
    
    const canonicalJson = BastionSerializer.serialize(processedState);
    const framedBytes = BastionSerializer.frame(canonicalJson);
    const encrypted = await this.encryptBinary(framedBytes, password, useDeviceSecret);
    return btoa(String.fromCharCode(...encrypted));
  }

  static async unpack(blob: string, password: Uint8Array): Promise<{ state: VaultState; version: number }> {
    const bytes = Uint8Array.from(atob(blob), c => c.charCodeAt(0));
    const { data, version } = await this.decryptBinary(bytes, password);
    const jsonStr = version >= 4 ? BastionSerializer.deframe(data) : new TextDecoder().decode(data);
    const parsed = JSON.parse(jsonStr);
    
    // POST-DECRYPTION SECURITY PASS
    const state = await this.processAfterUnpack(parsed, password);
    return { state, version };
  }

  private static async prepareForSerialization(state: VaultState, password: Uint8Array, useDeviceSecret: boolean): Promise<VaultState> {
      const clone = JSON.parse(JSON.stringify(state));
      // Encrypt entropy
      const entropyBytes = new TextEncoder().encode(clone.entropy);
      const encEntropy = await this.encryptBinary(entropyBytes, password, useDeviceSecret);
      clone.entropy = btoa(String.fromCharCode(...encEntropy));
      
      // Encrypt resonance keys
      for (const res of clone.locker) {
          const keyBytes = new TextEncoder().encode(res.key);
          const encKey = await this.encryptBinary(keyBytes, password, useDeviceSecret);
          res.key = btoa(String.fromCharCode(...encKey));
      }
      return clone;
  }

  private static async processAfterUnpack(state: VaultState, password: Uint8Array): Promise<VaultState> {
      const clone = JSON.parse(JSON.stringify(state));
      // Decrypt entropy
      const encEntropyBytes = Uint8Array.from(atob(clone.entropy), c => c.charCodeAt(0));
      const { data: decEntropy } = await this.decryptBinary(encEntropyBytes, password);
      clone.entropy = new TextDecoder().decode(decEntropy);
      
      // Decrypt resonance keys
      for (const res of clone.locker) {
          const encKeyBytes = Uint8Array.from(atob(res.key), c => c.charCodeAt(0));
          const { data: decKey } = await this.decryptBinary(encKeyBytes, password);
          res.key = new TextDecoder().decode(decKey);
      }
      return clone;
  }
}

/* ===================== MIGRATOR ===================== */
export class Migrator {
    static async migrateV4toV5(blob: Uint8Array, password: Uint8Array): Promise<Uint8Array> {
        // 1. Parse V4 blob
        const salt = blob.slice(5, 21);
        const iv = blob.slice(21, 33);
        const cipher = blob.slice(33);
        
        // 2. Decrypt using V4 key
        const key = await this.deriveV4Key(password, salt);
        const decrypted = new Uint8Array(await cryptoAPI.subtle.decrypt(
            { name: "AES-GCM", iv: toArrayBuffer(iv), additionalData: toArrayBuffer(ChaosLock.enc("BASTION_V4")), tagLength: 128 },
            key,
            toArrayBuffer(cipher)
        ));
        
        // 3. Encrypt using V5
        const result = await ChaosLock.encryptBinary(decrypted, password, true);
        
        // 4. Wipe
        decrypted.fill(0);
        return result;
    }

    static async deriveV4Key(password: Uint8Array, salt: Uint8Array): Promise<CryptoKey> {
        const derivedBytes = await deriveBitsPBKDF2(password, salt, LEGACY_VERSIONS.V4_KDF.ITERATIONS, 32);
        const key = await cryptoAPI.subtle.importKey("raw", toArrayBuffer(derivedBytes), { name: "AES-GCM" }, false, ["decrypt"]);
        derivedBytes.fill(0);
        return key;
    }
}

/* ===================== SECRET SHARER ===================== */
export class SecretSharer {
  static async split(secretStr: string, shares: number, threshold: number): Promise<string[]> {
    const sessionKeyBytes = cryptoAPI.getRandomValues(new Uint8Array(32));
    const iv = ChaosLock.generateNonce();
    const key = await cryptoAPI.subtle.importKey(
        "raw", 
        toArrayBuffer(sessionKeyBytes), 
        { name: "AES-GCM" }, 
        false, 
        ["encrypt"]
    );
    const encryptedSecret = await cryptoAPI.subtle.encrypt(
        { name: "AES-GCM", iv: toArrayBuffer(iv) }, 
        key, 
        toArrayBuffer(new TextEncoder().encode(secretStr))
    );
    const payload = new Uint8Array(12 + encryptedSecret.byteLength);
    payload.set(iv, 0);
    payload.set(new Uint8Array(encryptedSecret), 12);
    const payloadHex = ChaosLock.buf2hex(payload);

    const PRIME = 2n ** 256n - 2n ** 32n - 977n;
    const BN = {
      add: (a: bigint, b: bigint) => (a + b) % PRIME,
      mul: (a: bigint, b: bigint) => (a * b) % PRIME,
      random: () => {
        const buf = cryptoAPI.getRandomValues(new Uint8Array(32));
        let val = 0n;
        for (const b of buf) val = (val << 8n) + BigInt(b);
        return val % PRIME;
      }
    };

    let secretInt = 0n;
    for (const b of sessionKeyBytes) secretInt = (secretInt << 8n) + BigInt(b);
    const coeffs: bigint[] = [secretInt];
    for (let i = 1; i < threshold; i++) coeffs.push(BN.random());

    const setId = ChaosLock.buf2hex(cryptoAPI.getRandomValues(new Uint8Array(4)));
    const shards: string[] = [];

    for (let x = 1; x <= shares; x++) {
      let y = 0n;
      const xBig = BigInt(x);
      for (let i = coeffs.length - 1; i >= 0; i--) y = BN.add(BN.mul(y, xBig), coeffs[i]);
      shards.push(`bst_p256_${setId}_${threshold}_${x}_${y.toString(16)}_${payloadHex}`);
    }
    return shards;
  }

  static async combine(shards: string[]): Promise<string> {
    if (!shards.length) throw new Error("No shards provided");
    interface Shard { id: string; k: number; x: bigint; y: bigint; payload: string }
    const parsed: Shard[] = shards.map(s => {
      const parts = s.trim().split("_");
      return { id: parts[2], k: parseInt(parts[3]), x: BigInt(parts[4]), y: BigInt("0x" + parts[5]), payload: parts[6] };
    });

    const first = parsed[0];
    const kShares = parsed.slice(0, first.k);
    const PRIME = 2n ** 256n - 2n ** 32n - 977n;
    const BN = {
      add: (a: bigint, b: bigint) => (a + b) % PRIME,
      sub: (a: bigint, b: bigint) => ((a - b + PRIME) % PRIME),
      mul: (a: bigint, b: bigint) => (a * b) % PRIME,
      pow: (b: bigint, e: bigint) => { let r = 1n; b %= PRIME; while(e>0n){ if(e%2n===1n) r=(r*b)%PRIME; b=(b*b)%PRIME; e/=2n;} return r; },
      inv: (n: bigint) => BN.pow(n, PRIME-2n),
    };

    let secretInt = 0n;
    for (let j = 0; j < kShares.length; j++) {
      const xj = kShares[j].x, yj = kShares[j].y;
      let num = 1n, den = 1n;
      for (let m = 0; m < kShares.length; m++) if (m !== j) {
        const xm = kShares[m].x;
        num = BN.mul(num, BN.sub(0n, xm));
        den = BN.mul(den, BN.sub(xj, xm));
      }
      secretInt = BN.add(secretInt, BN.mul(yj, BN.mul(num, BN.inv(den))));
    }

    const hexKey = secretInt.toString(16).padStart(64, "0");
    const sessionKeyBytes = ChaosLock.hex2buf(hexKey);
    const payloadBytes = ChaosLock.hex2buf(first.payload);
    const iv = payloadBytes.slice(0, 12);
    const cipher = payloadBytes.slice(12);

    const key = await cryptoAPI.subtle.importKey(
        "raw", 
        toArrayBuffer(sessionKeyBytes), 
        { name: "AES-GCM" }, 
        false, 
        ["decrypt"]
    );
    const decrypted = await cryptoAPI.subtle.decrypt(
        { name: "AES-GCM", iv: toArrayBuffer(iv) }, 
        key, 
        toArrayBuffer(cipher)
    );
    return new TextDecoder().decode(decrypted);
  }
}

/* ===================== RESONANCE ENGINE ===================== */
export class ResonanceEngine {
  static async bind(data: Uint8Array, label: string, mime: string): Promise<{ artifact: Uint8Array; resonance: Resonance }> {
    const id = ChaosLock.getUUID();
    const keyHex = await ChaosLock.generateKey();
    const iv = ChaosLock.generateNonce();
    const hash = await ChaosLock.computeHash(data);
    const key = await cryptoAPI.subtle.importKey(
        "raw", 
        toArrayBuffer(ChaosLock.hex2buf(keyHex)), 
        { name: "AES-GCM" }, 
        false, 
        ["encrypt"]
    );
    const encrypted = await cryptoAPI.subtle.encrypt(
        { name: "AES-GCM", iv: toArrayBuffer(iv) }, 
        key, 
        toArrayBuffer(data)
    );
    const header = ChaosLock.concat(MAGIC_BYTES, ChaosLock.enc(id.padEnd(36, " ")).slice(0, 36), iv);
    return { artifact: ChaosLock.concat(header, new Uint8Array(encrypted)), resonance: { id, label, size: data.byteLength, mime, key: keyHex, hash, timestamp: Date.now() } };
  }

  static async resolve(artifact: Uint8Array, res: Resonance): Promise<Uint8Array> {
    const iv = artifact.slice(44, 56);
    const cipher = artifact.slice(56);
    const key = await cryptoAPI.subtle.importKey(
        "raw", 
        toArrayBuffer(ChaosLock.hex2buf(res.key)), 
        { name: "AES-GCM" }, 
        false, 
        ["decrypt"]
    );
    const decrypted = await cryptoAPI.subtle.decrypt(
        { name: "AES-GCM", iv: toArrayBuffer(iv) }, 
        key, 
        toArrayBuffer(cipher)
    );
    return new Uint8Array(decrypted);
  }
}

/* ===================== CHAOS ENGINE ===================== */
export class ChaosEngine {
  private static async flux(entropy: string, salt: string, length: number): Promise<Uint8Array> {
    const enc = new TextEncoder();
    const entropyBytes = enc.encode(entropy);
    const saltBytes = enc.encode(salt);
    
    const result = await deriveBitsPBKDF2(entropyBytes, saltBytes, KDF_CONFIG.ITERATIONS, length * 6);
    
    entropyBytes.fill(0);
    saltBytes.fill(0);
    return result;
  }

  static generateEntropy(): string {
    return [...cryptoAPI.getRandomValues(new Uint8Array(32))].map(b => b.toString(16).padStart(2, "0")).join("");
  }

  static async transmute(master: string, ctx: VaultConfig): Promise<string> {
    if (ctx.customPassword?.length) return ctx.customPassword;
    
    // Salt Determinism: Salt is derived from predictable inputs (service, user) 
    // to ensure reproducibility while remaining complex via Argon2id.
    const baseSalt = JSON.stringify({ v: 4, service: ctx.name.toLowerCase(), user: ctx.username.toLowerCase() });
    
    const pool = GLYPHS.ALPHA + GLYPHS.CAPS + GLYPHS.NUM + (ctx.useSymbols ? GLYPHS.SYM : "");
    
    // Rejection Sampling: Unbiased mapping to prevent modulo bias (critical for entropy quality).
    const limit = Math.floor(256 / pool.length) * pool.length;
    let out = "";
    let counter = 0;
    
    // Side-channel consideration: Loop execution time depends on rejection rate.
    // The rejection rate depends on CSPRNG/Argon2id output entropy.
    while (out.length < ctx.length) {
      const salt = `${baseSalt}::${counter}`;
      const buf = await this.flux(master, salt, ctx.length);
      for (let i = 0; i < buf.length && out.length < ctx.length; i++) {
        const byte = buf[i];
        if (byte < limit) out += pool[byte % pool.length];
      }
      counter++;
    }
    return out;
  }
}
