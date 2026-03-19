
import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({ label, error, icon, className = '', ...props }) => {
  return (
    <div className="w-full group">
      {label && <label className="block text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-1.5 ml-1 group-focus-within:text-amber-400 transition-colors">{label}</label>}
      <div className="relative">
        <input
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck="false"
          className={`w-full bg-slate-950 border ${error ? 'border-red-500/50 focus:border-red-500' : 'border-white/10 focus:border-amber-500/50'} text-slate-100 rounded-none py-2.5 px-3 focus:ring-1 focus:ring-amber-500/50 transition-all outline-none placeholder-slate-600 font-mono text-sm shadow-inner ${icon ? 'pl-10' : ''} ${className}`}
          {...props}
        />
        {icon && (
          <div className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors ${error ? 'text-red-400' : 'text-slate-500 group-focus-within:text-amber-400'}`}>
            {icon}
          </div>
        )}
      </div>
      {error && <p className="mt-1.5 ml-1 text-xs text-red-400 font-medium flex items-center gap-1">
        <span className="inline-block w-1 h-1 rounded-none bg-red-400"/>
        {error}
      </p>}
    </div>
  );
};
