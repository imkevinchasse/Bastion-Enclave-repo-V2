
import React, { useState, useEffect } from 'react';
import { HeartHandshake, Code, Share2, XCircle, ShieldCheck, Loader2, Landmark, UserCheck, Sparkles, Timer, Scale, Medal } from 'lucide-react';
import { AttestationService } from '../services/attestation';
import { GenesisService } from '../services/genesis';
import { IdentityProof } from '../types';
import { Input } from './Input';

interface CovenantModalProps {
  onResolve: (proof: IdentityProof) => void;
  mode?: 'onboarding' | 'sustenance';
  onDismiss?: () => void;
  legacyVersion?: number;
}

export const CovenantModal: React.FC<CovenantModalProps> = ({ onResolve, mode = 'onboarding', onDismiss, legacyVersion }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [stewardName, setStewardName] = useState('');
  const [genesisStatus, setGenesisStatus] = useState<any>(null);

  useEffect(() => {
      setGenesisStatus(GenesisService.getEpochStatus());
  }, []);

  const handleCommit = async (tier: 'sovereign' | 'advocate' | 'architect' | 'guardian') => {
    setIsProcessing(true);
    
    // Simulate cryptographic delay / Gateway connection
    await new Promise(r => setTimeout(r, 1200));

    if (tier === 'guardian') {
        // Redirect to Stripe for financial pledge
        window.open('https://donate.stripe.com/eVq3cwceX02x4Jufrx1VK00', '_blank');
    }
    
    if (tier === 'architect') {
        // Redirect to GitHub for code pledge
        window.open('https://github.com/imkevinchasse/Bastion-Enclave-repo-V2', '_blank');
    }

    try {
        const proof = await AttestationService.generateIdentity(tier, stewardName, legacyVersion);
        onResolve(proof);
    } catch (e) {
        console.error("Identity generation failed", e);
        // Fallback to basic sovereign
        const fallback = await AttestationService.generateIdentity('sovereign', stewardName, legacyVersion);
        onResolve(fallback);
    } finally {
        setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-md animate-in fade-in duration-700">
      <div className="max-w-2xl w-full bg-slate-900 border border-white/10 rounded-3xl shadow-2xl overflow-hidden relative animate-in zoom-in-95 duration-500">
        
        {/* Top Accent Line */}
        <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${mode === 'sustenance' ? 'from-emerald-500 via-amber-500 to-indigo-500' : 'from-amber-500 via-indigo-500 to-emerald-500'}`}></div>
        
        {isProcessing ? (
            <div className="p-20 flex flex-col items-center justify-center text-center">
                <Loader2 size={48} className="animate-spin text-indigo-500 mb-6" />
                <h3 className="text-xl font-bold text-white mb-2">
                    {mode === 'sustenance' ? 'Recording Stewardship...' : 'Issuing Continuity Bond...'}
                </h3>
                <p className="text-slate-400 text-sm">Cryptographically sealing your pledge.</p>
            </div>
        ) : (
            <div className="p-8 md:p-12 space-y-8">
            
            {/* Header */}
            <div className="text-center space-y-6">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-800 border border-white/5 mb-4 shadow-xl">
                    {mode === 'sustenance' ? <Scale size={32} className="text-emerald-400" /> : <Landmark size={32} className="text-amber-400" />}
                </div>
                <div>
                    <h2 className="text-3xl font-black text-white tracking-tight uppercase mb-2">
                        {mode === 'sustenance' ? 'Protocol Sustenance' : 'Protocol Continuity'}
                    </h2>
                    <p className="text-sm text-slate-400 font-mono uppercase tracking-widest">
                        {mode === 'sustenance' ? 'Value for Value' : 'Sovereign Stewardship Model'}
                    </p>
                </div>
                
                {/* Legacy Veteran Recognition */}
                {legacyVersion && (
                    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-3 flex items-center justify-between max-w-md mx-auto">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-slate-700 rounded-lg text-slate-300">
                                <Medal size={16} />
                            </div>
                            <div className="text-left">
                                <div className="text-xs font-bold text-slate-300 uppercase tracking-wider">Early Adopter Recognized</div>
                                <div className="text-[10px] text-slate-500">Origin: Protocol V{legacyVersion}</div>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-[10px] font-bold text-white px-2 py-1 bg-slate-700 rounded border border-slate-600">VETERAN STATUS</div>
                        </div>
                    </div>
                )}

                {/* Genesis Status Banner */}
                {genesisStatus?.isOpen && mode === 'onboarding' && (
                    <div className="bg-indigo-900/20 border border-indigo-500/30 rounded-xl p-3 flex items-center justify-between max-w-md mx-auto">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-500/20 rounded-lg text-indigo-400">
                                <Sparkles size={16} />
                            </div>
                            <div className="text-left">
                                <div className="text-xs font-bold text-indigo-300 uppercase tracking-wider">Genesis Window Open</div>
                                <div className="text-[10px] text-indigo-400/70">Epoch: {genesisStatus.name}</div>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-xs font-mono font-bold text-white">{genesisStatus.daysRemaining} Days Left</div>
                            <div className="text-[10px] text-indigo-400/70">Current Rank: #{genesisStatus.estimatedRank}</div>
                        </div>
                    </div>
                )}

                <div className="relative py-2">
                    <p className="text-lg text-slate-300 leading-relaxed font-serif italic max-w-lg mx-auto">
                        {mode === 'sustenance' 
                            ? "\"The laborer is worthy of his wages. If this tool has served you, consider bonding to ensure its survival.\""
                            : "\"Bastion Enclave rejects surveillance capitalism. It survives solely on Continuity Bonds issued by its users.\""
                        }
                    </p>
                </div>
            </div>

            {/* Input */}
            <div className="max-w-sm mx-auto">
                <Input 
                    placeholder="Steward Name (Optional)" 
                    value={stewardName}
                    onChange={(e) => setStewardName(e.target.value)}
                    icon={<UserCheck size={16} />}
                    className="text-center"
                />
                <p className="text-[10px] text-slate-500 text-center mt-2">
                    This name is cryptographically sealed in your local bond. It is not public.
                </p>
            </div>

            {/* Choices */}
            <div className="grid gap-3">
                <button onClick={() => handleCommit('guardian')} className="group flex items-center gap-5 p-4 rounded-2xl border border-white/5 bg-white/0 hover:bg-white/5 hover:border-indigo-500/30 transition-all text-left">
                    <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl group-hover:bg-indigo-500 group-hover:text-white transition-colors shrink-0">
                        <ShieldCheck size={24} />
                    </div>
                    <div>
                        <div className="font-bold text-slate-200 group-hover:text-white text-base">Issue Guardian Bond</div>
                        <div className="text-xs text-slate-500 group-hover:text-slate-400 transition-colors">I pledge financial stewardship. <span className="text-indigo-400 font-bold ml-1">+ Genesis Artifact</span></div>
                    </div>
                </button>

                <button onClick={() => handleCommit('architect')} className="group flex items-center gap-5 p-4 rounded-2xl border border-white/5 bg-white/0 hover:bg-white/5 hover:border-emerald-500/30 transition-all text-left">
                    <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl group-hover:bg-emerald-500 group-hover:text-white transition-colors shrink-0">
                        <Code size={24} />
                    </div>
                    <div>
                        <div className="font-bold text-slate-200 group-hover:text-white text-base">Issue Architect Bond</div>
                        <div className="text-xs text-slate-500 group-hover:text-slate-400 transition-colors">I pledge code/audit support. <span className="text-emerald-400 font-bold ml-1">+ Genesis Artifact</span></div>
                    </div>
                </button>

                <button onClick={() => handleCommit('advocate')} className="group flex items-center gap-5 p-4 rounded-2xl border border-white/5 bg-white/0 hover:bg-white/5 hover:border-amber-500/30 transition-all text-left">
                    <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl group-hover:bg-amber-500 group-hover:text-white transition-colors shrink-0">
                        <Share2 size={24} />
                    </div>
                    <div>
                        <div className="font-bold text-slate-200 group-hover:text-white text-base">Issue Advocate Bond</div>
                        <div className="text-xs text-slate-500 group-hover:text-slate-400 transition-colors">I pledge education support. <span className="text-amber-400 font-bold ml-1">+ Genesis Artifact</span></div>
                    </div>
                </button>

                {mode === 'onboarding' ? (
                    <button onClick={() => handleCommit('sovereign')} className="group flex items-center gap-5 p-4 rounded-2xl border border-white/5 bg-white/0 hover:bg-white/5 hover:border-slate-500/30 transition-all text-left opacity-60 hover:opacity-100">
                        <div className="p-3 bg-slate-800 text-slate-400 rounded-xl group-hover:bg-slate-700 group-hover:text-white transition-colors shrink-0">
                            <XCircle size={24} />
                        </div>
                        <div>
                            <div className="font-bold text-slate-300 group-hover:text-white text-base">Remain Observer</div>
                            <div className="text-xs text-slate-500 group-hover:text-slate-400 transition-colors">I cannot issue a bond at this time.</div>
                        </div>
                    </button>
                ) : (
                    <button onClick={onDismiss} className="group flex items-center gap-5 p-4 rounded-2xl border border-white/5 bg-white/0 hover:bg-white/5 hover:border-slate-500/30 transition-all text-left opacity-60 hover:opacity-100">
                        <div className="p-3 bg-slate-800 text-slate-400 rounded-xl group-hover:bg-slate-700 group-hover:text-white transition-colors shrink-0">
                            <XCircle size={24} />
                        </div>
                        <div>
                            <div className="font-bold text-slate-300 group-hover:text-white text-base">Not Yet</div>
                            <div className="text-xs text-slate-500 group-hover:text-slate-400 transition-colors">I will reconsider later.</div>
                        </div>
                    </button>
                )}
            </div>
            
            </div>
        )}
      </div>
    </div>
  );
};
