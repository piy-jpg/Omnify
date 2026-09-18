import React, { useRef, useState, useEffect } from 'react';
import { 
  Upload, 
  ArrowRight, 
  Sparkles, 
  ShieldCheck, 
  Zap, 
  FileText, 
  FileSpreadsheet, 
  FileImage, 
  RefreshCw,
  Wand2,
  Languages,
  Lock,
  ChevronRight,
  MousePointerClick,
  Volume2,
  VolumeX
} from 'lucide-react';

interface DashboardHeroProps {
  userName?: string;
  platformName?: string;
  onUploadClick: () => void;
  onExploreClick: () => void;
  onFileDrop: (files: FileList) => void;
  onQuickToolClick?: (toolId: string) => void;
}

export const DashboardHero: React.FC<DashboardHeroProps> = ({
  userName = 'Piyush Verma',
  platformName = 'Omnify',
  onUploadClick,
  onExploreClick,
  onFileDrop,
  onQuickToolClick
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [hasAutoSpoken, setHasAutoSpoken] = useState(false);

  // Text-to-speech welcome greeting
  const speakWelcome = (force: boolean = false) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
      if (!force) {
        setIsSpeaking(false);
        return;
      }
    }

    const greetingText = `Welcome back, ${userName}! Welcome to ${platformName}. Convert, create, and simplify your documents and media today.`;
    const utterance = new SpeechSynthesisUtterance(greetingText);
    utterance.rate = 1.0;
    utterance.pitch = 1.02;

    const voices = window.speechSynthesis.getVoices();
    const naturalVoice = voices.find(v => (
      v.lang.startsWith('en') && 
      (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Karen'))
    )) || voices.find(v => v.lang.startsWith('en'));

    if (naturalVoice) {
      utterance.voice = naturalVoice;
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    if (!hasAutoSpoken) {
      const alreadyGreeted = sessionStorage.getItem(`omni_greeted_${userName}`);
      if (!alreadyGreeted) {
        const timer = setTimeout(() => {
          speakWelcome(true);
          sessionStorage.setItem(`omni_greeted_${userName}`, 'true');
          setHasAutoSpoken(true);
        }, 800);
        return () => clearTimeout(timer);
      }
    }
  }, [userName, hasAutoSpoken]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFileDrop(e.dataTransfer.files);
    }
  };

  const quickTools = [
    { id: 'pdf-to-word', label: 'PDF → Word', icon: FileText, color: 'text-blue-400 group-hover/tool:text-blue-300', borderHover: 'hover:border-blue-500/40 hover:bg-blue-500/10' },
    { id: 'jpg-to-pdf', label: 'JPG → PDF', icon: FileImage, color: 'text-rose-400 group-hover/tool:text-rose-300', borderHover: 'hover:border-rose-500/40 hover:bg-rose-500/10' },
    { id: 'pdf-to-xlsx', label: 'PDF → Excel', icon: FileSpreadsheet, color: 'text-emerald-400 group-hover/tool:text-emerald-300', borderHover: 'hover:border-emerald-500/40 hover:bg-emerald-500/10' },
    { id: 'file-compressor', label: 'Compress File', icon: RefreshCw, color: 'text-amber-400 group-hover/tool:text-amber-300', borderHover: 'hover:border-amber-500/40 hover:bg-amber-500/10' },
    { id: 'ai-writer', label: 'AI Writer', icon: Wand2, color: 'text-purple-400 group-hover/tool:text-purple-300', borderHover: 'hover:border-purple-500/40 hover:bg-purple-500/10' },
    { id: 'ai-translator', label: 'AI Translator', icon: Languages, color: 'text-cyan-400 group-hover/tool:text-cyan-300', borderHover: 'hover:border-cyan-500/40 hover:bg-cyan-500/10' },
  ];

  const handleToolClick = (toolId: string) => {
    if (onQuickToolClick) {
      onQuickToolClick(toolId);
    } else {
      onUploadClick();
    }
  };

  return (
    <div 
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative overflow-hidden rounded-3xl bg-slate-950/95 text-white p-6 sm:p-8 lg:p-9 shadow-2xl border transition-all duration-300 group ${
        isDragging 
          ? 'border-indigo-400 ring-4 ring-indigo-500/25 bg-slate-900/95 scale-[1.005]' 
          : 'border-slate-800/90 hover:border-slate-700'
      }`}
    >
      {/* Background wallpaper with crisp dark overlay */}
      <img
        src="/images/dashboard-hero-bg.jpg"
        alt="Hero Background"
        className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none select-none opacity-20 transition-transform duration-1000 ease-out group-hover:scale-105"
      />

      {/* Atmospheric radial gradient glows */}
      <div className="absolute top-0 right-1/4 w-[480px] h-[320px] bg-indigo-500/10 rounded-full blur-[90px] pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 w-[380px] h-[280px] bg-cyan-500/10 rounded-full blur-[80px] pointer-events-none" />

      {/* Subtle crisp geometric dot matrix */}
      <div 
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)',
          backgroundSize: '24px 24px'
        }}
      />

      {/* Foreground Content */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
        
        {/* Left Content Column */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Top Pill Badges */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 shadow-xs select-none">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
              <span>100% FREE UNLIMITED PASS</span>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-800/80 text-slate-300 border border-slate-700/60 select-none">
              <span className="text-amber-300 text-xs">👋</span>
              <span>Welcome back, <strong className="text-white font-semibold">{userName}</strong></span>
            </div>

            {/* Hear Welcome TTS Button */}
            <button
              onClick={() => speakWelcome(false)}
              title={isSpeaking ? "Click to stop voice greeting" : `Listen to welcome message for ${userName}`}
              aria-label="Voice greeting speaker"
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition-all duration-200 cursor-pointer ${
                isSpeaking
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 ring-1 ring-rose-400/30 animate-pulse'
                  : 'bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 hover:text-indigo-200 border-indigo-500/30 hover:border-indigo-400/50 hover:scale-105 active:scale-95'
              }`}
            >
              {isSpeaking ? (
                <>
                  <VolumeX className="w-3.5 h-3.5 text-rose-300" />
                  <span>Speaking...</span>
                  <span className="flex items-center gap-0.5 ml-1">
                    <span className="w-1 h-2.5 bg-rose-400 rounded-full animate-pulse" />
                    <span className="w-1 h-3.5 bg-rose-300 rounded-full animate-pulse delay-75" />
                    <span className="w-1 h-2 bg-rose-400 rounded-full animate-pulse delay-150" />
                  </span>
                </>
              ) : (
                <>
                  <Volume2 className="w-3.5 h-3.5 text-indigo-300" />
                  <span>Hear Welcome</span>
                </>
              )}
            </button>
          </div>

          {/* Heading */}
          <div className="space-y-2">
            <h1 className="text-3xl sm:text-4xl lg:text-[42px] font-black tracking-tight leading-[1.12] text-white">
              Welcome, <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-indigo-100 to-indigo-300">{userName}</span>
              <span className="block text-2xl sm:text-3xl lg:text-[32px] font-extrabold text-indigo-400 mt-1">
                Convert, Create &amp; Simplify
              </span>
            </h1>

            <p className="text-sm sm:text-base text-slate-300/90 max-w-xl leading-relaxed font-normal">
              Transform files, documents, and media with ultra-fast GPU acceleration and intelligent AI tools.
            </p>
          </div>

          {/* Quick Convert & Tools */}
          <div className="space-y-2.5 pt-1">
            <div className="flex items-center gap-1.5 text-xs font-bold tracking-wider text-slate-400 uppercase">
              <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400/20" />
              <span>Quick Convert &amp; Tools:</span>
            </div>
            
            <div className="flex flex-wrap items-center gap-2">
              {quickTools.map((tool) => {
                const Icon = tool.icon;
                return (
                  <button
                    key={tool.id}
                    onClick={() => handleToolClick(tool.id)}
                    className={`group/tool flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 text-slate-300 hover:text-white border border-slate-800 ${tool.borderHover} text-xs font-medium transition-all duration-150 shadow-xs hover:-translate-y-0.5 cursor-pointer`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${tool.color} transition-transform group-hover/tool:scale-110`} />
                    <span>{tool.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Primary Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={(e) => e.target.files && onFileDrop(e.target.files)}
              className="hidden"
              multiple
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2.5 px-6 py-3 rounded-xl bg-white text-slate-950 font-bold text-sm shadow-xl shadow-white/10 hover:bg-slate-100 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer group/upload"
            >
              <Upload className="w-4 h-4 text-indigo-600 group-hover/upload:-translate-y-0.5 transition-transform" />
              <span>Upload Files to Convert</span>
            </button>

            <button
              onClick={onExploreClick}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 hover:text-white font-semibold text-sm border border-slate-700/80 hover:border-slate-600 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer group/explore"
            >
              <span>Explore All Tools</span>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover/explore:translate-x-0.5 transition-transform" />
            </button>
          </div>

          {/* Trust badges footer */}
          <div className="pt-4 flex flex-wrap items-center gap-2.5 text-xs text-slate-400 border-t border-slate-800/80">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-900/60 border border-slate-800/90 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>$0 Free Forever &bull; No Sign-Up</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-900/60 border border-slate-800/90 font-medium">
              <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>Parallel Multi-Thread Engine</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-900/60 border border-slate-800/90 font-medium">
              <Lock className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span>24h Ephemeral Auto-Shred</span>
            </div>
          </div>

        </div>

        {/* Right Dropzone Box */}
        <div className="lg:col-span-5 flex justify-center items-center">
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="w-full max-w-sm rounded-2xl bg-slate-900/60 hover:bg-slate-900/90 backdrop-blur-md p-6 border-2 border-dashed border-slate-700/70 hover:border-indigo-400/80 cursor-pointer transition-all duration-200 group/drop text-center space-y-4 shadow-xl hover:shadow-2xl hover:scale-[1.01]"
          >
            {/* Center Upload Icon */}
            <div className="w-14 h-14 mx-auto rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center group-hover/drop:scale-110 group-hover/drop:bg-indigo-500/20 group-hover/drop:text-indigo-300 transition-all duration-200">
              <Upload className="w-6 h-6 animate-bounce-subtle" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-white group-hover/drop:text-indigo-300 transition-colors">
                Drop files here to start
              </h3>
              <p className="text-xs text-slate-400 font-normal leading-relaxed px-2">
                Supports PDF, DOCX, XLSX, PPTX, JPG, PNG, WEBP, and more (up to 2 GB)
              </p>
            </div>

            {/* Format tags */}
            <div className="flex items-center justify-center gap-1.5 pt-1">
              {['PDF', 'DOCX', 'XLSX', 'MEDIA', 'OCR'].map((fmt) => (
                <span key={fmt} className="px-2 py-0.5 rounded-md bg-slate-800/80 border border-slate-700/60 text-[10px] font-semibold text-slate-300 tracking-wider">
                  {fmt}
                </span>
              ))}
            </div>

            {/* Browse Button */}
            <div className="pt-1">
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20 px-3.5 py-1.5 rounded-full border border-indigo-500/20 group-hover/drop:border-indigo-500/40 transition-colors">
                <MousePointerClick className="w-3.5 h-3.5" />
                <span>Click to browse from device</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover/drop:translate-x-0.5 transition-transform" />
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
