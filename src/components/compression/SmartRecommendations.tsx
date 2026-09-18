import React from 'react';
import { Sparkles, Check, ArrowRight } from 'lucide-react';
import { SmartRecommendation, CompressionOptions } from '../../types/compression';

interface SmartRecommendationsProps {
  recommendations: SmartRecommendation[];
  onApplyRecommendation: (suggested: Partial<CompressionOptions>) => void;
}

export const SmartRecommendations: React.FC<SmartRecommendationsProps> = ({
  recommendations,
  onApplyRecommendation
}) => {
  if (!recommendations || recommendations.length === 0) return null;

  return (
    <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-purple-500/10 via-indigo-500/10 to-brand-500/10 border border-purple-200/80 dark:border-purple-900/40 space-y-3 animate-in fade-in duration-200">
      <div className="flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
        <h4 className="text-xs font-extrabold uppercase tracking-wider text-purple-900 dark:text-purple-200">
          Smart Optimization Recommendations
        </h4>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {recommendations.map((rec, idx) => (
          <div
            key={idx}
            className="p-3.5 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-purple-100 dark:border-purple-900/30 backdrop-blur-xs flex flex-col justify-between gap-3 shadow-xs"
          >
            <div>
              <span className="text-xs font-extrabold text-slate-900 dark:text-white block">
                {rec.title}
              </span>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                {rec.description}
              </p>
            </div>

            {rec.suggestedSetting && (
              <button
                onClick={() => onApplyRecommendation(rec.suggestedSetting!)}
                className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-all self-start shadow-xs"
              >
                <span>Apply Setting</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
