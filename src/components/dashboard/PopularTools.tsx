import React from 'react';
import { ArrowUpRight, Sparkles, Flame, Zap, CheckCircle2, ArrowRight } from 'lucide-react';
import { ToolItem } from '../../types';
import { IconHelper } from '../common/IconHelper';

interface PopularToolsProps {
  tools: ToolItem[];
  onSelectTool: (tool: ToolItem) => void;
}

export const PopularTools: React.FC<PopularToolsProps> = ({ tools, onSelectTool }) => {
  // Limit to 8 tools to keep the dashboard clean
  const displayTools = tools.slice(0, 8);

  const getAccentStyles = (color: string) => {
    switch (color) {
      case 'rose':
        return {
          iconBg: 'bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400 group-hover:bg-rose-600 group-hover:text-white',
          border: 'hover:border-rose-300 dark:hover:border-rose-700/80',
          badge: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800'
        };
      case 'blue':
        return {
          iconBg: 'bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 group-hover:bg-blue-600 group-hover:text-white',
          border: 'hover:border-blue-300 dark:hover:border-blue-700/80',
          badge: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800'
        };
      case 'indigo':
        return {
          iconBg: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white',
          border: 'hover:border-indigo-300 dark:hover:border-indigo-700/80',
          badge: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800'
        };
      case 'purple':
        return {
          iconBg: 'bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400 group-hover:bg-purple-600 group-hover:text-white',
          border: 'hover:border-purple-300 dark:hover:border-purple-700/80',
          badge: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800'
        };
      case 'emerald':
        return {
          iconBg: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 group-hover:bg-emerald-600 group-hover:text-white',
          border: 'hover:border-emerald-300 dark:hover:border-emerald-700/80',
          badge: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
        };
      case 'amber':
        return {
          iconBg: 'bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400 group-hover:bg-amber-600 group-hover:text-white',
          border: 'hover:border-amber-300 dark:hover:border-amber-700/80',
          badge: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800'
        };
      case 'cyan':
        return {
          iconBg: 'bg-cyan-50 text-cyan-600 dark:bg-cyan-950/60 dark:text-cyan-400 group-hover:bg-cyan-600 group-hover:text-white',
          border: 'hover:border-cyan-300 dark:hover:border-cyan-700/80',
          badge: 'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950/60 dark:text-cyan-300 dark:border-cyan-800'
        };
      default:
        return {
          iconBg: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 group-hover:bg-brand-600 group-hover:text-white',
          border: 'hover:border-brand-300 dark:hover:border-brand-700/80',
          badge: 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
        };
    }
  };

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="flex items-center justify-between gap-3 pb-1 border-b border-slate-200/60 dark:border-slate-800/60">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-2xl bg-gradient-to-tr from-rose-500 to-amber-500 text-white shadow-md shadow-rose-500/20">
            <Flame className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                Popular Tools
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200/60 dark:border-rose-800/60">
                Trending
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-normal">
              High-speed converters & instant utilities
            </p>
          </div>
        </div>
      </div>

      {/* Grid of Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {displayTools.map((tool) => {
          const styles = getAccentStyles(tool.accentColor);

          return (
            <div
              key={tool.id}
              onClick={() => onSelectTool(tool)}
              className={`group relative p-5 rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800/90 shadow-xs hover:shadow-xl hover:-translate-y-1.5 transition-all duration-200 cursor-pointer ${styles.border}`}
            >
              {/* Top row: Icon & Action Indicator */}
              <div className="flex items-start justify-between mb-3.5">
                <div className={`p-3 rounded-2xl transition-all duration-200 shadow-xs group-hover:scale-110 ${styles.iconBg}`}>
                  <IconHelper name={tool.iconName} className="w-5 h-5" />
                </div>

                <div className="flex items-center gap-1.5">
                  {tool.isAi ? (
                    <span className="flex items-center gap-1 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 border border-purple-200/70 dark:border-purple-800/70 shadow-xs">
                      <Sparkles className="w-2.5 h-2.5 text-purple-500" /> AI
                    </span>
                  ) : (
                    <span className="text-[10px] font-extrabold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200/60 dark:border-emerald-800/60">
                      FREE
                    </span>
                  )}
                  <div className="w-7 h-7 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 group-hover:text-brand-600 dark:group-hover:text-brand-400 group-hover:bg-brand-50 dark:group-hover:bg-brand-950/60 flex items-center justify-center transition-all">
                    <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </div>
                </div>
              </div>

              {/* Title & Description */}
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors line-clamp-1">
                {tool.name}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed h-8">
                {tool.description}
              </p>

              {/* Formats pill footer */}
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] font-semibold text-slate-500">
                <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-[10px] font-bold">
                  {tool.fromFormat}
                </span>
                <span className="text-slate-400 dark:text-slate-500 font-bold text-xs">➔</span>
                <span className="px-2.5 py-1 rounded-lg bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 border border-brand-200/50 dark:border-brand-800/50 font-mono text-[10px] font-bold">
                  {tool.toFormat}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
