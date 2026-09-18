import React, { useState } from 'react';
import {
  Sparkles,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Zap,
  Info
} from 'lucide-react';
import {
  WritingContentType,
  SmartTemplateFields
} from '../../types/aiWriter';
import {
  CONTENT_TYPE_PRESETS,
  EXAMPLE_PROMPTS,
  ExamplePrompt
} from '../../data/aiWriterPresets';

interface AIWriterInputProps {
  userInput: string;
  onChangeUserInput: (text: string) => void;
  selectedType: WritingContentType;
  smartFields: SmartTemplateFields;
  onChangeSmartFields: (fields: SmartTemplateFields) => void;
  onGenerate: () => void;
  isGenerating: boolean;
  onSelectExample: (example: ExamplePrompt) => void;
}

export const AIWriterInput: React.FC<AIWriterInputProps> = ({
  userInput,
  onChangeUserInput,
  selectedType,
  smartFields,
  onChangeSmartFields,
  onGenerate,
  isGenerating,
  onSelectExample
}) => {
  const [showSmartFields, setShowSmartFields] = useState(false);
  const currentPreset = CONTENT_TYPE_PRESETS.find(p => p.id === selectedType) || CONTENT_TYPE_PRESETS[0];

  const wordCount = userInput.trim().split(/\s+/).filter(Boolean).length;
  const charCount = userInput.length;

  const handleFieldChange = (key: keyof SmartTemplateFields, val: string) => {
    onChangeSmartFields({
      ...smartFields,
      [key]: val
    });
  };

  return (
    <div className="space-y-3.5 pt-1">
      {/* 1. Main Raw Input Box */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
            What do you want to write?
          </label>
          <div className="text-[10px] font-mono text-slate-400">
            {wordCount} words • {charCount} chars
          </div>
        </div>

        <div className="relative">
          <textarea
            value={userInput}
            onChange={(e) => onChangeUserInput(e.target.value)}
            disabled={isGenerating}
            placeholder={currentPreset.placeholder}
            rows={4}
            className="w-full p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs sm:text-sm leading-relaxed shadow-xs focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all resize-none placeholder:text-slate-400 font-medium"
          />
        </div>
      </div>

      {/* 2. Clickable Quick Example Pills */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-1 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
          <Zap className="w-3 h-3 text-amber-500" />
          <span>Quick Examples:</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {EXAMPLE_PROMPTS.slice(0, 4).map((ex, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => onSelectExample(ex)}
              disabled={isGenerating}
              className="px-2.5 py-1 rounded-xl bg-slate-100/90 dark:bg-slate-800 hover:bg-brand-500/10 hover:text-brand-600 dark:hover:text-brand-400 border border-slate-200/70 dark:border-slate-700/60 text-[11px] font-semibold text-slate-600 dark:text-slate-300 transition-all cursor-pointer shadow-2xs"
            >
              {ex.title}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Optional Smart Template Fields */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 overflow-hidden">
        <button
          type="button"
          onClick={() => setShowSmartFields(!showSmartFields)}
          className="w-full px-3.5 py-2 flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
        >
          <span className="flex items-center gap-1.5">
            <SlidersHorizontal className="w-3.5 h-3.5 text-brand-500" />
            <span>Optional Document Fields</span>
            <span className="text-[10px] font-normal text-slate-400">(Recipient, Date...)</span>
          </span>
          {showSmartFields ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
        </button>

        {showSmartFields && (
          <div className="p-3 pt-0 space-y-2.5 border-t border-slate-200/60 dark:border-slate-800/60 animate-fade-in text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-0.5">To / Recipient Name</label>
                <input
                  type="text"
                  placeholder="e.g. Professor Smith"
                  value={smartFields.recipient || ''}
                  onChange={(e) => handleFieldChange('recipient', e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-0.5">From / Your Name</label>
                <input
                  type="text"
                  placeholder="e.g. Alex Johnson"
                  value={smartFields.sender || ''}
                  onChange={(e) => handleFieldChange('sender', e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Organization / Institution</label>
                <input
                  type="text"
                  placeholder="e.g. Stanford University"
                  value={smartFields.organization || ''}
                  onChange={(e) => handleFieldChange('organization', e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Date</label>
                <input
                  type="text"
                  placeholder="e.g. Today"
                  value={smartFields.date || ''}
                  onChange={(e) => handleFieldChange('date', e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                />
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 pt-0.5">
              <Info className="w-3 h-3 text-brand-500 flex-shrink-0" />
              <span>Leave blank for auto [Placeholders].</span>
            </div>
          </div>
        )}
      </div>

      {/* 4. Generate Action Button */}
      <button
        type="button"
        onClick={onGenerate}
        disabled={isGenerating}
        className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-brand-600 via-indigo-600 to-purple-600 hover:from-brand-500 hover:to-indigo-500 text-white font-black text-sm shadow-lg shadow-brand-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isGenerating ? (
          <>
            <RotateCcw className="w-4 h-4 animate-spin" />
            <span>Generating Polished Document...</span>
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
            <span>Generate Document</span>
          </>
        )}
      </button>
    </div>
  );
};
