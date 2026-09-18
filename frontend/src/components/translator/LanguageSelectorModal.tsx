import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Search, X, Check, Globe, Sparkles } from 'lucide-react';
import { SUPPORTED_LANGUAGES, AUTO_DETECT_LANGUAGE, LanguageItem } from '../../data/languagesData';

interface LanguageSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectLanguage: (language: LanguageItem) => void;
  selectedLanguageCode: string;
  allowAutoDetect?: boolean;
  title?: string;
  restrictedLanguages?: LanguageItem[];
}

export const LanguageSelectorModal: React.FC<LanguageSelectorModalProps> = ({
  isOpen,
  onClose,
  onSelectLanguage,
  selectedLanguageCode,
  allowAutoDetect = false,
  title = 'Select Language',
  restrictedLanguages
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const availableLanguages = restrictedLanguages || SUPPORTED_LANGUAGES;

  const filteredLanguages = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return availableLanguages;
    return availableLanguages.filter(
      l =>
        l.name.toLowerCase().includes(q) ||
        l.nativeName.toLowerCase().includes(q) ||
        l.code.toLowerCase().includes(q)
    );
  }, [searchQuery, availableLanguages]);

  const popularLanguages = useMemo(() => {
    return availableLanguages.filter(l => l.popular);
  }, [availableLanguages]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div 
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl max-h-[85vh] flex flex-col rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200/80 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                {title}
              </h3>
              <p className="text-xs text-slate-400">
                Choose from 100+ native & global languages
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search language name, native script, or code (e.g. Hindi, हिन्दी, hi)..."
              className="w-full pl-10 pr-9 py-2.5 text-xs rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 font-medium shadow-xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Language Grid & Lists */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
          
          {/* Auto Detect Button if enabled and not searching */}
          {allowAutoDetect && !searchQuery && (
            <div>
              <button
                onClick={() => {
                  onSelectLanguage(AUTO_DETECT_LANGUAGE);
                  onClose();
                }}
                className={`w-full flex items-center justify-between p-3 rounded-2xl border transition-all ${
                  selectedLanguageCode === 'auto'
                    ? 'bg-brand-50 dark:bg-brand-950/60 border-brand-400 text-brand-700 dark:text-brand-300 font-bold'
                    : 'bg-white dark:bg-slate-800/50 border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-lg">✨</span>
                  <div className="text-left">
                    <span className="text-xs font-extrabold">Auto Detect</span>
                    <p className="text-[11px] text-slate-400">Intelligently detects language from source text</p>
                  </div>
                </div>
                {selectedLanguageCode === 'auto' && (
                  <Check className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                )}
              </button>
            </div>
          )}

          {/* Popular Languages Pills (if not searching) */}
          {!searchQuery && (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                <Sparkles className="w-3 h-3 text-amber-500" />
                <span>Popular Languages</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {popularLanguages.slice(0, 9).map(lang => {
                  const isSelected = selectedLanguageCode === lang.code;
                  return (
                    <button
                      key={lang.code}
                      onClick={() => {
                        onSelectLanguage(lang);
                        onClose();
                      }}
                      className={`flex items-center justify-between p-2.5 rounded-2xl border text-xs text-left transition-all ${
                        isSelected
                          ? 'bg-brand-50 dark:bg-brand-950/60 border-brand-400 text-brand-700 dark:text-brand-300 font-bold shadow-xs'
                          : 'bg-white dark:bg-slate-800/50 border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-base">{lang.flag}</span>
                        <div className="min-w-0">
                          <p className="font-bold truncate text-xs">{lang.name}</p>
                          <p className="text-[10px] text-slate-400 truncate">{lang.nativeName}</p>
                        </div>
                      </div>
                      {isSelected && <Check className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400 flex-shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* All Filtered Languages */}
          <div className="space-y-2">
            <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
              {searchQuery ? `Matching Languages (${filteredLanguages.length})` : 'All Languages (A-Z)'}
            </div>

            {filteredLanguages.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {filteredLanguages.map(lang => {
                  const isSelected = selectedLanguageCode === lang.code;
                  return (
                    <button
                      key={lang.code}
                      onClick={() => {
                        onSelectLanguage(lang);
                        onClose();
                      }}
                      className={`flex items-center justify-between p-2.5 rounded-2xl border text-xs text-left transition-all ${
                        isSelected
                          ? 'bg-brand-50 dark:bg-brand-950/60 border-brand-400 text-brand-700 dark:text-brand-300 font-bold shadow-xs'
                          : 'bg-white dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-base">{lang.flag}</span>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-900 dark:text-white truncate">{lang.name}</span>
                            <span className="text-[10px] font-mono text-slate-400 px-1 py-0.2 rounded bg-slate-100 dark:bg-slate-800">{lang.code}</span>
                          </div>
                          <span className="text-[11px] text-slate-400 truncate block">{lang.nativeName}</span>
                        </div>
                      </div>
                      {isSelected && (
                        <Check className="w-4 h-4 text-brand-600 dark:text-brand-400 flex-shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 text-center text-slate-400 text-xs">
                No languages found matching "{searchQuery}"
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between text-xs text-slate-400">
          <span>{availableLanguages.length} supported translation {availableLanguages.length === 1 ? 'language' : 'languages'}</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
