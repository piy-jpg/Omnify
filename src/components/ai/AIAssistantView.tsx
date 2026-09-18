import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Bot,
  Send,
  Sparkles,
  FileText,
  Plus,
  Copy,
  Check,
  Download,
  Trash2,
  RefreshCw,
  HelpCircle,
  Zap,
  Layers,
  ChevronRight,
  BookOpen,
  FileSpreadsheet,
  CheckSquare,
  FileQuestion,
  CornerDownLeft,
  Columns,
  GraduationCap,
  ListOrdered,
  Eye,
  AlertCircle,
  ThumbsUp,
  ThumbsDown,
  Paperclip,
  Image as ImageIcon,
  Presentation,
  FileCode,
  FileBox,
  X,
  SlidersHorizontal,
  CheckCircle2,
  XCircle,
  ArrowRight
} from 'lucide-react';
import jsPDF from 'jspdf';
import { AIMessage, FileItem } from '../../types';
import { INITIAL_AI_CHAT } from '../../data/sampleFiles';
import {
  cleanFileName,
  formatBytes,
  getDynamicPromptsForFiles,
  generateGroundedResponse,
  QuizQuestion
} from '../../services/ai/aiAssistantEngine';

interface AIAssistantViewProps {
  files: FileItem[];
  onUploadNewDoc: () => void;
}

export const AIAssistantView: React.FC<AIAssistantViewProps> = ({
  files: initialFiles,
  onUploadNewDoc
}) => {
  // Local files state (deduplicated and manageable within the AI session)
  const [localFiles, setLocalFiles] = useState<FileItem[]>(() => {
    // Deduplicate incoming files by clean name
    const seen = new Set<string>();
    const unique: FileItem[] = [];
    initialFiles.forEach(f => {
      const clean = cleanFileName(f.name);
      if (!seen.has(clean)) {
        seen.add(clean);
        unique.push({
          ...f,
          name: clean
        });
      }
    });
    return unique;
  });

  // Keep localFiles in sync if parent initialFiles changes, preserving deduplication
  useEffect(() => {
    setLocalFiles(prev => {
      const seen = new Set<string>(prev.map(p => cleanFileName(p.name)));
      const next = [...prev];
      initialFiles.forEach(f => {
        const clean = cleanFileName(f.name);
        if (!seen.has(clean)) {
          seen.add(clean);
          next.push({
            ...f,
            name: clean
          });
        }
      });
      return next;
    });
  }, [initialFiles]);

  // Selected file IDs for AI context binding (multi-file selection)
  const [selectedDocIds, setSelectedDocIds] = useState<Set<string>>(() => {
    // Default to first 2 files selected if available
    const initialSet = new Set<string>();
    if (localFiles.length > 0) {
      initialSet.add(localFiles[0].id);
      if (localFiles[1]) initialSet.add(localFiles[1].id);
    }
    return initialSet;
  });

  const [messages, setMessages] = useState<AIMessage[]>(INITIAL_AI_CHAT);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingStep, setTypingStep] = useState<'reading' | 'synthesizing'>('reading');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [feedbackState, setFeedbackState] = useState<{ [msgId: string]: 'up' | 'down' }>({});

  // Interactive Quiz State
  const [quizAnswers, setQuizAnswers] = useState<{
    [qId: number]: { selectedIndex: number; isCorrect: boolean; showExplanation: boolean }
  }>({});

  // File Preview Modal
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);

  // Compare Modal
  const [showCompareModal, setShowCompareModal] = useState(false);

  // Quick Prompt Menu Toggle
  const [showPromptIdeas, setShowPromptIdeas] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // List of currently selected FileItems
  const selectedFilesList = useMemo(() => {
    return localFiles.filter(f => selectedDocIds.has(f.id));
  }, [localFiles, selectedDocIds]);

  // Dynamic quick action prompts based on selected files
  const dynamicPrompts = useMemo(() => {
    return getDynamicPromptsForFiles(selectedFilesList);
  }, [selectedFilesList]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Toggle single file selection
  const toggleFileSelection = (id: string) => {
    setSelectedDocIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Select all or clear all
  const selectAllFiles = () => {
    if (selectedDocIds.size === localFiles.length) {
      setSelectedDocIds(new Set());
    } else {
      setSelectedDocIds(new Set(localFiles.map(f => f.id)));
    }
  };

  // Remove file from AI session
  const removeFileFromSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setLocalFiles(prev => prev.filter(f => f.id !== id));
    setSelectedDocIds(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  // Handle direct file upload in AI view
  const handleDirectFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newItems: FileItem[] = [];
      const newIds: string[] = [];

      Array.from(e.target.files).forEach((file, index) => {
        const cleanName = cleanFileName(file.name);
        const newFileItem: FileItem = {
          id: `ai-doc-${Date.now()}-${index}`,
          name: cleanName,
          size: file.size,
          type: file.type || 'application/octet-stream',
          extension: (file.name.split('.').pop() || 'DOC').toUpperCase(),
          uploadedAt: 'Just now',
          status: 'ready',
          pages: file.type.includes('presentation') ? 12 : file.type.includes('pdf') ? 4 : 2
        };
        newItems.push(newFileItem);
        newIds.push(newFileItem.id);
      });

      setLocalFiles(prev => [...newItems, ...prev]);
      setSelectedDocIds(prev => {
        const next = new Set(prev);
        newIds.forEach(id => next.add(id));
        return next;
      });

      // Post system notification in chat
      const uploadedNames = newItems.map(f => `"${f.name}"`).join(', ');
      const sysMsg: AIMessage = {
        id: `sys-${Date.now()}`,
        sender: 'assistant',
        content: `📂 **${newItems.length} new document${newItems.length > 1 ? 's' : ''} uploaded and indexed:** ${uploadedNames}.\n\nI have extracted their contents and added them to your active AI context. You can now ask questions, extract tables, or generate quizzes.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestedActions: [
          'Summarize these new documents',
          'Extract all key metrics & tables',
          'Generate a 5-question quiz'
        ]
      };
      setMessages(prev => [...prev, sysMsg]);
    }
  };

  // Send message
  const handleSendMessage = (textToSend?: string) => {
    const query = (textToSend || inputText).trim();
    if (!query) return;

    if (selectedFilesList.length === 0) {
      // Warn user to select at least 1 file
      const warnMsg: AIMessage = {
        id: `warn-${Date.now()}`,
        sender: 'assistant',
        content: `⚠️ **Please select at least one document from the "Your Files" panel on the left.**\n\nYour questions need to be grounded in document content so I can extract accurate citations and insights.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestedActions: ['Select all files in workspace']
      };
      setMessages(prev => [...prev, warnMsg]);
      return;
    }

    const userMsg: AIMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);
    setTypingStep('reading');

    // Simulate multi-stage document reading and synthesis
    setTimeout(() => {
      setTypingStep('synthesizing');
    }, 450);

    setTimeout(() => {
      const responseData = generateGroundedResponse(query, selectedFilesList);

      const aiMsg: AIMessage = {
        id: `ai-${Date.now()}`,
        sender: 'assistant',
        content: responseData.content,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        citations: responseData.citations,
        suggestedActions: responseData.suggestedActions,
        extractedData: responseData.quiz ? { type: 'quiz', data: responseData.quiz } : undefined
      };

      setMessages(prev => [...prev, aiMsg]);
      setIsTyping(false);
    }, 950);
  };

  // Handle textarea Enter/Shift+Enter
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Copy text to clipboard
  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Thumbs up / down feedback
  const handleFeedback = (msgId: string, type: 'up' | 'down') => {
    setFeedbackState(prev => ({
      ...prev,
      [msgId]: prev[msgId] === type ? undefined! : type
    }));
  };

  // Reset / Clear chat
  const handleClearChat = () => {
    setMessages([
      {
        id: 'welcome-reset',
        sender: 'assistant',
        content: `👋 Chat history cleared. What would you like to explore across your **${selectedFilesList.length} selected document${selectedFilesList.length === 1 ? '' : 's'}**?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestedActions: dynamicPrompts.slice(0, 3).map(p => p.label)
      }
    ]);
    setQuizAnswers({});
  };

  // Export AI Summary PDF
  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.setTextColor(79, 70, 229);
    doc.text(`AI Document Intelligence Summary`, 15, 20);

    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    const activeNames = selectedFilesList.map(f => f.name).join(', ') || 'All Workspace Documents';
    doc.text(`Grounded in: ${activeNames}`, 15, 27);
    doc.text(`Generated: ${new Date().toLocaleString()} | ConvertPro AI Workspace`, 15, 33);

    doc.setDrawColor(226, 232, 240);
    doc.line(15, 37, 195, 37);

    let y = 46;
    messages.filter(m => m.sender === 'assistant').forEach((msg, idx) => {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(30, 41, 59);
      doc.text(`Response #${idx + 1} (${msg.timestamp})`, 15, y);
      y += 6;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(51, 65, 85);
      const cleanContent = msg.content.replace(/[#*`>]/g, '');
      const splitText = doc.splitTextToSize(cleanContent, 175);
      doc.text(splitText, 15, y);
      y += splitText.length * 4.5 + 4;

      if (msg.citations && msg.citations.length > 0) {
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(8);
        doc.setTextColor(99, 102, 241);
        doc.text(`Sources: ${msg.citations.join(' | ')}`, 15, y);
        y += 6;
      }

      y += 4;
      if (y > 265) {
        doc.addPage();
        y = 20;
      }
    });

    const primaryDocName = selectedFilesList[0]?.name || 'Workspace';
    doc.save(`${primaryDocName.replace(/\.[^/.]+$/, '')}_AI_Summary.pdf`);
  };

  // Helper for format icon
  const getFormatIcon = (ext?: string) => {
    const e = (ext || '').toUpperCase();
    if (e === 'PDF') return <FileText className="w-4 h-4 text-rose-500" />;
    if (['DOCX', 'DOC', 'TXT', 'RTF'].includes(e)) return <FileText className="w-4 h-4 text-blue-500" />;
    if (['PPTX', 'PPT'].includes(e)) return <Presentation className="w-4 h-4 text-amber-500" />;
    if (['XLSX', 'XLS', 'CSV'].includes(e)) return <FileSpreadsheet className="w-4 h-4 text-emerald-500" />;
    if (['JPG', 'JPEG', 'PNG', 'WEBP', 'SVG'].includes(e)) return <ImageIcon className="w-4 h-4 text-purple-500" />;
    return <FileBox className="w-4 h-4 text-slate-500" />;
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8.5rem)] min-h-[640px] rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
      
      {/* 1. PAGE HEADER */}
      <div className="px-6 py-4 border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 flex-shrink-0">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-xl bg-purple-100 dark:bg-purple-950/70 text-purple-600 dark:text-purple-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              AI Assistant
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-purple-50 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 border border-purple-200/60 dark:border-purple-800/60">
                Chat with Your Files
              </span>
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Upload documents, presentations, images, and other supported files, then ask questions about their content.
          </p>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/80 text-emerald-700 dark:text-emerald-400 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>AI Ready</span>
          </div>

          <button
            onClick={handleClearChat}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors shadow-2xs"
            title="Reset conversation"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
            <span>Clear Chat</span>
          </button>

          <button
            onClick={handleExportPDF}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold transition-colors shadow-xs"
            title="Export full Q&A and summary notes to PDF"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Summary PDF</span>
          </button>
        </div>
      </div>

      {/* 2. BODY WORKSPACE: 2-COLUMN LAYOUT */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        
        {/* LEFT COLUMN: YOUR FILES PANEL */}
        <div className="w-full md:w-80 lg:w-84 border-b md:border-b-0 md:border-r border-slate-200/80 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/40 p-4 flex flex-col justify-between flex-shrink-0 overflow-y-auto">
          
          <div className="space-y-3.5">
            {/* Panel Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Your Files
                </h3>
                <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                  {localFiles.length}
                </span>
              </div>

              <input
                type="file"
                multiple
                ref={fileInputRef}
                onChange={handleDirectFileUpload}
                className="hidden"
              />

              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-all shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Files</span>
              </button>
            </div>

            {/* Selection Controls */}
            {localFiles.length > 0 && (
              <div className="flex items-center justify-between py-1.5 px-2.5 rounded-xl bg-white dark:bg-slate-800/70 border border-slate-200/60 dark:border-slate-700/60 text-xs">
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  <strong className="text-purple-600 dark:text-purple-400">{selectedDocIds.size}</strong> of {localFiles.length} selected
                </span>
                <button
                  onClick={selectAllFiles}
                  className="text-[11px] font-bold text-purple-600 dark:text-purple-400 hover:underline"
                >
                  {selectedDocIds.size === localFiles.length ? 'Deselect All' : 'Select All'}
                </button>
              </div>
            )}

            {/* Files List */}
            <div className="space-y-2 max-h-[360px] md:max-h-[calc(100vh-23rem)] overflow-y-auto pr-1">
              {localFiles.length === 0 ? (
                <div className="text-center py-8 px-4 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 space-y-2">
                  <FileQuestion className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">No files added yet</p>
                  <p className="text-[11px] text-slate-400">Upload documents or images to ask questions.</p>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-2 px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 text-xs font-bold"
                  >
                    + Upload First File
                  </button>
                </div>
              ) : (
                localFiles.map(file => {
                  const isSelected = selectedDocIds.has(file.id);
                  const cleanName = cleanFileName(file.name);
                  const sizeFormatted = formatBytes(file.size);

                  return (
                    <div
                      key={file.id}
                      onClick={() => toggleFileSelection(file.id)}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-2.5 group ${
                        isSelected
                          ? 'bg-purple-50/90 dark:bg-purple-950/40 border-purple-300 dark:border-purple-800 text-purple-950 dark:text-purple-100 shadow-xs'
                          : 'bg-white dark:bg-slate-800/60 border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      {/* Checkbox + Icon + Info */}
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div
                          className={`w-4 h-4 rounded-md border flex items-center justify-center transition-colors flex-shrink-0 ${
                            isSelected
                              ? 'bg-purple-600 border-purple-600 text-white'
                              : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>

                        <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 flex-shrink-0">
                          {getFormatIcon(file.extension)}
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold truncate text-slate-900 dark:text-white" title={cleanName}>
                            {cleanName}
                          </p>
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                            <span className="font-semibold uppercase text-purple-600 dark:text-purple-400">
                              {file.extension || 'DOC'}
                            </span>
                            <span>&bull;</span>
                            <span>{sizeFormatted}</span>
                            {file.pages && (
                              <>
                                <span>&bull;</span>
                                <span>{file.pages} {file.extension === 'PPTX' ? 'slides' : 'pages'}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Action buttons (Preview & Remove) */}
                      <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 flex-shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setPreviewFile(file);
                          }}
                          className="p-1 rounded-lg hover:bg-slate-200/70 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                          title="Preview Document Content"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => removeFileFromSession(file.id, e)}
                          className="p-1 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-950/60 text-slate-400 hover:text-rose-600 transition-colors"
                          title="Remove from Session"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Left Panel Footer Tools */}
          <div className="pt-3 border-t border-slate-200/80 dark:border-slate-800 space-y-2">
            <button
              onClick={() => setShowCompareModal(true)}
              disabled={localFiles.length < 2}
              className="w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <span className="flex items-center gap-2">
                <Columns className="w-4 h-4 text-purple-600" />
                <span>Compare 2 Files</span>
              </span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: MAIN CHAT WORKSPACE */}
        <div className="flex-1 flex flex-col justify-between overflow-hidden bg-white dark:bg-slate-900">
          
          {/* Active Context Banner */}
          <div className="px-6 py-2.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Active Context:
              </span>
              {selectedFilesList.length === 0 ? (
                <span className="flex items-center gap-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 px-2.5 py-0.5 rounded-lg border border-amber-200/60 dark:border-amber-800/60">
                  <AlertCircle className="w-3.5 h-3.5" />
                  No files selected — select at least one file on the left
                </span>
              ) : (
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Using {selectedFilesList.length} document{selectedFilesList.length > 1 ? 's' : ''}:
                  </span>
                  {selectedFilesList.map(f => (
                    <span
                      key={f.id}
                      className="px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 text-[11px] font-medium border border-purple-200/60 dark:border-purple-800/60 truncate max-w-[180px]"
                    >
                      {cleanFileName(f.name)}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {selectedFilesList.length > 0 && (
              <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <Check className="w-3 h-3" /> Ready to ground answers
              </span>
            )}
          </div>

          {/* Message Feed */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Empty State when no messages */}
            {messages.length === 0 && (
              <div className="max-w-xl mx-auto my-auto text-center py-10 space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-950/80 text-purple-600 dark:text-purple-300 flex items-center justify-center mx-auto shadow-xs">
                  <Bot className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Chat with your files
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                    Ask questions, extract structured tables, compare multiple files, or generate study quizzes from your uploaded documents.
                  </p>
                </div>

                {/* 4 Starter Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left pt-2">
                  <div
                    onClick={() => handleSendMessage('What are the key points and executive takeaways of this document?')}
                    className="p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/50 hover:border-purple-300 dark:hover:border-purple-700 hover:bg-purple-50/40 cursor-pointer transition-all space-y-1"
                  >
                    <span className="text-sm">📌</span>
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">Summarize Key Takeaways</h4>
                    <p className="text-[11px] text-slate-400">Extract high-impact takeaways & milestones.</p>
                  </div>

                  <div
                    onClick={() => handleSendMessage('Generate a 5-question interactive quiz from this document')}
                    className="p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/50 hover:border-purple-300 dark:hover:border-purple-700 hover:bg-purple-50/40 cursor-pointer transition-all space-y-1"
                  >
                    <span className="text-sm">📝</span>
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">Interactive Quiz (5 MCQs)</h4>
                    <p className="text-[11px] text-slate-400">Test comprehension with instant feedback.</p>
                  </div>

                  <div
                    onClick={() => handleSendMessage('Extract all quantitative metrics, numbers and data tables')}
                    className="p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/50 hover:border-purple-300 dark:hover:border-purple-700 hover:bg-purple-50/40 cursor-pointer transition-all space-y-1"
                  >
                    <span className="text-sm">📊</span>
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">Extract Data & Metrics</h4>
                    <p className="text-[11px] text-slate-400">Format statistics into clean Markdown tables.</p>
                  </div>

                  <div
                    onClick={() => handleSendMessage('Explain the core message of this document in simple terms (ELI5)')}
                    className="p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/50 hover:border-purple-300 dark:hover:border-purple-700 hover:bg-purple-50/40 cursor-pointer transition-all space-y-1"
                  >
                    <span className="text-sm">💡</span>
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">Explain Simply (ELI5)</h4>
                    <p className="text-[11px] text-slate-400">Demystify complex topics in simple terms.</p>
                  </div>
                </div>
              </div>
            )}

            {/* Conversation Messages */}
            {messages.map((msg) => {
              const isUser = msg.sender === 'user';
              const isCopied = copiedId === msg.id;
              const feedback = feedbackState[msg.id];

              return (
                <div
                  key={msg.id}
                  className={`flex gap-3 max-w-3xl ${isUser ? 'ml-auto flex-row-reverse' : ''}`}
                >
                  {/* Avatar */}
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-xs font-bold shadow-xs ${
                      isUser
                        ? 'bg-purple-600 text-white'
                        : 'bg-gradient-to-tr from-purple-600 to-indigo-600 text-white'
                    }`}
                  >
                    {isUser ? 'You' : <Bot className="w-4 h-4" />}
                  </div>

                  {/* Message Container */}
                  <div className={`space-y-2 flex-1 min-w-0 ${isUser ? 'items-end' : 'items-start'}`}>
                    <div
                      className={`p-4 rounded-3xl text-xs leading-relaxed ${
                        isUser
                          ? 'bg-purple-600 text-white rounded-tr-none ml-auto max-w-xl'
                          : 'bg-slate-100/90 dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-tl-none border border-slate-200/70 dark:border-slate-700/60 shadow-xs'
                      }`}
                    >
                      {/* Markdown text rendering */}
                      <div className="whitespace-pre-line space-y-2">
                        {msg.content}
                      </div>

                      {/* Interactive Quiz Cards (if message contains quiz data or quiz text) */}
                      {(msg.extractedData?.type === 'quiz' || msg.content.includes('Interactive')) && (
                        <div className="mt-4 space-y-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                          {((msg.extractedData?.data as QuizQuestion[]) || [
                            {
                              id: 1,
                              question: 'What was the latency reduction achieved after GPU clustering?',
                              options: ['15%', '42% (Correct)', '80%', '10%'],
                              correctIndex: 1,
                              explanation: 'Section 2.1 verified a 42% decrease in processing latency.',
                              sourceDoc: 'Project_Report.docx',
                              citation: 'Page 2'
                            },
                            {
                              id: 2,
                              question: 'What is the auto-deletion purge policy for temporary user files?',
                              options: ['7 days', '30 days', '24 hours (Correct)', 'Permanent retention'],
                              correctIndex: 2,
                              explanation: 'Zero-retention privacy policy guarantees file deletion within 24 hours.',
                              sourceDoc: 'Project_Report.docx',
                              citation: 'Page 7'
                            }
                          ]).map((q) => {
                            const ans = quizAnswers[q.id];
                            return (
                              <div
                                key={q.id}
                                className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 space-y-2.5 shadow-2xs"
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <p className="font-bold text-slate-900 dark:text-white text-xs">
                                    {q.id}. {q.question}
                                  </p>
                                  <span className="text-[10px] font-semibold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/60 px-2 py-0.5 rounded-md border border-purple-200 dark:border-purple-800 flex-shrink-0">
                                    {q.citation}
                                  </span>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                  {q.options.map((opt, optIdx) => {
                                    const isChosen = ans?.selectedIndex === optIdx;
                                    const isRight = optIdx === q.correctIndex;
                                    let btnStyle = 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-purple-400';

                                    if (ans) {
                                      if (isRight) {
                                        btnStyle = 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-800 dark:text-emerald-200 font-bold';
                                      } else if (isChosen && !isRight) {
                                        btnStyle = 'bg-rose-50 dark:bg-rose-950/60 border-rose-500 text-rose-800 dark:text-rose-200 font-bold';
                                      }
                                    }

                                    return (
                                      <button
                                        key={optIdx}
                                        onClick={() => {
                                          setQuizAnswers(prev => ({
                                            ...prev,
                                            [q.id]: {
                                              selectedIndex: optIdx,
                                              isCorrect: optIdx === q.correctIndex,
                                              showExplanation: true
                                            }
                                          }));
                                        }}
                                        className={`p-2.5 rounded-xl text-left text-xs border transition-all flex items-center justify-between gap-2 ${btnStyle}`}
                                      >
                                        <span>{opt}</span>
                                        {ans && isRight && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />}
                                        {ans && isChosen && !isRight && <XCircle className="w-3.5 h-3.5 text-rose-600 flex-shrink-0" />}
                                      </button>
                                    );
                                  })}
                                </div>

                                {ans && (
                                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-[11px] text-slate-600 dark:text-slate-300">
                                    💡 <strong>Explanation:</strong> {q.explanation}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Citations & Source Grounding */}
                      {msg.citations && msg.citations.length > 0 && (
                        <div className="mt-3 pt-2.5 border-t border-slate-200 dark:border-slate-700/60 flex flex-wrap items-center gap-1.5">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            Sources:
                          </span>
                          {msg.citations.map((c, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-700 text-purple-700 dark:text-purple-300 text-[10px] font-semibold border border-slate-200 dark:border-slate-600 flex items-center gap-1"
                            >
                              <span>📄</span>
                              <span>{c}</span>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Actions & Timestamp Toolbar */}
                    <div className={`flex items-center gap-3 px-1 text-[11px] text-slate-400 ${isUser ? 'justify-end' : ''}`}>
                      <span>{msg.timestamp}</span>

                      {!isUser && (
                        <>
                          <button
                            onClick={() => handleCopy(msg.id, msg.content)}
                            className="hover:text-slate-700 dark:hover:text-slate-200 flex items-center gap-1 transition-colors"
                            title="Copy response"
                          >
                            {isCopied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                            <span>{isCopied ? 'Copied' : 'Copy'}</span>
                          </button>

                          <div className="h-3 w-px bg-slate-200 dark:bg-slate-700" />

                          <button
                            onClick={() => handleFeedback(msg.id, 'up')}
                            className={`flex items-center gap-1 hover:text-emerald-600 transition-colors ${
                              feedback === 'up' ? 'text-emerald-600 font-bold' : ''
                            }`}
                            title="Helpful"
                          >
                            <ThumbsUp className="w-3 h-3" />
                            <span>Helpful</span>
                          </button>

                          <button
                            onClick={() => handleFeedback(msg.id, 'down')}
                            className={`flex items-center gap-1 hover:text-rose-600 transition-colors ${
                              feedback === 'down' ? 'text-rose-600 font-bold' : ''
                            }`}
                            title="Not helpful"
                          >
                            <ThumbsDown className="w-3 h-3" />
                          </button>

                          <div className="h-3 w-px bg-slate-200 dark:bg-slate-700" />

                          <button
                            onClick={() => handleSendMessage('Please elaborate further on the key points above.')}
                            className="hover:text-purple-600 dark:hover:text-purple-400 flex items-center gap-1 transition-colors"
                            title="Ask follow up"
                          >
                            <span>Follow-up &rarr;</span>
                          </button>
                        </>
                      )}
                    </div>

                    {/* Suggested Follow-up Actions */}
                    {msg.suggestedActions && msg.suggestedActions.length > 0 && (
                      <div className="pt-1.5 flex flex-wrap gap-1.5">
                        {msg.suggestedActions.map((act, i) => (
                          <button
                            key={i}
                            onClick={() => handleSendMessage(act)}
                            className="px-3 py-1.5 rounded-xl text-[11px] font-medium bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/60 dark:hover:bg-purple-900/60 text-purple-700 dark:text-purple-300 border border-purple-200/70 dark:border-purple-800 transition-colors text-left flex items-center gap-1.5"
                          >
                            <Sparkles className="w-3 h-3 text-purple-500" />
                            <span>{act}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Realistic Multi-stage Typing Indicator */}
            {isTyping && (
              <div className="flex gap-3 max-w-2xl">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="p-4 rounded-3xl bg-slate-100 dark:bg-slate-800 rounded-tl-none border border-slate-200/60 dark:border-slate-700 flex items-center gap-3 text-xs text-slate-600 dark:text-slate-300">
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-purple-500 animate-bounce" />
                    <span className="w-2 h-2 rounded-full bg-purple-500 animate-bounce [animation-delay:0.2s]" />
                    <span className="w-2 h-2 rounded-full bg-purple-500 animate-bounce [animation-delay:0.4s]" />
                  </div>
                  <span className="font-medium">
                    {typingStep === 'reading'
                      ? 'AI is scanning & grounding selected files...'
                      : 'Synthesizing verified document insights...'}
                  </span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* DYNAMIC QUICK PROMPTS BAR */}
          <div className="px-6 py-2.5 border-t border-slate-200/70 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/30 flex items-center gap-2 overflow-x-auto scrollbar-none">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 whitespace-nowrap flex items-center gap-1">
              <Zap className="w-3 h-3 text-amber-500" />
              Prompts:
            </span>
            {dynamicPrompts.map((pill, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(pill.prompt)}
                disabled={!pill.prompt}
                className="px-3 py-1 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/40 dark:hover:border-purple-700 whitespace-nowrap transition-all shadow-2xs"
              >
                {pill.label}
              </button>
            ))}
          </div>

          {/* COMPOSER BAR */}
          <div className="p-4 border-t border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900">
            <div className="relative rounded-2xl bg-slate-100/80 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 focus-within:ring-2 focus-within:ring-purple-500 focus-within:border-transparent transition-all">
              
              <textarea
                ref={textareaRef}
                rows={2}
                placeholder={
                  selectedFilesList.length > 0
                    ? `Ask questions about ${selectedFilesList.length === 1 ? `"${cleanFileName(selectedFilesList[0].name)}"` : `${selectedFilesList.length} selected documents`} (Enter to send, Shift+Enter for new line)...`
                    : "Select at least one file from the left panel to begin asking questions..."
                }
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full px-4 pt-3 pb-2 text-xs sm:text-sm bg-transparent border-none text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none resize-none"
              />

              {/* Composer Controls */}
              <div className="flex items-center justify-between px-3 pb-2 pt-1 border-t border-slate-200/40 dark:border-slate-700/40">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-700 transition-colors"
                    title="Attach more files"
                  >
                    <Paperclip className="w-3.5 h-3.5" />
                    <span>Attach</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowPromptIdeas(!showPromptIdeas)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/60 transition-colors"
                    title="Show prompt templates"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Prompts</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-400 hidden sm:inline">
                    Enter &crarr; to send
                  </span>

                  <button
                    onClick={() => handleSendMessage()}
                    disabled={!inputText.trim() || isTyping}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-purple-500/20 font-bold text-xs flex items-center gap-1.5 transition-all"
                  >
                    <span>Send</span>
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Prompt Ideas Popover */}
            {showPromptIdeas && (
              <div className="mt-3 p-3 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                <button
                  onClick={() => {
                    handleSendMessage('Summarize the top 3 key takeaways and strategic goals from these files.');
                    setShowPromptIdeas(false);
                  }}
                  className="p-2 rounded-xl bg-white dark:bg-slate-800 text-left hover:border-purple-500 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                >
                  📌 <strong>Top 3 Goals</strong>
                  <p className="text-[10px] text-slate-400">Summarize strategic takeaways</p>
                </button>

                <button
                  onClick={() => {
                    handleSendMessage('Extract all financial data and performance benchmarks into a Markdown table.');
                    setShowPromptIdeas(false);
                  }}
                  className="p-2 rounded-xl bg-white dark:bg-slate-800 text-left hover:border-purple-500 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                >
                  📊 <strong>Metrics & Benchmarks</strong>
                  <p className="text-[10px] text-slate-400">Extract structured data</p>
                </button>

                <button
                  onClick={() => {
                    handleSendMessage('Generate a 5-question multiple choice test with explanations.');
                    setShowPromptIdeas(false);
                  }}
                  className="p-2 rounded-xl bg-white dark:bg-slate-800 text-left hover:border-purple-500 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                >
                  📝 <strong>5-Question Quiz</strong>
                  <p className="text-[10px] text-slate-400">Comprehension knowledge check</p>
                </button>
              </div>
            )}
          </div>

        </div>

      </div>

      {/* 3. FILE PREVIEW MODAL */}
      {previewFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-2xl rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/60">
                  {getFormatIcon(previewFile.extension)}
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    {cleanFileName(previewFile.name)}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {previewFile.extension} &bull; {formatBytes(previewFile.size)} &bull; {previewFile.pages || 4} pages
                  </p>
                </div>
              </div>
              <button
                onClick={() => setPreviewFile(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 space-y-3 max-h-72 overflow-y-auto">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                <span>Extracted Document Outline</span>
                <span className="text-emerald-600 font-semibold">● Optical Indexing Complete</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                <strong>Section 1 (Executive Summary)</strong>: Performance latency was accelerated by 42% following serverless GPU clustering. Average file compression achieved 64% without degradation of vector font clarity.
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                <strong>Section 2 (Security & Compliance)</strong>: Verified SOC2 Type II compliance standards. Rolling 24-hour auto-purge guarantee enforced across all worker containers.
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                <strong>Section 3 (Roadmap)</strong>: Multi-format batch OCR text recognition and customizable document generation templates slated for Q4 rollout.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  setSelectedDocIds(new Set([previewFile.id]));
                  setPreviewFile(null);
                  handleSendMessage(`Summarize key points from "${cleanFileName(previewFile.name)}"`);
                }}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-xs"
              >
                Ask AI to Summarize This File
              </button>
              <button
                onClick={() => setPreviewFile(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. DOCUMENT COMPARISON MODAL */}
      {showCompareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-3xl rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Columns className="w-5 h-5 text-purple-600" />
                <span>AI Document Comparison & Diff</span>
              </h3>
              <button
                onClick={() => setShowCompareModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border space-y-2">
                <span className="text-[10px] font-bold uppercase text-purple-600">Document A (Base)</span>
                <p className="font-bold text-xs text-slate-900 dark:text-white">
                  {cleanFileName(localFiles[0]?.name || 'Document_A.pdf')}
                </p>
                <p className="text-[11px] text-slate-500">
                  {localFiles[0]?.pages || 2} pages &bull; {formatBytes(localFiles[0]?.size || 2400000)}
                </p>
                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 text-[11px] text-slate-600 dark:text-slate-300 space-y-1">
                  <div>+ Contains baseline architectural blueprints</div>
                  <div>+ Defines initial 100 MB upload thresholds</div>
                  <div>- Lacks updated Q3 GPU cluster benchmarks</div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-purple-50/50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 space-y-2">
                <span className="text-[10px] font-bold uppercase text-purple-600">Document B (Target)</span>
                <p className="font-bold text-xs text-slate-900 dark:text-white">
                  {cleanFileName(localFiles[1]?.name || 'Document_B.docx')}
                </p>
                <p className="text-[11px] text-slate-500">
                  {localFiles[1]?.pages || 14} pages &bull; {formatBytes(localFiles[1]?.size || 1200000)}
                </p>
                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 text-[11px] text-purple-950 dark:text-purple-200 space-y-1">
                  <div>+ Includes 42% latency reduction metrics</div>
                  <div>+ 500 MB max file size threshold certified</div>
                  <div>+ Verified SOC2 Type II audit certificate</div>
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-300">
              <strong>AI Similarity Score: 78.4%</strong> — Both documents share enterprise infrastructure context, but Document B includes updated quarterly benchmarks and revised scalability targets.
            </div>

            <button
              onClick={() => {
                setShowCompareModal(false);
                const docAName = cleanFileName(localFiles[0]?.name || 'Doc A');
                const docBName = cleanFileName(localFiles[1]?.name || 'Doc B');
                handleSendMessage(`Compare "${docAName}" with "${docBName}" and highlight key differences, metrics, and conflicting info.`);
              }}
              className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md transition-all"
            >
              Insert Full Comparison in Chat
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
