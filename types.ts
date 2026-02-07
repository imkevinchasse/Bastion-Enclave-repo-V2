
export interface BreachStats {
  status: 'clean' | 'compromised' | 'unknown';
  lastChecked: number; // Timestamp
  seenCount: number; // How many times seen in HIBP (0 if clean)
}

export interface VaultConfig {
  id: string;
  name: string; // Service Name
  username: string; // Public Identifier
  version: number; // To rotate passwords, increment version
  length: number;
  useSymbols: boolean;
  category: 'login' | 'card' | 'note';
  updatedAt: number;
  customPassword?: string; // Optional: User-defined password (overrides generator)
  
  // COMPLIANCE UPDATE: Granular breach tracking
  breachStats?: BreachStats; 
  compromised?: boolean; // @deprecated: Kept for migration, use breachStats

  // SORTING & METRICS
  createdAt?: number; // Timestamp of creation
  usageCount?: number; // Number of times accessed/copied
  sortOrder?: number; // User-defined manual order index
}

export interface Note {
  id: string;
  title: string;
  content: string;
  updatedAt: number;
}

export interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  notes: string;
  updatedAt: number;
}

/**
 * GENESIS ARTIFACT
 * A specific, scarce proof of early adoption/stewardship.
 * Linked to a specific Protocol Epoch.
 */
export interface GenesisArtifact {
  id: string; // Hash of the artifact
  epoch: string; // e.g., "V3.5_GENESIS"
  rank: number; // Calculated based on time-of-entry (lower is rarer)
  issuedAt: number;
  totalSlots: number; // The theoretical max slots for this epoch
}

/**
 * IDENTITY & ATTESTATION
 * Cryptographic proofs of contribution and adherence to the protocol.
 */
export interface IdentityProof {
  id: string; // Public Key Fingerprint (Hex)
  type: 'pledge' | 'supporter';
  tier: 'sovereign' | 'advocate' | 'architect' | 'guardian';
  stewardName?: string; // Optional: Named Continuity Bond
  timestamp: number;
  signature: string; // Hex signature of the pledge statement
  publicKey: JsonWebKey; // The public key used to verify the signature
  privateKey?: JsonWebKey; // Stored locally to allow re-signing or proof generation
  genesis?: GenesisArtifact; // Optional: If bonded during a Genesis Window
  veteran?: { version: number; label: string }; // Optional: For users migrating from V1/V2
}

/**
 * RESONANCE (formerly LockerEntry)
 * A cryptographic binding between the Vault (Key) and an External Blob (Ciphertext).
 * 
 * SECURITY INVARIANTS:
 * 1. DECOUPLED ENTROPY: The `key` is purely random (32 bytes). It is NOT derived from the password or filename.
 * 2. DEAD-MAN DEPENDENCY: Loss of this `Resonance` object = Irreversible loss of the file.
 * 3. INTEGRITY: The `hash` ensures the decrypted payload matches the original exact state.
 */
export interface Resonance {
  id: string; // UUID linking to the physical file header
  label: string; // Human readable label (Metadata only, not used for seed)
  size: number;
  mime: string;
  key: string; // Hex-encoded 256-bit AES key (THE RESONANCE)
  hash: string; // SHA-256 integrity check of original file
  timestamp: number;
  embedded?: boolean; // If true, the ciphertext is persisted in the local browser BlobStore
}

// Legacy alias for compatibility during migration
export type LockerEntry = Resonance;

// Bitmask flags for Vault Capabilities
export enum VaultFlags {
  NONE = 0,
  DEVELOPER = 1 << 0, // 0x01
  BETA_FEATURES = 1 << 1, // 0x02
}

// The complete state of the user's vault
export interface VaultState {
  entropy: string; // 32 bytes hex - The internal random seed for this vault
  configs: VaultConfig[];
  notes: Note[];
  contacts: Contact[];
  locker: Resonance[];
  
  // Security & Integrity Meta
  version: number; // Monotonic counter to detect rollback
  lastModified: number; // Timestamp of last write
  lastBreachCheck?: number; // Global timestamp of last scan start
  flags?: number; // Bitmask for vault capabilities (Encrypted)
  
  // Identity Layer
  identity?: IdentityProof;
  
  // Legacy Tracking
  legacyOrigin?: number; // Tracks the protocol version this vault was originally created with (if < 3)
}

export enum SecurityLevel {
  CRITICAL = 'CRITICAL',
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
}

export interface AuditResult {
  score: number;
  level: SecurityLevel;
  suggestions: string[];
  analysis: string;
}

export interface PhishingResult {
  riskLevel: 'SAFE' | 'SUSPICIOUS' | 'DANGEROUS';
  confidence: number;
  indicators: string[]; 
  analysis: string;
}

export enum AppTab {
  VAULT = 'VAULT',
  NOTES = 'NOTES',
  CONTACTS = 'CONTACTS',
  LOCKER = 'LOCKER',
  GENERATOR = 'GENERATOR',
  SANDBOX = 'SANDBOX',
  DEVELOPER = 'DEVELOPER',
  IDENTITY = 'IDENTITY'
}

export interface LLMStatus {
  status: 'idle' | 'loading' | 'ready' | 'error';
  progress: number;
  message: string;
}

export type PublicPage = 'landing' | 'auth' | 'news' | 'documents' | 'game' | 'docs' | 'breach';
