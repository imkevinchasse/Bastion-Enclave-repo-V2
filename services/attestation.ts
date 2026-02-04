
import { IdentityProof } from "../types";
import { GenesisService } from "./genesis";

/**
 * BASTION ATTESTATION SERVICE
 * 
 * Manages the cryptographic identity of the Vault.
 * Generates ECDSA keypairs, signs pledges, and creates verifiable proofs of support.
 * 
 * INVARIANT: Personal data (email, name) is never included in the proof.
 * Identity is defined solely by the Key Pair generated within the Vault.
 */
export class AttestationService {

    static async generateIdentity(tier: IdentityProof['tier'], stewardName?: string, legacyVersion?: number): Promise<IdentityProof> {
        // 1. Generate new signing key pair (P-256)
        const keyPair = await window.crypto.subtle.generateKey(
            {
                name: "ECDSA",
                namedCurve: "P-256",
            },
            true,
            ["sign", "verify"]
        );

        // 2. Export Keys to JWK
        const publicKeyJWK = await window.crypto.subtle.exportKey("jwk", keyPair.publicKey);
        const privateKeyJWK = await window.crypto.subtle.exportKey("jwk", keyPair.privateKey);

        // 3. Check for Genesis Artifact
        const genesisArtifact = await GenesisService.mintArtifact();

        // 4. Create Pledge Statement
        const timestamp = Date.now();
        const pledgeStatement = JSON.stringify({
            action: "BASTION_CONTINUITY_BOND",
            tier: tier,
            steward: stewardName || "ANONYMOUS",
            epoch: timestamp,
            genesis: genesisArtifact ? genesisArtifact.epoch : "NONE",
            veteran: legacyVersion ? `V${legacyVersion}` : "NONE",
            agent: "BASTION_CLIENT_V3"
        });

        // 5. Sign Pledge
        const encoder = new TextEncoder();
        const data = encoder.encode(pledgeStatement);
        const signatureBuffer = await window.crypto.subtle.sign(
            {
                name: "ECDSA",
                hash: { name: "SHA-256" },
            },
            keyPair.privateKey,
            data
        );

        // 6. Compute Fingerprint (SHA-256 of Public Key)
        // We use the raw coordinate data for the hash
        const fingerprintInput = (publicKeyJWK.x || '') + (publicKeyJWK.y || '');
        const fingerprintBuffer = await window.crypto.subtle.digest("SHA-256", encoder.encode(fingerprintInput));
        const fingerprint = this.buf2hex(fingerprintBuffer);

        return {
            id: fingerprint.substring(0, 16), // Short ID
            type: tier === 'sovereign' ? 'pledge' : 'supporter',
            tier,
            stewardName,
            timestamp,
            signature: this.buf2hex(signatureBuffer),
            publicKey: publicKeyJWK,
            privateKey: privateKeyJWK,
            genesis: genesisArtifact,
            veteran: legacyVersion ? {
                version: legacyVersion,
                label: `PROTOCOL V${legacyVersion} VETERAN`
            } : undefined
        };
    }

    static async verifyProof(proof: IdentityProof): Promise<boolean> {
        try {
            if (!proof.publicKey) return false;

            const key = await window.crypto.subtle.importKey(
                "jwk",
                proof.publicKey,
                { name: "ECDSA", namedCurve: "P-256" },
                false,
                ["verify"]
            );

            // Reconstruct pledge statement
            // Note: This relies on the fields being identical. In a real system we'd store the raw statement.
            // For this UI demo, we reconstruct based on known schema.
            const pledgeStatement = JSON.stringify({
                action: "BASTION_CONTINUITY_BOND",
                tier: proof.tier,
                steward: proof.stewardName || "ANONYMOUS",
                epoch: proof.timestamp,
                genesis: proof.genesis ? proof.genesis.epoch : "NONE",
                veteran: proof.veteran ? `V${proof.veteran.version}` : "NONE",
                agent: "BASTION_CLIENT_V3"
            });

            const encoder = new TextEncoder();
            const data = encoder.encode(pledgeStatement);
            const signature = this.hex2buf(proof.signature);

            return await window.crypto.subtle.verify(
                { name: "ECDSA", hash: { name: "SHA-256" } },
                key,
                signature as any, // TS Fix: Cast for BufferSource compatibility
                data as any       // TS Fix: Cast for BufferSource compatibility
            );
        } catch (e) {
            console.error("Verification failed", e);
            return false;
        }
    }

    private static buf2hex(buffer: ArrayBuffer): string {
        return Array.from(new Uint8Array(buffer))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
    }

    private static hex2buf(hex: string): Uint8Array {
        const bytes = new Uint8Array(hex.length / 2);
        for (let i = 0; i < hex.length; i += 2) {
            bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
        }
        return bytes;
    }
}
