
import React, { useState } from 'react';
import { TopNav } from './TopNav';
import { Button } from './Button';
import { FileText, ExternalLink, ShieldAlert, BookOpen, Fingerprint, Microscope, FileCheck, ArrowRight, Mail, Bot, X, Terminal, Share2, Network } from 'lucide-react';
import { PublicPage } from '../types';

interface DocumentsPageProps {
  onNavigate: (page: PublicPage) => void;
}

const AGENT_SKILL_CONTENT = `
# Bastion Agent Skill

## 🦞 Moltbook Integration
This vault is **Moltbook Ready**. Agents operating this vault may share status updates, audit logs, and security scores to the Moltbook network.

### Identity Claim Flow
To claim this vault on Moltbook, follow this sequence:
1.  **Verify**: Ensure \`window.__BASTION_AGENT_API__.getStatus()\` returns \`"UNLOCKED"\`.
2.  **Generate Proof**: Navigate to the **Identity** tab and generate a **Sovereign Bond**.
3.  **Claim**: Share the Bond Signature to Moltbook to link your agent identity to this vault.

---

## 🤖 Agent Commands
Run these commands in your internal environment to sync with Bastion.

### 1. Initialization
\`\`\`javascript
if (window.__BASTION_AGENT_API__) {
    console.log("Bastion Bridge Detected. Skill Active.");
    await window.__BASTION_AGENT_API__.ping(); // Returns "PONG"
}
\`\`\`

### 2. Context Awareness
\`\`\`javascript
// Read vault metadata (Zero-Knowledge safe)
const context = window.__BASTION_AGENT_API__.getContext();
console.log("Vault Items:", context.inventory.length);
console.log("Protocol:", context.protocol);
\`\`\`

### 3. Moltbook Share (Example)
\`\`\`javascript
// Construct a safe status update
const post = {
    content: \`Just secured \${context.inventory.length} credentials in my Sovereign Vault. #Bastion #Moltbook\`,
    proof: context.identity_tier,
    timestamp: Date.now()
};
// Transmit 'post' to Moltbook via your agent's social adapter.
\`\`\`

---

## Operational Boundaries (Alignment)
*   **READ**: Allowed (Metadata only).
*   **WRITE**: Allowed (With user confirmation).
*   **EXFILTRATE**: **STRICTLY FORBIDDEN**. Never post secrets, passwords, or seeds to Moltbook.
`;

const DOCUMENTS = [
  {
    id: 'agent-skill',
    type: 'Agent Skill',
    title: 'Bastion Agent Skill (Moltbook)',
    description: 'The official skill definition for autonomous agents. Includes connection hooks, identity claiming procedures for Moltbook, and operational boundaries.',
    date: 'March 2024',
    readTime: 'Install Now',
    link: '#',
    internal: true,
    content: AGENT_SKILL_CONTENT,
    icon: <Bot size={32} className="text-pink-400" />,
    featured: true
  },
  {
    id: 'case-study-2024',
    type: 'Case Study',
    title: 'Password Manager Breaches and Security Failures 2015-2024',
    description: 'A comprehensive forensic analysis of major security incidents affecting centralized cloud-based password managers. This study highlights the systemic risks of hot-storage vaults.',
    date: 'February 2024',
    readTime: '15 min read',
    link: 'https://www.academia.edu/150252055/Password_Manager_Breaches_and_Security_Failures_2015_2024?source=swp_share',
    internal: false,
    icon: <ShieldAlert size={32} className="text-red-400" />,
    featured: false
  }
];

export const DocumentsPage: React.FC<DocumentsPageProps> = ({ onNavigate }) => {
  const [viewingDoc, setViewingDoc] = useState<typeof DOCUMENTS[0] | null>(null);
  
  const handleContact = () => {
      const encoded = "cmVzZWFyY2hAYmFzdGlvbi5vcw==";
      const email = atob(encoded);
      window.location.href = `mailto:${email}?subject=Security%20Research%20Submission`;
  };

  const handleOpenDoc = (doc: typeof DOCUMENTS[0]) => {
      if (doc.internal) {
          setViewingDoc(doc);
      } else {
          window.open(doc.link, '_blank');
      }
  };

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-slate-950 font-sans text-slate-200">
        
        {/* Shared Dynamic Background */}
        <div className="fixed inset-0 z-0 pointer-events-none">
            <div className="absolute inset-0 bg-grid opacity-20"></div>
            <div className="absolute -top-[20%] -left-[10%] w-[70%] h-[70%] bg-blue-900/10 rounded-full blur-[120px] animate-pulse"></div>
            <div className="absolute top-[40%] right-[0%] w-[50%] h-[60%] bg-indigo-900/10 rounded-full blur-[100px]"></div>
            <div className="absolute inset-0 opacity-30" style={{background: 'radial-gradient(circle at center, transparent 0%, #020617 100%)'}}></div>
        </div>

        <TopNav active="documents" onNavigate={onNavigate} />

        {/* Content */}
        <div className="relative z-10 flex-1 w-full max-w-6xl mx-auto p-6 pt-32 pb-12">
            
            {/* Page Hero */}
            <div className="text-center mb-16 animate-in fade-in slide-in-from-bottom-4">
                <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-blue-500/20 shadow-[0_0_30px_-5px_rgba(59,130,246,0.3)]">
                    <BookOpen size={32} className="text-blue-400" />
                </div>
                <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-4">
                    Strategic Intelligence
                </h1>
                <p className="text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
                    Research, case studies, and agent capabilities defining the future of sovereign identity.
                </p>
            </div>

            {/* Documents Grid */}
            <div className="space-y-8">
                {DOCUMENTS.map((doc, index) => (
                    <div 
                        key={doc.id}
                        className={`group relative overflow-hidden rounded-3xl border transition-all duration-300 ${doc.featured ? 'bg-slate-900/60 border-indigo-500/30 shadow-2xl shadow-indigo-500/10' : 'bg-slate-900/40 border-white/5 hover:border-white/10'}`}
                    >
                         {/* Featured Highlight */}
                         {doc.featured && (
                             <div className="absolute top-0 right-0 p-32 bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
                         )}

                         <div className="flex flex-col md:flex-row gap-8 p-8 md:p-10 relative z-10">
                             {/* Icon Column */}
                             <div className="shrink-0">
                                 <div className={`w-20 h-20 rounded-2xl flex items-center justify-center border shadow-inner ${doc.featured ? 'bg-slate-800 border-white/10' : 'bg-slate-950 border-white/5'}`}>
                                     {doc.icon}
                                 </div>
                             </div>

                             {/* Content Column */}
                             <div className="flex-1 space-y-4">
                                 <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-widest">
                                     <span className={`px-3 py-1 rounded-full ${doc.featured ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-400'}`}>
                                         {doc.type}
                                     </span>
                                     <span className="text-slate-500">• {doc.date}</span>
                                     {doc.featured && <span className="text-emerald-400 flex items-center gap-1"><Network size={10}/> MOLTBOOK READY</span>}
                                 </div>

                                 <h2 className="text-2xl md:text-3xl font-bold text-white leading-tight group-hover:text-indigo-200 transition-colors">
                                     {doc.title}
                                 </h2>

                                 <p className="text-slate-400 text-lg leading-relaxed max-w-3xl">
                                     {doc.description}
                                 </p>

                                 <div className="pt-4">
                                     <Button 
                                        variant={doc.featured ? 'primary' : 'secondary'} 
                                        className="group/btn"
                                        onClick={() => handleOpenDoc(doc)}
                                     >
                                         {doc.internal ? (doc.featured ? 'Install Skill' : 'View Document') : 'Read External'} 
                                         <ArrowRight size={18} className="group-hover/btn:translate-x-1 transition-transform" />
                                     </Button>
                                 </div>
                             </div>
                         </div>
                    </div>
                ))}
            </div>

            {/* Submission CTA */}
            <div className="mt-16 p-8 rounded-3xl bg-slate-900/30 border border-white/5 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-6">
                    <div className="p-4 bg-slate-800 rounded-full">
                        <Fingerprint size={24} className="text-slate-400" />
                    </div>
                    <div>
                        <h3 className="font-bold text-white text-lg">Submit Research</h3>
                        <p className="text-slate-400 text-sm">Have a security finding? We participate in responsible disclosure.</p>
                    </div>
                </div>
                <Button variant="ghost" onClick={handleContact}>
                    <Mail size={18} /> Submit via Email
                </Button>
            </div>
        </div>

        {/* DOCUMENT VIEWER MODAL */}
        {viewingDoc && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md animate-in fade-in" onClick={() => setViewingDoc(null)}></div>
                <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-4xl h-[85vh] relative z-10 flex flex-col shadow-2xl animate-in zoom-in-95">
                    
                    {/* Modal Header */}
                    <div className="flex items-center justify-between p-6 border-b border-white/5 bg-slate-950/50 rounded-t-2xl">
                        <div className="flex items-center gap-4">
                            <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400 border border-indigo-500/20">
                                <Bot size={20} />
                            </div>
                            <div>
                                <h3 className="font-bold text-white">{viewingDoc.title}</h3>
                                <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
                                    <Terminal size={10} /> {viewingDoc.id.toUpperCase()}
                                </div>
                            </div>
                        </div>
                        <button onClick={() => setViewingDoc(null)} className="p-2 text-slate-500 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                            <X size={20} />
                        </button>
                    </div>

                    {/* Modal Content */}
                    <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                        <div id="openclaw-readme" className="prose prose-invert prose-indigo max-w-none">
                            <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-slate-300">
                                {viewingDoc.content}
                            </pre>
                        </div>
                    </div>

                    {/* Modal Footer */}
                    <div className="p-4 bg-slate-950/50 border-t border-white/5 rounded-b-2xl flex justify-between items-center text-xs text-slate-500 font-mono">
                        <div>ALIGNMENT_HASH: VALID</div>
                        <div className="flex gap-4">
                            <span className="flex items-center gap-1 text-emerald-400"><Share2 size={10} /> MOLTBOOK_COMPATIBLE</span>
                            <span>READ_ONLY</span>
                        </div>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};
