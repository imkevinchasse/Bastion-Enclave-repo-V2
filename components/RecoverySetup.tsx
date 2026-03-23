import React, { useState } from 'react';
import { RecoveryService } from '../services/recoveryService';
import { Button } from './Button';
import { ShieldCheck, Copy, Check, AlertTriangle, ArrowRight } from 'lucide-react';

export const RecoverySetup: React.FC<{ masterSeed: string, onComplete: () => void }> = ({ masterSeed, onComplete }) => {
    const [step, setStep] = useState(0);
    const [setupData, setSetupData] = useState<{ shareB: string, totpUri: string } | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [copied, setCopied] = useState(false);

    const handleSetup = async () => {
        try {
            setLoading(true);
            setError('');
            const data = await RecoveryService.setupRecovery(masterSeed);
            setSetupData(data);
            setStep(1);
        } catch (e: any) {
            setError(e.message || "Failed to setup recovery");
        } finally {
            setLoading(false);
        }
    };

    const copyShare = () => {
        if (setupData) {
            navigator.clipboard.writeText(setupData.shareB);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    if (step === 0) {
        return (
            <div className="bg-slate-900/50 p-6 border border-white/5 space-y-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <ShieldCheck className="text-amber-500" /> Optional Recovery Setup
                </h3>
                <p className="text-sm text-slate-400">
                    Set up a deterministic, offline recovery method. This will generate a recovery capsule protected by Shamir's Secret Sharing, device-bound storage, and TOTP.
                </p>
                {error && <div className="text-red-400 text-xs bg-red-500/10 p-3 border border-red-500/20"><AlertTriangle size={14} className="inline mr-1"/>{error}</div>}
                <Button onClick={handleSetup} isLoading={loading} className="w-full">
                    Initialize Recovery System
                </Button>
            </div>
        );
    }

    return (
        <div className="bg-slate-900/50 p-6 border border-white/5 space-y-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <ShieldCheck className="text-emerald-500" /> Recovery Initialized
            </h3>
            
            <div className="space-y-4">
                <div className="bg-black/20 p-4 border border-white/5">
                    <h4 className="text-sm font-bold text-slate-300 mb-2">1. Save Your Backup Share</h4>
                    <p className="text-xs text-slate-500 mb-3">
                        This is "Share B". You must save this offline (print it, write it down, or store it on a separate secure device). You will need this if you lose your device or TOTP.
                    </p>
                    <div className="flex items-center gap-2">
                        <div className="font-mono text-amber-500/90 break-all bg-black/40 p-3 flex-1 select-all text-xs border border-amber-500/20">
                            {setupData?.shareB}
                        </div>
                        <button onClick={copyShare} className="p-3 hover:text-white text-amber-500 transition-colors bg-amber-500/10 border border-amber-500/20">
                            {copied ? <Check size={16} /> : <Copy size={16} />}
                        </button>
                    </div>
                </div>

                <div className="bg-black/20 p-4 border border-white/5">
                    <h4 className="text-sm font-bold text-slate-300 mb-2">2. Setup Authenticator App</h4>
                    <p className="text-xs text-slate-500 mb-3">
                        Scan this QR code or enter the URI into your authenticator app (e.g., Google Authenticator, Authy). This is required for device-based recovery.
                    </p>
                    <div className="bg-white p-4 inline-block mb-3">
                        {/* We use a simple QR code API for convenience, but the URI is also provided for offline entry */}
                        <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(setupData?.totpUri || '')}`} alt="TOTP QR Code" />
                    </div>
                    <div className="font-mono text-slate-400 break-all bg-black/40 p-2 text-[10px] border border-white/5">
                        {setupData?.totpUri}
                    </div>
                </div>
            </div>

            <Button onClick={onComplete} className="w-full" variant="secondary">
                I have saved my share and configured TOTP <ArrowRight size={16} className="ml-2" />
            </Button>
        </div>
    );
};
