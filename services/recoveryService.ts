import { ChaosLock, SecretSharer } from './cryptoService';

export class TOTP {
  static generateSecret(): string {
    const buffer = crypto.getRandomValues(new Uint8Array(20));
    return this.base32Encode(buffer);
  }

  static async getCode(secretBase32: string, timeStep = 30): Promise<string> {
    const secret = this.base32Decode(secretBase32);
    const counter = Math.floor(Date.now() / 1000 / timeStep);
    return this.getCodeForCounter(secret, counter);
  }

  static async verify(secretBase32: string, code: string, window = 1): Promise<boolean> {
    const secret = this.base32Decode(secretBase32);
    const currentCounter = Math.floor(Date.now() / 1000 / 30);
    for (let i = -window; i <= window; i++) {
      const counter = currentCounter + i;
      const generated = await this.getCodeForCounter(secret, counter);
      if (generated === code) return true;
    }
    return false;
  }

  private static async getCodeForCounter(secret: Uint8Array, counter: number): Promise<string> {
    const counterBuffer = new ArrayBuffer(8);
    const view = new DataView(counterBuffer);
    view.setUint32(4, counter, false);

    const key = await crypto.subtle.importKey(
      "raw",
      secret.buffer as ArrayBuffer,
      { name: "HMAC", hash: "SHA-1" },
      false,
      ["sign"]
    );

    const signature = await crypto.subtle.sign("HMAC", key, counterBuffer);
    const hmac = new Uint8Array(signature);
    const offset = hmac[hmac.length - 1] & 0xf;
    const code = (
      ((hmac[offset] & 0x7f) << 24) |
      ((hmac[offset + 1] & 0xff) << 16) |
      ((hmac[offset + 2] & 0xff) << 8) |
      (hmac[offset + 3] & 0xff)
    ) % 1000000;

    return code.toString().padStart(6, "0");
  }

  private static base32Encode(buffer: Uint8Array): string {
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
    let bits = 0;
    let value = 0;
    let output = "";
    for (let i = 0; i < buffer.length; i++) {
      value = (value << 8) | buffer[i];
      bits += 8;
      while (bits >= 5) {
        output += alphabet[(value >>> (bits - 5)) & 31];
        bits -= 5;
      }
    }
    if (bits > 0) {
      output += alphabet[(value << (5 - bits)) & 31];
    }
    return output;
  }

  private static base32Decode(input: string): Uint8Array {
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
    let bits = 0;
    let value = 0;
    let index = 0;
    const output = new Uint8Array(Math.ceil(input.length * 5 / 8));
    for (let i = 0; i < input.length; i++) {
      const val = alphabet.indexOf(input[i].toUpperCase());
      if (val === -1) continue;
      value = (value << 5) | val;
      bits += 5;
      if (bits >= 8) {
        output[index++] = (value >>> (bits - 8)) & 255;
        bits -= 8;
      }
    }
    return output.slice(0, index);
  }
}

export class DeviceBoundStorage {
  private static DB_NAME = "BastionDeviceDB";
  private static STORE_NAME = "keys";

  private static async getDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(this.DB_NAME, 1);
      req.onupgradeneeded = () => {
        req.result.createObjectStore(this.STORE_NAME);
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  static async getOrCreateKey(): Promise<CryptoKey> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.STORE_NAME, "readwrite");
      const store = tx.objectStore(this.STORE_NAME);
      const req = store.get("device_key");
      req.onsuccess = async () => {
        if (req.result) {
          resolve(req.result);
        } else {
          const key = await crypto.subtle.generateKey(
            { name: "AES-GCM", length: 256 },
            false,
            ["encrypt", "decrypt"]
          );
          store.put(key, "device_key");
          resolve(key);
        }
      };
      req.onerror = () => reject(req.error);
    });
  }

  static async encryptShare(share: string): Promise<string> {
    const key = await this.getOrCreateKey();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const enc = new TextEncoder();
    const ciphertext = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      key,
      enc.encode(share)
    );
    const payload = new Uint8Array(12 + ciphertext.byteLength);
    payload.set(iv, 0);
    payload.set(new Uint8Array(ciphertext), 12);
    return ChaosLock.buf2hex(payload);
  }

  static async decryptShare(encryptedHex: string): Promise<string> {
    const key = await this.getOrCreateKey();
    const payload = ChaosLock.hex2buf(encryptedHex);
    const iv = payload.slice(0, 12);
    const ciphertext = payload.slice(12);
    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      key,
      ciphertext
    );
    return new TextDecoder().decode(decrypted);
  }
}

export class RecoveryService {
  static async setupRecovery(masterSeed: string): Promise<{
    shareB: string;
    totpSecret: string;
    totpUri: string;
    recoveryCapsule: string;
  }> {
    const rkBytes = crypto.getRandomValues(new Uint8Array(32));
    const rkHex = ChaosLock.buf2hex(rkBytes);

    const iv = crypto.getRandomValues(new Uint8Array(12));
    const rkCryptoKey = await crypto.subtle.importKey(
      "raw",
      rkBytes,
      { name: "AES-GCM" },
      false,
      ["encrypt"]
    );
    const encryptedSeed = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      rkCryptoKey,
      new TextEncoder().encode(masterSeed)
    );
    const capsulePayload = new Uint8Array(12 + encryptedSeed.byteLength);
    capsulePayload.set(iv, 0);
    capsulePayload.set(new Uint8Array(encryptedSeed), 12);
    const recoveryCapsule = ChaosLock.buf2hex(capsulePayload);

    const shares = await SecretSharer.split(rkHex, 3, 2);
    const shareA = shares[0];
    const shareB = shares[1];
    const shareC = shares[2];

    const encryptedShareA = await DeviceBoundStorage.encryptShare(shareA);
    localStorage.setItem('bastion_share_a', encryptedShareA);

    const totpSecret = TOTP.generateSecret();
    localStorage.setItem('bastion_totp_secret', totpSecret);
    
    // Store Share C locally, gated by TOTP
    localStorage.setItem('bastion_share_c', shareC);

    const totpUri = `otpauth://totp/Bastion:Recovery?secret=${totpSecret}&issuer=Bastion`;

    localStorage.setItem('bastion_recovery_capsule', recoveryCapsule);

    return { shareB, totpSecret, totpUri, recoveryCapsule };
  }

  static async recoverWithDeviceAndTOTP(totpCode: string, recoveryCapsule: string): Promise<string> {
    const totpSecret = localStorage.getItem('bastion_totp_secret');
    if (!totpSecret) throw new Error("TOTP secret not found on device");

    const isValid = await TOTP.verify(totpSecret, totpCode);
    if (!isValid) throw new Error("Invalid TOTP code");

    const encryptedShareA = localStorage.getItem('bastion_share_a');
    const shareC = localStorage.getItem('bastion_share_c');
    if (!encryptedShareA || !shareC) throw new Error("Device shares not found");

    const shareA = await DeviceBoundStorage.decryptShare(encryptedShareA);
    const rkHex = await SecretSharer.combine([shareA, shareC]);

    return this.decryptCapsule(rkHex, recoveryCapsule);
  }

  static async recoverWithBackupAndDevice(shareB: string, recoveryCapsule: string): Promise<string> {
    const encryptedShareA = localStorage.getItem('bastion_share_a');
    if (!encryptedShareA) throw new Error("Device share not found");

    const shareA = await DeviceBoundStorage.decryptShare(encryptedShareA);
    const rkHex = await SecretSharer.combine([shareA, shareB]);

    return this.decryptCapsule(rkHex, recoveryCapsule);
  }
  
  static async recoverWithBackupAndShareC(shareB: string, shareC: string, recoveryCapsule: string): Promise<string> {
    const rkHex = await SecretSharer.combine([shareB, shareC]);
    return this.decryptCapsule(rkHex, recoveryCapsule);
  }

  private static async decryptCapsule(rkHex: string, recoveryCapsule: string): Promise<string> {
    const rkBytes = ChaosLock.hex2buf(rkHex);
    const payload = ChaosLock.hex2buf(recoveryCapsule);
    const iv = payload.slice(0, 12);
    const ciphertext = payload.slice(12);

    const rkCryptoKey = await crypto.subtle.importKey(
      "raw",
      rkBytes.buffer as ArrayBuffer,
      { name: "AES-GCM" },
      false,
      ["decrypt"]
    );

    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      rkCryptoKey,
      ciphertext
    );

    return new TextDecoder().decode(decrypted);
  }
}
