import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  PenTool,
  Clock,
  RotateCcw,
  Zap,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  FileText,
  Mail,
  ChevronRight,
  RefreshCw,
  Send,
  Layers,
  Settings,
  Key,
  X,
  Check
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  WritingContentType,
  WritingTone,
  WritingLength,
  WritingLanguage,
  SmartTemplateFields,
  WritingResponse,
  WritingVersion,
  WritingHistoryItem,
  AIEditActionType
} from '../types/aiWriter';
import {
  CONTENT_TYPE_PRESETS,
  EXAMPLE_PROMPTS,
  ExamplePrompt
} from '../data/aiWriterPresets';
import {
  generateWriting,
  editWriting,
  getStoredOpenAiApiKey,
  setStoredOpenAiApiKey,
  getStoredOpenAiModel,
  setStoredOpenAiModel
} from '../services/ai/aiWriterService';

import { WritingOptions } from '../components/aiWriter/WritingOptions';
import { AIWriterInput } from '../components/aiWriter/AIWriterInput';
import { AIWriterEditor } from '../components/aiWriter/AIWriterEditor';
import { WritingHistory } from '../components/aiWriter/WritingHistory';

interface AIWriterPageProps {
  onFileSaved?: (fileItem: any) => void;
}

const STORAGE_KEY_HISTORY = 'convertpro_ai_writer_history';

export const AIWriterPage: React.FC<AIWriterPageProps> = ({ onFileSaved }) => {
  // Input State
  const [selectedType, setSelectedType] = useState<WritingContentType>('email');
  const [selectedTone, setSelectedTone] = useState<WritingTone>('professional');
  const [selectedLength, setSelectedLength] = useState<WritingLength>('medium');
  const [selectedLanguage, setSelectedLanguage] = useState<WritingLanguage>('English');
  const [userInput, setUserInput] = useState<string>('');
  const [smartFields, setSmartFields] = useState<SmartTemplateFields>({});

  // Generation & Editor State
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isEditingAI, setIsEditingAI] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // OpenAI & ChatGPT Settings Modal State
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState<boolean>(false);
  const [openAiKeyInput, setOpenAiKeyInput] = useState<string>(getStoredOpenAiApiKey());
  const [openAiModelInput, setOpenAiModelInput] = useState<string>(getStoredOpenAiModel());
  const [savedKeyNotice, setSavedKeyNotice] = useState<boolean>(false);

  // Versions Management
  const [versions, setVersions] = useState<WritingVersion[]>([]);
  const [currentVersionIndex, setCurrentVersionIndex] = useState<number>(0);

  // Current Active Document View
  const [currentSubject, setCurrentSubject] = useState<string | undefined>(undefined);
  const [currentTitle, setCurrentTitle] = useState<string | undefined>(undefined);
  const [currentContent, setCurrentContent] = useState<string | null>(null);

  // History State
  const [history, setHistory] = useState<WritingHistoryItem[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);

  // Load session history from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_HISTORY);
      if (saved) {
        setHistory(JSON.parse(saved));
      }
    } catch (e) {
      console.warn('Failed to parse saved writing history:', e);
    }
  }, []);

  // Sync history to localStorage
  const saveHistory = (newHistory: WritingHistoryItem[]) => {
    setHistory(newHistory);
    try {
      localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(newHistory));
    } catch {}
  };

  // Handle Preset Change
  const handleSelectType = (type: WritingContentType) => {
    setSelectedType(type);
    const preset = CONTENT_TYPE_PRESETS.find(p => p.id === type);
    if (preset) {
      setSelectedTone(preset.defaultTone);
    }
  };

  // Handle Example Prompt Selection
  const handleSelectExample = (ex: ExamplePrompt) => {
    setUserInput(ex.rawText);
    setSelectedType(ex.type);
    setSelectedTone(ex.tone);
  };

  // Execute Main AI Document Generation
  const handleGenerate = async () => {
    let effectiveInput = userInput.trim();
    if (!effectiveInput && Object.keys(smartFields).length === 0) {
      const preset = CONTENT_TYPE_PRESETS.find(p => p.id === selectedType);
      effectiveInput = preset?.placeholder.replace(/^e\.g\.,?\s*/i, '').replace(/\.\.\.$/, '') || 'Please draft a formal communication document';
      setUserInput(effectiveInput);
    }

    setIsGenerating(true);
    setErrorMessage(null);

    try {
      const res = await generateWriting({
        type: selectedType,
        tone: selectedTone,
        length: selectedLength,
        language: selectedLanguage,
        userInput: effectiveInput,
        smartFields
      });

      if (!res.success) {
        throw new Error(res.error || 'Failed to generate writing content.');
      }

      const newVersion: WritingVersion = {
        id: `ver-${Date.now()}`,
        versionNumber: versions.length + 1,
        subject: res.subject,
        title: res.title,
        content: res.content,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        actionTrigger: 'Initial Generation'
      };

      const updatedVersions = [newVersion];
      setVersions(updatedVersions);
      setCurrentVersionIndex(0);
      setCurrentSubject(res.subject);
      setCurrentTitle(res.title);
      setCurrentContent(res.content);

      // Add to session history
      const preset = CONTENT_TYPE_PRESETS.find(p => p.id === selectedType);
      const historyItem: WritingHistoryItem = {
        id: `hist-${Date.now()}`,
        type: selectedType,
        typeLabel: preset?.label || 'Document',
        tone: selectedTone,
        language: selectedLanguage,
        userInputSnippet: userInput.slice(0, 60),
        subject: res.subject,
        title: res.title,
        content: res.content,
        timestamp: new Date().toLocaleDateString([], { month: 'short', day: 'numeric' }),
        createdAt: Date.now()
      };

      saveHistory([historyItem, ...history.slice(0, 29)]);

      confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
    } catch (err: any) {
      setErrorMessage(err.message || 'Unable to generate content right now. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle Regenerate (Generates a new version v2, v3)
  const handleRegenerate = async () => {
    if (!userInput.trim() && Object.keys(smartFields).length === 0) return;

    setIsGenerating(true);
    setErrorMessage(null);

    try {
      const res = await generateWriting({
        type: selectedType,
        tone: selectedTone,
        length: selectedLength,
        language: selectedLanguage,
        userInput,
        smartFields
      });

      if (!res.success) throw new Error(res.error || 'Regeneration failed.');

      const newVerNumber = versions.length + 1;
      const newVersion: WritingVersion = {
        id: `ver-${Date.now()}`,
        versionNumber: newVerNumber,
        subject: res.subject,
        title: res.title,
        content: res.content,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        actionTrigger: 'Regenerate'
      };

      const updatedVersions = [...versions, newVersion];
      setVersions(updatedVersions);
      setCurrentVersionIndex(updatedVersions.length - 1);
      setCurrentSubject(res.subject);
      setCurrentTitle(res.title);
      setCurrentContent(res.content);

      confetti({ particleCount: 40, spread: 50, origin: { y: 0.6 } });
    } catch (err: any) {
      setErrorMessage(err.message || 'Regeneration failed. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle Quick AI Edit Action (Improve, Shorten, Formalize, Friendlier, Grammar, Translate)
  const handleExecuteEditAction = async (action: AIEditActionType, targetLanguage?: string) => {
    if (!currentContent) return;

    setIsEditingAI(true);
    setErrorMessage(null);

    try {
      const res = await editWriting({
        action,
        content: currentContent,
        targetLanguage,
        subject: currentSubject,
        title: currentTitle,
        type: selectedType
      });

      if (!res.success) throw new Error(res.error || 'Action failed.');

      const newVerNumber = versions.length + 1;
      const newVersion: WritingVersion = {
        id: `ver-${Date.now()}`,
        versionNumber: newVerNumber,
        subject: res.subject || currentSubject,
        title: res.title || currentTitle,
        content: res.content,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        actionTrigger: action
      };

      const updatedVersions = [...versions, newVersion];
      setVersions(updatedVersions);
      setCurrentVersionIndex(updatedVersions.length - 1);
      if (res.subject) setCurrentSubject(res.subject);
      if (res.title) setCurrentTitle(res.title);
      setCurrentContent(res.content);
    } catch (err: any) {
      setErrorMessage(err.message || 'Could not complete the requested AI revision.');
    } finally {
      setIsEditingAI(false);
    }
  };

  // Switch Active Version
  const handleSelectVersion = (index: number) => {
    if (versions[index]) {
      setCurrentVersionIndex(index);
      setCurrentSubject(versions[index].subject);
      setCurrentTitle(versions[index].title);
      setCurrentContent(versions[index].content);
    }
  };

  // Reopen Item from History
  const handleSelectHistoryItem = (item: WritingHistoryItem) => {
    setSelectedType(item.type);
    setSelectedTone(item.tone);
    setSelectedLanguage(item.language);
    setUserInput(item.userInputSnippet);

    const reloadedVersion: WritingVersion = {
      id: `ver-${Date.now()}`,
      versionNumber: 1,
      subject: item.subject,
      title: item.title,
      content: item.content,
      timestamp: item.timestamp,
      actionTrigger: 'History'
    };

    setVersions([reloadedVersion]);
    setCurrentVersionIndex(0);
    setCurrentSubject(item.subject);
    setCurrentTitle(item.title);
    setCurrentContent(item.content);
  };

  // Delete Individual History Item
  const handleDeleteHistoryItem = (id: string) => {
    const updated = history.filter(h => h.id !== id);
    saveHistory(updated);
  };

  // Clear All History
  const handleClearAllHistory = () => {
    saveHistory([]);
  };

  // Clear Current Workspace Document
  const handleClear = () => {
    setCurrentContent(null);
    setCurrentSubject(undefined);
    setCurrentTitle(undefined);
    setVersions([]);
    setCurrentVersionIndex(0);
    setErrorMessage(null);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* 1. Top Header Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-xl relative overflow-hidden border border-indigo-900/40">
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="space-y-2 z-10">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-gradient-to-r from-brand-500 to-indigo-500 text-white text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-md">
              <Sparkles className="w-3.5 h-3.5" /> AI Writer Studio
            </span>
            <span className="text-[11px] text-indigo-300 font-bold">17+ Professional Formats</span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white">
            AI Writer
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
            Turn your simple ideas into polished emails, letters, notices, applications, and professional documents in seconds.
          </p>
        </div>

        <div className="flex items-center gap-3 z-10">
          <button
            type="button"
            onClick={() => setIsHistoryOpen(true)}
            className="px-4 py-2.5 sm:py-3 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs sm:text-sm border border-white/20 flex items-center gap-2 cursor-pointer transition-all active:scale-95"
          >
            <Clock className="w-4 h-4 text-brand-300" />
            <span>Recent Writing</span>
            {history.length > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-brand-500 text-[10px] font-black">
                {history.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Error Message Toast */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-bold flex items-center gap-2 animate-fade-in">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* 2. Main Two-Column Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* LEFT COLUMN: Input & Writing Parameters (5 cols) */}
        <div className="lg:col-span-5 space-y-4 bg-white/80 dark:bg-slate-900/80 p-5 sm:p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm backdrop-blur-xs">
          <WritingOptions
            selectedType={selectedType}
            onSelectType={handleSelectType}
            selectedTone={selectedTone}
            onSelectTone={setSelectedTone}
            selectedLength={selectedLength}
            onSelectLength={setSelectedLength}
            selectedLanguage={selectedLanguage}
            onSelectLanguage={setSelectedLanguage}
            disabled={isGenerating}
          />

          <div className="w-full h-[1px] bg-slate-200/80 dark:bg-slate-800" />

          <AIWriterInput
            userInput={userInput}
            onChangeUserInput={setUserInput}
            selectedType={selectedType}
            smartFields={smartFields}
            onChangeSmartFields={setSmartFields}
            onGenerate={handleGenerate}
            isGenerating={isGenerating}
            onSelectExample={handleSelectExample}
          />
        </div>

        {/* RIGHT COLUMN: Output Editor / Empty State (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {isGenerating ? (
            /* Generating Loading Animation */
            <div className="p-12 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm text-center space-y-4 min-h-[460px] flex flex-col items-center justify-center">
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-600 animate-pulse flex items-center justify-center shadow-lg shadow-brand-500/30">
                  <Sparkles className="w-8 h-8 text-white animate-spin" />
                </div>
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Crafting Your {CONTENT_TYPE_PRESETS.find(p => p.id === selectedType)?.label || 'Document'}...
                </h3>
                <p className="text-xs text-slate-400 max-w-sm">
                  Applying "{selectedTone}" tone, structuring formal greetings, and refining professional language.
                </p>
              </div>
            </div>
          ) : currentContent ? (
            /* Active Generated Document Editor */
            <AIWriterEditor
              type={selectedType}
              subject={currentSubject}
              title={currentTitle}
              content={currentContent}
              versions={versions}
              currentVersionIndex={currentVersionIndex}
              onSelectVersion={handleSelectVersion}
              onChangeContent={setCurrentContent}
              onChangeSubject={setCurrentSubject}
              onRegenerate={handleRegenerate}
              onExecuteEditAction={handleExecuteEditAction}
              isEditingAI={isEditingAI}
              onClear={handleClear}
            />
          ) : (
            /* Empty State Panel */
            <div className="p-8 sm:p-12 rounded-3xl bg-white/70 dark:bg-slate-900/40 border-2 border-dashed border-slate-200 dark:border-slate-800 text-center space-y-6 min-h-[460px] flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-3xl bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center">
                <PenTool className="w-8 h-8" />
              </div>

              <div className="space-y-1.5 max-w-md">
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  AI Generated Content Preview
                </h3>
                <p className="text-xs text-slate-400">
                  Describe what you want to communicate on the left, then click <strong>Generate Document</strong> to see the polished version here.
                </p>
              </div>

              {/* Sample Prompts */}
              <div className="w-full max-w-md space-y-2 text-left pt-2">
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 block text-center">
                  Try one of these examples:
                </span>
                <div className="space-y-2">
                  {EXAMPLE_PROMPTS.slice(0, 3).map((ex, idx) => (
                    <div
                      key={idx}
                      onClick={() => handleSelectExample(ex)}
                      className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 hover:border-brand-500/50 hover:bg-brand-500/5 transition-all cursor-pointer flex items-center justify-between gap-3 group"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-bold text-brand-600 dark:text-brand-400 uppercase">
                            {CONTENT_TYPE_PRESETS.find(p => p.id === ex.type)?.label}
                          </span>
                          <span className="text-slate-300">•</span>
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-brand-600 transition-colors">
                            {ex.title}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 line-clamp-1">
                          {ex.rawText}
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-brand-500 flex-shrink-0 transition-colors" />
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-center gap-4 text-[11px] font-bold text-slate-400 pt-2">
                <span className="flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Never Invents Facts</span>
                <span className="flex items-center gap-1"><Sparkles className="w-3.5 h-3.5 text-purple-500" /> Export PDF & Word</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Writing History Drawer */}
      <WritingHistory
        history={history}
        onSelectHistoryItem={handleSelectHistoryItem}
        onDeleteItem={handleDeleteHistoryItem}
        onClearAll={handleClearAllHistory}
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
      />

      {/* OpenAI & ChatGPT Settings Modal */}
      {isApiKeyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-7 space-y-5 animate-scale-up">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    ChatGPT & AI Engine Settings
                  </h3>
                  <p className="text-xs text-slate-400">
                    Configure OpenAI models & API access
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsApiKeyModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  OpenAI API Key (Optional)
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={openAiKeyInput}
                    onChange={(e) => setOpenAiKeyInput(e.target.value)}
                    placeholder="sk-..."
                    className="w-full pl-3 pr-8 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                  />
                  {openAiKeyInput && (
                    <button
                      type="button"
                      onClick={() => setOpenAiKeyInput('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-rose-500"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
                  Stored securely in your private browser session. Leave empty to use ConvertPro's built-in AI completion engine.
                </p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  ChatGPT Model
                </label>
                <select
                  value={openAiModelInput}
                  onChange={(e) => setOpenAiModelInput(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="gpt-4o-mini">GPT-4o Mini (Fast & Ultra High-Precision) - Recommended</option>
                  <option value="gpt-4o">GPT-4o (State of the Art Intelligence)</option>
                  <option value="gpt-3.5-turbo">GPT-3.5 Turbo (Classic)</option>
                </select>
              </div>

              <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-[11px] text-emerald-800 dark:text-emerald-300 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Dual-Engine Resilience:</strong> If offline or without key, ConvertPro automatically uses its context-aware neural linguistic composer.
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
              {savedKeyNotice ? (
                <span className="text-xs font-bold text-emerald-600 flex items-center gap-1 animate-fade-in">
                  <Check className="w-3.5 h-3.5" /> Preferences Saved!
                </span>
              ) : (
                <span />
              )}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsApiKeyModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setStoredOpenAiApiKey(openAiKeyInput);
                    setStoredOpenAiModel(openAiModelInput);
                    setSavedKeyNotice(true);
                    setTimeout(() => {
                      setSavedKeyNotice(false);
                      setIsApiKeyModalOpen(false);
                    }, 800);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition-all"
                >
                  Save Settings
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
