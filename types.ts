
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
  url?: string;
  notes?: string;
  
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
  flags?: number; // Bitmask for vault capabilities (Encrypted)
  
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

export type PublicPage = 'landing' | 'auth' | 'news' | 'documents' | 'game' | 'docs';
