import React, { useState } from 'react';
import { 
  X, 
  Smartphone, 
  RotateCw, 
  Sparkles, 
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Home,
  FileText,
  Layers,
  Bot,
  User,
  Zap,
  HardDrive
} from 'lucide-react';

interface MobilePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MobilePreviewModal: React.FC<MobilePreviewModalProps> = ({
  isOpen,
  onClose
}) => {
  const [deviceModel, setDeviceModel] = useState<'iphone' | 'pixel'>('iphone');
  const [scale, setScale] = useState<number>(0.9);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[95vh] text-white">
        
        {/* Top Controls Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-brand-500/20 text-brand-400">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">
                  Live Mobile Responsive Simulator
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  REAL-TIME PREVIEW
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Test mobile touch responsiveness, drawer navigation, and compact bento grids
              </p>
            </div>
          </div>

          {/* Device and Scale Selectors */}
          <div className="flex items-center gap-3">
            <div className="inline-flex p-1 rounded-xl bg-slate-800 border border-slate-700 text-xs font-semibold">
              <button
                onClick={() => setDeviceModel('iphone')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  deviceModel === 'iphone' ? 'bg-brand-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
              >
                iPhone 15 Pro (393x852)
              </button>
              <button
                onClick={() => setDeviceModel('pixel')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  deviceModel === 'pixel' ? 'bg-brand-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
              >
                Pixel 8 (412x915)
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Center Canvas Area with Mobile Phone Device Frame */}
        <div className="flex-1 overflow-y-auto p-6 flex items-center justify-center bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px]">
          
          {/* Phone Shell */}
          <div 
            className="relative rounded-[50px] bg-black p-3.5 shadow-2xl shadow-black/80 border-4 border-slate-700/80 transition-all duration-300"
            style={{
              width: deviceModel === 'iphone' ? '393px' : '412px',
              height: '750px',
              transform: `scale(${scale})`,
              transformOrigin: 'top center'
            }}
          >
            {/* Dynamic Island / Notch */}
            <div className="absolute top-5 left-1/2 -translate-x-1/2 z-30 w-28 h-6 bg-black rounded-full flex items-center justify-between px-3 border border-slate-800">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-900 border border-slate-700" />
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-950 border border-indigo-700/50" />
            </div>

            {/* Inner Screen containing live iframe */}
            <div className="relative w-full h-full rounded-[40px] overflow-hidden bg-white dark:bg-slate-950 border border-slate-800 flex flex-col">
              <iframe
                src={window.location.origin}
                title="ConvertPro Mobile Preview"
                className="w-full h-full border-0"
              />
            </div>

            {/* Bottom Home Indicator Bar */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1 bg-slate-600 rounded-full" />
          </div>

        </div>

        {/* Footer Guidance */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-900/90 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-brand-400" />
            <span>Fully responsive: Top navigation collapses to burger menu; grids adapt seamlessly to single column.</span>
          </div>
          <a
            href={window.location.origin}
            target="_blank"
            rel="noreferrer"
            className="text-brand-400 hover:underline font-bold flex items-center gap-1"
          >
            <span>Open in new tab to test DevTools mobile view</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

      </div>
    </div>
  );
};
