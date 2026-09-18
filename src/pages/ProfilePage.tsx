import React, { useState } from 'react';
import { 
  User, 
  ShieldCheck, 
  Key, 
  Crown, 
  CheckCircle2, 
  Copy, 
  Check, 
  Sparkles,
  Smartphone,
  HardDrive
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface ProfilePageProps {
  onOpenUpgrade: () => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ onOpenUpgrade }) => {
  const { user } = useAuth();
  const [copiedKey, setCopiedKey] = useState(false);
  const apiKey = 'omni_live_994a82b9e189201f928c0018274';

  const userName = user?.name || 'Piyush Verma';
  const userEmail = user?.email || 'piyush.verma@example.com';
  const userCategory = user?.category || 'Developer';
  const userPhone = user?.phone || '+91 98765 43210';
  const userInitials = userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'PV';

  const handleCopyKey = () => {
    navigator.clipboard.writeText(apiKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      
      {/* Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-brand-950 text-white p-6 sm:p-8 shadow-lg border border-indigo-800/40">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand-600 to-purple-600 flex items-center justify-center text-white text-xl font-extrabold shadow-lg">
              {userInitials}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-extrabold text-white">{userName}</h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  LIFETIME FREE PRO MEMBER
                </span>
              </div>
              <p className="text-xs text-indigo-200 mt-0.5">
                {userEmail} &bull; {userCategory} &bull; {userPhone} &bull; 100% Free Lifetime Pass
              </p>
            </div>
          </div>

          <button
            onClick={onOpenUpgrade}
            className="px-4 py-2 rounded-xl bg-white text-indigo-950 hover:bg-indigo-50 text-xs font-bold shadow-md self-start sm:self-auto cursor-pointer"
          >
            Manage Free Pass & Storage
          </button>
        </div>
      </div>

      {/* Profile Details & API Access */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Account info */}
        <div className="lg:col-span-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">Account Credentials</h2>
          
          <div className="space-y-3 text-xs">
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300">Display Name</label>
              <input type="text" readOnly value="Piyush Verma" className="w-full mt-1 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold" />
            </div>
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300">Registered Email</label>
              <input type="email" readOnly value="piyush.verma@example.com" className="w-full mt-1 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold" />
            </div>
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300">Security & 2FA Status</label>
              <div className="mt-1 flex items-center justify-between p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 font-bold">
                <span className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-emerald-600" /> Authenticator App 2FA Enabled</span>
                <span className="text-[10px] bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded">Active</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: API Secret Keys */}
        <div className="lg:col-span-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">Developer API Keys</h2>
          
          <p className="text-xs text-slate-500">
            Use your personal API token to programmatically trigger document conversions from your CLI, Python scripts, or backend services.
          </p>

          <div className="p-3 rounded-2xl bg-slate-900 text-white font-mono text-xs flex items-center justify-between">
            <span className="truncate pr-2">{apiKey}</span>
            <button
              onClick={handleCopyKey}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 flex-shrink-0"
            >
              {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 text-xs text-slate-600 dark:text-slate-400 space-y-1">
            <p className="font-bold text-slate-800 dark:text-slate-200">API Endpoint:</p>
            <p className="font-mono text-[11px] text-brand-600 dark:text-brand-400">POST https://api.convertpro.app/v1/convert</p>
          </div>
        </div>

      </div>

    </div>
  );
};
