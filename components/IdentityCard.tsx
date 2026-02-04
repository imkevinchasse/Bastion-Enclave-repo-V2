
import React, { useState } from 'react';
import { IdentityProof } from '../types';
import { ShieldCheck, Fingerprint, Activity, Award, CheckCircle, Copy, Code, Share2, Landmark, Calendar, Sparkles, Medal } from 'lucide-react';

interface IdentityCardProps {
  proof: IdentityProof;
}

export const IdentityCard: React.FC<IdentityCardProps> = ({ proof }) => {
  const [flipped, setFlipped] = useState(false);
  const [copied, setCopied] = useState(false);

  const getTierColor = (tier: string) => {
      switch(tier) {
          case 'architect': return 'from-purple-500 to-indigo-600 border-purple-400';
          case 'guardian': return 'from-amber-400 to-orange-600 border-amber-400'; // Gold for Guardian/Financial
          case 'advocate': return 'from-emerald-400 to-teal-600 border-emerald-400';
          default: return 'from-slate-700 to-slate-900 border-slate-600'; // sovereign
      }
  };

  const getTierLabel = (tier: string) => {
      switch(tier) {
          case 'architect': return 'Architect Bond';
          case 'guardian': return 'Guardian Bond';
          case 'advocate': return 'Advocate Bond';
          default: return 'Sovereign Observer';
      }
  };

  const getBondIcon = (tier: string) => {
      switch(tier) {
          case 'architect': return <Code size={24} />;
          case 'guardian': return <Landmark size={24} />;
          case 'advocate': return <Share2 size={24} />;
          default: return <Fingerprint size={24} />;
      }
  };

  const handleCopy = (e: React.MouseEvent) => {
      e.stopPropagation();
      const exportJson = JSON.stringify({
          bastion_bond: {
              id: proof.id,
              tier: proof.tier,
              steward: proof.stewardName,
              issued: proof.timestamp,
              genesis: proof.genesis,
              veteran: proof.veteran,
              sig: proof.signature
          }
      }, null, 2);
      navigator.clipboard.writeText(exportJson);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
  };

  const expiryDate = new Date(proof.timestamp + (365 * 24 * 60 * 60 * 1000)); // 1 Year
  const daysRemaining = Math.ceil((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  const isActive = daysRemaining > 0;

  return (
    <div className="perspective-1000 w-full max-w-md mx-auto h-[280px] cursor-pointer group" onClick={() => setFlipped(!flipped)}>
        <div className={`relative w-full h-full transition-transform duration-700 preserve-3d ${flipped ? 'rotate-y-180' : ''}`}>
            
            {/* FRONT FACE */}
            <div className={`absolute inset-0 backface-hidden rounded-2xl p-6 flex flex-col justify-between overflow-hidden border bg-gradient-to-br ${getTierColor(proof.tier)} shadow-2xl`}>
                
                {/* Holographic Overlay Effect */}
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
                <div className="absolute -inset-full top-0 block h-[200%] w-[200%] -rotate-45 translate-y-[20%] bg-gradient-to-r from-transparent via-white/10 to-transparent group-hover:animate-[shimmer_2.5s_infinite] pointer-events-none"></div>

                {/* Genesis Artifact Decoration (Gold Sheen) */}
                {proof.genesis && (
                    <div className="absolute top-0 right-0 w-24 h-24 bg-yellow-400/20 blur-2xl rounded-full pointer-events-none mix-blend-screen"></div>
                )}

                <div className="relative z-10 flex justify-between items-start">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/20 backdrop-blur-md rounded-lg text-white border border-white/20">
                            {getBondIcon(proof.tier)}
                        </div>
                        <div>
                            <h3 className="font-bold text-white text-lg tracking-tight leading-none">{getTierLabel(proof.tier)}</h3>
                            <p className="text-[10px] text-white/70 font-mono mt-1">CONTINUITY PROTOCOL</p>
                        </div>
                    </div>
                    <div className={`bg-white/10 backdrop-blur-md px-3 py-1 rounded-full border border-white/20 text-[10px] font-bold text-white flex items-center gap-1 ${isActive ? 'bg-emerald-500/20 border-emerald-400/30' : 'bg-red-500/20 border-red-400/30'}`}>
                        {isActive ? <CheckCircle size={10} /> : <Activity size={10} />} {isActive ? 'ACTIVE' : 'EXPIRED'}
                    </div>
                </div>

                <div className="relative z-10 space-y-4">
                    
                    {/* BADGES CONTAINER */}
                    <div className="flex gap-2">
                        {/* Genesis Badge */}
                        {proof.genesis && (
                            <div className="flex items-center gap-3 bg-white/10 border border-white/20 rounded-lg p-2 backdrop-blur-sm">
                                <div className="p-1.5 bg-yellow-500/20 rounded text-yellow-300 border border-yellow-500/30">
                                    <Sparkles size={14} />
                                </div>
                                <div>
                                    <div className="text-[10px] font-bold text-white uppercase tracking-widest leading-none mb-0.5">Genesis Artifact</div>
                                    <div className="text-[9px] font-mono text-yellow-200/80">Epoch: {proof.genesis.epoch} • Rank: #{proof.genesis.rank}</div>
                                </div>
                            </div>
                        )}

                        {/* Veteran Badge */}
                        {proof.veteran && (
                            <div className="flex items-center gap-3 bg-white/10 border border-white/20 rounded-lg p-2 backdrop-blur-sm">
                                <div className="p-1.5 bg-slate-500/30 rounded text-slate-300 border border-slate-400/30">
                                    <Medal size={14} />
                                </div>
                                <div>
                                    <div className="text-[10px] font-bold text-white uppercase tracking-widest leading-none mb-0.5">Early Adopter</div>
                                    <div className="text-[9px] font-mono text-slate-300/80">{proof.veteran.label}</div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="font-mono text-xs text-white/60 space-y-1 mt-2">
                        <div className="flex justify-between">
                            <span>STEWARD</span>
                            <span className="text-white font-bold">{proof.stewardName || 'ANONYMOUS'}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>RENEWS</span>
                            <span className={daysRemaining < 30 ? "text-red-300" : "text-white"}>{expiryDate.toLocaleDateString()}</span>
                        </div>
                    </div>
                    
                    <div className="pt-3 border-t border-white/10 flex justify-between items-end">
                        <div className="text-[10px] text-white/50 max-w-[200px] leading-tight">
                            Cryptographic continuity bond. Non-transferable.
                        </div>
                        <div className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors" onClick={handleCopy}>
                            {copied ? <CheckCircle size={16} className="text-white"/> : <Share2 size={16} className="text-white"/>}
                        </div>
                    </div>
                </div>
            </div>

            {/* BACK FACE */}
            <div className="absolute inset-0 backface-hidden rotate-y-180 bg-slate-900 rounded-2xl border border-white/10 p-6 flex flex-col shadow-2xl">
                <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-widest mb-4">
                    <Code size={14} /> Signed Ledger Entry
                </div>
                
                <div className="flex-1 bg-black/50 rounded-lg p-3 font-mono text-[10px] text-emerald-400 overflow-hidden break-all border border-white/5 relative">
                    <div className="absolute top-2 right-2 flex gap-1">
                        <div className="w-2 h-2 rounded-full bg-red-500"></div>
                        <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                        <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                    </div>
                    <span className="text-slate-500">{"// Continuity Bond"}</span><br/>
                    {`{`}
                    <br/>&nbsp;&nbsp;"steward": "{proof.stewardName || 'ANONYMOUS'}",
                    <br/>&nbsp;&nbsp;"bond_type": "{proof.tier}",
                    {proof.genesis && (
                        <>
                        <br/>&nbsp;&nbsp;"genesis_rank": {proof.genesis.rank},
                        </>
                    )}
                    {proof.veteran && (
                        <>
                        <br/>&nbsp;&nbsp;"veteran_status": "V{proof.veteran.version}",
                        </>
                    )}
                    <br/>&nbsp;&nbsp;"expires": "{expiryDate.toISOString().split('T')[0]}",
                    <br/>&nbsp;&nbsp;"sig": "{proof.signature.substring(0, 12)}..."
                    <br/>{`}`}
                </div>

                <div className="mt-4 text-center text-[10px] text-slate-500">
                    This bond verifies your role in sustaining the enclave.
                </div>
            </div>

        </div>
    </div>
  );
};
