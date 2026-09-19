import React, { useState } from 'react';
import {
  Zap,
  Scale,
  Sparkles,
  Archive,
  Target,
  Sliders,
  Film,
  Image as ImageIcon,
  Volume2,
  VolumeX,
  Layers,
  ChevronDown,
  Info
} from 'lucide-react';
import {
  CompressionOptions,
  CompressionPreset,
  VideoResolution,
  AudioMode,
  ImageResizeScale,
  QueueItem
} from '../../types/compression';
import { formatBytes } from '../../utils/formatters';
import { estimateOutputSize } from '../../utils/compressionEstimator';

interface CompressionSettingsPanelProps {
  options: CompressionOptions;
  onChange: (newOptions: CompressionOptions) => void;
  items?: QueueItem[];
  totalOriginalBytes?: number;
  hasVideo?: boolean;
  hasImage?: boolean;
  fileCount?: number;
  onApplyToAll?: () => void;
}

export const CompressionSettingsPanel: React.FC<CompressionSettingsPanelProps> = ({
  options,
  onChange,
  items = [],
  totalOriginalBytes,
  hasVideo = true,
  hasImage = true,
  fileCount = 1,
  onApplyToAll
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [customTargetInput, setCustomTargetInput] = useState('');
  const [customUnit, setCustomUnit] = useState<'KB' | 'MB'>('MB');

  const estimate = estimateOutputSize(items, options, totalOriginalBytes);

  const handlePresetSelect = (preset: CompressionPreset) => {
    let quality = 80;
    if (preset === 'fast') quality = 85;
    else if (preset === 'balanced') quality = 78;
    else if (preset === 'high') quality = 92;
    else if (preset === 'maximum') quality = 50;

    onChange({
      ...options,
      preset,
      quality,
      targetSizeBytes: preset === 'target' ? options.targetSizeBytes || 5 * 1024 * 1024 : null
    });
  };

  const handleQualityChange = (q: number) => {
    onChange({
      ...options,
      quality: q,
      preset: q > 88 ? 'high' : q < 60 ? 'maximum' : 'balanced'
    });
  };

  const handleTargetPreset = (sizeMb: number) => {
    const bytes = sizeMb * 1024 * 1024;
    onChange({
      ...options,
      preset: 'target',
      targetSizeBytes: bytes,
      targetSizeFormatted: `${sizeMb} MB`
    });
  };

  const handleCustomTargetApply = () => {
    const num = parseFloat(customTargetInput);
    if (!isNaN(num) && num > 0) {
      const bytes = customUnit === 'MB' ? num * 1024 * 1024 : num * 1024;
      onChange({
        ...options,
        preset: 'target',
        targetSizeBytes: Math.round(bytes),
        targetSizeFormatted: `${num} ${customUnit}`
      });
    }
  };

  const presets: { id: CompressionPreset; label: string; desc: string; icon: React.ElementType; color: string }[] = [
    { id: 'fast', label: 'Fast', desc: 'Quick low-CPU processing', icon: Zap, color: 'text-amber-500' },
    { id: 'balanced', label: 'Balanced', desc: 'Recommended: Optimal quality & size', icon: Scale, color: 'text-brand-500' },
    { id: 'high', label: 'High Quality', desc: 'Maximum visual & document fidelity', icon: Sparkles, color: 'text-purple-500' },
    { id: 'maximum', label: 'Maximum', desc: 'Smallest practical file size', icon: Archive, color: 'text-emerald-500' },
    { id: 'target', label: 'Target Size', desc: 'Attempt exact file size threshold', icon: Target, color: 'text-rose-500' }
  ];

  return (
    <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-5 sm:p-6 shadow-sm space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-2xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">
              Compression Settings
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Select an optimization preset or customize granular parameters
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {totalOriginalBytes !== undefined && totalOriginalBytes > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-xs font-mono">
              <span className="text-slate-400 font-bold uppercase text-[10px]">Previous Size:</span>
              <span className="font-extrabold text-slate-900 dark:text-white">{formatBytes(totalOriginalBytes)}</span>
              {fileCount > 1 && <span className="text-slate-400 text-[10px]">({fileCount} files)</span>}
            </div>
          )}

          {fileCount > 1 && onApplyToAll && (
            <button
              onClick={onApplyToAll}
              className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-brand-50 hover:text-brand-600 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all"
            >
              Apply to All Files ({fileCount})
            </button>
          )}
        </div>
      </div>

      {/* 1. Presets Selector Grid */}
      <div className="space-y-2.5">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          Compression Mode Preset:
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
          {presets.map((p) => {
            const isSelected = options.preset === p.id;
            const Icon = p.icon;
            return (
              <button
                key={p.id}
                onClick={() => handlePresetSelect(p.id)}
                className={`flex flex-col p-3.5 rounded-2xl border text-left transition-all relative group ${
                  isSelected
                    ? 'bg-brand-50/70 dark:bg-brand-950/50 border-brand-500 ring-2 ring-brand-500/20 shadow-xs'
                    : 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-700/80 hover:border-brand-300 dark:hover:border-slate-600'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-2">
                  <div className={`p-2 rounded-xl ${isSelected ? 'bg-brand-600 text-white shadow-xs' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  {isSelected && (
                    <span className="w-2 h-2 rounded-full bg-brand-600 animate-pulse" />
                  )}
                </div>
                <span className="text-xs font-extrabold text-slate-900 dark:text-white block truncate">
                  {p.label}
                </span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 line-clamp-2 mt-0.5 leading-snug">
                  {p.desc}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Target File Size Section (Visible when Target Preset Active) */}
      {options.preset === 'target' && (
        <div className="p-4 rounded-2xl bg-rose-50/40 dark:bg-rose-950/20 border border-rose-200/80 dark:border-rose-900/40 space-y-3 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-rose-700 dark:text-rose-300">
              <Target className="w-4 h-4 text-rose-500" />
              <span>Target Size Threshold:</span>
            </div>
            {totalOriginalBytes !== undefined && totalOriginalBytes > 0 && (
              <div className="text-xs font-mono text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 px-2.5 py-1 rounded-xl border border-rose-200/60 dark:border-rose-900/40">
                Previous Size: <strong className="text-slate-900 dark:text-white font-extrabold">{formatBytes(totalOriginalBytes)}</strong>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {[0.5, 1, 2, 5, 10, 25].map((mb) => {
              const bytes = mb * 1024 * 1024;
              const isSelected = options.targetSizeBytes === bytes;
              return (
                <button
                  key={mb}
                  onClick={() => handleTargetPreset(mb)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    isSelected
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-rose-400'
                  }`}
                >
                  {mb < 1 ? '500 KB' : `${mb} MB`}
                </button>
              );
            })}
          </div>

          {/* Custom Size Input */}
          <div className="flex items-center gap-2 pt-1 max-w-sm">
            <input
              type="number"
              placeholder="Custom size..."
              value={customTargetInput}
              onChange={(e) => setCustomTargetInput(e.target.value)}
              className="flex-1 px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500/30"
            />
            <select
              value={customUnit}
              onChange={(e) => setCustomUnit(e.target.value as any)}
              className="px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none"
            >
              <option value="MB">MB</option>
              <option value="KB">KB</option>
            </select>
            <button
              onClick={handleCustomTargetApply}
              className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors"
            >
              Set
            </button>
          </div>

          <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-rose-500 flex-shrink-0" />
            <span>Iterative optimization will attempt to match this target within safe quality bounds.</span>
          </p>
        </div>
      )}

      {/* 3. Quality Slider */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
            <span>Quality Ratio:</span>
            <span className="text-brand-600 dark:text-brand-400 font-extrabold font-mono text-sm">
              {options.quality}%
            </span>
          </label>
          <span className="text-[11px] font-semibold text-slate-400">
            {options.quality > 85 ? 'High Quality (Low Reduction)' : options.quality < 60 ? 'Maximum Size Reduction' : 'Balanced (Recommended)'}
          </span>
        </div>

        <input
          type="range"
          min="10"
          max="100"
          step="5"
          value={options.quality}
          onChange={(e) => handleQualityChange(parseInt(e.target.value, 10))}
          className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-brand-600"
        />

        <div className="flex justify-between text-[10px] font-bold text-slate-400">
          <span>Smallest Size (10%)</span>
          <span>Balanced (78%)</span>
          <span>Highest Quality (100%)</span>
        </div>

        {/* ── LIVE COMPRESSION PREVIEW BAR ─────────────────────────────── */}
        {totalOriginalBytes !== undefined && totalOriginalBytes > 0 && (() => {
          const est = estimate;
          const reductionPct = est.reductionPercentage;
          const barColor =
            reductionPct >= 40 ? 'bg-emerald-500' :
            reductionPct >= 20 ? 'bg-brand-500' :
            reductionPct >= 5  ? 'bg-amber-500' : 'bg-slate-400';
          const textColor =
            reductionPct >= 40 ? 'text-emerald-600 dark:text-emerald-400' :
            reductionPct >= 20 ? 'text-brand-600 dark:text-brand-400' :
            reductionPct >= 5  ? 'text-amber-600 dark:text-amber-400' : 'text-slate-500';
          const bgColor =
            reductionPct >= 40 ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/60' :
            reductionPct >= 20 ? 'bg-brand-50 dark:bg-brand-950/30 border-brand-200 dark:border-brand-800/60' :
            reductionPct >= 5  ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/60' :
            'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700';
          const label =
            reductionPct >= 40 ? '🔥 Excellent compression' :
            reductionPct >= 20 ? '✅ Good compression' :
            reductionPct >= 5  ? '⚡ Moderate compression' :
            '💡 Minimal reduction (file may already be optimized)';

          return (
            <div className={`p-4 rounded-2xl border ${bgColor} space-y-3 transition-all duration-300`}>
              {/* Size row */}
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2 text-xs font-bold">
                  <span className="text-slate-500 dark:text-slate-400 font-mono">{formatBytes(totalOriginalBytes)}</span>
                  <span className="text-slate-400">→</span>
                  <span className={`font-extrabold font-mono text-sm ${textColor}`}>
                    ~{formatBytes(est.estimatedBytes)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {reductionPct > 0 && (
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-extrabold ${barColor} text-white`}>
                      -{reductionPct}%
                    </span>
                  )}
                  <span className={`text-[11px] font-semibold ${textColor}`}>{label}</span>
                </div>
              </div>

              {/* Reduction bar */}
              <div className="w-full h-2.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                <div
                  className={`h-full rounded-full ${barColor} transition-all duration-500`}
                  style={{ width: `${Math.min(100, reductionPct)}%` }}
                />
              </div>

              {/* Saved bytes label */}
              {est.savedBytes > 0 && (
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  Saving approximately <strong className={`font-extrabold ${textColor}`}>{formatBytes(est.savedBytes)}</strong> of disk space
                  {fileCount > 1 && ` across ${fileCount} files`}
                </p>
              )}
            </div>
          );
        })()}
      </div>


      {/* 4. Format-Specific Controls Toggle */}
      {(hasVideo || hasImage) && (
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center justify-between w-full text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400 py-1.5 transition-colors"
          >
            <span className="flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-brand-500" />
              <span>Format-Specific Parameters (Video Resolution, Image Scale, Audio)</span>
            </span>
            <ChevronDown className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
          </button>

          {showAdvanced && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 mt-2 border-t border-slate-100 dark:border-slate-800 animate-in fade-in duration-200">
              
              {/* Video Resolution */}
              {hasVideo && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Film className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Video Output Resolution:</span>
                  </label>
                  <select
                    value={options.resolution || 'original'}
                    onChange={(e) => onChange({ ...options, resolution: e.target.value as VideoResolution })}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="original">Original Resolution</option>
                    <option value="1080p">1080p Full HD (1920x1080)</option>
                    <option value="720p">720p HD (1280x720) - Recommended</option>
                    <option value="480p">480p SD (854x480) - Maximum Compression</option>
                  </select>
                </div>
              )}

              {/* Video Audio Mode */}
              {hasVideo && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Volume2 className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Video Audio Track:</span>
                  </label>
                  <select
                    value={options.audioMode || 'preserve'}
                    onChange={(e) => onChange({ ...options, audioMode: e.target.value as AudioMode })}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="preserve">Preserve Audio (128 kbps AAC)</option>
                    <option value="reduced">Reduced Bitrate (96 kbps AAC)</option>
                    <option value="mute">Mute / Remove Audio Stream</option>
                  </select>
                </div>
              )}

              {/* Image Resize Scale */}
              {hasImage && (
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-rose-500" />
                    <span>Image Dimensions Rescaling:</span>
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'original', label: '100% (Original)' },
                      { id: '75%', label: '75% Scale' },
                      { id: '50%', label: '50% Scale' }
                    ].map((s) => (
                      <button
                        key={s.id}
                        onClick={() => onChange({ ...options, resizeScale: s.id as ImageResizeScale })}
                        className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                          (options.resizeScale || 'original') === s.id
                            ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-400 text-rose-700 dark:text-rose-300'
                            : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-rose-300'
                        }`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}
        </div>
      )}

    </div>
  );
};
