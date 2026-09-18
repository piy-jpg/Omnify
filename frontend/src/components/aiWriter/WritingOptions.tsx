import React from 'react';
import {
  Mail,
  FileText,
  Briefcase,
  Send,
  CalendarX,
  FileCheck,
  Megaphone,
  FileSignature,
  AlertCircle,
  HelpCircle,
  MessageSquare,
  StickyNote,
  BarChart3,
  Lightbulb,
  Users,
  Edit3,
  Sliders,
  Globe,
  Sparkles,
  ChevronDown,
  Check
} from 'lucide-react';
import {
  WritingContentType,
  WritingTone,
  WritingLength,
  WritingLanguage
} from '../../types/aiWriter';
import {
  CONTENT_TYPE_PRESETS,
  TONE_OPTIONS,
  LENGTH_OPTIONS,
  LANGUAGE_OPTIONS
} from '../../data/aiWriterPresets';

interface WritingOptionsProps {
  selectedType: WritingContentType;
  onSelectType: (type: WritingContentType) => void;
  selectedTone: WritingTone;
  onSelectTone: (tone: WritingTone) => void;
  selectedLength: WritingLength;
  onSelectLength: (length: WritingLength) => void;
  selectedLanguage: WritingLanguage;
  onSelectLanguage: (lang: WritingLanguage) => void;
  disabled?: boolean;
}

export const WritingOptions: React.FC<WritingOptionsProps> = ({
  selectedType,
  onSelectType,
  selectedTone,
  onSelectTone,
  selectedLength,
  onSelectLength,
  selectedLanguage,
  onSelectLanguage,
  disabled
}) => {
  const currentPreset = CONTENT_TYPE_PRESETS.find(p => p.id === selectedType) || CONTENT_TYPE_PRESETS[0];

  return (
    <div className="space-y-4">
      {/* 1. Content Type Selector */}
      <div className="space-y-1.5">
        <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Document / Content Type
        </label>
        <div className="relative">
          <select
            value={selectedType}
            onChange={(e) => onSelectType(e.target.value as WritingContentType)}
            disabled={disabled}
            className="w-full px-3.5 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-bold text-xs sm:text-sm shadow-xs focus:ring-2 focus:ring-brand-500 focus:border-brand-500 appearance-none cursor-pointer pr-10 transition-all hover:border-brand-400/50"
          >
            <optgroup label="📧 Emails & Professional Messages">
              {CONTENT_TYPE_PRESETS.filter(p => p.category === 'email').map(p => (
                <option key={p.id} value={p.id}>{p.label}</option>
              ))}
            </optgroup>
            <optgroup label="📜 Formal Letters & Notices">
              {CONTENT_TYPE_PRESETS.filter(p => p.category === 'official').map(p => (
                <option key={p.id} value={p.id}>{p.label}</option>
              ))}
            </optgroup>
            <optgroup label="💼 Corporate & Business">
              {CONTENT_TYPE_PRESETS.filter(p => p.category === 'business').map(p => (
                <option key={p.id} value={p.id}>{p.label}</option>
              ))}
            </optgroup>
            <optgroup label="✨ General & Other">
              {CONTENT_TYPE_PRESETS.filter(p => p.category === 'general').map(p => (
                <option key={p.id} value={p.id}>{p.label}</option>
              ))}
            </optgroup>
          </select>
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
            <ChevronDown className="w-4 h-4" />
          </div>
        </div>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
          {currentPreset.description}
        </p>
      </div>

      {/* 2. Tone Selector - Clean Responsive Grid with Ample Room */}
      <div className="space-y-1.5">
        <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Writing Tone
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-2">
          {TONE_OPTIONS.map((t) => {
            const isSelected = selectedTone === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => onSelectTone(t.id)}
                disabled={disabled}
                className={`p-2 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-1.5 ${
                  isSelected
                    ? 'border-brand-500 bg-brand-500/10 text-brand-700 dark:text-brand-300 ring-1 ring-brand-500 font-bold shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-sm shrink-0">{t.icon}</span>
                  <span className="text-xs font-bold truncate">{t.label}</span>
                </div>
                {isSelected && <Check className="w-3 h-3 text-brand-500 shrink-0" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Length & Language Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
        {/* Length */}
        <div className="space-y-1.5">
          <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Target Length
          </label>
          <div className="grid grid-cols-3 gap-1 p-1 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            {LENGTH_OPTIONS.map((l) => (
              <button
                key={l.id}
                type="button"
                onClick={() => onSelectLength(l.id)}
                disabled={disabled}
                className={`py-1.5 px-1 rounded-xl text-xs font-bold transition-all text-center cursor-pointer ${
                  selectedLength === l.id
                    ? 'bg-white dark:bg-slate-800 text-brand-600 dark:text-brand-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>

        {/* Language */}
        <div className="space-y-1.5">
          <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Language
          </label>
          <div className="relative">
            <select
              value={selectedLanguage}
              onChange={(e) => onSelectLanguage(e.target.value)}
              disabled={disabled}
              className="w-full px-3 py-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-bold text-xs shadow-xs focus:ring-2 focus:ring-brand-500 appearance-none cursor-pointer pr-8"
            >
              {LANGUAGE_OPTIONS.map((lang) => (
                <option key={lang.id} value={lang.id}>
                  {lang.label} ({lang.nativeLabel})
                </option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
              <Globe className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
