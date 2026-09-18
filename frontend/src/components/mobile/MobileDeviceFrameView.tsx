import React, { useState } from 'react';
import { 
  Smartphone, 
  Tablet, 
  RotateCw, 
  Monitor, 
  Sparkles, 
  Sun, 
  Moon,
  ChevronLeft,
  ChevronRight,
  ExternalLink
} from 'lucide-react';

interface MobileDeviceFrameViewProps {
  children: React.ReactNode;
  onExitMobileView: () => void;
  isDark: boolean;
  onToggleTheme: () => void;
}

export const MobileDeviceFrameView: React.FC<MobileDeviceFrameViewProps> = ({
  children,
  onExitMobileView,
  isDark,
  onToggleTheme
}) => {
  const [device, setDevice] = useState<'iphone' | 'pixel' | 'tablet'>('iphone');
  const [scale, setScale] = useState<number>(0.95);

  const deviceWidths = {
    iphone: '393px',
    pixel: '412px',
    tablet: '768px'
  };

  const deviceHeights = {
    iphone: '844px',
    pixel: '880px',
    tablet: '960px'
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-start p-3 sm:p-6 overflow-y-auto">
      
      {/* Top Floating Mobile Toolbar */}
      <header className="w-full max-w-5xl mb-4 p-3 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl backdrop-blur-md flex flex-wrap items-center justify-between gap-3 sticky top-2 z-50">
        
        {/* Left Info */}
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-brand-500/20 text-brand-400">
            <Smartphone className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-xs text-white">Mobile Device Simulator</span>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                100% FREE ACTIVE
              </span>
            </div>
            <p className="text-[10px] text-slate-400">
              Testing mobile responsive layout at {deviceWidths[device]}
            </p>
          </div>
        </div>

        {/* Center Device Switcher */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-800/80 border border-slate-700/80 text-xs font-semibold">
          <button
            onClick={() => setDevice('iphone')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all ${
              device === 'iphone' ? 'bg-brand-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>iPhone 15 Pro</span>
          </button>

          <button
            onClick={() => setDevice('pixel')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all ${
              device === 'pixel' ? 'bg-brand-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Pixel 8</span>
          </button>

          <button
            onClick={() => setDevice('tablet')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all ${
              device === 'tablet' ? 'bg-brand-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Tablet className="w-3.5 h-3.5" />
            <span>Tablet</span>
          </button>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleTheme}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title="Toggle theme"
          >
            {isDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={onExitMobileView}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white text-slate-900 hover:bg-slate-100 font-bold text-xs shadow-md transition-all"
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>Switch to Desktop View</span>
          </button>
        </div>

      </header>

      {/* Main Mobile Frame Canvas */}
      <main className="flex-1 w-full flex items-center justify-center py-2">
        <div
          className="relative rounded-[50px] bg-black p-3.5 shadow-2xl shadow-black border-4 border-slate-700/80 transition-all duration-300"
          style={{
            width: deviceWidths[device],
            height: deviceHeights[device],
            transform: `scale(${scale})`,
            transformOrigin: 'top center'
          }}
        >
          {/* Dynamic Island Notch */}
          {device !== 'tablet' && (
            <div className="absolute top-5 left-1/2 -translate-x-1/2 z-40 w-28 h-6 bg-black rounded-full flex items-center justify-between px-3 border border-slate-800">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-900 border border-slate-700" />
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-950 border border-indigo-700/50" />
            </div>
          )}

          {/* Screen Wrapper */}
          <div className="w-full h-full rounded-[40px] overflow-y-auto bg-[#F8FAFC] dark:bg-slate-950 text-slate-900 dark:text-slate-100 border border-slate-800 shadow-inner">
            {children}
          </div>

          {/* Bottom Home Indicator */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1 bg-slate-600 rounded-full pointer-events-none" />
        </div>
      </main>

    </div>
  );
};
