
/**
 * BASTION PROTOCOL V5 KNOWN-ANSWER TEST (KAT) SUITE
 * 
 * Defines fixed inputs and expected deterministic outputs for protocol baseline verification.
 * Used for cross-implementation (JS <=> Rust) verification.
 */
import { ChaosLock } from "../services/cryptoService";

async function testKnownVectors() {
    console.log("Running Protocol V5 Known-Answer Tests...");

    // Vector 1: SHA-256 Hash KAT
    // Known output for "hello world" using SHA-256
    const hashInput = "hello world";
    const expectedHash = "b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9";
    const actualHash = await ChaosLock.computeHash(ChaosLock.enc(hashInput));
    
    if (actualHash !== expectedHash) {
        throw new Error(`Hash KAT failed: expected ${expectedHash}, got ${actualHash}`);
    }
    console.log("KAT Hash: Passed.");

    // Vector 2: Structural Constants
    console.assert(ChaosLock.enc("BSTN\x05").length === 5, "Binary Header length mismatch");

    console.log("KAT SUCCESS.");
}

async function run() {
    await testKnownVectors();
}

run().catch(error => {
    console.error(error);
    process.exit(1);
});
