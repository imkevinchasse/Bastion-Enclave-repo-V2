import { VaultState, Resonance, VaultConfig } from "../types";
import { argon2id } from 'hash-wasm';
import { BastionSerializer } from "./serializer";

// PBKDF2 Constants (Legacy Support)
const PBKDF2_V2_ITERATIONS = 210_000;
const PBKDF2_V1_ITERATIONS = 100_000;
const PBKDF2_DIGEST = "SHA-512";

// Argon2id Constants (Current Standard)
const ARGON_MEM_KB = 65536; // 64 MB
const ARGON_ITERATIONS = 3;
const ARGON_PARALLELISM = 1;
const ARGON_HASH_LEN = 32; // 256 bits

const MAGIC_BYTES = new Uint8Array([0x42, 0x41, 0x53, 0x54, 0x49, 0x4f, 0x4e, 0x31]); // "BASTION1"

const HEADER_V2 = new Uint8Array([0x42, 0x53, 0x54, 0x4E, 0x02]); // PBKDF2
const HEADER_V3 = new Uint8Array([0x42, 0x53, 0x54, 0x4E, 0x03]); // Argon2id Raw
const HEADER_V3_5 = new Uint8Array([0x42, 0x53, 0x54, 0x4E, 0x04]); // Argon2id + framed

const GLYPHS = {
  ALPHA: "abcdefghijklmnopqrstuvwxyz",
  CAPS: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  NUM: "0123456789",
  SYM: "!@#$%^&*()_+-=[]{}|;:,.<>?",
};

const cryptoAPI = globalThis.crypto;

/* ===================== HELPERS ===================== */
function toArrayBuffer(view: ArrayBuffer | ArrayBufferView): ArrayBuffer {
  if (view instanceof ArrayBuffer) return view;
  return view.buffer.slice(view.byteOffset, view.byteOffset + view.byteLength);
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

  private static async deriveKeyArgon2id(password: string, salt: Uint8Array): Promise<CryptoKey> {
    const derivedBytes = await argon2id({
      password,
      salt,
      parallelism: ARGON_PARALLELISM,
      iterations: ARGON_ITERATIONS,
      memorySize: ARGON_MEM_KB,
      hashLength: ARGON_HASH_LEN,
      outputType: 'binary'
    });

    return cryptoAPI.subtle.importKey(
      "raw",
      toArrayBuffer(derivedBytes),
      { name: "AES-GCM" },
      false,
      ["encrypt", "decrypt"]
    );
  }

  private static async deriveKeyPBKDF2(password: string, salt: Uint8Array, useDomainSep: boolean = true, iterations: number = PBKDF2_V2_ITERATIONS): Promise<CryptoKey> {
    const finalSalt = useDomainSep ? this.concat(this.enc("BASTION_VAULT_V1::"), salt) : salt;
    const material = await cryptoAPI.subtle.importKey(
      "raw",
      this.enc(password),
      { name: "PBKDF2" },
      false,
      ["deriveKey"]
    );
    return cryptoAPI.subtle.deriveKey(
      { name: "PBKDF2", salt: finalSalt, iterations, hash: "SHA-256" },
      material,
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt", "decrypt"]
    );
  }

  static async encryptBinary(data: Uint8Array, password: string): Promise<Uint8Array> {
    const salt = cryptoAPI.getRandomValues(new Uint8Array(16));
    const iv = cryptoAPI.getRandomValues(new Uint8Array(12));
    const key = await this.deriveKeyArgon2id(password, salt);
    const encrypted = await cryptoAPI.subtle.encrypt(
      { name: "AES-GCM", iv },
      key,
      data
    );
    return this.concat(HEADER_V3_5, salt, iv, new Uint8Array(encrypted));
  }

  static async decryptBinary(blob: Uint8Array, password: string): Promise<{ data: Uint8Array; version: number }> {
    if (blob.length < 28) throw new Error("Blob too short");

    let offset = 0;
    let version = 1;

    if (blob[0] === 0x42 && blob[1] === 0x53 && blob[2] === 0x54 && blob[3] === 0x4E) {
      const vByte = blob[4];
      version = vByte === 0x04 ? 4 : vByte === 0x03 ? 3 : vByte === 0x02 ? 2 : 1;
      offset = 5;
    }

    const salt = blob.slice(offset, offset + 16);
    const iv = blob.slice(offset + 16, offset + 28);
    const cipher = blob.slice(offset + 28);

    const keyFallbacks: (() => Promise<CryptoKey>)[] = [
      () => (version >= 3 ? this.deriveKeyArgon2id(password, salt) : this.deriveKeyPBKDF2(password, salt, true, PBKDF2_V2_ITERATIONS)),
      () => this.deriveKeyPBKDF2(password, salt, false, PBKDF2_V2_ITERATIONS),
      () => this.deriveKeyPBKDF2(password, salt, true, PBKDF2_V2_ITERATIONS)
    ];

    for (const getKey of keyFallbacks) {
      try {
        const key = await getKey();
        const decrypted = await cryptoAPI.subtle.decrypt({ name: "AES-GCM", iv }, key, cipher);
        return { data: new Uint8Array(decrypted), version };
      } catch { /* continue fallback */ }
    }

    throw new Error("Decryption failed. Invalid password or incompatible vault version.");
  }

  static async pack(state: VaultState, password: string): Promise<string> {
    const canonicalJson = BastionSerializer.serialize(state);
    const framedBytes = BastionSerializer.frame(canonicalJson);
    const encrypted = await this.encryptBinary(framedBytes, password);
    return btoa(String.fromCharCode(...encrypted));
  }

  static async unpack(blob: string, password: string): Promise<{ state: VaultState; version: number }> {
    const bytes = Uint8Array.from(atob(blob), c => c.charCodeAt(0));
    const { data, version } = await this.decryptBinary(bytes, password);
    const jsonStr = version >= 4 ? BastionSerializer.deframe(data) : new TextDecoder().decode(data);
    return { state: JSON.parse(jsonStr), version };
  }
}

/* ===================== SECRET SHARER ===================== */
export class SecretSharer {
  static async split(secretStr: string, shares: number, threshold: number): Promise<string[]> {
    const sessionKeyBytes = cryptoAPI.getRandomValues(new Uint8Array(32));
    const iv = cryptoAPI.getRandomValues(new Uint8Array(12));
    const key = await cryptoAPI.subtle.importKey("raw", sessionKeyBytes, { name: "AES-GCM" }, false, ["encrypt"]);
    const encryptedSecret = await cryptoAPI.subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(secretStr));
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

    let hexKey = secretInt.toString(16).padStart(64, "0");
    const sessionKeyBytes = ChaosLock.hex2buf(hexKey);
    const payloadBytes = ChaosLock.hex2buf(first.payload);
    const iv = payloadBytes.slice(0, 12);
    const cipher = payloadBytes.slice(12);

    const key = await cryptoAPI.subtle.importKey("raw", sessionKeyBytes, { name: "AES-GCM" }, false, ["decrypt"]);
    const decrypted = await cryptoAPI.subtle.decrypt({ name: "AES-GCM", iv }, key, cipher);
    return new TextDecoder().decode(decrypted);
  }
}

/* ===================== RESONANCE ENGINE ===================== */
export class ResonanceEngine {
  static async bind(data: Uint8Array, label: string, mime: string): Promise<{ artifact: Uint8Array; resonance: Resonance }> {
    const id = ChaosLock.getUUID();
    const keyHex = await ChaosLock.generateKey();
    const iv = cryptoAPI.getRandomValues(new Uint8Array(12));
    const hash = await ChaosLock.computeHash(data);
    const key = await cryptoAPI.subtle.importKey("raw", ChaosLock.hex2buf(keyHex), { name: "AES-GCM" }, false, ["encrypt"]);
    const encrypted = await cryptoAPI.subtle.encrypt({ name: "AES-GCM", iv }, key, data);
    const header = ChaosLock.concat(MAGIC_BYTES, ChaosLock.enc(id.padEnd(36, " ")).slice(0, 36), iv);
    return { artifact: ChaosLock.concat(header, new Uint8Array(encrypted)), resonance: { id, label, size: data.byteLength, mime, key: keyHex, hash, timestamp: Date.now() } };
  }

  static async resolve(artifact: Uint8Array, res: Resonance): Promise<Uint8Array> {
    const iv = artifact.slice(44, 56);
    const cipher = artifact.slice(56);
    const key = await cryptoAPI.subtle.importKey("raw", ChaosLock.hex2buf(res.key), { name: "AES-GCM" }, false, ["decrypt"]);
    const decrypted = await cryptoAPI.subtle.decrypt({ name: "AES-GCM", iv }, key, cipher);
    return new Uint8Array(decrypted);
  }
}

/* ===================== CHAOS ENGINE ===================== */
export class ChaosEngine {
  private static async flux(entropy: string, salt: string, length: number): Promise<Uint8Array> {
    const enc = new TextEncoder();
    const baseKey = await cryptoAPI.subtle.importKey("raw", enc.encode(entropy), { name: "PBKDF2" }, false, ["deriveBits"]);
    const bitsNeeded = length * 8; // now correct; remove arbitrary *4
    const bits = await cryptoAPI.subtle.deriveBits(
      { name: "PBKDF2", salt: enc.encode(salt), iterations: PBKDF2_V2_ITERATIONS, hash: PBKDF2_DIGEST },
      baseKey,
      bitsNeeded
    );
    return new Uint8Array(bits);
  }

  static generateEntropy(): string {
    return [...cryptoAPI.getRandomValues(new Uint8Array(32))].map(b => b.toString(16).padStart(2, "0")).join("");
  }

  static async transmute(master: string, ctx: VaultConfig): Promise<string> {
    if (ctx.customPassword?.length) return ctx.customPassword;
    const salt = `BASTION_GENERATOR_V2::${ctx.name.toLowerCase()}::${ctx.username.toLowerCase()}::v${ctx.version}`;
    let buf = await this.flux(master, salt, ctx.length);
    const pool = GLYPHS.ALPHA + GLYPHS.CAPS + GLYPHS.NUM + (ctx.useSymbols ? GLYPHS.SYM : "");
    const limit = 256 - (256 % pool.length);
    let out = "", bufIdx = 0;
    while (out.length < ctx.length) {
      if (bufIdx >= buf.length) {
          buf = await this.flux(master, salt + out, ctx.length);
          bufIdx = 0;
      }
      const byte = buf[bufIdx++];
      if (byte < limit) out += pool[byte % pool.length];
    }
    return out;
  }
}