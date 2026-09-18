import React from 'react';
import { TranslationMode } from '../../services/ai/aiTranslationService';
import { Sparkles, Briefcase, Award, Smile, GraduationCap, Building2, Cpu, Feather, Palette } from 'lucide-react';

interface TranslatorModeSelectorProps {
  selectedMode: TranslationMode;
  onSelectMode: (mode: TranslationMode) => void;
}

interface ModeItem {
  id: TranslationMode;
  label: string;
  description: string;
  icon: React.ElementType;
  badgeColor: string;
}

export const MODES_LIST: ModeItem[] = [
  {
    id: 'standard',
    label: 'Standard',
    description: 'Natural, fluent, and faithful translation',
    icon: Sparkles,
    badgeColor: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 dark:text-indigo-400'
  },
  {
    id: 'professional',
    label: 'Professional',
    description: 'Polished corporate tone with refined wording',
    icon: Briefcase,
    badgeColor: 'text-blue-600 bg-blue-50 dark:bg-blue-950/60 dark:text-blue-400'
  },
  {
    id: 'formal',
    label: 'Formal',
    description: 'Elevated vocabulary with respectful structure',
    icon: Award,
    badgeColor: 'text-purple-600 bg-purple-50 dark:bg-purple-950/60 dark:text-purple-400'
  },
  {
    id: 'business',
    label: 'Business',
    description: 'Executive-ready commercial terminology',
    icon: Building2,
    badgeColor: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 dark:text-emerald-400'
  },
  {
    id: 'technical',
    label: 'Technical',
    description: 'Preserves technical parameters & formulas',
    icon: Cpu,
    badgeColor: 'text-amber-600 bg-amber-50 dark:bg-amber-950/60 dark:text-amber-400'
  },
  {
    id: 'academic',
    label: 'Academic',
    description: 'Scholarly precision and formal citations',
    icon: GraduationCap,
    badgeColor: 'text-cyan-600 bg-cyan-50 dark:bg-cyan-950/60 dark:text-cyan-400'
  },
  {
    id: 'casual',
    label: 'Casual',
    description: 'Relaxed, friendly, and conversational',
    icon: Smile,
    badgeColor: 'text-rose-600 bg-rose-50 dark:bg-rose-950/60 dark:text-rose-400'
  },
  {
    id: 'simple',
    label: 'Simple',
    description: 'Plain, easily understood wording',
    icon: Feather,
    badgeColor: 'text-teal-600 bg-teal-50 dark:bg-teal-950/60 dark:text-teal-400'
  },
  {
    id: 'creative',
    label: 'Creative',
    description: 'Engaging, expressive, and stylistic flow',
    icon: Palette,
    badgeColor: 'text-fuchsia-600 bg-fuchsia-50 dark:bg-fuchsia-950/60 dark:text-fuchsia-400'
  }
];

export const TranslatorModeSelector: React.FC<TranslatorModeSelectorProps> = ({
  selectedMode,
  onSelectMode
}) => {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Translation Style & Mode:
        </span>
        <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
          Adapts vocabulary while preserving semantic context
        </span>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-none">
        {MODES_LIST.map(mode => {
          const Icon = mode.icon;
          const isSelected = selectedMode === mode.id;

          return (
            <button
              key={mode.id}
              onClick={() => onSelectMode(mode.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all duration-150 ${
                isSelected
                  ? 'bg-brand-600 text-white shadow-md shadow-brand-500/25 scale-[1.02]'
                  : 'bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-slate-400'}`} />
              <span>{mode.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
