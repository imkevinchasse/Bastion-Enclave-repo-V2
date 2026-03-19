
import React, { useState, useEffect } from 'react';
import { Button } from './Button';
import { Input } from './Input';
import { TopNav } from './TopNav';
import { RefreshCw, Copy, Check, Eye, EyeOff, ShieldAlert, KeyRound, Upload, Trash2, LogIn, UserPlus, HelpCircle, HardDrive, FileText, Scan, Fingerprint, Info, Terminal, ShieldCheck } from 'lucide-react';
import { ChaosLock, ChaosEngine } from '../services/cryptoService';
import { VaultState, PublicPage, VaultFlags } from '../types';
import { track } from '@vercel/analytics';
import { SecurityService } from '../services/securityService';

interface AuthScreenProps {
  onOpen: (state: VaultState, blob: string, password: string, isNew?: boolean, detectedVersion?: number) => void;
  onNavigate: (page: PublicPage) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onOpen, onNavigate }) => {
  const [tab, setTab] = useState<'open' | 'create'>('open');
  const [password, setPassword] = useState('');
  const [blob, setBlob] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // UI State
  const [showPassword, setShowPassword] = useState(false);
  const [copiedPassword, setCopiedPassword] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  
  // Local Storage State
  const [localVaultFound, setLocalVaultFound] = useState(false);
  const [integritySafe, setIntegritySafe] = useState(true);

  // Input Validation State
  const isSeed = /^[0-9a-fA-F]{64}$/i.test(blob.trim());
  const isBackup = blob.trim().includes("BASTION SECURE VAULT");

  // Dev Mode Detection (UI Only)
  const isDevModeTrigger = password.startsWith("dev://");

  useEffect(() => {
      // Check Local Storage for existing vault
      const storedBlob = localStorage.getItem('BASTION_VAULT');
      if (storedBlob) {
          setBlob(storedBlob);
          setLocalVaultFound(true);
      }
      
      // Always default to 'open' (Restore/Unlock) to allow inputting existing vault info immediately.
      // We do not force 'create' even if no local vault is found.
      setTab('open');

      // Check Integrity
      const report = SecurityService.checkIntegrity();
      setIntegritySafe(!report.compromised);
  }, []);

  const confirmClearLocalVault = () => {
      localStorage.removeItem('BASTION_VAULT');
      localStorage.removeItem('BASTION_MAX_VERSION');
      setBlob('');
      setLocalVaultFound(false);
      setTab('open'); // Default to open/restore after clear
      setPassword('');
      setShowClearConfirm(false);
  };

  const generateStrongPassword = () => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?";
    const len = 32;
    const array = new Uint32Array(len);
    window.crypto.getRandomValues(array);
    return Array.from(array).map(x => chars[x % chars.length]).join('');
  };

  useEffect(() => {
    if (tab === 'create') {
        if (!password) {
            setPassword(generateStrongPassword());
            setShowPassword(true);
        }
    } else {
        setPassword('');
        setShowPassword(false);
    }
  }, [tab]);

  const handleRegeneratePassword = () => {
      setPassword(generateStrongPassword());
      setCopiedPassword(false);
  };

  const handleCopyPassword = () => {
      navigator.clipboard.writeText(password);
      setCopiedPassword(true);
      setTimeout(() => setCopiedPassword(false), 2000);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
        setError("Password must be at least 8 characters");
        return;
    }
    setLoading(true);
    
    // --- SECURE DEVELOPER MODE INITIALIZATION ---
    // 1. Check for trigger prefix
    let finalPassword = password;
    let flags = VaultFlags.NONE;

    if (password.startsWith("dev://")) {
        // Strip the prefix to ensure the actual key used for encryption is the strong part.
        // This prevents the "dev://" string from becoming a known plaintext weakness in the key derivation input.
        finalPassword = password.replace("dev://", "");
        
        if (finalPassword.length < 8) {
            setError("Developer password too short after stripping prefix.");
            setLoading(false);
            return;
        }
        
        // Set the flag BIT. This is stored INSIDE the encrypted blob.
        // Attackers cannot see this flag without decrypting the vault first.
        flags |= VaultFlags.DEVELOPER;
    }

    // 2. Generate Full Entropy (32 bytes)
    // We NEVER modify this entropy. It must remain pure random.
    const entropy = ChaosEngine.generateEntropy();

    const initialState: VaultState = { 
        entropy, 
        configs: [], 
        notes: [], 
        contacts: [], 
        locker: [],
        version: 1,
        lastModified: Date.now(),
        flags: flags // Stored securely inside the blob
    };

    try {
        const newBlob = await ChaosLock.pack(initialState, finalPassword);
        
        // Reset version sentinel for new vault
        localStorage.removeItem('BASTION_MAX_VERSION');

        // Analytics Beacon
        track('Vault Created');

        // Pass isNew=true to trigger unsaved changes warning until backup
        onOpen(initialState, newBlob, finalPassword, true, 4); // 4 = Current Protocol
    } catch (e) {
        setError("Failed to create vault.");
    } finally {
        setLoading(false);
    }
  };

  const handleOpen = async (e: React.FormEvent) => {
    e.preventDefault();
    const inputData = blob.trim();

    if (!inputData) {
        setError("Please provide a Backup File or Seed.");
        return;
    }
    setLoading(true);
    setError('');

    try {
        const isHexSeed = /^[0-9a-fA-F]{64}$/.test(inputData);

        if (isHexSeed) {
            const recoveredState: VaultState = {
                entropy: inputData.toLowerCase(),
                configs: [], 
                notes: [], 
                contacts: [], 
                locker: [],
                version: 1,
                lastModified: Date.now(),
                flags: VaultFlags.NONE // Seeds alone cannot recover flags, safe default
            };
            const newBlob = await ChaosLock.pack(recoveredState, password || 'temp');
            
            // Analytics Beacon
            track('Identity Recovered');

            // Recovering from seed is effectively a "new" session in memory until saved
            onOpen(recoveredState, newBlob, password, true, 4);
        } else {
            const { state, version } = await ChaosLock.unpack(inputData, password);
            
            // Analytics Beacon
            track('Vault Unlocked');

            // Pass detected version to App for legacy handling
            onOpen(state, inputData, password, false, version);
        }

    } catch (e) {
        await new Promise(r => setTimeout(r, 800));
        setError("Incorrect password or invalid file.");
    } finally {
        setLoading(false);
    }
  };

  const handleFileDrop = async (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) {
          try {
              const text = await file.text();
              if (text.includes("BASTION SECURE VAULT")) {
                   const tokenMatch = text.match(/\[2\] VAULT TOKEN[^\n]*\n-+\n([A-Za-z0-9+/=]+)/m);
                   if (tokenMatch && tokenMatch[1]) setBlob(tokenMatch[1].trim());
                   if (!tokenMatch) {
                        const seedMatch = text.match(/\[3\] MASTER SEED[^\n]*\n-+\n([0-9a-fA-F]{64})/m);
                        if (seedMatch && seedMatch[1]) setBlob(seedMatch[1].trim());
                   }
              } else {
                  setBlob(text.trim());
              }
              setLocalVaultFound(true); 
          } catch(err) {
              setError("Could not read file.");
          }
      }
  };

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-slate-950 font-sans text-slate-200">
        
        {/* Simplified Auth UI logic remains the same, just handling new unpack return type internally */}
        <div className="fixed inset-0 z-0 pointer-events-none">
            <div className="absolute inset-0 bg-grid opacity-[0.03]"></div>
            <div className="absolute top-[20%] right-[10%] w-[60%] h-[60%] bg-amber-900/10 rounded-none blur-[120px] animate-pulse"></div>
        </div>

        <TopNav active="auth" onNavigate={onNavigate} />

        <div className="relative z-10 flex-1 flex flex-col items-center justify-center max-w-md mx-auto w-full p-4 pt-24">
            
            <div className="w-full relative">
                <div className="relative bg-slate-950/80 backdrop-blur-xl rounded-none border border-white/5 overflow-hidden shadow-2xl">
                    
                    {/* Integrity Banner */}
                    {integritySafe && (
                        <div className="bg-emerald-950/50 border-b border-emerald-900/50 py-1.5 flex justify-center items-center gap-2 text-[10px] font-mono font-bold text-emerald-500 uppercase tracking-widest">
                            <ShieldCheck size={12} /> Execution Environment Verified
                        </div>
                    )}

                    <div className="flex border-b border-white/5 bg-slate-900/30">
                        <button 
                            onClick={() => {setTab('open'); setError('');}}
                            data-agent-id="auth-tab-open"
                            className={`flex-1 py-4 text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors ${tab === 'open' ? 'text-amber-400 bg-amber-500/5 border-b-2 border-amber-500' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'}`}
                        >
                            <LogIn size={16} /> Unlock Vault
                        </button>
                        <button 
                            onClick={() => {setTab('create'); setError('');}}
                            data-agent-id="auth-tab-create"
                            className={`flex-1 py-4 text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors ${tab === 'create' ? 'text-amber-400 bg-amber-500/5 border-b-2 border-amber-500' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'}`}
                        >
                            <UserPlus size={16} /> Create New
                        </button>
                    </div>

                    <div className="p-6">
                        <button onClick={() => setShowHelp(!showHelp)} className="absolute top-16 right-4 text-slate-600 hover:text-amber-400 transition-colors">
                            <HelpCircle size={16} />
                        </button>

                         {showHelp && (
                            <div className="absolute inset-0 z-20 bg-slate-950/95 backdrop-blur-md p-8 flex flex-col justify-center animate-in fade-in">
                                <h3 className="font-mono font-bold text-amber-400 mb-4 uppercase tracking-wider text-sm">About Bastion Enclave</h3>
                                <ul className="space-y-3 text-xs font-mono text-slate-400">
                                    <li><span className="text-amber-500 mr-2">{'>'}</span><strong>Local Only:</strong> Data never leaves this device.</li>
                                    <li><span className="text-amber-500 mr-2">{'>'}</span><strong>No Cloud:</strong> We cannot reset your password.</li>
                                    <li><span className="text-amber-500 mr-2">{'>'}</span><strong>Backups:</strong> Download a backup file from the main menu.</li>
                                    <li><span className="text-amber-500 mr-2">{'>'}</span><strong>Dev Mode:</strong> Prefix password with <code>dev://</code> to initialize a Developer Vault.</li>
                                </ul>
                                <Button size="sm" variant="secondary" onClick={() => setShowHelp(false)} className="mt-6 w-full">Acknowledge</Button>
                            </div>
                        )}

                        {tab === 'open' ? (
                            <form onSubmit={handleOpen} className="space-y-6 animate-in fade-in slide-in-from-right-4">
                                <div className="text-center">
                                    {localVaultFound ? (
                                         <div className="inline-flex items-center justify-center w-12 h-12 rounded-none bg-amber-500/10 text-amber-400 mb-4 border border-amber-500/20">
                                             <HardDrive size={24} />
                                         </div>
                                    ) : (
                                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-none bg-slate-900 border border-white/5 text-slate-500 mb-4">
                                             <Scan size={24} />
                                         </div>
                                    )}
                                    <h2 className="text-xl font-semibold text-slate-200 tracking-tight">
                                        {localVaultFound ? 'Decrypt Vault' : 'Restore Vault'}
                                    </h2>
                                </div>

                                {!localVaultFound && (
                                    <>
                                        <div className="bg-slate-900/50 p-4 rounded-none border border-white/5 text-left animate-in slide-in-from-top-2">
                                            <div className="flex items-center gap-2 text-amber-400 font-mono font-bold text-[10px] uppercase tracking-wider mb-2">
                                                <Info size={12} /> Recovery Options
                                            </div>
                                            <p className="text-xs text-slate-400 leading-relaxed">
                                                <span className="text-amber-500 font-medium">A:</span> Drag & drop your <strong>Backup File</strong> to restore your vault.<br/>
                                                <span className="text-emerald-500 font-medium">B:</span> Paste your <strong>Master Seed</strong> to recover your vault.
                                            </p>
                                        </div>

                                        <div 
                                            className={`relative border border-dashed rounded-none transition-all group overflow-hidden ${
                                                isDragging ? 'border-amber-500 bg-amber-500/10' : 
                                                isSeed ? 'border-emerald-500 bg-emerald-500/10' :
                                                isBackup ? 'border-amber-500 bg-amber-500/10' :
                                                'border-white/10 hover:border-amber-500/50 hover:bg-slate-900/50 focus-within:border-amber-500/50 focus-within:bg-slate-900/50'
                                            }`}
                                        >
                                            {!blob && (
                                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none p-4 opacity-50 group-focus-within:opacity-20 transition-opacity">
                                                    <div className="flex gap-3 text-slate-500 mb-2">
                                                        <FileText size={16} />
                                                        <Fingerprint size={16} />
                                                    </div>
                                                    <p className="text-[10px] font-mono font-bold text-slate-500 uppercase text-center tracking-wider">Drag Backup File<br/><span className="text-[9px] font-normal opacity-70">or paste Master Seed</span></p>
                                                </div>
                                            )}
                                            
                                            <textarea 
                                                data-agent-id="auth-blob-input"
                                                value={blob}
                                                onChange={e => setBlob(e.target.value)}
                                                className="w-full h-32 bg-transparent p-4 text-[11px] font-mono text-slate-300 resize-none outline-none relative z-10 placeholder-transparent custom-scrollbar leading-relaxed"
                                                spellCheck={false}
                                                onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                                                onDragLeave={() => setIsDragging(false)}
                                                onDrop={handleFileDrop}
                                            />
                                            
                                            {(isSeed || isBackup) && (
                                                <div className="absolute bottom-2 right-2 px-2 py-1 rounded-none text-[9px] font-mono font-bold uppercase tracking-widest flex items-center gap-1 bg-slate-950 border border-white/5 z-20">
                                                    {isSeed ? (
                                                        <span className="text-emerald-500 flex items-center gap-1"><Fingerprint size={10} /> VALID SEED</span>
                                                    ) : (
                                                        <span className="text-amber-500 flex items-center gap-1"><FileText size={10} /> BACKUP FILE</span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </>
                                )}

                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest">Master Password</label>
                                        <div className="relative">
                                            <Input 
                                                data-agent-id="auth-master-password"
                                                type={showPassword ? "text" : "password"}
                                                value={password}
                                                onChange={e => setPassword(e.target.value)}
                                                className="pr-10"
                                                autoFocus={localVaultFound}
                                                placeholder={localVaultFound ? "••••••••" : "Password for this vault"}
                                            />
                                            <button 
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-amber-400"
                                            >
                                                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                                            </button>
                                        </div>
                                    </div>

                                    {error && (
                                        <div className="p-3 bg-red-950/50 border border-red-900/50 rounded-none flex items-center gap-2 text-red-500 text-[10px] font-mono font-bold uppercase tracking-wider">
                                            <ShieldAlert size={12} /> {error}
                                        </div>
                                    )}

                                    {showClearConfirm ? (
                                        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-none animate-in fade-in slide-in-from-bottom-2">
                                            <div className="text-red-500 text-xs font-semibold text-center mb-3">
                                                Remove local vault from this device?
                                                <div className="text-xs font-normal mt-1 text-slate-400">Ensure you have a backup. This cannot be undone.</div>
                                            </div>
                                            <div className="flex gap-2">
                                                <Button type="button" variant="ghost" onClick={() => setShowClearConfirm(false)} className="flex-1 h-10">Cancel</Button>
                                                <Button type="button" variant="danger" onClick={confirmClearLocalVault} className="flex-1 h-10">Yes, Remove</Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex gap-2">
                                            {localVaultFound && (
                                                <button 
                                                    type="button" 
                                                    onClick={() => setShowClearConfirm(true)}
                                                    className="p-2.5 rounded-none border border-white/5 bg-slate-900/50 text-slate-500 hover:text-red-500 hover:border-red-500/30 transition-colors"
                                                    title="Clear local data"
                                                >
                                                    <Trash2 size={20} />
                                                </button>
                                            )}
                                            <Button type="submit" data-agent-id="auth-unlock-btn" className="w-full h-11" isLoading={loading}>
                                                {isSeed ? 'Recover Vault' : 'Unlock Vault'}
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </form>
                        ) : (
                            <form onSubmit={handleCreate} className="space-y-6 animate-in fade-in slide-in-from-left-4">
                                <div className="text-center mb-6">
                                    <h2 className="text-xl font-semibold text-slate-200 tracking-tight">Create New Vault</h2>
                                    <p className="text-slate-400 text-sm mt-2 leading-relaxed">
                                        Everything is encrypted locally. <br/>
                                        <span className="text-amber-500">If you forget this password, your data is lost forever.</span>
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <label className="flex justify-between items-center text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest">
                                        <span>Master Password</span>
                                        <button type="button" onClick={handleRegeneratePassword} className="text-amber-500 hover:text-amber-400 flex items-center gap-1">
                                            <RefreshCw size={10} /> Generate
                                        </button>
                                    </label>
                                    <div className="relative group">
                                        <Input 
                                            data-agent-id="auth-master-password"
                                            type={showPassword ? "text" : "password"}
                                            value={password}
                                            onChange={e => setPassword(e.target.value)}
                                            className={`pr-20 ${isDevModeTrigger ? 'border-amber-500/50 focus:border-amber-500' : ''}`}
                                        />
                                        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                                            <button type="button" onClick={handleCopyPassword} className="p-1.5 text-slate-500 hover:text-amber-400 rounded-none">
                                                {copiedPassword ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                                            </button>
                                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="p-1.5 text-slate-500 hover:text-amber-400 rounded-none">
                                                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                                            </button>
                                        </div>
                                    </div>
                                    {isDevModeTrigger && (
                                        <div className="flex items-center gap-2 text-[9px] font-mono font-bold text-amber-500 mt-1 animate-in slide-in-from-top-1 uppercase tracking-widest">
                                            <Terminal size={10} /> DEVELOPER MODE FLAG SET
                                        </div>
                                    )}
                                </div>

                                <Button type="submit" data-agent-id="auth-create-btn" className="w-full h-11" isLoading={loading}>
                                    {isDevModeTrigger ? 'Initialize Dev Vault' : 'Create Vault'}
                                </Button>
                                
                                <p className="text-center text-xs text-slate-500 leading-relaxed">
                                    By creating a vault, you acknowledge that Bastion Enclave operates entirely offline. 
                                    You are responsible for downloading backups from the main menu.
                                </p>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};
