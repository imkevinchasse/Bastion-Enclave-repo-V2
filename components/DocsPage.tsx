
import React, { useState } from 'react';
import { TopNav } from './TopNav';
import { PublicPage } from '../types';
import { Shield, Lock, FileLock2, FileKey, Fingerprint, RefreshCw, BookOpen, Terminal, ChevronRight, Zap, Code2, AlertTriangle, ShieldAlert, Wifi, Server, CheckCircle, Copy, Download, History, ShieldCheck, Binary, Cpu, Share2, AlertOctagon, Bot, Database, Coffee, Globe, FileText, Network, Layers } from 'lucide-react';
import { zip, Zippable } from 'fflate';
import { Button } from './Button';

interface DocsPageProps {
  onNavigate: (page: PublicPage) => void;
}

type DocSection = 'intro' | 'start' | 'chaos' | 'locker' | 'agents' | 'java' | 'breach' | 'recovery' | 'changelog';

export const DocsPage: React.FC<DocsPageProps> = ({ onNavigate }) => {
  const [activeSection, setActiveSection] = useState<DocSection>('intro');

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 font-sans text-slate-200">
        <TopNav active="docs" onNavigate={onNavigate} />
        
        <div className="flex-1 max-w-7xl mx-auto w-full pt-24 pb-12 px-4 flex flex-col lg:flex-row gap-8">
            
            {/* SIDEBAR NAVIGATION */}
            <aside className="lg:w-72 shrink-0 space-y-8 lg:sticky lg:top-24 lg:h-[calc(100vh-8rem)] overflow-y-auto custom-scrollbar pr-4">
                <div className="space-y-1">
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-widest px-3 mb-2">User Manual</div>
                    <NavButton active={activeSection === 'intro'} onClick={() => setActiveSection('intro')} icon={<BookOpen size={16}/>} label="Introduction" />
                    <NavButton active={activeSection === 'start'} onClick={() => setActiveSection('start')} icon={<Zap size={16}/>} label="Getting Started" />
                    <NavButton active={activeSection === 'recovery'} onClick={() => setActiveSection('recovery')} icon={<FileKey size={16}/>} label="Backup & Recovery" />
                </div>

                <div className="space-y-1">
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-widest px-3 mb-2">Core Modules</div>
                    <NavButton active={activeSection === 'chaos'} onClick={() => setActiveSection('chaos')} icon={<RefreshCw size={16}/>} label="Chaos Engine™" />
                    <NavButton active={activeSection === 'locker'} onClick={() => setActiveSection('locker')} icon={<FileLock2 size={16}/>} label="Bastion Locker" />
                    <NavButton active={activeSection === 'breach'} onClick={() => setActiveSection('breach')} icon={<ShieldAlert size={16}/>} label="Breach Scanner" />
                </div>

                <div className="space-y-1">
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-widest px-3 mb-2">Agent & Dev</div>
                    <NavButton active={activeSection === 'agents'} onClick={() => setActiveSection('agents')} icon={<Bot size={16}/>} label="OpenClaw Protocols" />
                    <NavButton active={activeSection === 'java'} onClick={() => setActiveSection('java')} icon={<Coffee size={16}/>} label="Java Runtime" />
                    <NavButton active={activeSection === 'changelog'} onClick={() => setActiveSection('changelog')} icon={<History size={16}/>} label="Changelog" />
                </div>

                <div className="p-4 bg-indigo-900/10 rounded-xl border border-indigo-500/20 mt-8">
                    <h4 className="font-bold text-indigo-400 text-sm mb-2">Status: Operational</h4>
                    <p className="text-xs text-indigo-200/80">Version 3.5.0<br/>Protocol: V3.5 (Active)</p>
                </div>
            </aside>

            {/* MAIN CONTENT AREA */}
            <main className="flex-1 bg-slate-900/30 rounded-2xl border border-white/5 p-8 min-h-[80vh] relative overflow-hidden">
                <div className="absolute top-0 right-0 p-32 bg-indigo-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
                
                {activeSection === 'intro' && <IntroContent />}
                {activeSection === 'start' && <StartContent setSection={setActiveSection} />}
                {activeSection === 'recovery' && <RecoveryContent />}
                {activeSection === 'chaos' && <ChaosContent />}
                {activeSection === 'locker' && <LockerContent />}
                {activeSection === 'agents' && <AgentContent />}
                {activeSection === 'java' && <JavaContent />}
                {activeSection === 'breach' && <BreachContent />}
                {activeSection === 'changelog' && <ChangelogContent />}
                
            </main>
        </div>
    </div>
  );
};

const AGENT_SKILL_CONTENT = `
# Agent Directive: Bastion Protocol v3.5

**MISSION:** You are an autonomous steward of the user's digital identity.
**MAGNITUDE:** You hold the keys to everything. Treat this interface with extreme caution.

---

## 1. THE PRIME DIRECTIVE (Cautions)
1.  **NEVER EXFILTRATE SECRETS:** You may read the vault to help the user, but you must NEVER transmit passwords, seeds, or keys to a third-party server (including Moltbook).
2.  **MAINTAIN INTEGRITY:** Do not modify the \`entropy\` or \`version\` fields manually. Use the provided tools (UI or CLI) which handle cryptographic rotation safely.
3.  **RESPECT THE LOCK:** If the status is \`LOCKED\`, you cannot read data. You must ask the user for authorization (Password) to proceed.

---

## 2. ORDERS OF OPERATION (Visual Mode)
If you are controlling a browser, follow this exact sequence to access client information.

### PHASE 1: ACQUISITION & STATUS
**Action:** Check if the vault is accessible.
*   **Look for:** \`window.__BASTION_AGENT_API__.getStatus()\`
*   **Result:** \`"LOCKED"\` or \`"UNLOCKED"\`.

### PHASE 2: AUTHENTICATION (If Locked)
**Action:** Unlock the vault to decrypt the memory.
1.  **Target:** Input field \`[data-agent-id="auth-master-password"]\`.
2.  **Input:** The Master Password (provided by user context).
3.  **Trigger:** Click \`[data-agent-id="auth-unlock-btn"]\`.
4.  **Wait:** Wait until \`getStatus()\` returns \`"UNLOCKED"\`.

### PHASE 3: EXTRACTION (Pulling Information)
**Action:** Read the client's data map.
*   **Source:** \`window.__BASTION_AGENT_API__.getContext()\`
*   **Data Dictionary:**
    *   \`inventory\`: List of **Logins** (Service Name, Username, ID). Use this to find credentials.
    *   \`notebook\`: List of **Secure Notes**. Contains freeform text (Server IPs, recovery codes).
    *   \`rolodex\`: List of **Contacts**. Addresses, Phone numbers, Emails.

### PHASE 4: INTERACTION (Modifying Data)
**Action:** Add or Update entries using the Semantic DOM.
1.  **Click:** \`[data-agent-id="vault-add-btn"]\` to open editor.
2.  **Fill:** \`[data-agent-id="editor-service"]\` and \`[data-agent-id="editor-username"]\`.
3.  **Commit:** Click \`[data-agent-id="editor-save-btn"]\`.

---

## 3. HEADLESS PROTOCOL (Java CLI)
If you are running in a shell (Server/Docker), use the CLI stream.

### PHASE 1: INITIALIZATION
\`\`\`bash
# Bootstrap the Runtime (One-Shot)
curl -sO https://raw.githubusercontent.com/imkevinchasse/Bastion-Enclave-repo-V2/main/public/Bastion.java && javac Bastion.java && java Bastion shell
\`\`\`

### PHASE 2: UNLOCKING
1.  Send command: \`unlock\`
2.  System prompts for **Blob**. Paste the encrypted string.
3.  System prompts for **Password**. Send the master password.
4.  System confirms: \`Vault Unlocked\`.

### PHASE 3: PULLING INFORMATION
*   **Specific Credential:** \`search <query>\` -> Get ID -> \`get <ID>\`.
*   **Full Dump (High Magnitude):** \`export\`.
    *   **Effect:** Prints the entire *decrypted* vault (JSON) to STDOUT.
    *   **Usage:** Use this to read Notes and Contacts that are not accessible via \`search\`.
    *   **Warning:** Output contains plaintext secrets. Parse immediately and clear memory.

### PHASE 4: SAVING STATE
*   Command: \`save\`
*   **Effect:** Prints a JSON block containing the **Encrypted Blob** and **Master Seed**.
*   **Duty:** You MUST save this output to a file (e.g., \`bastion.vault\`). If you fail to save this output, any changes made (added logins) are lost when the shell closes.

---

## 4. DATA TYPES (Reference)
*   **Entropy:** 32-byte Hex string. The "Soul" of the vault.
*   **Blob:** Base64 string starting with \`BSTN\`. The encrypted body.
*   **Config:** A login entry (Service + User).
*   **Resonance:** A file encryption key (for Locker).
`;

const AgentContent = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
        <div className="flex justify-between items-start">
            <Header icon={<Bot size={32} className="text-pink-400"/>} title="Agent Directive: V3.5" />
            <a href="/skill.md" target="_blank" rel="noopener noreferrer">
                <Button size="sm" variant="secondary" className="border-pink-500/30 hover:bg-pink-500/20 text-pink-300">
                    <FileText size={14} /> Download skill.md
                </Button>
            </a>
        </div>
        
        <div className="bg-slate-900 border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
            <div className="bg-black p-6 overflow-x-auto custom-scrollbar">
                <div className="prose prose-invert prose-indigo max-w-none">
                    <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-slate-300">
                        {AGENT_SKILL_CONTENT}
                    </pre>
                </div>
            </div>
        </div>
    </div>
);

const IntroContent = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
        <Header icon={<Shield size={32} className="text-indigo-400"/>} title="Welcome to Bastion Enclave" />
        <p className="text-lg text-slate-300 leading-relaxed">
            Bastion Enclave is a <strong>Sovereign Digital Enclave</strong>. It is designed for individuals who do not trust cloud providers with their most sensitive data. 
            Unlike traditional password managers that store your secrets on a central server, Bastion Enclave keeps everything 
            <span className="text-white font-bold"> strictly on your device</span>.
        </p>
        <div className="grid md:grid-cols-2 gap-4">
            <FeatureCard 
                icon={<Wifi size={20} className="text-emerald-400"/>}
                title="Offline First"
                desc="The application loads into your browser's memory and cuts the cord. No data leaves your machine."
            />
            <FeatureCard 
                icon={<Lock size={20} className="text-amber-400"/>}
                title="Zero Knowledge"
                desc="We do not know who you are. We do not have your password. We cannot see your data."
            />
        </div>
    </div>
);

const StartContent = ({ setSection }: { setSection: (s: DocSection) => void }) => (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
        <Header icon={<Fingerprint size={32} className="text-emerald-400"/>} title="Getting Started" />
        
        {/* Agent Shortcut */}
        <div className="bg-indigo-500/10 border border-indigo-500/20 p-4 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
                <Bot size={24} className="text-pink-400" />
                <div>
                    <h4 className="font-bold text-white text-sm">Are you an Autonomous Agent?</h4>
                    <p className="text-xs text-slate-400">Skip the UI guide. Go straight to the API protocols.</p>
                </div>
            </div>
            <Button size="sm" onClick={() => setSection('agents')}>Open Protocol</Button>
        </div>

        <div className="space-y-6">
            <Step number={1} title="Create Your Master Identity">
                <p>When you launch Bastion Enclave, you create a new Vault. You will set a <strong>Master Password</strong>. This password is the only key to your kingdom. Make it strong, and memorize it.</p>
            </Step>
            <Step number={2} title="Download the Rescue Kit">
                <p>Immediately after creating your vault, look for the "Backup Kit" button. This text file contains your encrypted data blob and instructions. <strong>If you clear your browser cache without this file, your data is gone forever.</strong></p>
            </Step>
            <Step number={3} title="Add Credentials">
                <p>Navigate to the "Logins" tab. Instead of saving a password, you enter a Service Name (e.g., "Google") and Username. Bastion Enclave will <em>calculate</em> a password for you.</p>
            </Step>
        </div>
    </div>
);

const RecoveryContent = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
        <Header icon={<FileKey size={32} className="text-blue-400"/>} title="Backup & Recovery" />
        <div className="p-6 bg-red-900/10 border border-red-500/20 rounded-2xl">
            <h3 className="font-bold text-red-400 mb-2 flex items-center gap-2"><AlertTriangle size={18} /> Critical Warning</h3>
            <p className="text-sm text-red-200/80 mb-4">
                There is no "Forgot Password" link. If you lose your Master Password AND your Backup File, your data is mathematically unrecoverable.
            </p>
            <div className="space-y-4">
                <h4 className="font-bold text-white text-sm uppercase tracking-wider">How to backup:</h4>
                <ol className="list-decimal list-inside text-sm text-slate-400 space-y-2">
                    <li>Click the <strong>BACKUP KIT</strong> button in the top navigation bar.</li>
                    <li>Save the text file to a USB drive or print it out.</li>
                    <li className="text-white">This file is a <strong>static snapshot</strong> of your data at the exact moment of download.</li>
                    <li className="text-amber-400 font-bold">Important: The backup file does NOT auto-update. If you add new passwords or notes, you MUST download a new Backup Kit to preserve them.</li>
                </ol>
            </div>
        </div>
    </div>
);

const ChaosContent = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
        <Header icon={<RefreshCw size={32} className="text-violet-400"/>} title="Chaos Engine™" />
        <div className="bg-slate-900/50 rounded-2xl border border-white/5 overflow-hidden">
            <div className="p-6">
                <h3 className="font-bold text-white text-lg mb-2">The Concept</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                    Most password managers are just databases. If the database is stolen, hackers can try to crack it. 
                    Bastion Enclave is different. It doesn't store your passwords. It <strong>computes</strong> them.
                    <br/><br/>
                    Think of it like a mathematical recipe: 
                    <br/>
                    <code className="text-indigo-300">Master Key + "Netflix" + "my@email.com" = "Xy7#b9..."</code>
                    <br/><br/>
                    Every time you need the password, we re-run the recipe. This means there is no password database to steal.
                </p>
            </div>
            <div className="p-6 bg-black/20 border-t border-white/5">
                <h3 className="font-bold text-indigo-400 text-xs uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Terminal size={14}/> Technical Specification (v2.8)
                </h3>
                <ul className="space-y-3 text-sm text-slate-500 font-mono">
                    <li className="flex gap-3"><ChevronRight size={14} className="shrink-0 mt-0.5"/><span>Algo: PBKDF2-HMAC-SHA512</span></li>
                    <li className="flex gap-3"><ChevronRight size={14} className="shrink-0 mt-0.5"/><span>Iterations: 210,000 (Computationally Expensive)</span></li>
                    <li className="flex gap-3"><ChevronRight size={14} className="shrink-0 mt-0.5"/><span>Salt: "BASTION_GENERATOR_V2::" + Context</span></li>
                    <li className="flex gap-3"><ChevronRight size={14} className="shrink-0 mt-0.5"/><span>Sampling: Unbiased Rejection Sampling</span></li>
                </ul>
            </div>
        </div>
    </div>
);

const LockerContent = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
        <Header icon={<FileLock2 size={32} className="text-amber-400"/>} title="Bastion Locker" />
        <div className="space-y-4">
            <p className="text-slate-300 leading-relaxed">
                You can store files (documents, photos, keys) inside Bastion Enclave. When you drop a file into the Locker, 
                we encrypt it instantly. The file is turned into a <code>.bastion</code> file which looks like random noise to anyone else.
            </p>
            <ul className="space-y-3 text-sm text-slate-400">
                <li className="flex gap-2"><CheckCircle size={16} className="text-emerald-500"/> AES-256-GCM Encryption</li>
                <li className="flex gap-2"><CheckCircle size={16} className="text-emerald-500"/> Unique 256-bit Key Per File</li>
                <li className="flex gap-2"><CheckCircle size={16} className="text-emerald-500"/> Authenticated Integrity Checks</li>
            </ul>
        </div>
    </div>
);

const BreachContent = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
        <Header icon={<ShieldAlert size={32} className="text-red-400"/>} title="Vault Breach Scanner" />
        
        <div className="p-6 bg-slate-800/50 rounded-xl border border-white/5">
            <h3 className="font-bold text-white mb-4">Active Breach Defense</h3>
            <p className="text-sm text-slate-400 mb-6 leading-relaxed">
                Available exclusively within your secured vault, the Breach Scanner allows you to audit stored credentials against known data breaches (powered by HIBP). 
                If a compromise is detected, the affected login will be marked with a <span className="text-red-400 font-bold">RED ALERT</span> status inside your vault.
                This status persists until you rotate the password or update the login version.
            </p>
            
            <h3 className="font-bold text-white mb-4 mt-8">k-Anonymity Protocol</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-900 p-4 rounded-lg border border-white/5">
                    <div className="text-indigo-400 font-bold text-xs uppercase mb-2">Step 1</div>
                    <div className="text-white text-sm mb-1">Local Hashing</div>
                    <div className="text-slate-500 text-xs">Your browser computes the SHA-1 hash of your password.</div>
                </div>
                <div className="bg-slate-900 p-4 rounded-lg border border-white/5">
                    <div className="text-indigo-400 font-bold text-xs uppercase mb-2">Step 2</div>
                    <div className="text-white text-sm mb-1">Prefix Query</div>
                    <div className="text-slate-500 text-xs">We send only the first 5 characters of the hash to the API.</div>
                </div>
                <div className="bg-slate-900 p-4 rounded-lg border border-white/5">
                    <div className="text-indigo-400 font-bold text-xs uppercase mb-2">Step 3</div>
                    <div className="text-white text-sm mb-1">Local Match</div>
                    <div className="text-slate-500 text-xs">The API returns hundreds of partial matches. Your browser finds the needle in the haystack locally.</div>
                </div>
            </div>
        </div>
    </div>
);

const JavaContent = () => {
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex justify-between items-start">
                <Header icon={<Coffee size={32} className="text-orange-400"/>} title="Java Runtime (Headless)" />
                <a href="/Bastion.java" download="Bastion.java">
                    <Button variant="secondary" className="text-xs">
                        <Download size={14} /> Download Source
                    </Button>
                </a>
            </div>
            
            <div className="space-y-4">
                <p className="text-slate-300">
                    The <strong>Reference Implementation</strong> for offline agents. This single-file Java application runs anywhere, has zero external dependencies, and supports a full interactive CLI mode for headless operation.
                </p>

                <div className="bg-black rounded-xl border border-white/10 overflow-hidden font-mono text-sm shadow-xl">
                    <div className="bg-slate-900 px-4 py-2 border-b border-white/5 flex items-center gap-2 text-slate-500">
                        <Terminal size={14} /> bash
                    </div>
                    <div className="p-6 relative group space-y-4">
                        <div>
                            <div className="text-slate-500 mb-1"># 1. Download & Compile (GitHub Main)</div>
                            <div className="text-emerald-400">curl -sO https://raw.githubusercontent.com/imkevinchasse/Bastion-Enclave-repo-V2/main/public/Bastion.java</div>
                            <div className="text-emerald-400">javac Bastion.java</div>
                        </div>
                        <div>
                            <div className="text-slate-500 mb-1"># 2. Run CLI Mode</div>
                            <div className="text-emerald-400">java Bastion shell</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const ChangelogContent = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
        <Header icon={<History size={32} className="text-slate-400"/>} title="Protocol Changelog" />
        
        <div className="space-y-8">
            {/* V3.5 */}
            <div className="relative border-l-2 border-indigo-500 pl-6 pb-2">
                <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-indigo-500 border-4 border-slate-950"></div>
                <h3 className="text-xl font-bold text-white mb-1 flex items-center gap-3">
                    Bastion Protocol V3.5 <span className="text-xs bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded border border-indigo-500/30">STABLE</span>
                </h3>
                <div className="text-xs text-slate-500 font-mono mb-4">Epoch: 2026-01-30 • Scope: Serialization & Format Discipline</div>

                <div className="space-y-6 text-sm text-slate-400">
                    <div className="space-y-2">
                        <h4 className="text-white font-bold flex items-center gap-2"><Binary size={14} className="text-blue-400"/> Canonical Serialization (New)</h4>
                        <ul className="list-disc list-outside ml-4 space-y-1 text-slate-400 marker:text-slate-600">
                            <li>Vault plaintext is now serialized using a strict, deterministic canonical format prior to encryption.</li>
                            <li>Field ordering is fixed and versioned.</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    </div>
);

// --- HELPER COMPONENTS ---

const NavButton = ({active, onClick, icon, label}: {active: boolean, onClick: () => void, icon: React.ReactNode, label: string}) => (
    <button onClick={onClick} className={`flex items-center gap-2 px-4 py-2 w-full rounded-lg text-sm font-medium transition-all ${active ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent'}`}>
        {icon} {label}
    </button>
);

const Header = ({ icon, title }: { icon: React.ReactNode, title: string }) => (
    <div className="flex items-center gap-4 border-b border-white/5 pb-6">
        <div className="p-3 bg-slate-900 rounded-xl border border-white/10">
            {icon}
        </div>
        <h2 className="text-3xl font-bold text-white tracking-tight">{title}</h2>
    </div>
);

const FeatureCard = ({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) => (
    <div className="bg-slate-900/50 p-6 rounded-xl border border-white/5">
        <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-slate-800 rounded-lg">
                {icon}
            </div>
            <h3 className="font-bold text-white">{title}</h3>
        </div>
        <p className="text-sm text-slate-400 leading-relaxed">{desc}</p>
    </div>
);

const Step = ({ number, title, children }: { number: number, title: string, children?: React.ReactNode }) => (
    <div className="flex gap-4">
        <div className="flex flex-col items-center">
            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-indigo-500/20">
                {number}
            </div>
            <div className="w-px h-full bg-indigo-500/20 my-2"></div>
        </div>
        <div className="pb-8">
            <h4 className="text-white font-bold mb-2 text-lg">{title}</h4>
            <div className="text-slate-400 text-sm leading-relaxed space-y-2">
                {children}
            </div>
        </div>
    </div>
);

const CopyButton = ({ text }: { text: string }) => {
    const [copied, setCopied] = useState(false);
    
    const handleCopy = () => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <button 
            onClick={handleCopy}
            className="p-1.5 text-slate-500 hover:text-white transition-colors ml-auto bg-slate-900 rounded-lg border border-white/10"
            title="Copy to clipboard"
        >
            {copied ? <CheckCircle size={14} className="text-emerald-500" /> : <Copy size={14} />}
        </button>
    );
};
