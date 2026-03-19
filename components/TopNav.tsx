
import React, { useState } from 'react';
import { BrandLogo } from './BrandLogo';
import { Signal, Lock, Home, Menu, X, ArrowRight, BookOpen, FileText, ShieldAlert, CheckCircle } from 'lucide-react';
import { PublicPage } from '../types';

interface TopNavProps {
  active: PublicPage;
  onNavigate: (page: PublicPage) => void;
}

export const TopNav: React.FC<TopNavProps> = ({ active, onNavigate }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleNav = (page: PublicPage) => {
    onNavigate(page);
    setIsMobileMenuOpen(false);
  };

  // Z-Index lowered to 30 to avoid conflicting with dev tool overlays
  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-30 border-b border-white/5 bg-slate-950/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between relative">
          
          {/* Left Side: Logo & Nav */}
          <div className="flex items-center gap-8">
            {/* Logo Area */}
            <div 
              className="flex items-center gap-3 cursor-pointer group select-none" 
              onClick={() => handleNav('landing')}
            >
                <BrandLogo size={24} className="group-hover:brightness-125 transition-all text-amber-500" />
                <div className="flex flex-col">
                  <span className="font-semibold text-base text-slate-200 tracking-tight leading-none group-hover:text-amber-400 transition-colors">BASTION ENCLAVE</span>
                  <span className="text-[9px] text-slate-500 font-mono uppercase tracking-widest leading-none mt-1">Sovereign-V4</span>
                </div>
            </div>

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex items-center gap-1">
                <NavButton 
                  active={active === 'landing'} 
                  onClick={() => onNavigate('landing')} 
                  label="Overview" 
                />
                <NavButton 
                  active={active === 'docs'} 
                  onClick={() => onNavigate('docs')} 
                  label="Documentation" 
                />
                <NavButton 
                  active={active === 'news'} 
                  onClick={() => onNavigate('news')} 
                  label="Iron Ledger" 
                />
                <NavButton 
                  active={active === 'documents'} 
                  onClick={() => onNavigate('documents')} 
                  label="Research" 
                />
                <NavButton 
                  active={active === 'breach'} 
                  onClick={() => onNavigate('breach')} 
                  label="Breach Check" 
                />
            </div>
          </div>

          {/* Right Side Actions */}
          <div className="hidden md:flex items-center gap-4">
              <button 
                onClick={() => onNavigate('auth')}
                className="group relative px-4 py-1.5 rounded-none bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-medium transition-all flex items-center gap-2 overflow-hidden shadow-[0_0_15px_rgba(245,158,11,0.2)] hover:shadow-[0_0_20px_rgba(245,158,11,0.4)]"
              >
                <Lock size={12} className="group-hover:scale-110 transition-transform" />
                <span>Vault Access</span>
              </button>
          </div>

          {/* Mobile Toggle */}
          <button 
            className="md:hidden p-2 text-slate-400 hover:text-amber-400 transition-colors"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle Menu"
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </nav>

      {/* Mobile Navigation Menu */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-20 bg-slate-950 pt-20 px-6 animate-in slide-in-from-top-10 duration-200">
           <div className="flex flex-col gap-2">
             <MobileNavButton 
                active={active === 'landing'} 
                onClick={() => handleNav('landing')} 
                icon={<Home size={16} />} 
                label="Overview" 
                desc="Platform Features"
             />
             <MobileNavButton 
                active={active === 'docs'} 
                onClick={() => handleNav('docs')} 
                icon={<FileText size={16} />} 
                label="Documentation" 
                desc="User Manual & Specs"
             />
             <MobileNavButton 
                active={active === 'news'} 
                onClick={() => handleNav('news')} 
                icon={<Signal size={16} />} 
                label="Iron Ledger" 
                desc="System Updates"
             />
             <MobileNavButton 
                active={active === 'documents'} 
                onClick={() => handleNav('documents')} 
                icon={<BookOpen size={16} />} 
                label="Research" 
                desc="Technical Papers"
             />
             <MobileNavButton 
                active={active === 'breach'} 
                onClick={() => handleNav('breach')} 
                icon={<ShieldAlert size={16} />} 
                label="Breach Check" 
                desc="Password Analysis"
             />
             
             <div className="h-px bg-slate-800 my-4"></div>

             <button 
                onClick={() => handleNav('auth')} 
                className="w-full p-4 rounded-none bg-amber-600 text-slate-950 font-mono font-bold uppercase text-xs tracking-wider flex items-center justify-between"
             >
                <span className="flex items-center gap-3">
                  <Lock size={16} /> Vault Access
                </span>
                <ArrowRight size={16} />
             </button>
           </div>
        </div>
      )}
    </>
  );
};

const NavButton = ({ active, onClick, label }: { active: boolean, onClick: () => void, label: string }) => (
  <button 
    onClick={onClick}
    className={`px-3 py-1.5 rounded-none text-xs font-medium transition-all ${
      active 
        ? 'text-amber-400 bg-amber-500/10' 
        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
    }`}
  >
     {label}
  </button>
);

const MobileNavButton = ({ active, onClick, icon, label, desc }: any) => (
  <button 
      onClick={onClick}
      className={`p-3 rounded-none flex items-center gap-4 transition-all border ${active ? 'bg-amber-500/10 border-amber-500/20' : 'bg-transparent border-transparent hover:bg-slate-800/50 hover:border-white/5'}`}
  >
      <div className={`text-slate-500 ${active ? 'text-amber-400' : ''}`}>
        {icon}
      </div>
      <div className="text-left">
        <div className={`text-sm font-medium ${active ? 'text-amber-400' : 'text-slate-300'}`}>{label}</div>
        <div className="text-[10px] text-slate-500 font-mono mt-0.5">{desc}</div>
      </div>
  </button>
);
