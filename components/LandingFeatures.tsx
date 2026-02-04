
import React, { useState } from 'react';
import { Archive, Atom, Activity, Lock, FileCode2, Zap, X, Terminal, ShieldCheck, Database, FileKey, Share2, Bot, Workflow } from 'lucide-react';

// --- DATA STRUCTURES ---

const FEATURES = [
  {
    id: 'chaos',
    icon: <Atom size={28} className="text-indigo-400" />,
    title: "Chaos Engine™",
    short: "Stateless, deterministic password computation. No database required.",
    specs: ["HMAC-SHA512", "REJECTION SAMPLING", "DOMAIN SEPARATION"]
  },
  {
    id: 'locker',
    icon: <Archive size={28} className="text-amber-400" />,
    title: "Bastion Locker",
    short: "Memory-hard encryption for sensitive assets using Sovereign-V3.",
    specs: ["ARGON2ID", "AES-256-GCM", "SPLIT-HORIZON"]
  },
  {
    id: 'sharding',
    icon: <Share2 size={28} className="text-emerald-400" />,
    title: "Prime Field Sharing",
    short: "Cryptographically split secrets into recovery shards.",
    specs: ["SHAMIR SECRET SHARING", "FINITE FIELD (Fp)", "INFORMATION THEORETIC SECURITY"]
  },
  {
    id: 'agent',
    icon: <Bot size={28} className="text-pink-400" />,
    title: "OpenClaw Ready",
    short: "Semantic DOM and JSON Bridge for headless automation and agents.",
    specs: ["SEMANTIC DOM", "STATE BRIDGE", "SELENIUM COMPATIBLE"]
  }
];

const GLOSSARY: Record<string, { title: string, body: string }> = {
    "ARGON2ID": {
        title: "Argon2id Key Derivation",
        body: "The winner of the Password Hashing Competition (PHC). Unlike older algorithms (PBKDF2/Bcrypt), Argon2id is 'Memory-Hard'. It forces the attacker to use significant RAM (64MB per attempt), neutralizing the advantage of GPU farms and ASICs used by nation-state actors."
    },
    "HMAC-SHA512": {
        title: "HMAC-SHA512 Flux",
        body: "The Chaos Engine uses SHA-512 (512-bit output) in HMAC mode to generate the entropy stream. This provides 2x the bit-width of standard SHA-256, ensuring sufficient randomness to perform rejection sampling without exhausting the pool."
    },
    "REJECTION SAMPLING": {
        title: "Unbiased Rejection Sampling",
        body: "Standard modulo arithmetic (`byte % N`) introduces statistical bias when 256 is not divisible by N. This bias can theoretically reduce password strength. We implement strict Rejection Sampling: if a random byte falls into the biased 'remainder' zone, we discard it and fetch a new byte. This ensures true mathematical uniformity."
    },
    "DOMAIN SEPARATION": {
        title: "Cryptographic Domain Separation",
        body: "We modify the hashing inputs based on context. A password generated for 'Google' uses a completely different mathematical salt structure than one for 'Amazon'. This prevents 'Rainbow Table' attacks from working across your vault."
    },
    "AES-256-GCM": {
        title: "Advanced Encryption Standard (GCM)",
        body: "We use Galois/Counter Mode (GCM) with unique 12-byte IVs for every operation. This provides Authenticated Encryption (AEAD), guaranteeing both confidentiality (secrecy) and integrity (tamper-resistance)."
    },
    "SPLIT-HORIZON": {
        title: "Split-Horizon Storage",
        body: "The decryption key for a file is never stored with the file itself. The key is held in the Vault (Encrypted), while the payload is stored in the Browser Database (Encrypted). An attacker stealing the database gets only random noise without the separate vault key."
    },
    "SHAMIR SECRET SHARING": {
        title: "Shamir's Secret Sharing",
        body: "A form of 'Information-Theoretic Security'. We split your master secret into $n$ parts. You need $k$ parts to reconstruct it. With $k-1$ parts, it is mathematically impossible to reconstruct the secret, regardless of computing power."
    },
    "FINITE FIELD (Fp)": {
        title: "Prime Field Arithmetic",
        body: "We perform polynomial interpolation over a Finite Field defined by a large prime (secp256k1 order). This prevents geometric attacks and ensures the math holds up against quantum-computer assisted analysis."
    },
    "INFORMATION THEORETIC SECURITY": {
        title: "Information-Theoretic Security",
        body: "The highest level of security. It means the system cannot be broken even with infinite computing power. Our sharding implementation adheres to this standard."
    },
    "SEMANTIC DOM": {
        title: "Semantic Agent DOM",
        body: "The interface exposes stable `data-agent-id` attributes for every interactive element. This allows autonomous agents (like OpenClaw or Selenium scripts) to reliably navigate, read, and operate the vault without relying on fragile XPath or CSS selectors that break with UI updates."
    },
    "STATE BRIDGE": {
        title: "Reactive State Bridge",
        body: "A hidden JSON feed (`#bastion-agent-bridge`) reflects the vault's internal cryptographic state in real-time. Agents can 'see' the application state (locked status, item counts, sync status) instantly without OCR or screen scraping."
    },
    "SELENIUM COMPATIBLE": {
        title: "Headless Browser Ready",
        body: "The application detects when it is running in a headless environment and optimizes its rendering pipeline. It is fully compatible with Selenium, Puppeteer, and Playwright for users who wish to build their own automated rotation scripts."
    }
};

const DEEP_DIVES: Record<string, { title: string, subtitle: string, desc: string, technical: string[] }> = {
    "chaos": {
        title: "Chaos Engine™ V2",
        subtitle: "Deterministic Entropy Generator",
        desc: "The safest way to store a password is to never store it at all. The Chaos Engine computes your password mathematically using your Master Seed and the Service Name as inputs. V2 Upgrades include HMAC-SHA512 for a wider entropy pool and Unbiased Rejection Sampling to eliminate modulo bias attacks.",
        technical: ["HMAC-SHA512 Flux", "Zero-Bias Sampling", "Stateless Execution"]
    },
    "locker": {
        title: "Bastion Locker",
        subtitle: "Sovereign-V3 Protocol",
        desc: "We have upgraded our vault encryption to the Sovereign-V3 standard. This utilizes Argon2id with 64MB of memory hardness and 3 passes. This makes brute-forcing your vault on consumer hardware computationally infeasible, and makes cloud-scale GPU cracking significantly more expensive for attackers.",
        technical: ["Argon2id (m=64MB, t=3)", "AES-256-GCM", "Protocol Versioning"]
    },
    "sharding": {
        title: "Prime Field Sharing",
        subtitle: "Threshold Cryptography",
        desc: "Backups are a security risk. If you write down your password, it can be stolen. Bastion allows you to split your master password into 5 'shards'. You can distribute these shards (e.g., one to a lawyer, one in a safe, one with a spouse). An attacker needs 3 combined shards to recover the key. 2 shards are useless.",
        technical: ["Lagrange Interpolation", "GF(2^256) Arithmetic", "Hybrid Encryption"]
    },
    "agent": {
        title: "Agent-First Architecture",
        subtitle: "Programmable Sovereignty",
        desc: "Bastion is designed to be operated by machines as well as humans. We expose a full Semantic DOM and State Bridge that allows tools like OpenClaw and Selenium to drive the vault programmatically. This enables you to build your own auto-rotation bots, backup daemons, and audit scripts that run entirely offline on your own infrastructure.",
        technical: ["Data-Agent-ID Selectors", "JSON State Bridge", "Parity Spec v1"]
    }
};

export const LandingFeatures: React.FC = () => {
  const [selectedSpec, setSelectedSpec] = useState<string | null>(null);
  const [selectedFeature, setSelectedFeature] = useState<string | null>(null);

  const glossaryItem = selectedSpec ? GLOSSARY[selectedSpec] : null;
  const featureItem = selectedFeature ? DEEP_DIVES[selectedFeature] : null;

  return (
    <div className="space-y-16">
      
      {/* Introduction Block */}
      <div className="relative pl-8 border-l-2 border-indigo-500/30">
         <h2 className="text-2xl font-bold text-white mb-4">Architectural Guarantees</h2>
         <p className="text-slate-400 text-lg leading-relaxed max-w-3xl">
            Bastion Enclave introduces <strong>Sovereign-V3.5</strong>: a strict, memory-hard cryptographic standard designed to resist GPU-accelerated brute force attacks. We do not ask for your trust; we prove our security through transparent, open-source architecture.
         </p>
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {FEATURES.map((feature) => (
            <div 
                key={feature.id}
                onClick={() => setSelectedFeature(feature.id)}
                className="group relative bg-slate-900/40 border border-white/5 rounded-2xl p-8 hover:bg-slate-900/60 hover:border-indigo-500/30 transition-all duration-300 hover:-translate-y-1 overflow-hidden cursor-pointer"
            >
                {/* Hover Glow */}
                <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl group-hover:bg-indigo-500/20 transition-all duration-500"></div>
                
                <div className="relative z-10 flex flex-col h-full">
                    <div className="flex justify-between items-start mb-6">
                        <div className="p-4 bg-slate-950 border border-white/10 rounded-xl shadow-inner group-hover:scale-110 transition-transform duration-300">
                            {feature.icon}
                        </div>
                        <Activity size={20} className="text-slate-700 group-hover:text-emerald-500 transition-colors" />
                    </div>
                    
                    <h3 className="text-xl font-bold text-slate-200 mb-3 group-hover:text-white flex items-center gap-2">
                        {feature.title}
                        <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded text-slate-500 group-hover:text-indigo-400">V3.5 SPEC</span>
                    </h3>
                    <p className="text-lg text-slate-400 leading-relaxed mb-6 flex-1">
                        {feature.short}
                    </p>

                    {/* Tech Specs */}
                    <div className="flex flex-wrap gap-2 pt-4 border-t border-white/5">
                        {feature.specs.map((spec, sIdx) => (
                            <button 
                                key={sIdx} 
                                onClick={(e) => { e.stopPropagation(); setSelectedSpec(spec); }}
                                className="text-[10px] uppercase font-bold px-2.5 py-1.5 rounded bg-slate-950/50 border border-white/5 text-slate-500 hover:border-indigo-500/50 hover:text-indigo-400 hover:bg-indigo-500/10 transition-colors"
                            >
                                {spec}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        ))}
      </div>

      {/* GLOSSARY MODAL */}
      {glossaryItem && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setSelectedSpec(null)}></div>
              <div className="bg-slate-900 border border-indigo-500/30 rounded-2xl p-8 max-w-lg w-full relative z-10 shadow-2xl shadow-indigo-500/20 animate-in zoom-in-95 duration-200">
                  <button onClick={() => setSelectedSpec(null)} className="absolute top-4 right-4 text-slate-500 hover:text-white">
                      <X size={20} />
                  </button>
                  <div className="flex items-center gap-3 mb-4 text-indigo-400">
                      <Terminal size={24} />
                      <span className="text-xs font-bold uppercase tracking-widest bg-indigo-500/10 px-2 py-1 rounded border border-indigo-500/20">{selectedSpec}</span>
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4">{glossaryItem.title}</h3>
                  <p className="text-slate-300 leading-relaxed">{glossaryItem.body}</p>
              </div>
          </div>
      )}

      {/* FEATURE DEEP DIVE MODAL */}
      {featureItem && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setSelectedFeature(null)}></div>
              <div className="bg-slate-900 border border-white/10 rounded-3xl w-full max-w-2xl relative z-10 shadow-2xl overflow-hidden animate-in slide-in-from-bottom-8 duration-300 flex flex-col">
                  {/* Header Graphic */}
                  <div className="h-32 bg-gradient-to-r from-indigo-900/40 via-slate-900 to-slate-900 relative border-b border-white/5">
                        <div className="absolute inset-0 bg-grid opacity-30"></div>
                        <div className="absolute bottom-0 left-0 p-8">
                             <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-indigo-500 rounded-lg text-white shadow-lg shadow-indigo-500/40">
                                    <Zap size={20} />
                                </div>
                                <h2 className="text-3xl font-black text-white tracking-tight">{featureItem.title}</h2>
                             </div>
                             <p className="text-indigo-400 font-mono text-xs uppercase tracking-widest">{featureItem.subtitle}</p>
                        </div>
                        <button onClick={() => setSelectedFeature(null)} className="absolute top-6 right-6 p-2 bg-black/20 hover:bg-white/10 rounded-full text-white transition-colors backdrop-blur">
                            <X size={20} />
                        </button>
                  </div>
                  
                  <div className="p-8 space-y-8">
                      <div>
                          <h4 className="flex items-center gap-2 text-sm font-bold text-slate-500 uppercase tracking-widest mb-3">
                              <FileCode2 size={16} /> System Logic
                          </h4>
                          <p className="text-lg text-slate-300 leading-relaxed">
                              {featureItem.desc}
                          </p>
                      </div>

                      <div className="bg-black/30 rounded-xl p-6 border border-white/5">
                          <h4 className="flex items-center gap-2 text-sm font-bold text-slate-500 uppercase tracking-widest mb-4">
                              <Database size={16} /> Technical Stack
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                              {featureItem.technical.map((tech, i) => (
                                  <div key={i} className="flex items-center gap-2 text-sm text-emerald-400 font-mono bg-emerald-900/10 px-3 py-2 rounded-lg border border-emerald-500/20">
                                      <ShieldCheck size={14} /> {tech}
                                  </div>
                              ))}
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      )}

    </div>
  );
};
