
/**
 * BASTION CRYPTOGRAPHIC TEST SUITE
 * 
 * Verifies primitive integrity and roundtrip functionality.
 */
import { ChaosLock } from '../services/cryptoService';

async function testRoundtrip() {
    console.log("Running Cryptographic Roundtrip Tests...");
    const secret = new TextEncoder().encode("super-secret-password");
    const data = new TextEncoder().encode("sensitive-vault-data");
    
    // Encrypt
    const encrypted = await ChaosLock.encryptBinary(data, secret);
    
    // Decrypt
    const { data: decrypted } = await ChaosLock.decryptBinary(encrypted, secret);
    
    const isMatch = (new TextDecoder().decode(data) === new TextDecoder().decode(decrypted));
    console.assert(isMatch, "Encryption/Decryption roundtrip FAILED");
    if (isMatch) console.log("Roundtrip SUCCESS");
}

async function runAll() {
    await testRoundtrip();
}

runAll().catch(console.error);
