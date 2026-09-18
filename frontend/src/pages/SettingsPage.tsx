import React, { useState } from 'react';
import { 
  Settings, 
  Clock, 
  Sliders, 
  Bell, 
  Languages, 
  ShieldCheck, 
  Check, 
  Save 
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const [autoPurge, setAutoPurge] = useState('24');
  const [quality, setQuality] = useState('high');
  const [ocrLang, setOcrLang] = useState('eng');
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      
      {/* Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-800 via-indigo-900 to-slate-900 text-white p-6 sm:p-8 shadow-lg">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/15 backdrop-blur-md">
            <Settings className="w-3.5 h-3.5 text-slate-300" />
            <span>Workspace Preferences</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Engine Configuration & Privacy Rules
          </h1>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Configure default export quality, OCR neural language models, auto-purge timers, and email notifications.
          </p>
        </div>
      </div>

      {/* Settings Grid */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6 max-w-3xl">
        
        {/* Retention */}
        <div className="space-y-2 border-b border-slate-100 dark:border-slate-800 pb-5">
          <label className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-brand-600" />
            Automatic Ephemeral Retention Purge
          </label>
          <select
            value={autoPurge}
            onChange={(e) => setAutoPurge(e.target.value)}
            className="w-full p-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold"
          >
            <option value="1">1 Hour (Strict Privacy)</option>
            <option value="6">6 Hours</option>
            <option value="24">24 Hours (Standard Default)</option>
            <option value="72">72 Hours (Extended)</option>
          </select>
          <p className="text-[11px] text-slate-400">All unpinned conversion outputs will be permanently shredded after this window.</p>
        </div>

        {/* Default Compression */}
        <div className="space-y-2 border-b border-slate-100 dark:border-slate-800 pb-5">
          <label className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Sliders className="w-4 h-4 text-brand-600" />
            Default Document Compression Quality
          </label>
          <select
            value={quality}
            onChange={(e) => setQuality(e.target.value)}
            className="w-full p-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold"
          >
            <option value="high">High Quality (92% - Preserves small vectors & text)</option>
            <option value="medium">Balanced (75% - Ideal for email dispatch)</option>
            <option value="extreme">Extreme Compression (50% - Smallest file size)</option>
          </select>
        </div>

        {/* Notifications */}
        <div className="space-y-3 pb-2">
          <label className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Bell className="w-4 h-4 text-brand-600" />
            Notifications & Alerts
          </label>
          <label className="flex items-center gap-3 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={emailNotifs}
              onChange={(e) => setEmailNotifs(e.target.checked)}
              className="rounded text-brand-600 focus:ring-brand-500"
            />
            <span>Send email notification upon completion of large batch conversions</span>
          </label>
        </div>

        {/* Save button */}
        <div className="pt-2">
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md transition-all"
          >
            {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            <span>{saved ? 'Preferences Saved!' : 'Save Preferences'}</span>
          </button>
        </div>

      </div>

    </div>
  );
};
