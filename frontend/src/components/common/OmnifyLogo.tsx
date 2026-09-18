import React from 'react';

interface OmnifyLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showTagline?: boolean;
  className?: string;
  variant?: 'full' | 'icon';
}

export const OmnifyLogo: React.FC<OmnifyLogoProps> = ({
  size = 'md',
  showTagline = false,
  className = '',
  variant = 'full'
}) => {
  const iconSizes = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9 sm:w-10 sm:h-10',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  const textSizes = {
    sm: 'text-base',
    md: 'text-xl sm:text-2xl',
    lg: 'text-3xl',
    xl: 'text-4xl'
  };

  return (
    <div className={`flex items-center gap-2.5 sm:gap-3 select-none ${className}`}>
      {/* 3D Gradient Ribbon 'O' with Star Sparkle */}
      <div className={`relative flex items-center justify-center ${iconSizes[size]} rounded-2xl bg-gradient-to-tr from-[#0284c7] via-[#6366f1] to-[#a855f7] p-0.5 shadow-md shadow-indigo-500/25 shrink-0 group`}>
        <div className="w-full h-full rounded-[14px] bg-slate-950 flex items-center justify-center relative overflow-hidden">
          {/* Inner Gradient Orbit Ribbon */}
          <svg viewBox="0 0 100 100" className="w-full h-full transform transition-transform group-hover:rotate-12 duration-300">
            <defs>
              <linearGradient id="omniGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#38bdf8" />
                <stop offset="45%" stopColor="#6366f1" />
                <stop offset="100%" stopColor="#c084fc" />
              </linearGradient>
              <linearGradient id="omniLoop" x1="100%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#38bdf8" />
                <stop offset="60%" stopColor="#818cf8" />
                <stop offset="100%" stopColor="#e879f9" />
              </linearGradient>
            </defs>

            {/* Outer Ring */}
            <circle cx="50" cy="50" r="34" fill="none" stroke="url(#omniGrad)" strokeWidth="15" strokeLinecap="round" />
            
            {/* Dynamic S-curve Cross Ribbon */}
            <path
              d="M 28 64 C 38 42 62 42 74 34"
              fill="none"
              stroke="url(#omniLoop)"
              strokeWidth="13"
              strokeLinecap="round"
            />

            {/* Glowing Accent Star Sparkle */}
            <path
              d="M 76 18 Q 76 25 83 25 Q 76 25 76 32 Q 76 25 69 25 Q 76 25 76 18 Z"
              fill="#c084fc"
            />
          </svg>
        </div>
      </div>

      {variant === 'full' && (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className={`${textSizes[size]} font-black tracking-tight font-sans text-slate-900 dark:text-white flex items-center`}>
              <span className="bg-gradient-to-r from-sky-400 via-indigo-500 to-purple-500 bg-clip-text text-transparent">O</span>
              <span>MNIFY</span>
            </span>
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800">
              100% FREE
            </span>
          </div>

          <p className="text-[10px] sm:text-[11px] font-semibold text-slate-500 dark:text-slate-400 -mt-0.5 tracking-tight">
            One Platform. Everything.
          </p>
        </div>
      )}
    </div>
  );
};
