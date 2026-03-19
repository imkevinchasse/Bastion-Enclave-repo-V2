
import React, { useState, useEffect } from 'react';
import { TopNav } from './TopNav';
import { LandingFeatures } from './LandingFeatures';
import { Button } from './Button';
import { BrandLogo } from './BrandLogo';
import { ArrowRight, HeartHandshake, Zap, HardDrive, FileJson, Binary, Shield, ServerOff, Scaling, Terminal, Lock, Globe, Database, Anchor, RefreshCw, Cpu, CheckCircle, GitFork } from 'lucide-react';
import { PublicPage } from '../types';
import { ProvenanceService, ProvenanceReport } from '../services/provenance';

interface LandingPageProps {
  onNavigate: (page: PublicPage) => void;
}

const DEMO_STAGES = {
    'input': {
        icon: <FileJson size={20} />,
        label: 'Raw Input',
        desc: 'Plaintext JSON object in volatile RAM',
        color: 'text-slate-400',
        borderColor: 'border-slate-500',
        bg: 'bg-slate-500/10',
        code: `{
  "id": "vault_entry_8f92a",
  "service": "github.com",
  "username": "developer@bastion.os",
  "password": "correct-horse-battery-staple",
  "protocol": "SOVEREIGN_V4"
}`
    },
    'process': {
        icon: <Binary size={20} />,
        label: 'Argon2id Transmutation',
        desc: 'Memory-Hard Key Derivation (V4 Standard)',
        color: 'text-amber-400',
        borderColor: 'border-amber-500',
        bg: 'bg-amber-500/10',
        code: `// Sovereign-V4: Anti-ASIC Hardening
const masterKey = await argon2id({
  password: userInput,
  salt: randomBytes(16),
  parallelism: 1,
  iterations: 3,
  memorySize: 65536, // 64 MB RAM Cost
  hashLength: 32,
  outputType: 'binary'
});

// STATUS: KEY DERIVED (TIME COST: ~250ms)`
    },
    'chaos': {
        icon: <RefreshCw size={20} />,
        label: 'Chaos Engine V2',
        desc: 'Deterministic Stateless Generation',
        color: 'text-orange-400',
        borderColor: 'border-orange-500',
        bg: 'bg-orange-500/10',
        code: `// Chaos V2: HMAC-SHA512 + Rejection Sampling
const salt = "BASTION_V2::" + service + "::" + user;
const flux = pbkdf2(entropy, salt, 210000, 512);

// Zero-Bias Sampling Loop
while (out.length < length) {
  const byte = flux[i++];
  if (byte < limit) { // Reject biased bytes
    out += charset[byte % charset.length];
  }
}
// RESULT: 8x9#mP2$v... (Never Stored)`
    },
    'storage': {
        icon: <HardDrive size={20} />,
        label: 'Local Storage',
        desc: 'Authenticated Encryption (AEAD)',
        color: 'text-emerald-400',
        borderColor: 'border-emerald-500',
        bg: 'bg-emerald-500/10',
        code: `// Header: "BSTN" + Version 0x03
[0x42, 0x53, 0x54, 0x4E, 0x03]

// Payload (AES-256-GCM)
IV:  [12 bytes unique nonce]
TAG: [16 bytes auth]
CIPHER: [Encrypted Data]

// STORAGE LOCATION: IndexedDB / LocalStorage
// SERVER STATUS: 404 NOT FOUND (No Backend)`
    }
};

const COMPARISON_DATA = [
    { feature: "Primary Storage Location", bastion: "Device (Local)", lp: "Cloud (Central)", bw: "Cloud (Central)", op: "Cloud (Central)", kp: "Device (Local)" },
    { feature: "Password Logic", bastion: "Deterministic (Math)", lp: "Random (Database)", bw: "Random (Database)", op: "Random (Database)", kp: "Random (Database)" },
    { feature: "KDF / Hashing Hardness", bastion: "Argon2id (64MB)", lp: "PBKDF2 (Low RAM)", bw: "PBKDF2 (Low RAM)", op: "PBKDF2 (Low RAM)", kp: "Argon2 (Config)" },
    { feature: "Zero-Knowledge Architecture", bastion: "Guaranteed (Code)", lp: "Policy Based", bw: "Audited Code", op: "Proprietary", kp: "Open Source" },
    { feature: "Centralized Attack Surface", bastion: "None (Distributed)", lp: "High (Honeypot)", bw: "High (Honeypot)", op: "High (Honeypot)", kp: "None" },
    { feature: "Breach Monitoring", bastion: "k-Anonymity (API)", lp: "Cloud Scans", bw: "Cloud Scans", op: "Watchtower", kp: "Plugin Required" },
    { feature: "AI Security Analysis", bastion: "On-Device (WebGPU)", lp: "None", bw: "None", op: "None", kp: "None" },
];

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
  const [activeStage, setActiveStage] = useState<'input' | 'process' | 'chaos' | 'storage'>('input');
  const [provenance, setProvenance] = useState<ProvenanceReport | null>(null);
  
  const currentDemo = DEMO_STAGES[activeStage];

  useEffect(() => {
      ProvenanceService.verify().then(setProvenance);
  }, []);

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-slate-950 font-sans text-slate-200">
        
        {/* Dynamic Space Background */}
        <div className="fixed inset-0 z-0 pointer-events-none">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wNSkiLz48L3N2Zz4=')] opacity-50"></div>
            <div className="absolute -top-[20%] -left-[10%] w-[70%] h-[70%] bg-amber-900/10 rounded-none blur-[120px] animate-pulse"></div>
            <div className="absolute top-[40%] right-[0%] w-[50%] h-[60%] bg-orange-900/10 rounded-none blur-[100px]"></div>
            <div className="absolute inset-0 opacity-60" style={{background: 'radial-gradient(circle at center, transparent 0%, #0a0a0c 100%)'}}></div>
        </div>

        <TopNav active="landing" onNavigate={onNavigate} />

        <div className="relative z-10 flex-1 w-full overflow-y-auto">
            
            {/* 1. HERO SECTION */}
            <div className="max-w-7xl mx-auto px-6 pt-32 pb-20 flex flex-col-reverse lg:flex-row items-center gap-12 lg:gap-24">
                <div className="flex-1 text-center lg:text-left space-y-8 animate-in fade-in slide-in-from-left-8 duration-700">
                     <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-none bg-slate-900/80 border border-amber-500/20 text-amber-500 text-[11px] font-mono uppercase tracking-widest backdrop-blur-sm">
                        <span className="w-1.5 h-1.5 rounded-none bg-amber-500 animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.8)]"></span>
                        Protocol V4 Active
                    </div>
                    
                    <h1 className="text-5xl md:text-7xl font-sans font-bold text-slate-100 tracking-tight leading-[1.05]">
                        The Cloud is Compromised. <br/>
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">
                            Go Sovereign.
                        </span>
                    </h1>
                    
                    <p className="text-lg text-slate-400 font-sans leading-relaxed max-w-2xl mx-auto lg:mx-0">
                        Bastion Enclave replaces "trust" with verifiable cryptography. Every password is derived on-the-fly using Argon2id and deterministic math. Your secrets never leave your device—no storage, no leaks, no compromise.
                    </p>
                    
                    <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start pt-4">
                        <Button size="lg" onClick={() => onNavigate('auth')} className="w-full sm:w-auto h-12 text-sm px-8 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold border-none rounded-none">
                            Enter Vault <ArrowRight size={16} />
                        </Button>
                        <a href="https://github.com/imkevinchasse/Bastion-Enclave-repo-V2" target="_blank" rel="noreferrer" className="w-full sm:w-auto">
                           <Button variant="secondary" size="lg" className="w-full h-12 text-sm px-8 rounded-none border-slate-700 hover:bg-slate-800 text-slate-300">
                               <Terminal size={16} /> Inspect Source
                           </Button>
                        </a>
                    </div>
                </div>

                <div className="flex-1 flex justify-center animate-in fade-in zoom-in-95 duration-1000">
                    <div className="relative">
                        <div className="absolute inset-0 bg-amber-500/10 blur-[80px] rounded-none"></div>
                        <BrandLogo size={320} animated={true} className="text-amber-500 relative z-10" />
                    </div>
                </div>
            </div>

            {/* 2. CORE VALUE PROP (Features) */}
            <div className="bg-slate-900/30 border-y border-slate-800 backdrop-blur-sm">
                <div className="max-w-7xl mx-auto px-6 py-24">
                    <LandingFeatures />
                </div>
            </div>

            {/* 3. ARCHITECTURE & SECURITY */}
            <div className="max-w-7xl mx-auto px-6 py-24">
                <div className="bg-slate-900/50 border border-slate-800/80 rounded-none overflow-hidden relative backdrop-blur-sm shadow-2xl">
                    <div className="absolute top-0 right-0 p-32 bg-amber-500/5 rounded-none blur-3xl"></div>
                    
                    <div className="grid lg:grid-cols-2 gap-12 p-8 lg:p-16 items-start">
                        <div className="space-y-8">
                            <h2 className="text-3xl md:text-4xl font-sans font-bold text-slate-100 tracking-tight">Trust No One. Not Even Us.</h2>
                            <p className="text-base font-sans text-slate-400 leading-relaxed">
                                Most password managers claim "Zero Knowledge" while still storing your encrypted blob on their central servers. This is a <strong>policy</strong>, not a guarantee. If their server is subpoenaed or breached, your data is at risk.
                                <br/><br/>
                                <strong className="text-slate-200">Bastion is architecturally different.</strong> It executes entirely in your browser's memory. We provide the code; you provide the execution environment. There is no central database to breach.
                            </p>
                            
                            {/* Interactive Pipeline Triggers */}
                            <div className="flex flex-col gap-3">
                                <button 
                                    onClick={() => setActiveStage('input')}
                                    className={`flex items-center gap-4 p-4 rounded-none border transition-all text-left group ${activeStage === 'input' ? 'bg-slate-800/80 border-slate-600 shadow-sm' : 'bg-slate-950/50 border-slate-800/50 hover:border-slate-700 hover:bg-slate-900/50'}`}
                                >
                                    <div className={`p-3 rounded-none ${activeStage === 'input' ? 'bg-slate-700 text-slate-200' : 'bg-slate-900 text-slate-500'}`}>
                                        <FileJson size={20}/>
                                    </div>
                                    <div>
                                        <h4 className={`font-sans font-semibold text-sm ${activeStage === 'input' ? 'text-slate-200' : 'text-slate-400'}`}>1. Volatile Input</h4>
                                        <p className="text-xs font-sans text-slate-500 mt-0.5">Plaintext exists ONLY in RAM.</p>
                                    </div>
                                    <ArrowRight className={`ml-auto ${activeStage === 'input' ? 'text-slate-400' : 'text-slate-700'} group-hover:translate-x-1 transition-transform`} size={16} />
                                </button>

                                <button 
                                    onClick={() => setActiveStage('process')}
                                    className={`flex items-center gap-4 p-4 rounded-none border transition-all text-left group ${activeStage === 'process' ? 'bg-amber-500/10 border-amber-500/50 shadow-sm' : 'bg-slate-950/50 border-slate-800/50 hover:border-slate-700 hover:bg-slate-900/50'}`}
                                >
                                    <div className={`p-3 rounded-none ${activeStage === 'process' ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-900 text-slate-500'}`}>
                                        <Zap size={20}/>
                                    </div>
                                    <div>
                                        <h4 className={`font-sans font-semibold text-sm ${activeStage === 'process' ? 'text-amber-400' : 'text-slate-400'}`}>2. Argon2id Hardening</h4>
                                        <p className="text-xs font-sans text-slate-500 mt-0.5">V4 Protocol: Memory-hard derivation.</p>
                                    </div>
                                    <ArrowRight className={`ml-auto ${activeStage === 'process' ? 'text-amber-500' : 'text-slate-700'} group-hover:translate-x-1 transition-transform`} size={16} />
                                </button>

                                <button 
                                    onClick={() => setActiveStage('chaos')}
                                    className={`flex items-center gap-4 p-4 rounded-none border transition-all text-left group ${activeStage === 'chaos' ? 'bg-orange-500/10 border-orange-500/50 shadow-sm' : 'bg-slate-950/50 border-slate-800/50 hover:border-slate-700 hover:bg-slate-900/50'}`}
                                >
                                    <div className={`p-3 rounded-none ${activeStage === 'chaos' ? 'bg-orange-500/20 text-orange-400' : 'bg-slate-900 text-slate-500'}`}>
                                        <RefreshCw size={20}/>
                                    </div>
                                    <div>
                                        <h4 className={`font-sans font-semibold text-sm ${activeStage === 'chaos' ? 'text-orange-400' : 'text-slate-400'}`}>3. Chaos Engine V2</h4>
                                        <p className="text-xs font-sans text-slate-500 mt-0.5">Deterministic SHA-512 Generation.</p>
                                    </div>
                                    <ArrowRight className={`ml-auto ${activeStage === 'chaos' ? 'text-orange-500' : 'text-slate-700'} group-hover:translate-x-1 transition-transform`} size={16} />
                                </button>

                                <button 
                                    onClick={() => setActiveStage('storage')}
                                    className={`flex items-center gap-4 p-4 rounded-none border transition-all text-left group ${activeStage === 'storage' ? 'bg-emerald-500/10 border-emerald-500/50 shadow-sm' : 'bg-slate-950/50 border-slate-800/50 hover:border-slate-700 hover:bg-slate-900/50'}`}
                                >
                                    <div className={`p-3 rounded-none ${activeStage === 'storage' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-900 text-slate-500'}`}>
                                        <HardDrive size={20}/>
                                    </div>
                                    <div>
                                        <h4 className={`font-sans font-semibold text-sm ${activeStage === 'storage' ? 'text-emerald-400' : 'text-slate-400'}`}>4. Opaque Persistence</h4>
                                        <p className="text-xs font-sans text-slate-500 mt-0.5">Only encrypted noise touches the disk.</p>
                                    </div>
                                    <ArrowRight className={`ml-auto ${activeStage === 'storage' ? 'text-emerald-500' : 'text-slate-700'} group-hover:translate-x-1 transition-transform`} size={16} />
                                </button>
                            </div>
                        </div>
                        
                        {/* Interactive Code Display */}
                        <div className="relative h-full min-h-[500px] flex flex-col bg-[#0d0d12] rounded-none border border-slate-800/80 shadow-2xl overflow-hidden">
                            {/* Window Header */}
                            <div className="flex items-center gap-2 px-4 py-3 bg-slate-900/80 border-b border-slate-800/80">
                                <div className="flex gap-1.5">
                                    <div className="w-3 h-3 rounded-none bg-slate-700"></div>
                                    <div className="w-3 h-3 rounded-none bg-slate-700"></div>
                                    <div className="w-3 h-3 rounded-none bg-slate-700"></div>
                                </div>
                                <div className="flex-1 text-center font-mono text-[11px] text-slate-500 tracking-wider">
                                    bastion_runtime_env
                                </div>
                            </div>

                            {/* Content */}
                            <div className="flex-1 p-6 font-mono text-xs overflow-auto custom-scrollbar relative">
                                <div className={`absolute top-0 right-0 p-24 ${currentDemo.bg} blur-[80px] rounded-none opacity-20 transition-colors duration-500`}></div>
                                
                                <div className="relative z-10 animate-in fade-in zoom-in-95 duration-300" key={activeStage}>
                                    <div className={`inline-flex items-center gap-2 mb-4 px-3 py-1 rounded-none border ${currentDemo.borderColor} ${currentDemo.bg} ${currentDemo.color} text-[10px] font-bold uppercase tracking-widest`}>
                                        {currentDemo.icon} {currentDemo.label}
                                    </div>
                                    <div className="text-slate-500 mb-6 border-l-2 border-slate-800 pl-3 italic">
                                        // {currentDemo.desc}
                                    </div>
                                    <pre className="text-slate-300 leading-relaxed whitespace-pre-wrap break-all">
                                        {currentDemo.code}
                                    </pre>
                                </div>
                            </div>

                            {/* Status Footer */}
                            <div className="px-4 py-2 bg-slate-900 border-t border-slate-800 text-[10px] font-mono flex justify-between text-slate-500 uppercase tracking-widest">
                                <span>UTF-8</span>
                                <span>{activeStage === 'storage' ? 'ENCRYPTED' : activeStage === 'process' ? 'PROCESSING' : activeStage === 'chaos' ? 'COMPUTING' : 'PLAINTEXT'}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 4. PROBLEM / SOLUTION */}
            <div className="bg-slate-900/30 border-y border-slate-800/50">
                <div className="max-w-7xl mx-auto px-6 py-24 grid lg:grid-cols-2 gap-16">
                    <div className="space-y-6">
                        <div className="text-orange-500 font-mono font-semibold text-[11px] uppercase tracking-widest flex items-center gap-2">
                            <ServerOff size={14} /> The Risk
                        </div>
                        <h2 className="text-3xl font-sans font-bold text-slate-100 tracking-tight">Centralization is Vulnerability</h2>
                        <p className="text-base font-sans text-slate-400 leading-relaxed">
                            When 50 million passwords are stored on one server, it becomes the ultimate target for nation-state actors. 
                            If that server falls, encryption is the only defense—and history shows that metadata leaks, weak PBKDF2 iterations, and operational errors often render server-side encryption moot.
                        </p>
                    </div>
                    <div className="space-y-6">
                         <div className="text-emerald-500 font-mono font-semibold text-[11px] uppercase tracking-widest flex items-center gap-2">
                             <Shield size={14} /> The Solution
                         </div>
                         <h2 className="text-3xl font-sans font-bold text-slate-100 tracking-tight">Distributed Sovereignty</h2>
                         <p className="text-base font-sans text-slate-400 leading-relaxed">
                            Bastion Enclave distributes the risk. By keeping data local, there is no central database to breach. 
                            Attacking Bastion means attacking millions of individual, hardened devices—a task that is computationally and economically infeasible.
                         </p>
                    </div>
                </div>
            </div>

            {/* 5. COMPETITIVE LANDSCAPE */}
            <div className="max-w-7xl mx-auto px-6 py-24">
                <div className="text-center mb-16 space-y-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-none bg-slate-900/80 border border-slate-800 text-slate-400 text-[11px] font-mono uppercase tracking-widest">
                        <Database size={14} className="text-amber-500" /> Architectural Audit
                    </div>
                    <h2 className="text-3xl md:text-5xl font-sans font-bold text-slate-100 tracking-tight">The Sovereign Advantage</h2>
                    <p className="text-slate-400 font-sans text-lg max-w-2xl mx-auto">
                        See how the Bastion protocol eliminates entire classes of attack vectors inherent to cloud-based managers.
                    </p>
                </div>

                <div className="overflow-x-auto pb-6">
                    <div className="min-w-[1000px]">
                        <div className="grid grid-cols-[1.5fr_1fr_1fr_1fr_1fr_1fr] gap-4 mb-4 px-4">
                            <div className="font-mono font-semibold text-[11px] text-slate-500 uppercase tracking-widest py-4">Architecture</div>
                            <div className="font-mono font-bold text-xs text-amber-500 uppercase tracking-widest py-2 flex flex-col items-center justify-center bg-amber-500/10 border border-amber-500/30 rounded-none">
                                <BrandLogo size={20} className="mb-2" />
                                Bastion
                            </div>
                            <div className="font-mono font-semibold text-[11px] text-slate-500 uppercase tracking-widest py-4 text-center">LastPass</div>
                            <div className="font-mono font-semibold text-[11px] text-slate-500 uppercase tracking-widest py-4 text-center">Bitwarden</div>
                            <div className="font-mono font-semibold text-[11px] text-slate-500 uppercase tracking-widest py-4 text-center">1Password</div>
                            <div className="font-mono font-semibold text-[11px] text-slate-500 uppercase tracking-widest py-4 text-center">KeePass</div>
                        </div>

                        <div className="space-y-2">
                            {COMPARISON_DATA.map((row, idx) => (
                                <div key={idx} className="grid grid-cols-[1.5fr_1fr_1fr_1fr_1fr_1fr] gap-4 items-center p-4 rounded-none hover:bg-slate-900/80 transition-colors border border-transparent hover:border-slate-800">
                                    <div className="font-sans font-medium text-slate-300 text-sm">{row.feature}</div>
                                    
                                    {/* Bastion Column */}
                                    <div className="text-center font-mono font-bold text-amber-500 text-[11px] uppercase tracking-widest bg-amber-500/5 py-3 rounded-none border border-amber-500/20">
                                        {row.bastion}
                                    </div>
                                    
                                    <div className="text-center font-sans text-xs text-slate-400">{row.lp}</div>
                                    <div className="text-center font-sans text-xs text-slate-400">{row.bw}</div>
                                    <div className="text-center font-sans text-xs text-slate-400">{row.op}</div>
                                    <div className="text-center font-sans text-xs text-slate-400">{row.kp}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* 6. INVESTOR CALLOUTS */}
            <div className="max-w-7xl mx-auto px-6 py-24 border-t border-slate-800/50">
                <div className="grid md:grid-cols-3 gap-8">
                    <div className="bg-slate-900/50 p-8 rounded-none border border-slate-800 hover:border-amber-500/30 transition-colors shadow-lg">
                        <Anchor size={28} className="text-amber-500 mb-6" />
                        <h3 className="text-xl font-sans font-bold text-slate-100 tracking-tight mb-3">Anchored Data</h3>
                        <p className="text-slate-400 font-sans text-sm leading-relaxed">
                            Heavy files in the Locker are <strong>anchored</strong> to the specific device they were encrypted on. They do not sync automatically, preventing massive bandwidth usage or "surprise" downloads on mobile.
                        </p>
                    </div>
                    <div className="bg-slate-900/50 p-8 rounded-none border border-slate-800 hover:border-emerald-500/30 transition-colors shadow-lg">
                        <Scaling size={28} className="text-emerald-500 mb-6" />
                        <h3 className="text-xl font-sans font-bold text-slate-100 tracking-tight mb-3">Edge AI Analysis</h3>
                        <p className="text-slate-400 font-sans text-sm leading-relaxed">
                            Our Neural Auditor runs via WebGPU on your local graphics card. We don't send your passwords to an AI server; we bring the AI model to you.
                        </p>
                    </div>
                    <div className="bg-slate-900/50 p-8 rounded-none border border-slate-800 hover:border-orange-500/30 transition-colors shadow-lg">
                        <Terminal size={28} className="text-orange-500 mb-6" />
                        <h3 className="text-xl font-sans font-bold text-slate-100 tracking-tight mb-3">Portable Identity</h3>
                        <p className="text-slate-400 font-sans text-sm leading-relaxed">
                            Your Identity (Passwords, Contacts, Notes, and File Keys) travels with your 5KB text backup. You can restore access on any device instantly, while heavy files remain on their origin device.
                        </p>
                    </div>
                </div>
            </div>

            {/* 7. CTA */}
            <div className="relative py-32 px-6 overflow-hidden">
                <div className="absolute inset-0 bg-amber-900/5"></div>
                <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-transparent to-slate-950"></div>
                
                <div className="max-w-4xl mx-auto text-center relative z-10 space-y-8">
                    <h2 className="text-4xl md:text-5xl font-sans font-bold text-slate-100 tracking-tight">
                        Take Back Your Digital Sovereignty
                    </h2>
                    <p className="text-lg font-sans text-slate-400 leading-relaxed max-w-2xl mx-auto">
                        Stop renting your security from the cloud. Own your encryption. Control your keys.
                        Become a founding member of the Bastion Protocol.
                    </p>
                    <div className="flex flex-col sm:flex-row justify-center gap-4">
                        <a 
                            href="https://donate.stripe.com/eVq3cwceX02x4Jufrx1VK00" 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3 text-sm font-sans font-semibold rounded-none bg-slate-200 text-slate-900 hover:bg-white transition-all h-12"
                        >
                            Support Project
                        </a>
                        <Button size="lg" variant="secondary" className="h-12 px-10 text-sm rounded-none border-slate-700 hover:bg-slate-800 text-slate-300" onClick={() => onNavigate('auth')}>
                            Launch Web App
                        </Button>
                    </div>
                </div>
            </div>

            {/* FOOTER */}
            <div className="border-t border-slate-800 bg-slate-950 py-12 px-6">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-2 opacity-50 text-slate-500">
                        <BrandLogo size={20} />
                        <span className="font-mono font-bold text-xs uppercase tracking-widest">Bastion Enclave</span>
                    </div>
                    <div className="text-sm text-slate-500 font-mono text-center md:text-right">
                        <div className="text-[10px] uppercase tracking-widest">© 2024 BASTION SECURITY • OPEN SOURCE PROTOCOL</div>
                        <div className="text-[9px] mt-1 opacity-60 uppercase tracking-widest">NO TRACKING. NO ANALYTICS. NO COOKIES.</div>
                        {provenance && (
                            <div className={`text-[9px] mt-2 flex items-center justify-center md:justify-end gap-1 uppercase tracking-widest ${provenance.verified ? 'text-emerald-500' : 'text-amber-500'}`}>
                                {provenance.verified ? <CheckCircle size={10} /> : <GitFork size={10} />}
                                {provenance.status === 'OFFICIAL' ? 'OFFICIAL BUILD' : provenance.status === 'DEV' ? 'DEV BUILD' : 'COMMUNITY FORK'}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};
