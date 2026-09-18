import React, { useState, useRef, useEffect } from 'react';
import { 
  Languages, 
  ArrowLeftRight, 
  Upload, 
  Sparkles, 
  FileText, 
  Copy, 
  Check, 
  Download, 
  Trash2, 
  Volume2, 
  RefreshCw, 
  Cpu, 
  ShieldCheck, 
  Zap, 
  Eye, 
  Edit3, 
  AlertCircle, 
  ChevronDown, 
  SlidersHorizontal,
  Presentation,
  Image as ImageIcon,
  CheckCircle2,
  FolderOpen
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { TranslatorHeader } from '../components/translator/TranslatorHeader';
import { LanguageSelectorModal } from '../components/translator/LanguageSelectorModal';
import { TranslatorModeSelector } from '../components/translator/TranslatorModeSelector';
import { TranslationProgress } from '../components/translator/TranslationProgress';
import { TranslationPreview } from '../components/translator/TranslationPreview';
import { DocumentPreview } from '../components/translator/DocumentPreview';
import { TranslationActions } from '../components/translator/TranslationActions';
import { TranslationHistory, TranslationHistoryItem } from '../components/translator/TranslationHistory';
import { ExportTranslationModal } from '../components/translator/ExportTranslationModal';
import { 
  AITranslationService, 
  TranslationMode, 
  ParsedDocumentStructure,
  DocumentSection
} from '../services/ai/aiTranslationService';
import { 
  SUPPORTED_LANGUAGES, 
  AUTO_DETECT_LANGUAGE, 
  LanguageItem, 
  getLanguageByCode,
  AI_TRANSLATOR_SOURCE_LANGUAGES,
  AI_TRANSLATOR_TARGET_LANGUAGES,
  AI_TRANSLATOR_ALL_LANGUAGES
} from '../data/languagesData';

interface AITranslatorPageProps {
  onFileConverted?: (fileItem: any) => void;
}

export const AITranslatorPage: React.FC<AITranslatorPageProps> = ({
  onFileConverted
}) => {
  // Navigation tabs between Text Mode & Document Mode
  const [activeInputTab, setActiveInputTab] = useState<'text' | 'document'>('text');

  // Language state
  const [sourceLang, setSourceLang] = useState<LanguageItem>(
    AI_TRANSLATOR_SOURCE_LANGUAGES[0] // English only
  );
  const [targetLang, setTargetLang] = useState<LanguageItem>(
    AI_TRANSLATOR_TARGET_LANGUAGES[0] // Hindi default
  );
  const [detectedLangName, setDetectedLangName] = useState<string | null>(null);

  // Modal selector states
  const [isSourceModalOpen, setIsSourceModalOpen] = useState(false);
  const [isTargetModalOpen, setIsTargetModalOpen] = useState(false);

  // Tone mode
  const [selectedMode, setSelectedMode] = useState<TranslationMode>('standard');

  // Text translation state
  const [sourceText, setSourceText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [lastTranslatedSource, setLastTranslatedSource] = useState('');
  const [lastTranslatedTarget, setLastTranslatedTarget] = useState(
    (AI_TRANSLATOR_TARGET_LANGUAGES[0] || {}).code || 'hi'
  );
  const [isTranslating, setIsTranslating] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showDiff, setShowDiff] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [translationSuccess, setTranslationSuccess] = useState(false);

  // Check if input source text or target language has changed since last translation
  const isSourceChanged = Boolean(
    sourceText.trim() && (
      sourceText.trim() !== lastTranslatedSource.trim() || 
      targetLang.code !== lastTranslatedTarget
    )
  );

  // Document translation state
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [parsedDoc, setParsedDoc] = useState<ParsedDocumentStructure | null>(null);
  const [isParsingDoc, setIsParsingDoc] = useState(false);
  const [progressStage, setProgressStage] = useState('');
  const [progressPercent, setProgressPercent] = useState(0);

  // Drag & drop state
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // History & Export modal states
  const [history, setHistory] = useState<TranslationHistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('convertpro_translation_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem('convertpro_translation_history', JSON.stringify(history));
    } catch {}
  }, [history]);

  // Handle Swap/Cycle Target Language (source is always English)
  const handleSwapLanguages = () => {
    const currentIdx = AI_TRANSLATOR_TARGET_LANGUAGES.findIndex(l => l.code === targetLang.code);
    const nextIdx = (currentIdx + 1) % AI_TRANSLATOR_TARGET_LANGUAGES.length;
    setTargetLang(AI_TRANSLATOR_TARGET_LANGUAGES[nextIdx]);
  };

  // Direct Text Translation Trigger
  const handleTranslateText = async () => {
    if (!sourceText.trim()) {
      setErrorMessage('Please enter or paste text to translate.');
      return;
    }

    setErrorMessage(null);
    setIsTranslating(true);
    setProgressPercent(20);
    setProgressStage('Detecting language & context...');

    try {
      setTimeout(() => {
        setProgressPercent(60);
        setProgressStage('Neural translation processing...');
      }, 300);

      const response = await AITranslationService.translate({
        text: sourceText,
        sourceLanguage: sourceLang.code,
        targetLanguage: targetLang.code,
        mode: selectedMode,
        preserveFormatting: true
      });

      setProgressPercent(100);
      setProgressStage('Translation complete!');
      setTranslatedText(response.translatedText);
      setLastTranslatedSource(sourceText);
      setLastTranslatedTarget(targetLang.code);

      const effectiveDetectedName = response.detectedLanguage ? getLanguageByCode(response.detectedLanguage).name : (sourceLang.code === 'auto' ? 'English' : sourceLang.name);
      if (sourceLang.code === 'auto') {
        setDetectedLangName(effectiveDetectedName);
      }

      setIsTranslating(false);
      setTranslationSuccess(true);
      setTimeout(() => setTranslationSuccess(false), 5000);
      confetti({ particleCount: 70, spread: 60, origin: { y: 0.8 } });

      // Save to history
      const newHistoryItem: TranslationHistoryItem = {
        id: `trans-${Date.now()}`,
        title: sourceText.substring(0, 45) + (sourceText.length > 45 ? '...' : ''),
        sourceLang: sourceLang.code,
        sourceLangName: sourceLang.code === 'auto' ? `Auto (${effectiveDetectedName})` : sourceLang.name,
        targetLang: targetLang.code,
        targetLangName: targetLang.name,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        wordCount: response.metadata?.targetWordCount || translatedText.split(/\s+/).length,
        translatedText: response.translatedText
      };
      setHistory(prev => [newHistoryItem, ...prev.slice(0, 19)]);

      // Global ConvertPro file notification
      const convertedFile = {
        id: `trans-${Date.now()}`,
        name: `Translation_${targetLang.name.replace(/\s+/g, '_')}_${Date.now().toString().slice(-4)}.txt`,
        size: response.translatedText.length,
        type: 'text/plain',
        extension: 'TXT',
        uploadedAt: 'Just now',
        status: 'ready' as const,
        originalSize: sourceText.length,
        convertedSize: response.translatedText.length
      };
      onFileConverted?.(convertedFile);
    } catch (err: any) {
      setIsTranslating(false);
      setErrorMessage(err.message || 'Translation could not be completed. Please try again.');
    }
  };

  // File Upload & Document Parsing
  const handleFileSelect = async (file: File) => {
    setUploadedFile(file);
    setErrorMessage(null);
    setIsParsingDoc(true);
    setProgressPercent(15);
    setProgressStage(`Analyzing document structure for ${file.name}...`);

    try {
      const doc = await AITranslationService.parseDocument(file);
      setParsedDoc(doc);
      setSourceText(doc.rawText);
      setIsParsingDoc(false);
    } catch (err: any) {
      setIsParsingDoc(false);
      setErrorMessage(`Unable to parse ${file.name}. Please ensure the file is not corrupted.`);
    }
  };

  // Document Translation Trigger
  const handleTranslateDocument = async () => {
    if (!parsedDoc || !parsedDoc.rawText.trim()) {
      setErrorMessage('Please upload a document to translate.');
      return;
    }

    setErrorMessage(null);
    setIsTranslating(true);
    setProgressPercent(15);
    setProgressStage('Extracting document sections & structure...');

    try {
      setTimeout(() => {
        setProgressPercent(40);
        setProgressStage('Protecting tokens, URLs & terminology...');
      }, 400);

      setTimeout(() => {
        setProgressPercent(75);
        setProgressStage('Neural AI translating multi-page blocks...');
      }, 800);

      // Translate the full text
      const response = await AITranslationService.translate({
        text: parsedDoc.rawText,
        sourceLanguage: sourceLang.code,
        targetLanguage: targetLang.code,
        mode: selectedMode,
        preserveFormatting: true
      });

      // Split translated text into paragraphs to match document sections
      const translatedParagraphs = response.translatedText.split(/\n\n+/);
      const updatedSections: DocumentSection[] = parsedDoc.sections.map((sec, idx) => ({
        ...sec,
        translatedText: translatedParagraphs[idx] || sec.originalText
      }));

      setParsedDoc({
        ...parsedDoc,
        sections: updatedSections
      });
      setTranslatedText(response.translatedText);
      setLastTranslatedSource(parsedDoc.rawText);
      setLastTranslatedTarget(targetLang.code);

      const effectiveDocDetected = response.detectedLanguage ? getLanguageByCode(response.detectedLanguage).name : (sourceLang.code === 'auto' ? 'English' : sourceLang.name);
      if (sourceLang.code === 'auto') {
        setDetectedLangName(effectiveDocDetected);
      }

      setProgressPercent(100);
      setProgressStage('Document translation complete!');
      setIsTranslating(false);
      setTranslationSuccess(true);
      setTimeout(() => setTranslationSuccess(false), 5000);
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.75 } });

      // Save to history
      const newHistoryItem: TranslationHistoryItem = {
        id: `doc-${Date.now()}`,
        title: parsedDoc.fileName,
        sourceLang: sourceLang.code,
        sourceLangName: sourceLang.code === 'auto' ? `Auto (${effectiveDocDetected})` : sourceLang.name,
        targetLang: targetLang.code,
        targetLangName: targetLang.name,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        wordCount: response.metadata?.targetWordCount || 100,
        translatedText: response.translatedText
      };
      setHistory(prev => [newHistoryItem, ...prev.slice(0, 19)]);

      // Global ConvertPro file notification
      const ext = parsedDoc.fileType;
      const convertedFile = {
        id: `trans-doc-${Date.now()}`,
        name: `${parsedDoc.fileName.replace(/\.[^/.]+$/, '')}_${targetLang.name.replace(/\s+/g, '_')}.${ext.toLowerCase()}`,
        size: response.translatedText.length * 2,
        type: 'application/octet-stream',
        extension: ext,
        uploadedAt: 'Just now',
        status: 'ready' as const,
        originalSize: parsedDoc.rawText.length,
        convertedSize: response.translatedText.length
      };
      onFileConverted?.(convertedFile);
    } catch (err: any) {
      setIsTranslating(false);
      setErrorMessage(err.message || 'Document translation could not be completed. Please try again.');
    }
  };

  // Quick Refine Action Trigger
  const handleRefineAction = async (action: 'more_formal' | 'simplify' | 'improve_fluency' | 'technical_terms' | 'retranslate') => {
    if (!translatedText.trim()) return;
    setIsRefining(true);

    try {
      const refined = await AITranslationService.refineTranslation(
        translatedText,
        targetLang.name,
        action
      );
      setTranslatedText(refined);
      setIsRefining(false);
      confetti({ particleCount: 40, spread: 50 });
    } catch {
      setIsRefining(false);
    }
  };

  // Copy Translation
  const handleCopy = () => {
    navigator.clipboard.writeText(translatedText);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  // Text to Speech
  const handleSpeak = () => {
    if (!translatedText || typeof window === 'undefined' || !window.speechSynthesis) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(translatedText);
    utterance.lang = targetLang.code;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  // Sample Templates for Fast Testing
  const sampleTemplates = [
    {
      title: 'Business Proposal',
      text: `Artificial Intelligence is transforming enterprise productivity worldwide.

Key Strategic Deliverables:
1. Automated multilingual document synthesis with 99.4% precision.
2. Parallel processing pipeline delivering sub-second response times.
3. Strict SOC2 Type II compliance with zero-knowledge data retention.

For inquiries, contact support@convertpro.io or visit https://convertpro.io.`
    },
    {
      title: 'Technical Specification',
      text: `ConvertPro API v2.4 Architecture Overview:
- Endpoint: POST /api/ai/translate
- Security: End-to-end encrypted TLS 1.3 with AES-256 GCM
- Latency SLA: 380ms average GPU processing time
- Maximum File Size: 2.0 GB per batch payload.`
    },
    {
      title: 'Formal Notice',
      text: `Dear Valued Customer,

Please be informed that scheduled system optimization will take place on Saturday, October 24th between 02:00 UTC and 04:00 UTC.

All core conversion engines and cloud storage vaults will remain fully accessible without interruption.`
    }
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* 1. Header Banner */}
      <TranslatorHeader
        onOpenHistory={() => setIsHistoryOpen(true)}
        historyCount={history.length}
      />

      {/* 2. Top Language Selector Bar with Swap Button */}
      <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-4">
        
        <div className="grid grid-cols-1 md:grid-cols-11 gap-3 items-center">
          
          {/* Source Language Button (5 Cols) */}
          <div className="md:col-span-5 space-y-1">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 pl-1">
              Source Language:
            </span>
            <button
              onClick={() => setIsSourceModalOpen(true)}
              className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 transition-all text-left group"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="text-xl">{sourceLang.flag}</span>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white truncate">
                      {sourceLang.name}
                    </span>
                    {detectedLangName && sourceLang.code === 'auto' && (
                      <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                        Detected: {detectedLangName}
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-400 truncate block">
                    {sourceLang.nativeName}
                  </span>
                </div>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-brand-600 transition-colors flex-shrink-0" />
            </button>
          </div>

          {/* Swap Button (1 Col) */}
          <div className="md:col-span-1 flex justify-center items-center pt-3 md:pt-4">
            <button
              onClick={handleSwapLanguages}
              className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-brand-50 dark:hover:bg-brand-950/60 text-slate-600 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400 border border-slate-200/80 dark:border-slate-700 transition-all hover:scale-110 active:scale-90 shadow-xs"
              title="Switch target language (Hindi / Gujarati / Marathi)"
            >
              <ArrowLeftRight className="w-4 h-4" />
            </button>
          </div>

          {/* Target Language Button (5 Cols) */}
          <div className="md:col-span-5 space-y-1">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 pl-1">
              Target Language:
            </span>
            <button
              onClick={() => setIsTargetModalOpen(true)}
              className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-brand-50/40 hover:bg-brand-50/80 dark:bg-brand-950/30 dark:hover:bg-brand-950/50 border border-brand-200/80 dark:border-brand-900/80 transition-all text-left group"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="text-xl">{targetLang.flag}</span>
                <div className="min-w-0">
                  <span className="text-xs sm:text-sm font-extrabold text-brand-700 dark:text-brand-300 truncate block">
                    {targetLang.name}
                  </span>
                  <span className="text-[11px] text-brand-600/70 dark:text-brand-400/70 truncate block">
                    {targetLang.nativeName}
                  </span>
                </div>
              </div>
              <ChevronDown className="w-4 h-4 text-brand-500 group-hover:text-brand-700 transition-colors flex-shrink-0" />
            </button>
          </div>

        </div>

        {/* Translation Mode Selector Strip */}
        <TranslatorModeSelector
          selectedMode={selectedMode}
          onSelectMode={setSelectedMode}
        />

      </div>

      {/* 3. Input Mode Switcher (Text vs Document) */}
      <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveInputTab('text')}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeInputTab === 'text'
                ? 'bg-brand-600 text-white shadow-md shadow-brand-500/20'
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <span>✍️ Direct Text & Paste</span>
          </button>

          <button
            onClick={() => setActiveInputTab('document')}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeInputTab === 'document'
                ? 'bg-brand-600 text-white shadow-md shadow-brand-500/20'
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <span>📁 Document & File Upload</span>
            <span className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 text-[10px] font-mono">
              PDF/DOCX/PPTX
            </span>
          </button>
        </div>

        {/* Sample Templates Quick-Pick (if text mode and empty) */}
        {activeInputTab === 'text' && !sourceText && (
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400">
            <span>Try sample:</span>
            {sampleTemplates.map((t, idx) => (
              <button
                key={idx}
                onClick={() => setSourceText(t.text)}
                className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-brand-50 hover:text-brand-600 text-slate-600 dark:text-slate-300 text-[11px] font-bold transition-all"
              >
                {t.title}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Error Alert if any */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-rose-500 hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Success Banner after translation */}
      {translationSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center justify-between animate-in slide-in-from-top duration-300">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
            <div>
              <span className="text-sm font-extrabold">Translation Completed Successfully!</span>
              <p className="text-[11px] text-emerald-600/80 dark:text-emerald-400/80 mt-0.5">
                Your text has been translated to {targetLang.name}. You can copy, export, or refine the result below.
              </p>
            </div>
          </div>
          <button onClick={() => setTranslationSuccess(false)} className="text-emerald-500 hover:underline text-xs">
            Dismiss
          </button>
        </div>
      )}

      {/* 4. Main Translation Workspace */}

      {/* ================= MODE 1: DIRECT TEXT ================= */}
      {activeInputTab === 'text' && (
        <div className="space-y-6">
          
          {/* Dual Text Areas Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            
            {/* Left Source Text Input */}
            <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm flex flex-col overflow-hidden">
              <div className="flex items-center justify-between p-3.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-xs font-bold text-slate-500">
                <span>Source Text ({sourceLang.name})</span>
                <div className="flex items-center gap-2 text-slate-400 font-mono text-[11px]">
                  <span>{sourceText.split(/\s+/).filter(Boolean).length} words</span>
                  <span>&bull;</span>
                  <span>{sourceText.length} chars</span>
                  {sourceText && (
                    <button
                      onClick={() => {
                        setSourceText('');
                        setTranslatedText('');
                        setLastTranslatedSource('');
                        setTranslationSuccess(false);
                      }}
                      className="text-slate-400 hover:text-rose-500 ml-1"
                      title="Clear text"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              <textarea
                value={sourceText}
                onChange={(e) => {
                  setSourceText(e.target.value);
                  if (translationSuccess) setTranslationSuccess(false);
                }}
                placeholder="Type, paste text, or drag document content here to translate..."
                className="w-full h-80 sm:h-96 p-4 sm:p-5 bg-transparent text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none resize-none font-sans leading-relaxed"
              />
            </div>

            {/* Right Translated Text Output */}
            <div className="rounded-3xl bg-white dark:bg-slate-900 border border-brand-200 dark:border-brand-900/60 shadow-sm flex flex-col overflow-hidden ring-1 ring-brand-500/10">
              <div className="flex items-center justify-between p-3.5 border-b border-brand-100 dark:border-brand-950/60 bg-brand-50/30 dark:bg-brand-950/30 text-xs font-bold text-brand-700 dark:text-brand-300">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Translated Result ({targetLang.name})
                </span>
                <div className="flex items-center gap-2 text-slate-400 font-mono text-[11px]">
                  <span>{translatedText.split(/\s+/).filter(Boolean).length} words</span>
                  <span>&bull;</span>
                  <span>{translatedText.length} chars</span>
                </div>
              </div>

              {isTranslating ? (
                <div className="w-full h-80 sm:h-96 p-6 flex flex-col items-center justify-center space-y-3 text-center">
                  <TranslationProgress
                    currentStage={progressStage}
                    percent={progressPercent}
                    sourceLanguageName={sourceLang.name}
                    targetLanguageName={targetLang.name}
                  />
                </div>
              ) : translatedText ? (
                <div className="flex-1 flex flex-col">
                  {isEditing ? (
                    <textarea
                      value={translatedText}
                      onChange={(e) => setTranslatedText(e.target.value)}
                      className="w-full h-80 sm:h-96 p-4 sm:p-5 bg-transparent text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none resize-none font-sans leading-relaxed"
                    />
                  ) : (
                    <div className="w-full h-80 sm:h-96 p-4 sm:p-5 overflow-y-auto text-xs sm:text-sm text-slate-900 dark:text-white font-sans leading-relaxed whitespace-pre-wrap font-medium">
                      {translatedText}
                    </div>
                  )}
                </div>
              ) : (
                <div className="w-full h-80 sm:h-96 flex flex-col items-center justify-center p-6 text-center text-slate-400 space-y-2">
                  <Languages className="w-10 h-10 text-slate-300 dark:text-slate-700" />
                  <p className="text-xs font-bold text-slate-600 dark:text-slate-400">Translation output will appear here</p>
                  <p className="text-[11px]">Click 'Translate Text' below to generate real AI translation.</p>
                </div>
              )}
            </div>

          </div>

          {/* Translation Actions Toolbar or Translate Button */}
          {(!translatedText || isSourceChanged) ? (
            <div className="flex flex-col items-center justify-center pt-2 space-y-2">
              <button
                onClick={handleTranslateText}
                disabled={isTranslating || !sourceText.trim()}
                className="flex items-center gap-2.5 px-8 py-4 rounded-2xl bg-gradient-to-r from-brand-600 via-indigo-600 to-purple-600 hover:from-brand-700 hover:to-purple-700 text-white font-extrabold text-sm shadow-xl shadow-brand-500/25 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                <span>{translatedText && isSourceChanged ? `Re-translate to ${targetLang.name}` : `Translate to ${targetLang.name}`}</span>
              </button>
              {translatedText && isSourceChanged && (
                <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium animate-in fade-in duration-200">
                  Input changed • Click button above to update translation
                </p>
              )}
            </div>
          ) : (
            <TranslationActions
              onCopy={handleCopy}
              isCopied={isCopied}
              onOpenExportModal={() => setIsExportModalOpen(true)}
              onRefineAction={handleRefineAction}
              isRefining={isRefining}
              onToggleEdit={() => setIsEditing(!isEditing)}
              isEditing={isEditing}
              onSpeak={handleSpeak}
              isSpeaking={isSpeaking}
              onToggleDiff={() => setShowDiff(!showDiff)}
              showDiff={showDiff}
            />
          )}

          {/* Side-by-Side Diff Section if enabled */}
          {showDiff && translatedText && (
            <TranslationPreview
              sourceText={sourceText}
              translatedText={translatedText}
              sourceLanguageName={sourceLang.name}
              targetLanguageName={targetLang.name}
              isEditing={isEditing}
              onTranslatedTextChange={setTranslatedText}
              showDiff={true}
            />
          )}

        </div>
      )}

      {/* ================= MODE 2: DOCUMENT & FILE TRANSLATION ================= */}
      {activeInputTab === 'document' && (
        <div className="space-y-6">
          
          {/* File Upload / Drag & Drop Target */}
          {!parsedDoc ? (
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                  handleFileSelect(e.dataTransfer.files[0]);
                }
              }}
              onClick={() => fileInputRef.current?.click()}
              className={`p-8 sm:p-12 rounded-3xl border-2 border-dashed text-center cursor-pointer transition-all duration-200 space-y-4 ${
                isDragging
                  ? 'border-brand-500 bg-brand-50/60 dark:bg-brand-950/40 scale-[1.01]'
                  : 'border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-brand-400 hover:bg-slate-50/50 dark:hover:bg-slate-850'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.doc,.pptx,.ppt,.txt,.jpg,.jpeg,.png,.webp,.bmp"
                onChange={(e) => e.target.files && handleFileSelect(e.target.files[0])}
                className="hidden"
              />

              <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-tr from-brand-600 via-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-lg shadow-brand-500/25">
                <Upload className="w-8 h-8 animate-bounce-subtle" />
              </div>

              <div className="space-y-1.5">
                <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
                  Drop your document here or click to browse
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                  Supports PDF, Word DOCX, PowerPoint PPTX, Images (JPG, PNG) and TXT (up to 500 MB)
                </p>
              </div>

              {/* Supported Format Tags */}
              <div className="flex flex-wrap items-center justify-center gap-1.5 pt-2">
                <span className="px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200/60 dark:border-rose-800 font-mono text-[10px] font-bold">PDF</span>
                <span className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800 font-mono text-[10px] font-bold">DOCX</span>
                <span className="px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800 font-mono text-[10px] font-bold">PPTX</span>
                <span className="px-2.5 py-1 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200/60 dark:border-purple-800 font-mono text-[10px] font-bold">IMAGE OCR</span>
                <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-[10px] font-bold">TXT</span>
              </div>
            </div>
          ) : (
            /* Uploaded Document Ready Card */
            <div className="space-y-6">
              
              <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-3 rounded-2xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-extrabold text-slate-900 dark:text-white truncate">
                      {parsedDoc.fileName}
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {parsedDoc.fileType} Format &bull; {parsedDoc.totalWords} Words &bull; {parsedDoc.sections.length} Extracted Paragraphs/Slides
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <button
                    onClick={() => {
                      setUploadedFile(null);
                      setParsedDoc(null);
                      setTranslatedText('');
                    }}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 hover:text-rose-600 text-slate-600 dark:text-slate-300 text-xs font-bold transition-colors"
                  >
                    Change File
                  </button>

                  {!translatedText && (
                    <button
                      onClick={handleTranslateDocument}
                      disabled={isTranslating}
                      className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-700 hover:to-indigo-700 text-white text-xs font-extrabold shadow-md shadow-brand-500/25 transition-all"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>Translate Document</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Progress Indicator while translating */}
              {isTranslating && (
                <TranslationProgress
                  currentStage={progressStage}
                  percent={progressPercent}
                  fileName={parsedDoc.fileName}
                  sourceLanguageName={sourceLang.name}
                  targetLanguageName={targetLang.name}
                />
              )}

              {/* Document Side-by-Side Visual Preview */}
              {parsedDoc && (
                <DocumentPreview
                  fileName={parsedDoc.fileName}
                  fileType={parsedDoc.fileType}
                  sections={parsedDoc.sections}
                  sourceLanguageName={sourceLang.name}
                  targetLanguageName={targetLang.name}
                  imageBlobUrl={parsedDoc.imageBlobUrl}
                />
              )}

              {/* Post-Translation Smart Actions */}
              {translatedText && (
                <TranslationActions
                  onCopy={handleCopy}
                  isCopied={isCopied}
                  onOpenExportModal={() => setIsExportModalOpen(true)}
                  onRefineAction={handleRefineAction}
                  isRefining={isRefining}
                  onToggleEdit={() => setIsEditing(!isEditing)}
                  isEditing={isEditing}
                  onSpeak={handleSpeak}
                  isSpeaking={isSpeaking}
                />
              )}

            </div>
          )}

        </div>
      )}

      {/* 5. Language Selector Modals */}
      <LanguageSelectorModal
        isOpen={isSourceModalOpen}
        onClose={() => setIsSourceModalOpen(false)}
        onSelectLanguage={setSourceLang}
        selectedLanguageCode={sourceLang.code}
        allowAutoDetect={false}
        title="Select Source Language"
        restrictedLanguages={AI_TRANSLATOR_SOURCE_LANGUAGES}
      />

      <LanguageSelectorModal
        isOpen={isTargetModalOpen}
        onClose={() => setIsTargetModalOpen(false)}
        onSelectLanguage={setTargetLang}
        selectedLanguageCode={targetLang.code}
        allowAutoDetect={false}
        title="Select Target Language"
        restrictedLanguages={AI_TRANSLATOR_TARGET_LANGUAGES}
      />

      {/* 6. Translation History Drawer */}
      <TranslationHistory
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={history}
        onLoadHistoryItem={(item) => {
          setSourceText(item.title);
          setTranslatedText(item.translatedText);
          setLastTranslatedSource(item.title);
          setLastTranslatedTarget(item.targetLang);
          setSourceLang(getLanguageByCode(item.sourceLang));
          setTargetLang(getLanguageByCode(item.targetLang));
          setActiveInputTab('text');
        }}
        onDeleteHistoryItem={(id) => setHistory(prev => prev.filter(h => h.id !== id))}
        onClearAll={() => setHistory([])}
      />

      {/* 7. Export Translation Modal */}
      <ExportTranslationModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        translatedText={translatedText}
        originalFileName={parsedDoc?.fileName}
        sourceLanguageName={sourceLang.name}
        targetLanguageName={targetLang.name}
      />

    </div>
  );
};
