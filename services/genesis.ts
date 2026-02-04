
import { GenesisArtifact } from "../types";

/**
 * BASTION GENESIS ENGINE
 * 
 * Manages the "Scarcity Without Exclusion" mechanics.
 * Calculates Artifact Ranks based on time-decay during the Protocol Epoch.
 */

// EPOCH CONFIGURATION
const EPOCH_NAME = "V3.5_GENESIS";
// Set start date to roughly now (for demo purposes, assume launch was Jan 1 2024)
// In a real scenario, this would be the actual release date.
const EPOCH_START = new Date('2024-01-01T00:00:00Z').getTime(); 
const EPOCH_DURATION_DAYS = 90; // 90 Day Window
const EPOCH_END = EPOCH_START + (EPOCH_DURATION_DAYS * 24 * 60 * 60 * 1000);
const TOTAL_THEORETICAL_SLOTS = 10000;

export class GenesisService {

    static getEpochStatus() {
        const now = Date.now();
        const isOpen = now >= EPOCH_START && now < EPOCH_END;
        const daysRemaining = Math.max(0, Math.ceil((EPOCH_END - now) / (1000 * 60 * 60 * 24)));
        
        // Calculate "Capacity" used based on time decay
        // This simulates slots filling up over time without a central server.
        const progress = Math.min(1, (now - EPOCH_START) / (EPOCH_END - EPOCH_START));
        const estimatedRank = Math.floor(1 + (progress * TOTAL_THEORETICAL_SLOTS));

        return {
            name: EPOCH_NAME,
            isOpen,
            daysRemaining,
            estimatedRank,
            totalSlots: TOTAL_THEORETICAL_SLOTS
        };
    }

    static async mintArtifact(): Promise<GenesisArtifact | undefined> {
        const status = this.getEpochStatus();
        
        if (!status.isOpen) return undefined;

        const idSource = `${EPOCH_NAME}::${Date.now()}::${Math.random()}`;
        const encoder = new TextEncoder();
        const data = encoder.encode(idSource);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

        return {
            id: hashHex.substring(0, 16),
            epoch: EPOCH_NAME,
            rank: status.estimatedRank,
            issuedAt: Date.now(),
            totalSlots: status.totalSlots
        };
    }
}
