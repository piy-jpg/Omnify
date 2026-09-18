import React, { useState, useEffect, useRef } from 'react';
import {
  Presentation,
  Sparkles,
  Upload,
  FileText,
  Sliders,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Search,
  Star,
  Download,
  Share2,
  Play,
  Maximize2,
  X,
  Layers,
  Wand2,
  Plus,
  Trash2,
  Copy,
  RefreshCw,
  BarChart2,
  FileSpreadsheet,
  Quote,
  Clock,
  ArrowRight,
  ShieldCheck,
  Check,
  Eye,
  SlidersHorizontal,
  Lightbulb,
  FileArchive,
  Grid,
  TrendingUp,
  Cpu,
  Monitor,
  HelpCircle,
  BookOpen,
  Volume2,
  Edit3,
  Flame,
  Zap,
  Info,
  Globe,
  FileCode,
  Printer,
  Image as ImageIcon,
  Columns,
  MoveUp,
  MoveDown,
  MessageSquare,
  Target
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  PresentationPreset,
  PRESENTATION_PRESETS,
  PRESENTATION_CATEGORIES
} from '../data/presentationPresets';
import {
  OutlineItem,
  SlideData,
  PresentationProject,
  QualityReport,
  generateOutline,
  generateFullPresentation,
  rewriteSlideWithAI,
  checkPresentationQuality,
  exportToEditablePptx,
  exportToPdf,
  exportToImagesZip,
  exportToMarkdown,
  exportToInteractiveHtml,
  exportSpeakerNotesDoc,
  exportSingleSlideImage,
  exportHandoutsPdf
} from '../services/presentationEngine';
import { SlideVisual, VisualType, planSlideVisual } from '../services/visualAssetsEngine';
import { parseUploadedDocument } from '../services/documentParser';
import { FileItem } from '../types';

interface AIPresentationGeneratorPageProps {
  onFileGenerated?: (file: FileItem) => void;
}

export const AIPresentationGeneratorPage: React.FC<AIPresentationGeneratorPageProps> = ({
  onFileGenerated
}) => {
  // Workflow Step: 'input' | 'presets' | 'outline' | 'editor'
  const [step, setStep] = useState<'input' | 'presets' | 'outline' | 'editor'>('input');

  // Step 1: Input & Configuration State
  const [inputMode, setInputMode] = useState<'text' | 'document' | 'topic'>('text');
  const [textInput, setTextInput] = useState('');
  const [uploadedDocName, setUploadedDocName] = useState<string | null>(null);
  const [isParsingDoc, setIsParsingDoc] = useState(false);
  const [topicInput, setTopicInput] = useState('');
  const [promptCommand, setPromptCommand] = useState('');

  // Settings
  const [slideCount, setSlideCount] = useState<number>(10);
  const [customSlideCount, setCustomSlideCount] = useState<number>(12);
  const [audience, setAudience] = useState('Business');
  const [tone, setTone] = useState('Professional');
  const [language, setLanguage] = useState('English');

  // Step 2: Presets & Filtering
  const [selectedPresetId, setSelectedPresetId] = useState<string>('biz-exec-brief');
  const [presetCategory, setPresetCategory] = useState<string>('all');
  const [presetTagFilter, setPresetTagFilter] = useState<string>('all');
  const [presetSearch, setPresetSearch] = useState('');
  const [favoritePresetIds, setFavoritePresetIds] = useState<Set<string>>(() => {
    const saved = localStorage.getItem('convertpro_fav_presets');
    return saved ? new Set(JSON.parse(saved)) : new Set(['biz-exec-brief', 'tech-ai-future', 'startup-seed-pitch', 'cr-dark-minimal-gallery']);
  });

  // Step 3: Outline State
  const [generatedOutline, setGeneratedOutline] = useState<OutlineItem[]>([]);
  const [projectTitle, setProjectTitle] = useState('');
  const [projectSubtitle, setProjectSubtitle] = useState('');

  // Step 4: Full Presentation Project & Editor State
  const [currentProject, setCurrentProject] = useState<PresentationProject | null>(null);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [customAIPrompt, setCustomAIPrompt] = useState('');
  const [isAIProcessing, setIsAIProcessing] = useState(false);
  const [showSpeakerNotes, setShowSpeakerNotes] = useState(true);

  // Presenter Mode State
  const [isFullscreenPreview, setIsFullscreenPreview] = useState(false);
  const [presenterElapsedSecs, setPresenterElapsedSecs] = useState(0);

  // Modals & Overlays
  const [isQualityCheckOpen, setIsQualityCheckOpen] = useState(false);
  const [qualityReport, setQualityReport] = useState<QualityReport | null>(null);
  const [shareLinkCopied, setShareLinkCopied] = useState(false);
  const [isExportingPptx, setIsExportingPptx] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingImages, setIsExportingImages] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // History state in LocalStorage
  const [savedProjects, setSavedProjects] = useState<PresentationProject[]>(() => {
    const saved = localStorage.getItem('convertpro_saved_presentations');
    return saved ? JSON.parse(saved) : [];
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync favorites
  useEffect(() => {
    localStorage.setItem('convertpro_fav_presets', JSON.stringify(Array.from(favoritePresetIds)));
  }, [favoritePresetIds]);

  // Sync projects
  useEffect(() => {
    localStorage.setItem('convertpro_saved_presentations', JSON.stringify(savedProjects));
  }, [savedProjects]);

  // Presenter Timer
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isFullscreenPreview) {
      interval = setInterval(() => {
        setPresenterElapsedSecs(prev => prev + 1);
      }, 1000);
    } else {
      setPresenterElapsedSecs(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isFullscreenPreview]);

  // Fullscreen Escape / Arrow Key Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isFullscreenPreview) {
        if (e.key === 'ArrowRight' || e.key === 'Space' || e.key === 'n' || e.key === 'N') {
          e.preventDefault();
          setActiveSlideIndex(prev => Math.min((currentProject?.slides.length || 1) - 1, prev + 1));
        } else if (e.key === 'ArrowLeft' || e.key === 'p' || e.key === 'P') {
          e.preventDefault();
          setActiveSlideIndex(prev => Math.max(0, prev - 1));
        } else if (e.key === 'Escape') {
          setIsFullscreenPreview(false);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreenPreview, currentProject]);

  // Word & Character count helpers
  const currentContent = (inputMode === 'topic' ? (topicInput || textInput) : textInput) || promptCommand || '';
  const charCount = currentContent.length;
  const wordCount = currentContent.trim() ? currentContent.trim().split(/\s+/).length : 0;

  // Format Presenter Timer (mm:ss)
  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Toggle favorite preset
  const handleToggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavoritePresetIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Handle Quick Command Selection
  const handleSelectQuickPrompt = (prompt: string) => {
    setPromptCommand(prompt);
    setTextInput(prompt);
    if (prompt.includes('15-slide')) setSlideCount(15);
    else if (prompt.includes('10-slide')) setSlideCount(10);
    else if (prompt.includes('20-slide')) setSlideCount(20);

    if (prompt.toLowerCase().includes('student')) {
      setAudience('Students');
      setTone('Academic');
    } else if (prompt.toLowerCase().includes('investor') || prompt.toLowerCase().includes('pitch')) {
      setAudience('Business');
      setTone('Executive');
    }
  };

  // Handle Real Document Upload (PDF, DOCX, PPTX, TXT, MD)
  const handleDocumentUpload = async (file: File) => {
    setUploadedDocName(file.name);
    setIsParsingDoc(true);

    try {
      const result = await parseUploadedDocument(file);
      setTextInput(result.extractedText);
      setProjectTitle(result.extractedTitle);
      if (result.estimatedSlideCount) {
        setSlideCount(result.estimatedSlideCount);
      }
    } catch (err) {
      console.error('Error parsing document:', err);
      setTextInput(`Document loaded: ${file.name}`);
    } finally {
      setIsParsingDoc(false);
    }
  };

  // Move to Step 2: Presets
  const handleProceedToPresets = () => {
    const raw = (currentContent || promptCommand || '').trim();
    if (!raw) {
      alert('Presentation content generation failed: Please enter a presentation topic or paste your content first.');
      return;
    }
    console.log('[AI Presentation Generator] [1 USER INPUT] Entered content:', raw);
    setStep('presets');
  };

  // Move to Step 3: Generate Outline
  const handleProceedToOutline = (presetId?: string) => {
    const activePreset = presetId || selectedPresetId;
    setSelectedPresetId(activePreset);

    const raw = (currentContent || promptCommand || '').trim();
    if (!raw) {
      alert('Presentation content generation failed: Please enter a presentation topic or paste your content first.');
      return;
    }

    const effectiveCount = slideCount === 99 ? customSlideCount : slideCount;
    console.log('[AI Presentation Generator] [2 API REQUEST] Generating outline for count:', effectiveCount);

    try {
      const { title, subtitle, outline, audience: detectedAudience } = generateOutline(raw, effectiveCount, audience, tone, language);
      setProjectTitle(title);
      setProjectSubtitle(subtitle);
      if (detectedAudience && detectedAudience !== audience) {
        setAudience(detectedAudience);
      }
      setGeneratedOutline(outline);
      setStep('outline');
    } catch (err: any) {
      alert(err.message || 'Presentation content generation failed. Please try again.');
    }
  };

  // Move to Step 4: Generate Full Slides
  const handleGenerateFullSlides = () => {
    setIsAIProcessing(true);
    const raw = (currentContent || promptCommand || '').trim();
    if (!raw) {
      setIsAIProcessing(false);
      alert('Presentation content generation failed: Please enter your presentation content.');
      return;
    }

    const effectiveCount = generatedOutline.length;
    console.log('[AI Presentation Generator] [2 API REQUEST] Generating full presentation slides...');

    setTimeout(() => {
      try {
        const project = generateFullPresentation(
          {
            title: projectTitle,
            subtitle: projectSubtitle,
            topic: projectTitle,
            rawInput: raw,
            inputMode,
            slideCount: effectiveCount,
            audience,
            tone,
            language,
            presetId: selectedPresetId
          },
          generatedOutline
        );

        setCurrentProject(project);
        setActiveSlideIndex(0);
        setQualityReport(project.qualityReport || null);
        setSavedProjects(prev => [project, ...prev.filter(p => p.id !== project.id)]);
        setIsAIProcessing(false);
        setStep('editor');
        confetti({ particleCount: 75, spread: 60, origin: { y: 0.6 } });

        // Notify file manager
        if (onFileGenerated) {
          const newFile: FileItem = {
            id: project.id,
            name: `${project.title}.pptx`,
            size: 2450000,
            type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            extension: 'PPTX',
            uploadedAt: 'Just now',
            status: 'ready'
          };
          onFileGenerated(newFile);
        }
      } catch (err: any) {
        setIsAIProcessing(false);
        alert(err.message || 'Presentation generation failed. Please try again.');
      }
    }, 400);
  };

  // AI Slide-by-slide Rewriter Command & Custom Copilot Prompt
  const handleAICommand = (actionOrPrompt: 'simplify' | 'expand' | 'professionalize' | 'diagram' | 'add_stats' | 'shorten' | 'infographic' | 'clarify' | 'speaker_notes' | string) => {
    if (!currentProject) return;
    setIsAIProcessing(true);

    setTimeout(() => {
      const activeSlide = currentProject.slides[activeSlideIndex];
      const updatedSlide = rewriteSlideWithAI(activeSlide, actionOrPrompt);

      const updatedSlides = [...currentProject.slides];
      updatedSlides[activeSlideIndex] = updatedSlide;

      const updatedProject: PresentationProject = {
        ...currentProject,
        slides: updatedSlides,
        lastEditedAt: 'Just now',
        qualityReport: checkPresentationQuality(updatedSlides)
      };

      setCurrentProject(updatedProject);
      setQualityReport(updatedProject.qualityReport || null);
      setIsAIProcessing(false);
      setCustomAIPrompt('');
    }, 300);
  };

  // Change Presentation Theme Style Dynamically
  const handleChangePresetTheme = (newPresetId: string) => {
    if (!currentProject) return;
    const newPreset = PRESENTATION_PRESETS.find(p => p.id === newPresetId);
    if (!newPreset) return;

    setSelectedPresetId(newPresetId);
    const updatedProject: PresentationProject = {
      ...currentProject,
      presetId: newPresetId,
      preset: newPreset
    };
    setCurrentProject(updatedProject);
  };

  // Update or Regenerate Slide Visual Asset
  const handleUpdateSlideVisual = (visualType: VisualType, customPrompt?: string) => {
    if (!currentProject) return;
    const activeSlide = currentProject.slides[activeSlideIndex];
    if (!activeSlide) return;

    const points = activeSlide.content.bullets || [];
    const newVisual = planSlideVisual(
      activeSlide.slideNumber,
      activeSlide.title,
      points,
      'general',
      visualType
    );
    if (customPrompt) {
      newVisual.prompt = customPrompt;
    }

    const updatedSlides = [...currentProject.slides];
    updatedSlides[activeSlideIndex] = {
      ...activeSlide,
      visual: newVisual
    };

    setCurrentProject({
      ...currentProject,
      slides: updatedSlides
    });
  };

  // Slide Manipulation Helpers
  const handleDuplicateSlide = (index: number) => {
    if (!currentProject) return;
    const slideToDup = currentProject.slides[index];
    const newSlide: SlideData = {
      ...JSON.parse(JSON.stringify(slideToDup)),
      id: `slide-dup-${Date.now()}`,
      title: `${slideToDup.title} (Copy)`,
      slideNumber: index + 2
    };

    const newSlides = [...currentProject.slides];
    newSlides.splice(index + 1, 0, newSlide);

    // Re-index slide numbers
    const reindexed = newSlides.map((s, idx) => ({ ...s, slideNumber: idx + 1 }));
    setCurrentProject({ ...currentProject, slides: reindexed });
    setActiveSlideIndex(index + 1);
  };

  const handleDeleteSlide = (index: number) => {
    if (!currentProject || currentProject.slides.length <= 1) return;
    const newSlides = currentProject.slides.filter((_, idx) => idx !== index);
    const reindexed = newSlides.map((s, idx) => ({ ...s, slideNumber: idx + 1 }));
    setCurrentProject({ ...currentProject, slides: reindexed });
    setActiveSlideIndex(Math.max(0, index - 1));
  };

  const handleMoveSlide = (fromIndex: number, toIndex: number) => {
    if (!currentProject || toIndex < 0 || toIndex >= currentProject.slides.length) return;
    const newSlides = [...currentProject.slides];
    const [moved] = newSlides.splice(fromIndex, 1);
    newSlides.splice(toIndex, 0, moved);
    const reindexed = newSlides.map((s, idx) => ({ ...s, slideNumber: idx + 1 }));
    setCurrentProject({ ...currentProject, slides: reindexed });
    setActiveSlideIndex(toIndex);
  };

  // Export PPTX
  const handleDownloadPPTX = async () => {
    if (!currentProject) return;
    setIsExportingPptx(true);
    try {
      await exportToEditablePptx(currentProject);
      confetti({ particleCount: 50, spread: 40 });
    } catch (e) {
      console.error('PPTX export error', e);
    } finally {
      setIsExportingPptx(false);
    }
  };

  // Export PDF
  const handleDownloadPDF = async () => {
    if (!currentProject) return;
    setIsExportingPdf(true);
    try {
      await exportToPdf(currentProject);
      confetti({ particleCount: 40, spread: 35 });
    } catch (e) {
      console.error('PDF export error', e);
    } finally {
      setIsExportingPdf(false);
    }
  };

  // Export Images ZIP
  const handleDownloadImagesZip = async () => {
    if (!currentProject) return;
    setIsExportingImages(true);
    try {
      await exportToImagesZip(currentProject);
      confetti({ particleCount: 40, spread: 35 });
    } catch (e) {
      console.error('Images zip error', e);
    } finally {
      setIsExportingImages(false);
    }
  };

  // Export Markdown
  const handleDownloadMarkdown = () => {
    if (!currentProject) return;
    exportToMarkdown(currentProject);
    confetti({ particleCount: 40, spread: 35 });
  };

  // Export Interactive HTML
  const handleDownloadInteractiveHtml = () => {
    if (!currentProject) return;
    exportToInteractiveHtml(currentProject);
    confetti({ particleCount: 40, spread: 35 });
  };

  // Export Speaker Notes Text
  const handleDownloadSpeakerNotes = () => {
    if (!currentProject) return;
    exportSpeakerNotesDoc(currentProject);
    confetti({ particleCount: 40, spread: 35 });
  };

  // Export Single Slide PNG
  const handleDownloadCurrentSlide = async () => {
    if (!currentProject) return;
    await exportSingleSlideImage(currentProject, activeSlideIndex);
    confetti({ particleCount: 40, spread: 35 });
  };

  // Export Handouts PDF
  const handleDownloadHandouts = async () => {
    if (!currentProject) return;
    await exportHandoutsPdf(currentProject);
    confetti({ particleCount: 40, spread: 35 });
  };

  // Share Link
  const handleSharePresentation = () => {
    const shareUrl = `${window.location.origin}/presentation/${currentProject?.id || 'demo'}`;
    navigator.clipboard.writeText(shareUrl);
    setShareLinkCopied(true);
    setTimeout(() => setShareLinkCopied(false), 2500);
  };

  // Filtered Presets
  const filteredPresets = PRESENTATION_PRESETS.filter(preset => {
    const matchesCategory = presetCategory === 'all' || preset.category === presetCategory;
    const matchesSearch = !presetSearch ||
      preset.name.toLowerCase().includes(presetSearch.toLowerCase()) ||
      preset.description.toLowerCase().includes(presetSearch.toLowerCase()) ||
      preset.previewHighlights.some(h => h.toLowerCase().includes(presetSearch.toLowerCase()));
    const matchesTag = presetTagFilter === 'all' || preset.tags.includes(presetTagFilter as any);
    return matchesCategory && matchesSearch && matchesTag;
  });

  const selectedPreset = PRESENTATION_PRESETS.find(p => p.id === selectedPresetId) || PRESENTATION_PRESETS[0];
  const activeSlide = currentProject?.slides[activeSlideIndex];

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      
      {/* 1. Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-700 via-purple-700 to-pink-700 text-white p-6 sm:p-8 shadow-xl">
        <div className="absolute -right-10 -bottom-10 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/20 backdrop-blur-md text-white border border-white/20">
              <Presentation className="w-3.5 h-3.5 text-amber-300" />
              <span>AI Presentation Generator</span>
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-400 text-slate-950">
              MAJOR UPDATE
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/30 text-emerald-200 border border-emerald-400/30">
              <Zap className="w-3 h-3" />
              112+ Designer Presets & Real Editable PPTX
            </span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
            Turn Your Ideas and Content into Polished Presentations in Seconds
          </h1>

          <p className="text-xs sm:text-sm text-purple-100/90 leading-relaxed">
            Convert text, notes, research papers, PDFs, or a simple topic into professional widescreen slide decks with auto-detected charts, smart layouts, speaker notes, and genuine editable PowerPoint exports.
          </p>

          {/* Workflow Steps Tabs */}
          <div className="flex flex-wrap items-center gap-2 pt-2">
            {[
              { id: 'input', label: '1. Content Input' },
              { id: 'presets', label: '2. 100+ Presets' },
              { id: 'outline', label: '3. AI Outline' },
              { id: 'editor', label: '4. AI Slide Editor' }
            ].map((st, idx) => (
              <button
                key={st.id}
                onClick={() => {
                  if (st.id === 'editor' && !currentProject) return;
                  if (st.id === 'outline' && generatedOutline.length === 0) return;
                  setStep(st.id as any);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  step === st.id
                    ? 'bg-white text-purple-900 shadow-md scale-105'
                    : 'bg-white/10 text-white/80 hover:bg-white/20'
                }`}
              >
                <span>{st.label}</span>
                {idx < 3 && <ChevronRight className="w-3 h-3 text-white/50" />}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* STEP 1: INPUT & GENERATION SETTINGS */}
      {/* ========================================================================= */}
      {step === 'input' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          
          {/* Natural Language Command Bar */}
          <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-white">
              <Wand2 className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span>What do you want to create?</span>
            </div>

            <div className="relative">
              <input
                type="text"
                value={promptCommand}
                onChange={(e) => {
                  setPromptCommand(e.target.value);
                  setTextInput(e.target.value);
                }}
                placeholder="e.g. Create a 15-slide presentation about artificial intelligence for B.Tech students..."
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/50"
              />
            </div>

            {/* Quick Prompt Chips */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[11px] font-bold text-slate-400 mr-1">Examples:</span>
              {[
                'Create a 15-slide presentation about artificial intelligence for B.Tech students.',
                'Turn this research paper into a conference presentation.',
                'Create an investor pitch from this business plan.',
                'Convert my assignment into a professional presentation.',
                'Create a 10-slide presentation from this PDF.'
              ].map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => handleSelectQuickPrompt(chip)}
                  className="px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/40 dark:hover:bg-purple-900/60 text-purple-700 dark:text-purple-300 border border-purple-200/60 dark:border-purple-800/60 transition-colors truncate max-w-xs"
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>

          {/* 3 Input Tabs: Paste Text | Upload Document | Start with Topic */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left 8 Cols: Input Content Canvas */}
            <div className="lg:col-span-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm space-y-4">
              
              {/* Tabs Switcher */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  {[
                    { id: 'text', label: 'Paste Text', icon: Edit3 },
                    { id: 'document', label: 'Upload Document', icon: Upload },
                    { id: 'topic', label: 'Start With Topic', icon: Lightbulb }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setInputMode(tab.id as any)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                        inputMode === tab.id
                          ? 'bg-brand-600 text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                      }`}
                    >
                      <tab.icon className="w-3.5 h-3.5" />
                      <span>{tab.label}</span>
                    </button>
                  ))}
                </div>

                {/* Counts */}
                <div className="flex items-center gap-3 text-[11px] text-slate-400 font-medium">
                  <span>{wordCount} words</span>
                  <span>&bull;</span>
                  <span>{charCount} characters</span>
                </div>
              </div>

              {/* Mode 1: Paste Text */}
              {inputMode === 'text' && (
                <div className="space-y-2">
                  <textarea
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    rows={12}
                    placeholder="Paste your content, notes, article, assignment, research, or topic here...

ConvertPro AI will automatically identify the main topic, key concepts, data statistics, case studies, and structured slide hierarchy."
                    className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-sans text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/50 resize-none leading-relaxed"
                  />
                </div>
              )}

              {/* Mode 2: Upload Document */}
              {inputMode === 'document' && (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-purple-300 dark:border-purple-800 hover:border-purple-500 rounded-3xl p-12 text-center cursor-pointer transition-all bg-purple-50/20 hover:bg-purple-50/50 dark:bg-purple-950/10 group relative"
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept=".pdf,.docx,.txt,.pptx,.md"
                    onChange={(e) => e.target.files && e.target.files[0] && handleDocumentUpload(e.target.files[0])}
                    className="hidden"
                  />
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center mx-auto mb-3 shadow-md group-hover:scale-110 transition-transform">
                    {isParsingDoc ? <RefreshCw className="w-7 h-7 animate-spin" /> : <Upload className="w-7 h-7" />}
                  </div>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-white mb-1">
                    {isParsingDoc
                      ? 'Extracting Document Text & Sections...'
                      : uploadedDocName
                      ? `Loaded: ${uploadedDocName}`
                      : 'Upload PDF, DOCX, TXT, PPTX, or MD'}
                  </h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
                    Drag and drop your document here. ConvertPro will extract sections, references, and statistics.
                  </p>
                  <button
                    type="button"
                    className="px-4 py-2 rounded-xl bg-brand-600 text-white font-bold text-xs shadow-sm hover:bg-brand-700 transition-colors"
                  >
                    Browse Document
                  </button>
                </div>
              )}

              {/* Mode 3: Start with Topic */}
              {inputMode === 'topic' && (
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Presentation Topic or Core Thesis
                    </label>
                    <input
                      type="text"
                      value={topicInput}
                      onChange={(e) => {
                        setTopicInput(e.target.value);
                        setTextInput(e.target.value);
                      }}
                      placeholder="e.g. Next-Generation Quantum Computing and Cryptography Standards"
                      className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-900 dark:text-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {[
                      'Generative AI in Enterprise Customer Experience',
                      'Clean Energy Grid & Battery Storage Economics',
                      'Cybersecurity Zero-Trust Architecture Blueprint',
                      'Series A SaaS Go-To-Market Pitch Deck'
                    ].map((topic) => (
                      <button
                        key={topic}
                        type="button"
                        onClick={() => {
                          setTopicInput(topic);
                          setTextInput(topic);
                        }}
                        className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-purple-50 dark:hover:bg-purple-950/40 text-left text-slate-700 dark:text-slate-300 font-medium transition-colors border border-slate-200/60 dark:border-slate-700/60"
                      >
                        ⚡ {topic}
                      </button>
                    ))}
                  </div>
                </div>
              )}

            </div>

            {/* Right 4 Cols: Generation Settings Panel */}
            <div className="lg:col-span-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm space-y-5">
              
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                <Sliders className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Generation Settings
                </h3>
              </div>

              {/* Presentation Length */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex justify-between">
                  <span>Slide Count</span>
                  <span className="text-brand-600 font-extrabold">{slideCount === 99 ? `${customSlideCount} Slides` : `${slideCount} Slides`}</span>
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { count: 5, label: '5 slides' },
                    { count: 8, label: '8 slides' },
                    { count: 10, label: '10 slides' },
                    { count: 15, label: '15 slides' },
                    { count: 20, label: '20 slides' },
                    { count: 30, label: '30 slides' }
                  ].map((s) => (
                    <button
                      key={s.count}
                      type="button"
                      onClick={() => setSlideCount(s.count)}
                      className={`py-1.5 px-2 rounded-xl text-xs font-bold transition-all ${
                        slideCount === s.count
                          ? 'bg-brand-600 text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Audience */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Target Audience</label>
                <select
                  value={audience}
                  onChange={(e) => setAudience(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200"
                >
                  <option value="Business">Business & Executives</option>
                  <option value="Corporate">Corporate Board</option>
                  <option value="Students">Students & Academic</option>
                  <option value="Education">Classroom & Teachers</option>
                  <option value="Marketing">Marketing & Clients</option>
                  <option value="Technical">Technical & Developers</option>
                  <option value="Research">Scientific Research</option>
                  <option value="General">General Public</option>
                </select>
              </div>

              {/* Tone */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Tone & Personality</label>
                <select
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200"
                >
                  <option value="Professional">Professional & Polished</option>
                  <option value="Academic">Academic & Scholarly</option>
                  <option value="Executive">Executive & Strategic</option>
                  <option value="Creative">Creative & Bold</option>
                  <option value="Minimal">Minimal & Clean</option>
                  <option value="Persuasive">Persuasive Pitch</option>
                  <option value="Educational">Educational & Engaging</option>
                </select>
              </div>

              {/* Language */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Presentation Language</label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200"
                >
                  <option value="English">English (US/UK)</option>
                  <option value="Hindi">Hindi (हिंदी)</option>
                  <option value="Hinglish">Hinglish (Hindi in Latin script)</option>
                  <option value="Spanish">Spanish (Español)</option>
                  <option value="French">French (Français)</option>
                  <option value="German">German (Deutsch)</option>
                  <option value="Japanese">Japanese (日本語)</option>
                  <option value="Arabic">Arabic (العربية)</option>
                </select>
              </div>

              {/* Proceed Button */}
              <button
                type="button"
                onClick={handleProceedToPresets}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-brand-600 via-purple-600 to-indigo-600 hover:from-brand-700 hover:to-indigo-700 text-white font-extrabold text-xs shadow-md transition-all flex items-center justify-center gap-2 group"
              >
                <span>Choose Style & Preset (100+)</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </button>

            </div>

          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 2: 100+ PRESET TEMPLATE BROWSER */}
      {/* ========================================================================= */}
      {step === 'presets' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          
          {/* Top Filter Bar */}
          <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <Grid className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                  Choose a Presentation Style
                </h3>
                <p className="text-xs text-slate-400">
                  Select from {PRESENTATION_PRESETS.length} hand-crafted presets with unique typography, layout grids, and color schemes.
                </p>
              </div>

              {/* Search input */}
              <div className="relative w-full md:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={presetSearch}
                  onChange={(e) => setPresetSearch(e.target.value)}
                  placeholder="Search 100+ presets..."
                  className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none"
                />
              </div>
            </div>

            {/* Category Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
              {PRESENTATION_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setPresetCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                    presetCategory === cat.id
                      ? 'bg-brand-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Tag Badges */}
            <div className="flex items-center gap-2 pt-1 text-xs">
              <span className="text-slate-400 font-bold text-[10px] uppercase">Filter:</span>
              {['all', 'popular', 'new', 'minimal', 'dark', 'colorful', 'professional'].map((tag) => (
                <button
                  key={tag}
                  onClick={() => setPresetTagFilter(tag)}
                  className={`px-2.5 py-0.5 rounded-md text-[11px] font-semibold transition-colors capitalize ${
                    presetTagFilter === tag
                      ? 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-bold'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  {tag === 'all' ? 'All Styles' : tag}
                </button>
              ))}
            </div>
          </div>

          {/* Presets Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredPresets.map((preset) => {
              const isSelected = selectedPresetId === preset.id;
              const isFav = favoritePresetIds.has(preset.id);

              return (
                <div
                  key={preset.id}
                  onClick={() => setSelectedPresetId(preset.id)}
                  className={`rounded-3xl border transition-all cursor-pointer overflow-hidden flex flex-col justify-between group ${
                    isSelected
                      ? 'border-brand-500 ring-2 ring-brand-500/30 shadow-md bg-white dark:bg-slate-900'
                      : 'border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-400 dark:hover:border-slate-700'
                  }`}
                >
                  {/* Realistic Mini Slide Preview Card */}
                  <div
                    className="p-4 aspect-video relative flex flex-col justify-between overflow-hidden transition-transform group-hover:scale-[1.01]"
                    style={{
                      backgroundColor: preset.theme.backgroundColor,
                      color: preset.theme.textColor
                    }}
                  >
                    {/* Top Accent Strip */}
                    <div
                      className="h-1.5 w-16 rounded-full mb-2"
                      style={{ backgroundColor: preset.theme.accentColor }}
                    />

                    {/* Mini Slide Title & Category Badge */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span
                          className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider"
                          style={{
                            backgroundColor: preset.theme.badgeBg,
                            color: preset.theme.badgeText
                          }}
                        >
                          {preset.category}
                        </span>
                        
                        <button
                          type="button"
                          onClick={(e) => handleToggleFavorite(preset.id, e)}
                          className="p-1 rounded-full text-slate-400 hover:text-amber-400 transition-colors"
                        >
                          <Star className={`w-3.5 h-3.5 ${isFav ? 'fill-amber-400 text-amber-400' : ''}`} />
                        </button>
                      </div>

                      <h4
                        className="text-xs font-black line-clamp-1"
                        style={{ color: preset.theme.textColor }}
                      >
                        {preset.name}
                      </h4>
                    </div>

                    {/* Mini Slide Body Shape Mockup */}
                    <div className="grid grid-cols-3 gap-1.5 my-1">
                      <div
                        className="p-1 rounded-md border text-[8px] leading-tight"
                        style={{
                          backgroundColor: preset.theme.surfaceColor,
                          borderColor: preset.theme.surfaceBorder,
                          color: preset.theme.mutedColor
                        }}
                      >
                        <div className="w-3 h-1 rounded-full mb-1" style={{ backgroundColor: preset.theme.accentColor }} />
                        <span>Insight</span>
                      </div>
                      <div
                        className="p-1 rounded-md border text-[8px] leading-tight"
                        style={{
                          backgroundColor: preset.theme.surfaceColor,
                          borderColor: preset.theme.surfaceBorder,
                          color: preset.theme.mutedColor
                        }}
                      >
                        <div className="w-3 h-1 rounded-full mb-1" style={{ backgroundColor: preset.theme.secondaryColor }} />
                        <span>Metric</span>
                      </div>
                      <div
                        className="p-1 rounded-md border text-[8px] leading-tight"
                        style={{
                          backgroundColor: preset.theme.surfaceColor,
                          borderColor: preset.theme.surfaceBorder,
                          color: preset.theme.mutedColor
                        }}
                      >
                        <div className="w-3 h-1 rounded-full mb-1" style={{ backgroundColor: preset.theme.accentColor }} />
                        <span>Outcome</span>
                      </div>
                    </div>

                    {/* Footer Highlights */}
                    <div className="flex items-center justify-between text-[8px]" style={{ color: preset.theme.mutedColor }}>
                      <span>{preset.theme.fontHeading}</span>
                      <span>16:9 HD</span>
                    </div>
                  </div>

                  {/* Card Description & Action Footer */}
                  <div className="p-4 space-y-3 bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800">
                    <div>
                      <p className="text-xs font-bold text-slate-800 dark:text-white mb-0.5">{preset.name}</p>
                      <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">{preset.description}</p>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center gap-1">
                        {preset.tags.map(t => (
                          <span key={t} className="text-[9px] px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold uppercase">
                            {t}
                          </span>
                        ))}
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleProceedToOutline(preset.id);
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                          isSelected
                            ? 'bg-brand-600 text-white shadow-xs'
                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-brand-50'
                        }`}
                      >
                        Use Preset →
                      </button>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>

          {/* Sticky Bottom Bar for Presets */}
          <div className="sticky bottom-6 z-20 p-4 rounded-3xl bg-slate-900/95 dark:bg-slate-800/95 backdrop-blur-md text-white border border-slate-700 shadow-2xl flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-xl border flex items-center justify-center text-xs font-bold"
                style={{
                  backgroundColor: selectedPreset.theme.backgroundColor,
                  borderColor: selectedPreset.theme.surfaceBorder,
                  color: selectedPreset.theme.textColor
                }}
              >
                16:9
              </div>
              <div>
                <p className="text-xs font-extrabold text-white">Selected Style: {selectedPreset.name}</p>
                <p className="text-[11px] text-slate-400">Ready to synthesize your content into {slideCount === 99 ? customSlideCount : slideCount} structured slides</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleProceedToOutline()}
              className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-brand-500 via-purple-600 to-indigo-600 hover:from-brand-600 hover:to-indigo-700 text-white font-extrabold text-xs shadow-lg flex items-center gap-2"
            >
              <span>Generate Outline →</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 3: AI OUTLINE STRUCTURING & REORDERING */}
      {/* ========================================================================= */}
      {step === 'outline' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          
          <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400 uppercase tracking-wider">
                  AI Structure Review
                </span>
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white mt-1">
                  {projectTitle}
                </h3>
                <p className="text-xs text-slate-400">
                  Review and customize the {generatedOutline.length}-slide presentation outline before rendering visuals.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setStep('presets')}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs"
                >
                  Change Style
                </button>
                <button
                  type="button"
                  onClick={handleGenerateFullSlides}
                  disabled={isAIProcessing}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 via-purple-600 to-indigo-600 text-white font-extrabold text-xs shadow-md flex items-center gap-1.5"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{isAIProcessing ? 'Rendering Slides...' : 'Generate Presentation Slides →'}</span>
                </button>
              </div>
            </div>

            {/* Outline Cards List */}
            <div className="space-y-2.5">
              {generatedOutline.map((item, idx) => (
                <div
                  key={item.id}
                  className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800 flex items-center justify-between gap-4 group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-7 h-7 rounded-xl bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 font-mono font-bold text-xs flex items-center justify-center flex-shrink-0">
                      {idx + 1}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={item.title}
                          onChange={(e) => {
                            const newOutline = [...generatedOutline];
                            newOutline[idx].title = e.target.value;
                            setGeneratedOutline(newOutline);
                          }}
                          className="text-xs sm:text-sm font-bold bg-transparent border-none text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-brand-500 rounded px-1"
                        />
                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-medium capitalize">
                          {item.suggestedLayout.replace('-', ' ')}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 truncate px-1">
                        {item.keyPoints.join(' • ')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => {
                        const newOutline = [...generatedOutline];
                        const temp = newOutline[idx - 1];
                        newOutline[idx - 1] = newOutline[idx];
                        newOutline[idx] = temp;
                        setGeneratedOutline(newOutline);
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-30"
                      title="Move Up"
                    >
                      ▲
                    </button>
                    <button
                      type="button"
                      disabled={idx === generatedOutline.length - 1}
                      onClick={() => {
                        const newOutline = [...generatedOutline];
                        const temp = newOutline[idx + 1];
                        newOutline[idx + 1] = newOutline[idx];
                        newOutline[idx] = temp;
                        setGeneratedOutline(newOutline);
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-30"
                      title="Move Down"
                    >
                      ▼
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setGeneratedOutline(generatedOutline.filter((_, i) => i !== idx));
                      }}
                      className="p-1.5 rounded-lg text-rose-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                      title="Delete Outline Item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Add Slide to Outline */}
            <button
              type="button"
              onClick={() => {
                const newNum = generatedOutline.length + 1;
                setGeneratedOutline(prev => [
                  ...prev,
                  {
                    id: `outline-custom-${Date.now()}`,
                    slideNumber: newNum,
                    title: `Additional Strategic Section ${newNum}`,
                    concept: 'Custom Slide Topic',
                    suggestedLayout: 'cards-3',
                    keyPoints: ['Key Objective', 'Strategic Insight', 'Execution Measure']
                  }
                ]);
              }}
              className="w-full py-2.5 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-brand-500 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-brand-600 transition-colors flex items-center justify-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Add Another Slide to Outline</span>
            </button>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 4: SLIDE-BY-SLIDE AI EDITOR & PREVIEW CANVAS */}
      {/* ========================================================================= */}
      {step === 'editor' && currentProject && (
        <div className="space-y-4 animate-in fade-in duration-150">
          
          {/* Top Actions & Quality Status Header */}
          <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            
            <div className="flex items-center gap-3 min-w-0">
              <span className="p-2.5 rounded-2xl bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400">
                <Presentation className="w-5 h-5" />
              </span>
              <div className="min-w-0">
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white truncate">
                  {currentProject.title}
                </h3>
                <div className="flex items-center gap-2 text-[11px] text-slate-400">
                  <span>{currentProject.slides.length} Slides</span>
                  <span>&bull;</span>
                  <span>{currentProject.preset.name}</span>
                </div>
              </div>
            </div>

            {/* Actions Bar: Quality Check, Fullscreen, Export Options */}
            <div className="flex flex-wrap items-center gap-2">
              
              {/* Quality Score Badge */}
              {qualityReport && (
                <button
                  type="button"
                  onClick={() => setIsQualityCheckOpen(true)}
                  className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 text-xs font-bold flex items-center gap-1.5"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Quality: {qualityReport.score}%</span>
                </button>
              )}

              {/* Fullscreen Presenter */}
              <button
                type="button"
                onClick={() => setIsFullscreenPreview(true)}
                className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5"
              >
                <Play className="w-3.5 h-3.5 text-brand-600" />
                <span>Present</span>
              </button>

              {/* Master Multi-Format Download Center Button */}
              <button
                type="button"
                onClick={() => setIsExportModalOpen(true)}
                className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-brand-600 via-purple-600 to-indigo-600 hover:from-brand-700 hover:to-indigo-700 text-white font-extrabold text-xs shadow-md flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Options (8 Formats)</span>
              </button>

              {/* Quick PPTX Download */}
              <button
                type="button"
                onClick={handleDownloadPPTX}
                disabled={isExportingPptx}
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300"
                title="Quick Download PPTX"
              >
                <Presentation className="w-4 h-4 text-orange-500" />
              </button>

              {/* Quick PDF Download */}
              <button
                type="button"
                onClick={handleDownloadPDF}
                disabled={isExportingPdf}
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300"
                title="Quick Download PDF"
              >
                <FileText className="w-4 h-4 text-rose-500" />
              </button>

              {/* Quick Single Slide PNG */}
              <button
                type="button"
                onClick={handleDownloadCurrentSlide}
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300"
                title="Download Current Slide PNG"
              >
                <ImageIcon className="w-4 h-4 text-emerald-500" />
              </button>

              {/* Share Link */}
              <button
                type="button"
                onClick={handleSharePresentation}
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300"
                title="Copy Share Link"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>

          </div>

          {/* 3-Column Studio Layout: Left Thumbnails | Center 16:9 Canvas | Right AI Assistant */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            
            {/* 1. Left Thumbnail Rail (3 Cols) */}
            <div className="lg:col-span-3 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 shadow-sm flex flex-col justify-between max-h-[760px] overflow-y-auto space-y-3">
              <div className="space-y-2">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Slides ({currentProject.slides.length})
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const newSlideNum = currentProject.slides.length + 1;
                      const newSlide: SlideData = {
                        id: `slide-new-${Date.now()}`,
                        slideNumber: newSlideNum,
                        title: `Section ${newSlideNum}`,
                        subtitle: 'Key Concept & Impact',
                        layout: 'cards-3',
                        content: {
                          headline: 'Key Dimensions & Insights',
                          cards: [
                            { title: 'Core Dimension', desc: 'Detailed breakdown of foundational mechanism.', iconName: 'Layers', highlight: 'Phase 01' },
                            { title: 'Implementation', desc: 'Practical execution and deployment dynamics.', iconName: 'Cpu', highlight: 'Phase 02' },
                            { title: 'Expected Outcome', desc: 'Direct impact and verifiable results.', iconName: 'TrendingUp', highlight: 'Phase 03' }
                          ]
                        },
                        speakerNotes: 'Walk the audience through these key focal points.'
                      };
                      setCurrentProject({
                        ...currentProject,
                        slides: [...currentProject.slides, newSlide]
                      });
                      setActiveSlideIndex(currentProject.slides.length);
                    }}
                    className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-brand-50 text-brand-600 text-xs font-bold flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Slide</span>
                  </button>
                </div>

                {/* Thumbnails */}
                <div className="space-y-2">
                  {currentProject.slides.map((s, idx) => (
                    <div
                      key={s.id}
                      onClick={() => setActiveSlideIndex(idx)}
                      className={`p-2.5 rounded-2xl border transition-all cursor-pointer flex items-center gap-2.5 group ${
                        activeSlideIndex === idx
                          ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-950/40 ring-1 ring-brand-500'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-400 bg-slate-50/50 dark:bg-slate-800/40'
                      }`}
                    >
                      <span className="w-5 h-5 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-mono text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                        {idx + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                          {s.title}
                        </p>
                        <p className="text-[10px] text-slate-400 truncate capitalize">
                          {s.layout.replace('-', ' ')}
                        </p>
                      </div>

                      {/* Hover action shortcuts */}
                      <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDuplicateSlide(idx);
                          }}
                          className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500"
                          title="Duplicate"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                        {currentProject.slides.length > 1 && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteSlide(idx);
                            }}
                            className="p-1 rounded hover:bg-rose-100 dark:hover:bg-rose-950 text-rose-500"
                            title="Delete"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 2. Center 16:9 Slide Canvas (6 Cols) */}
            <div className="lg:col-span-6 space-y-4">
              {activeSlide && (
                <div
                  className="rounded-3xl p-6 sm:p-8 aspect-video shadow-xl border flex flex-col justify-between relative overflow-hidden transition-all duration-300"
                  style={{
                    backgroundColor: currentProject.preset.theme.backgroundColor,
                    borderColor: currentProject.preset.theme.surfaceBorder,
                    color: currentProject.preset.theme.textColor
                  }}
                >
                  {/* Top Bar with Accent & Layout Quick Switcher */}
                  <div className="flex items-center justify-between mb-3">
                    <div
                      className="h-2 w-28 rounded-full"
                      style={{ backgroundColor: currentProject.preset.theme.accentColor }}
                    />

                    {/* Canvas Controls: Move Up, Move Down, Duplicate, Delete */}
                    <div className="flex items-center gap-1 bg-black/20 backdrop-blur-md rounded-xl p-1">
                      <button
                        type="button"
                        disabled={activeSlideIndex === 0}
                        onClick={() => handleMoveSlide(activeSlideIndex, activeSlideIndex - 1)}
                        className="p-1 rounded text-white/70 hover:text-white disabled:opacity-30"
                        title="Move Slide Up"
                      >
                        <MoveUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={activeSlideIndex === currentProject.slides.length - 1}
                        onClick={() => handleMoveSlide(activeSlideIndex, activeSlideIndex + 1)}
                        className="p-1 rounded text-white/70 hover:text-white disabled:opacity-30"
                        title="Move Slide Down"
                      >
                        <MoveDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDuplicateSlide(activeSlideIndex)}
                        className="p-1 rounded text-white/70 hover:text-white"
                        title="Duplicate Slide"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      {currentProject.slides.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleDeleteSlide(activeSlideIndex)}
                          className="p-1 rounded text-rose-400 hover:text-rose-300"
                          title="Delete Slide"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Slide Header: Editable In-place */}
                  <div className="space-y-1 mb-3">
                    <input
                      type="text"
                      value={activeSlide.title}
                      onChange={(e) => {
                        const updated = [...currentProject.slides];
                        updated[activeSlideIndex].title = e.target.value;
                        setCurrentProject({ ...currentProject, slides: updated });
                      }}
                      className="w-full text-xl sm:text-2xl font-black bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-brand-400 rounded px-1"
                      style={{ color: currentProject.preset.theme.textColor }}
                    />
                    <input
                      type="text"
                      value={activeSlide.subtitle || ''}
                      placeholder="Add slide subtitle or concept..."
                      onChange={(e) => {
                        const updated = [...currentProject.slides];
                        updated[activeSlideIndex].subtitle = e.target.value;
                        setCurrentProject({ ...currentProject, slides: updated });
                      }}
                      className="w-full text-xs font-medium bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-brand-400 rounded px-1"
                      style={{ color: currentProject.preset.theme.mutedColor }}
                    />
                  </div>

                  {/* Dynamic Layout Rendering in Canvas with Full In-Place Editing */}
                  <div className="flex-1 flex flex-col justify-center my-auto">
                    
                    {/* Hero Layout with Visual Media Split */}
                    {activeSlide.layout === 'hero' && (
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                        <div className="md:col-span-7 space-y-3">
                          <textarea
                            value={activeSlide.content.headline || ''}
                            rows={2}
                            onChange={(e) => {
                              const updated = [...currentProject.slides];
                              updated[activeSlideIndex].content.headline = e.target.value;
                              setCurrentProject({ ...currentProject, slides: updated });
                            }}
                            className="w-full text-sm sm:text-base font-semibold leading-relaxed bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-brand-400 rounded p-1 resize-none"
                            style={{ color: currentProject.preset.theme.textColor }}
                          />

                          {activeSlide.content.cards && (
                            <div className="grid grid-cols-3 gap-2">
                              {activeSlide.content.cards.map((c, cIdx) => (
                                <div
                                  key={cIdx}
                                  className="p-2.5 rounded-xl border text-[10px] space-y-0.5"
                                  style={{
                                    backgroundColor: currentProject.preset.theme.surfaceColor,
                                    borderColor: currentProject.preset.theme.surfaceBorder
                                  }}
                                >
                                  <input
                                    type="text"
                                    value={c.title}
                                    onChange={(e) => {
                                      const updated = [...currentProject.slides];
                                      if (updated[activeSlideIndex].content.cards) {
                                        updated[activeSlideIndex].content.cards![cIdx].title = e.target.value;
                                        setCurrentProject({ ...currentProject, slides: updated });
                                      }
                                    }}
                                    className="w-full font-bold text-[10px] bg-transparent border-none focus:outline-none"
                                    style={{ color: currentProject.preset.theme.accentColor }}
                                  />
                                  <input
                                    type="text"
                                    value={c.desc}
                                    onChange={(e) => {
                                      const updated = [...currentProject.slides];
                                      if (updated[activeSlideIndex].content.cards) {
                                        updated[activeSlideIndex].content.cards![cIdx].desc = e.target.value;
                                        setCurrentProject({ ...currentProject, slides: updated });
                                      }
                                    }}
                                    className="w-full text-[9px] bg-transparent border-none focus:outline-none"
                                    style={{ color: currentProject.preset.theme.mutedColor }}
                                  />
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Visual Right Column */}
                        <div className="md:col-span-5 h-44 rounded-2xl overflow-hidden relative shadow-md border group" style={{ borderColor: currentProject.preset.theme.surfaceBorder }}>
                          {activeSlide.visual?.svgDataUri ? (
                            <img src={activeSlide.visual.svgDataUri} alt={activeSlide.visual.altText} className="w-full h-full object-contain p-2 bg-slate-900/40" />
                          ) : activeSlide.visual?.imageUrl ? (
                            <img src={activeSlide.visual.imageUrl} alt={activeSlide.visual?.altText || 'Hero Visual'} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-slate-800 text-slate-400">
                              <Sparkles className="w-8 h-8 opacity-50" />
                            </div>
                          )}
                          <div className="absolute top-2 right-2">
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-white/90 uppercase tracking-wider">
                              {activeSlide.visual?.type.replace('_', ' ') || 'Hero Visual'}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 3-Card / 4-Card Layout */}
                    {(activeSlide.layout === 'cards-3' || activeSlide.layout === 'cards-4') && activeSlide.content.cards && (
                      <div className={`grid ${activeSlide.layout === 'cards-4' ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-1 sm:grid-cols-3'} gap-3`}>
                        {activeSlide.content.cards.map((c, cIdx) => (
                          <div
                            key={cIdx}
                            className="p-3.5 rounded-2xl border space-y-1.5"
                            style={{
                              backgroundColor: currentProject.preset.theme.surfaceColor,
                              borderColor: currentProject.preset.theme.surfaceBorder
                            }}
                          >
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded" style={{ backgroundColor: currentProject.preset.theme.badgeBg, color: currentProject.preset.theme.badgeText }}>
                              {c.highlight || `Point 0${cIdx + 1}`}
                            </span>
                            <input
                              type="text"
                              value={c.title}
                              onChange={(e) => {
                                const updated = [...currentProject.slides];
                                if (updated[activeSlideIndex].content.cards) {
                                  updated[activeSlideIndex].content.cards![cIdx].title = e.target.value;
                                  setCurrentProject({ ...currentProject, slides: updated });
                                }
                              }}
                              className="w-full font-bold text-xs bg-transparent border-none focus:outline-none"
                              style={{ color: currentProject.preset.theme.textColor }}
                            />
                            <textarea
                              value={c.desc}
                              rows={2}
                              onChange={(e) => {
                                const updated = [...currentProject.slides];
                                if (updated[activeSlideIndex].content.cards) {
                                  updated[activeSlideIndex].content.cards![cIdx].desc = e.target.value;
                                  setCurrentProject({ ...currentProject, slides: updated });
                                }
                              }}
                              className="w-full text-[11px] leading-relaxed bg-transparent border-none focus:outline-none resize-none"
                              style={{ color: currentProject.preset.theme.mutedColor }}
                            />
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Split Comparison Layout */}
                    {activeSlide.layout === 'split-comparison' && activeSlide.content.comparison && (
                      <div className="grid grid-cols-2 gap-4">
                        <div
                          className="p-4 rounded-2xl border space-y-2"
                          style={{ backgroundColor: currentProject.preset.theme.surfaceColor, borderColor: currentProject.preset.theme.surfaceBorder }}
                        >
                          <input
                            type="text"
                            value={activeSlide.content.comparison.leftTitle}
                            onChange={(e) => {
                              const updated = [...currentProject.slides];
                              if (updated[activeSlideIndex].content.comparison) {
                                updated[activeSlideIndex].content.comparison!.leftTitle = e.target.value;
                                setCurrentProject({ ...currentProject, slides: updated });
                              }
                            }}
                            className="w-full font-bold text-xs text-rose-500 bg-transparent border-none focus:outline-none"
                          />
                          <div className="space-y-1 text-[11px]" style={{ color: currentProject.preset.theme.mutedColor }}>
                            {activeSlide.content.comparison.leftItems.map((it, idx) => (
                              <input
                                key={idx}
                                type="text"
                                value={it}
                                onChange={(e) => {
                                  const updated = [...currentProject.slides];
                                  if (updated[activeSlideIndex].content.comparison) {
                                    updated[activeSlideIndex].content.comparison!.leftItems[idx] = e.target.value;
                                    setCurrentProject({ ...currentProject, slides: updated });
                                  }
                                }}
                                className="w-full bg-transparent border-none focus:outline-none text-[11px]"
                              />
                            ))}
                          </div>
                        </div>
                        <div
                          className="p-4 rounded-2xl border space-y-2 ring-1 ring-emerald-500/50"
                          style={{ backgroundColor: currentProject.preset.theme.surfaceColor, borderColor: currentProject.preset.theme.accentColor }}
                        >
                          <input
                            type="text"
                            value={activeSlide.content.comparison.rightTitle}
                            onChange={(e) => {
                              const updated = [...currentProject.slides];
                              if (updated[activeSlideIndex].content.comparison) {
                                updated[activeSlideIndex].content.comparison!.rightTitle = e.target.value;
                                setCurrentProject({ ...currentProject, slides: updated });
                              }
                            }}
                            className="w-full font-bold text-xs text-emerald-500 bg-transparent border-none focus:outline-none"
                          />
                          <div className="space-y-1 text-[11px]" style={{ color: currentProject.preset.theme.textColor }}>
                            {activeSlide.content.comparison.rightItems.map((it, idx) => (
                              <input
                                key={idx}
                                type="text"
                                value={it}
                                onChange={(e) => {
                                  const updated = [...currentProject.slides];
                                  if (updated[activeSlideIndex].content.comparison) {
                                    updated[activeSlideIndex].content.comparison!.rightItems[idx] = e.target.value;
                                    setCurrentProject({ ...currentProject, slides: updated });
                                  }
                                }}
                                className="w-full bg-transparent border-none focus:outline-none text-[11px]"
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Stats Grid Layout with Telemetry Visual */}
                    {activeSlide.layout === 'stats-grid' && activeSlide.content.stats && (
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                        <div className="md:col-span-7 grid grid-cols-2 gap-3">
                          {activeSlide.content.stats.map((st, idx) => (
                            <div
                              key={idx}
                              className="p-3.5 rounded-2xl border flex flex-col justify-between"
                              style={{ backgroundColor: currentProject.preset.theme.surfaceColor, borderColor: currentProject.preset.theme.surfaceBorder }}
                            >
                              <input
                                type="text"
                                value={st.value}
                                onChange={(e) => {
                                  const updated = [...currentProject.slides];
                                  if (updated[activeSlideIndex].content.stats) {
                                    updated[activeSlideIndex].content.stats![idx].value = e.target.value;
                                    setCurrentProject({ ...currentProject, slides: updated });
                                  }
                                }}
                                className="text-2xl font-black bg-transparent border-none focus:outline-none"
                                style={{ color: currentProject.preset.theme.accentColor }}
                              />
                              <input
                                type="text"
                                value={st.label}
                                onChange={(e) => {
                                  const updated = [...currentProject.slides];
                                  if (updated[activeSlideIndex].content.stats) {
                                    updated[activeSlideIndex].content.stats![idx].label = e.target.value;
                                    setCurrentProject({ ...currentProject, slides: updated });
                                  }
                                }}
                                className="text-[11px] font-bold bg-transparent border-none focus:outline-none"
                                style={{ color: currentProject.preset.theme.textColor }}
                              />
                            </div>
                          ))}
                        </div>

                        {/* Visual Right Column */}
                        <div className="md:col-span-5 h-44 rounded-2xl overflow-hidden relative shadow-md border" style={{ borderColor: currentProject.preset.theme.surfaceBorder }}>
                          {activeSlide.visual?.svgDataUri ? (
                            <img src={activeSlide.visual.svgDataUri} alt={activeSlide.visual.altText} className="w-full h-full object-contain p-2 bg-slate-900/40" />
                          ) : activeSlide.visual?.imageUrl ? (
                            <img src={activeSlide.visual.imageUrl} alt={activeSlide.visual?.altText || 'Stats Visual'} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-slate-800 text-slate-400">
                              <TrendingUp className="w-8 h-8 opacity-50" />
                            </div>
                          )}
                          <div className="absolute top-2 right-2">
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-white/90 uppercase tracking-wider">
                              Metrics Telemetry
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Quote Layout */}
                    {activeSlide.layout === 'quote' && activeSlide.content.quote && (
                      <div
                        className="p-6 rounded-2xl border text-center space-y-3"
                        style={{ backgroundColor: currentProject.preset.theme.surfaceColor, borderColor: currentProject.preset.theme.surfaceBorder }}
                      >
                        <Quote className="w-6 h-6 mx-auto opacity-50" style={{ color: currentProject.preset.theme.accentColor }} />
                        <textarea
                          value={activeSlide.content.quote.text}
                          rows={2}
                          onChange={(e) => {
                            const updated = [...currentProject.slides];
                            if (updated[activeSlideIndex].content.quote) {
                              updated[activeSlideIndex].content.quote!.text = e.target.value;
                              setCurrentProject({ ...currentProject, slides: updated });
                            }
                          }}
                          className="w-full text-sm font-serif italic text-center bg-transparent border-none focus:outline-none resize-none"
                          style={{ color: currentProject.preset.theme.textColor }}
                        />
                        <div className="flex items-center justify-center gap-1 text-xs font-bold" style={{ color: currentProject.preset.theme.accentColor }}>
                          <span>—</span>
                          <input
                            type="text"
                            value={activeSlide.content.quote.author}
                            onChange={(e) => {
                              const updated = [...currentProject.slides];
                              if (updated[activeSlideIndex].content.quote) {
                                updated[activeSlideIndex].content.quote!.author = e.target.value;
                                setCurrentProject({ ...currentProject, slides: updated });
                              }
                            }}
                            className="bg-transparent border-none focus:outline-none text-center font-bold"
                          />
                        </div>
                      </div>
                    )}

                    {/* Timeline Layout */}
                    {activeSlide.layout === 'timeline' && activeSlide.content.timeline && (
                      <div className="grid grid-cols-3 gap-3">
                        {activeSlide.content.timeline.map((t, idx) => (
                          <div
                            key={idx}
                            className="p-3.5 rounded-2xl border space-y-1"
                            style={{ backgroundColor: currentProject.preset.theme.surfaceColor, borderColor: currentProject.preset.theme.surfaceBorder }}
                          >
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-brand-500/20 text-brand-400 font-mono">
                              {t.step}
                            </span>
                            <input
                              type="text"
                              value={t.title}
                              onChange={(e) => {
                                const updated = [...currentProject.slides];
                                if (updated[activeSlideIndex].content.timeline) {
                                  updated[activeSlideIndex].content.timeline![idx].title = e.target.value;
                                  setCurrentProject({ ...currentProject, slides: updated });
                                }
                              }}
                              className="w-full font-bold text-xs bg-transparent border-none focus:outline-none"
                              style={{ color: currentProject.preset.theme.textColor }}
                            />
                            <textarea
                              value={t.desc}
                              rows={2}
                              onChange={(e) => {
                                const updated = [...currentProject.slides];
                                if (updated[activeSlideIndex].content.timeline) {
                                  updated[activeSlideIndex].content.timeline![idx].desc = e.target.value;
                                  setCurrentProject({ ...currentProject, slides: updated });
                                }
                              }}
                              className="w-full text-[10px] bg-transparent border-none focus:outline-none resize-none"
                              style={{ color: currentProject.preset.theme.mutedColor }}
                            />
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Standard Bullets / QA-Conclusion with 2-Column Visual Split */}
                    {(activeSlide.layout === 'qa-conclusion' || !activeSlide.content.cards && !activeSlide.content.stats && !activeSlide.content.comparison && !activeSlide.content.quote && !activeSlide.content.timeline) && (
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                        <div className="md:col-span-7 space-y-2.5">
                          {(activeSlide.content.bullets || ['Strategic milestone overview', 'Automated high-speed precision', 'Measurable business outcome']).map((b, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: currentProject.preset.theme.accentColor }} />
                              <input
                                type="text"
                                value={b}
                                onChange={(e) => {
                                  const updated = [...currentProject.slides];
                                  if (!updated[activeSlideIndex].content.bullets) {
                                    updated[activeSlideIndex].content.bullets = ['Key Strategic Priority'];
                                  }
                                  updated[activeSlideIndex].content.bullets![idx] = e.target.value;
                                  setCurrentProject({ ...currentProject, slides: updated });
                                }}
                                className="w-full text-xs sm:text-sm font-medium bg-transparent border-none focus:outline-none"
                                style={{ color: currentProject.preset.theme.textColor }}
                              />
                            </div>
                          ))}
                        </div>

                        {/* Visual Right Column */}
                        <div className="md:col-span-5 h-44 rounded-2xl overflow-hidden relative shadow-md border group" style={{ borderColor: currentProject.preset.theme.surfaceBorder }}>
                          {activeSlide.visual?.svgDataUri ? (
                            <img src={activeSlide.visual.svgDataUri} alt={activeSlide.visual.altText} className="w-full h-full object-contain p-2 bg-slate-900/40" />
                          ) : activeSlide.visual?.imageUrl ? (
                            <img src={activeSlide.visual.imageUrl} alt={activeSlide.visual?.altText || 'Slide Visual'} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-slate-800 text-slate-400">
                              <Sparkles className="w-8 h-8 opacity-50" />
                            </div>
                          )}
                          <div className="absolute top-2 right-2">
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-white/90 uppercase tracking-wider">
                              {activeSlide.visual?.type.replace('_', ' ') || 'Architecture Diagram'}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                  </div>

                  {/* Slide Canvas Footer */}
                  <div
                    className="flex items-center justify-between text-[10px] pt-3 border-t"
                    style={{
                      borderColor: currentProject.preset.theme.surfaceBorder,
                      color: currentProject.preset.theme.mutedColor
                    }}
                  >
                    <span>ConvertPro AI Presentation Studio</span>
                    <span>Slide {activeSlideIndex + 1} of {currentProject.slides.length}</span>
                  </div>
                </div>
              )}

              {/* Speaker Notes Drawer */}
              {activeSlide && showSpeakerNotes && (
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-slate-700 dark:text-slate-300 font-bold">
                    <span className="flex items-center gap-1.5">
                      <Volume2 className="w-3.5 h-3.5 text-brand-600" />
                      Speaker Notes (Slide {activeSlideIndex + 1})
                    </span>
                    <button
                      type="button"
                      onClick={() => handleAICommand('speaker_notes')}
                      className="text-[11px] text-brand-600 hover:underline font-semibold"
                    >
                      Regenerate Notes
                    </button>
                  </div>
                  <textarea
                    value={activeSlide.speakerNotes}
                    onChange={(e) => {
                      const updated = [...currentProject.slides];
                      updated[activeSlideIndex].speakerNotes = e.target.value;
                      setCurrentProject({ ...currentProject, slides: updated });
                    }}
                    rows={2}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 resize-none focus:outline-none"
                  />
                </div>
              )}
            </div>

            {/* 3. Right AI Assistant & Layout Panel (3 Cols) */}
            <div className="lg:col-span-3 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 shadow-sm space-y-4">
              
              {/* Style Switcher */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <Wand2 className="w-3.5 h-3.5 text-purple-600" />
                  <span>Smart Style Switcher</span>
                </label>
                <select
                  value={selectedPresetId}
                  onChange={(e) => handleChangePresetTheme(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200"
                >
                  {PRESENTATION_PRESETS.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.category})
                    </option>
                  ))}
                </select>
              </div>

              {/* Layout Switcher */}
              {activeSlide && (
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Slide Layout</label>
                  <select
                    value={activeSlide.layout}
                    onChange={(e) => {
                      const updated = [...currentProject.slides];
                      updated[activeSlideIndex].layout = e.target.value as any;
                      setCurrentProject({ ...currentProject, slides: updated });
                    }}
                    className="w-full px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200"
                  >
                    <option value="hero">Hero Title Layout</option>
                    <option value="cards-3">3-Card Feature Grid</option>
                    <option value="cards-4">4-Card Functional Grid</option>
                    <option value="split-comparison">Problem vs Solution Split</option>
                    <option value="stats-grid">Metrics & Numbers Grid</option>
                    <option value="timeline">Roadmap & Timeline</option>
                    <option value="quote">Executive Quote</option>
                    <option value="qa-conclusion">Summary & Conclusion</option>
                  </select>
                </div>
              )}

              {/* AI Visual Studio & Planner for Active Slide */}
              {activeSlide && (
                <div className="space-y-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      Visual Studio & Planner
                    </span>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 uppercase">
                      {activeSlide.visual?.type.replace('_', ' ') || 'AI Visual'}
                    </span>
                  </div>

                  {/* Visual Type Selector */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">Visual Format</label>
                    <select
                      value={activeSlide.visual?.type || 'diagram'}
                      onChange={(e) => handleUpdateSlideVisual(e.target.value as VisualType)}
                      className="w-full px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200"
                    >
                      <option value="diagram">📐 Vector Architecture Diagram</option>
                      <option value="process_workflow">🔄 Process Workflow Flowchart</option>
                      <option value="hero_image">🖼️ 16:9 High-Res Hero Image</option>
                      <option value="text_image_split">🎨 Side-by-Side Split Visual</option>
                      <option value="illustration">✨ 3D Conceptual Illustration</option>
                      <option value="stats_grid">📊 Telemetry & Metric Grid</option>
                      <option value="timeline">📈 Phased Timeline Graphic</option>
                      <option value="comparison">⚖️ Comparison Matrix Graphic</option>
                      <option value="cards_grid">🗂️ Card Grid</option>
                    </select>
                  </div>

                  {/* Visual Prompt Editor */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">AI Visual Prompt</label>
                    <textarea
                      value={activeSlide.visual?.prompt || ''}
                      rows={2}
                      onChange={(e) => {
                        const updated = [...currentProject.slides];
                        if (updated[activeSlideIndex].visual) {
                          updated[activeSlideIndex].visual!.prompt = e.target.value;
                          setCurrentProject({ ...currentProject, slides: updated });
                        }
                      }}
                      placeholder="Prompt defining this slide's visual..."
                      className="w-full p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-[11px] text-slate-800 dark:text-slate-200 resize-none focus:outline-none"
                    />
                  </div>

                  {/* Visual Preview Thumbnail & Regenerate Button */}
                  <div className="flex items-center gap-2">
                    {activeSlide.visual?.imageUrl && (
                      <img
                        src={activeSlide.visual.imageUrl}
                        alt="Slide visual"
                        className="w-12 h-10 rounded-lg object-cover border border-slate-200 dark:border-slate-700 shadow-xs"
                      />
                    )}
                    <button
                      type="button"
                      onClick={() => handleUpdateSlideVisual(activeSlide.visual?.type || 'diagram')}
                      className="flex-1 py-1.5 px-3 rounded-xl bg-purple-50 dark:bg-purple-950/50 hover:bg-purple-100 text-purple-700 dark:text-purple-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors border border-purple-200/60 dark:border-purple-800/60"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Regenerate Visual</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Free-form Custom AI Copilot Input */}
              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  AI Slide Copilot
                </span>
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={customAIPrompt}
                    onChange={(e) => setCustomAIPrompt(e.target.value)}
                    placeholder="e.g. Translate to Spanish, add stats..."
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && customAIPrompt.trim()) {
                        handleAICommand(customAIPrompt);
                      }
                    }}
                    className="w-full px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none"
                  />
                  <button
                    type="button"
                    disabled={!customAIPrompt.trim() || isAIProcessing}
                    onClick={() => handleAICommand(customAIPrompt)}
                    className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs disabled:opacity-40"
                  >
                    Run
                  </button>
                </div>
              </div>

              {/* AI One-Click Action Commands */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Quick AI Actions
                </span>

                <div className="grid grid-cols-1 gap-1 text-xs">
                  {[
                    { action: 'simplify' as const, label: '⚡ Make this slide simpler' },
                    { action: 'expand' as const, label: '📝 Add more details' },
                    { action: 'professionalize' as const, label: '👔 Make it executive tone' },
                    { action: 'diagram' as const, label: '📐 Convert into 3-card diagram' },
                    { action: 'add_stats' as const, label: '📊 Add statistical metrics' },
                    { action: 'shorten' as const, label: '✂️ Shorten text density' }
                  ].map(cmd => (
                    <button
                      key={cmd.action}
                      type="button"
                      disabled={isAIProcessing}
                      onClick={() => handleAICommand(cmd.action)}
                      className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 hover:bg-purple-50 dark:hover:bg-purple-950/40 text-left font-medium text-slate-700 dark:text-slate-300 text-xs transition-colors border border-slate-200/50 dark:border-slate-700/50"
                    >
                      <span>{cmd.label}</span>
                    </button>
                  ))}
                </div>
              </div>

            </div>

          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* FULLSCREEN PRESENTATION PREVIEW MODAL */}
      {/* ========================================================================= */}
      {isFullscreenPreview && currentProject && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col justify-between p-6 sm:p-12 animate-in fade-in duration-200">
          
          {/* Top Controls */}
          <div className="flex items-center justify-between text-white/80">
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs font-bold bg-white/10 px-3 py-1.5 rounded-xl">
                Slide {activeSlideIndex + 1} / {currentProject.slides.length}
              </span>
              <span className="font-mono text-xs text-amber-300 bg-amber-500/20 border border-amber-500/30 px-3 py-1.5 rounded-xl flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                <span>{formatTimer(presenterElapsedSecs)}</span>
              </span>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs text-white/60">Use Arrow Keys ← →, Space, or N / P</span>
              <button
                type="button"
                onClick={() => setIsFullscreenPreview(false)}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Fullscreen Slide Canvas */}
          <div className="flex-1 flex items-center justify-center my-6">
            <div
              className="w-full max-w-6xl aspect-video rounded-3xl p-8 sm:p-12 shadow-2xl flex flex-col justify-between border relative overflow-hidden transition-all duration-300"
              style={{
                backgroundColor: currentProject.preset.theme.backgroundColor,
                borderColor: currentProject.preset.theme.surfaceBorder,
                color: currentProject.preset.theme.textColor
              }}
            >
              {/* Header Zone */}
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <span
                    className="text-[10px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-full border"
                    style={{
                      backgroundColor: currentProject.preset.theme.surfaceColor,
                      borderColor: currentProject.preset.theme.surfaceBorder,
                      color: currentProject.preset.theme.accentColor
                    }}
                  >
                    {activeSlideIndex === 0
                      ? '⚡ EXECUTIVE BRIEFING // 2025'
                      : `SLIDE ${String(activeSlideIndex + 1).padStart(2, '0')} // ${currentProject.preset.name.toUpperCase()}`}
                  </span>
                  <div className="h-1 flex-1 rounded-full opacity-30" style={{ backgroundColor: currentProject.preset.theme.accentColor }} />
                </div>
                <h2 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
                  {currentProject.slides[activeSlideIndex]?.title}
                </h2>
                {currentProject.slides[activeSlideIndex]?.subtitle && (
                  <p className="text-xs sm:text-sm font-medium opacity-80" style={{ color: currentProject.preset.theme.mutedColor }}>
                    {currentProject.slides[activeSlideIndex]?.subtitle}
                  </p>
                )}
              </div>

              {/* Dynamic Body Layout */}
              <div className="my-auto py-2">
                {/* 1. Hero Title Layout */}
                {(activeSlideIndex === 0 || currentProject.slides[activeSlideIndex]?.layout === 'hero') && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                    {(
                      currentProject.slides[activeSlideIndex]?.content.cards || [
                        { title: 'Audience Focus', desc: `${currentProject.audience || 'Executive Stakeholders'} alignment`, highlight: 'ALIGNMENT' },
                        { title: 'Strategic Tone', desc: `${currentProject.tone || 'Authoritative'} synthesis & delivery`, highlight: 'PURPOSE' },
                        { title: 'Executive Scope', desc: 'Comprehensive domain intelligence & roadmap', highlight: 'ROADMAP' }
                      ]
                    ).slice(0, 3).map((c, i) => (
                      <div
                        key={i}
                        className="p-5 rounded-2xl border relative overflow-hidden transition-all hover:scale-[1.02] shadow-lg flex flex-col justify-between"
                        style={{
                          backgroundColor: currentProject.preset.theme.surfaceColor,
                          borderColor: currentProject.preset.theme.surfaceBorder
                        }}
                      >
                        <div className="h-1.5 w-full absolute top-0 left-0" style={{ backgroundColor: currentProject.preset.theme.accentColor }} />
                        <div className="space-y-2 mt-1">
                          <span
                            className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full inline-block"
                            style={{
                              backgroundColor: `${currentProject.preset.theme.accentColor}15`,
                              color: currentProject.preset.theme.accentColor
                            }}
                          >
                            {c.highlight || `FOCUS 0${i + 1}`}
                          </span>
                          <h4 className="text-base font-bold" style={{ color: currentProject.preset.theme.textColor }}>{c.title}</h4>
                          <p className="text-xs leading-relaxed" style={{ color: currentProject.preset.theme.mutedColor }}>{c.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* 2. Split-Comparison Layout */}
                {activeSlideIndex !== 0 && currentProject.slides[activeSlideIndex]?.layout === 'split-comparison' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {/* Left: Traditional / Challenges */}
                    <div
                      className="p-6 rounded-2xl border relative overflow-hidden shadow-lg space-y-3"
                      style={{
                        backgroundColor: currentProject.preset.theme.surfaceColor,
                        borderColor: 'rgba(244, 63, 94, 0.3)'
                      }}
                    >
                      <div className="h-1.5 w-full absolute top-0 left-0 bg-rose-500" />
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black uppercase tracking-wider text-rose-400 bg-rose-500/10 px-2.5 py-1 rounded-lg border border-rose-500/20">
                          {currentProject.slides[activeSlideIndex]?.content.comparison?.leftTitle || '✕ CHALLENGES & BOTTLENECKS'}
                        </span>
                      </div>
                      <div className="space-y-2.5 pt-1">
                        {currentProject.slides[activeSlideIndex]?.content.comparison?.leftItems.slice(0, 4).map((it, idx) => (
                          <div key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm">
                            <span className="text-rose-400 font-bold flex-shrink-0">✕</span>
                            <span style={{ color: currentProject.preset.theme.mutedColor }}>{it}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Right: AI-Powered Advantage */}
                    <div
                      className="p-6 rounded-2xl border relative overflow-hidden shadow-lg space-y-3"
                      style={{
                        backgroundColor: currentProject.preset.theme.surfaceColor,
                        borderColor: 'rgba(16, 185, 129, 0.3)'
                      }}
                    >
                      <div className="h-1.5 w-full absolute top-0 left-0 bg-emerald-500" />
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                          {currentProject.slides[activeSlideIndex]?.content.comparison?.rightTitle || '✓ AI-POWERED SOLUTION'}
                        </span>
                      </div>
                      <div className="space-y-2.5 pt-1">
                        {currentProject.slides[activeSlideIndex]?.content.comparison?.rightItems.slice(0, 4).map((it, idx) => (
                          <div key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm">
                            <span className="text-emerald-400 font-bold flex-shrink-0">✓</span>
                            <span style={{ color: currentProject.preset.theme.textColor }}>{it}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. Timeline / Implementation Roadmap Layout */}
                {activeSlideIndex !== 0 && currentProject.slides[activeSlideIndex]?.layout === 'timeline' && (
                  <div className="space-y-4">
                    <div className="h-1.5 w-full rounded-full overflow-hidden bg-slate-800">
                      <div className="h-full rounded-full" style={{ width: '75%', backgroundColor: currentProject.preset.theme.accentColor }} />
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      {(currentProject.slides[activeSlideIndex]?.content.timeline || []).slice(0, 4).map((step, idx) => (
                        <div
                          key={idx}
                          className="p-4 rounded-2xl border relative overflow-hidden shadow-md flex flex-col justify-between"
                          style={{
                            backgroundColor: currentProject.preset.theme.surfaceColor,
                            borderColor: currentProject.preset.theme.surfaceBorder
                          }}
                        >
                          <div className="h-1 w-full absolute top-0 left-0" style={{ backgroundColor: currentProject.preset.theme.accentColor }} />
                          <div className="space-y-1.5">
                            <span
                              className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full inline-block"
                              style={{
                                backgroundColor: `${currentProject.preset.theme.accentColor}15`,
                                color: currentProject.preset.theme.accentColor
                              }}
                            >
                              {step.step || `PHASE 0${idx + 1}`}
                            </span>
                            <h5 className="text-xs sm:text-sm font-bold" style={{ color: currentProject.preset.theme.textColor }}>{step.title}</h5>
                            <p className="text-[11px] sm:text-xs leading-relaxed" style={{ color: currentProject.preset.theme.mutedColor }}>{step.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 4. Stats Grid Layout */}
                {activeSlideIndex !== 0 && currentProject.slides[activeSlideIndex]?.layout === 'stats-grid' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
                    {(currentProject.slides[activeSlideIndex]?.content.stats || []).slice(0, 4).map((st, i) => (
                      <div
                        key={i}
                        className="p-6 rounded-2xl border relative overflow-hidden shadow-lg"
                        style={{
                          backgroundColor: currentProject.preset.theme.surfaceColor,
                          borderColor: currentProject.preset.theme.surfaceBorder
                        }}
                      >
                        <div className="h-1.5 w-full absolute top-0 left-0" style={{ backgroundColor: currentProject.preset.theme.accentColor }} />
                        <p className="text-3xl sm:text-4xl font-black mt-2" style={{ color: currentProject.preset.theme.accentColor }}>{st.value}</p>
                        <p className="text-xs sm:text-sm font-bold mt-2" style={{ color: currentProject.preset.theme.textColor }}>{st.label}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* 5. Standard Cards / Grid Layout (Default) */}
                {activeSlideIndex !== 0 &&
                  currentProject.slides[activeSlideIndex]?.layout !== 'split-comparison' &&
                  currentProject.slides[activeSlideIndex]?.layout !== 'timeline' &&
                  currentProject.slides[activeSlideIndex]?.layout !== 'stats-grid' && (
                    <div
                      className={`grid gap-5 ${
                        (currentProject.slides[activeSlideIndex]?.content.cards?.length || 3) >= 4
                          ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-4'
                          : (currentProject.slides[activeSlideIndex]?.content.cards?.length || 3) === 2
                          ? 'grid-cols-1 sm:grid-cols-2'
                          : 'grid-cols-1 sm:grid-cols-3'
                      }`}
                    >
                      {(
                        currentProject.slides[activeSlideIndex]?.content.cards ||
                        (currentProject.slides[activeSlideIndex]?.content.bullets || []).map((b, bIdx) => ({
                          title: `Core Capability 0${bIdx + 1}`,
                          desc: b,
                          highlight: 'CAPABILITY'
                        }))
                      ).slice(0, 4).map((c, i) => (
                        <div
                          key={i}
                          className="p-5 rounded-2xl border relative overflow-hidden shadow-lg flex flex-col justify-between transition-all hover:scale-[1.01]"
                          style={{
                            backgroundColor: currentProject.preset.theme.surfaceColor,
                            borderColor: currentProject.preset.theme.surfaceBorder
                          }}
                        >
                          <div className="h-1.5 w-full absolute top-0 left-0" style={{ backgroundColor: currentProject.preset.theme.accentColor }} />
                          <div className="space-y-2 mt-1">
                            <span
                              className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full inline-block"
                              style={{
                                backgroundColor: `${currentProject.preset.theme.accentColor}15`,
                                color: currentProject.preset.theme.accentColor
                              }}
                            >
                              {c.highlight || `POINT 0${i + 1}`}
                            </span>
                            <h4 className="text-sm sm:text-base font-bold" style={{ color: currentProject.preset.theme.textColor }}>{c.title}</h4>
                            <p className="text-xs leading-relaxed" style={{ color: currentProject.preset.theme.mutedColor }}>{c.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
              </div>

              {/* Footer Zone */}
              <div
                className="flex items-center justify-between text-[11px] pt-3 border-t"
                style={{
                  borderColor: currentProject.preset.theme.surfaceBorder,
                  color: currentProject.preset.theme.mutedColor
                }}
              >
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: currentProject.preset.theme.accentColor }} />
                  <span>ConvertPro Presentation Studio // {currentProject.title}</span>
                </div>
                <span className="font-mono font-bold">
                  {String(activeSlideIndex + 1).padStart(2, '0')} / {String(currentProject.slides.length).padStart(2, '0')}
                </span>
              </div>
            </div>
          </div>

          {/* Bottom Nav Buttons & Notes Preview */}
          <div className="flex flex-col items-center gap-3">
            {currentProject.slides[activeSlideIndex]?.speakerNotes && (
              <div className="max-w-2xl text-center text-xs text-white/70 bg-white/5 border border-white/10 px-4 py-2 rounded-xl backdrop-blur-md">
                🎙️ <span className="font-semibold text-white/90">Notes:</span> {currentProject.slides[activeSlideIndex]?.speakerNotes}
              </div>
            )}

            <div className="flex items-center justify-center gap-4">
              <button
                type="button"
                disabled={activeSlideIndex === 0}
                onClick={() => setActiveSlideIndex(prev => Math.max(0, prev - 1))}
                className="px-6 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 disabled:opacity-30 text-white font-bold text-xs"
              >
                Previous Slide
              </button>
              <button
                type="button"
                disabled={activeSlideIndex === currentProject.slides.length - 1}
                onClick={() => setActiveSlideIndex(prev => Math.min(currentProject.slides.length - 1, prev + 1))}
                className="px-6 py-2.5 rounded-2xl bg-brand-600 hover:bg-brand-700 disabled:opacity-30 text-white font-bold text-xs shadow-lg"
              >
                Next Slide
              </button>
            </div>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* QUALITY CHECK MODAL */}
      {/* ========================================================================= */}
      {isQualityCheckOpen && qualityReport && currentProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-150">
          <div className="w-full max-w-xl rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-5">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-500" />
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  Presentation Quality & Verification Score
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsQualityCheckOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Score Metric Bar */}
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-emerald-800 dark:text-emerald-300">Overall Presentation Score</p>
                <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{qualityReport.score} / 100</p>
              </div>
              <span className="px-3 py-1 rounded-full bg-emerald-500 text-white text-xs font-bold">
                Executive Ready
              </span>
            </div>

            {/* Recommendations List */}
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {qualityReport.recommendations.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-4">
                  ✓ Perfect balance! No typography or density issues detected.
                </p>
              ) : (
                qualityReport.recommendations.map(rec => (
                  <div
                    key={rec.id}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs gap-3"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-800 dark:text-slate-200">{rec.message}</p>
                    </div>
                    {rec.autoFixable && (
                      <button
                        type="button"
                        onClick={() => {
                          handleAICommand('simplify');
                          setIsQualityCheckOpen(false);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-brand-600 text-white font-bold text-[10px] flex-shrink-0"
                      >
                        Fix Automatically
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>

            <button
              type="button"
              onClick={() => setIsQualityCheckOpen(false)}
              className="w-full py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-xs"
            >
              Close Quality Report
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MULTI-FORMAT EXPORT & DOWNLOAD CENTER MODAL */}
      {/* ========================================================================= */}
      {isExportModalOpen && currentProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-150">
          <div className="w-full max-w-3xl rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-gradient-to-br from-brand-500 to-purple-600 text-white shadow-md">
                  <Download className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                    Export & Download Presentation
                  </h3>
                  <p className="text-xs text-slate-400">
                    Choose from 8 distinct export formats for editing, presenting, sharing, or printing.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsExportModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: 8 Export Options Grid */}
            <div className="p-6 overflow-y-auto space-y-4">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                
                {/* 1. Editable PPTX */}
                <div
                  onClick={() => {
                    handleDownloadPPTX();
                    setIsExportModalOpen(false);
                  }}
                  className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700/80 hover:border-orange-500 dark:hover:border-orange-500 bg-slate-50/60 dark:bg-slate-800/40 hover:bg-orange-50/30 dark:hover:bg-orange-950/20 cursor-pointer transition-all flex flex-col justify-between space-y-3 group shadow-xs hover:shadow-md"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-xl bg-orange-100 dark:bg-orange-950/80 text-orange-600 dark:text-orange-400">
                          <Presentation className="w-4 h-4" />
                        </div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                          PowerPoint Deck (.pptx)
                        </h4>
                      </div>
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-orange-100 dark:bg-orange-950/80 text-orange-700 dark:text-orange-300">
                        Editable Vector
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                      Genuine Microsoft PowerPoint format with editable vector card shapes, text boxes, and slide notes.
                    </p>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 font-semibold">
                    <span>{currentProject.slides.length} Widescreen Slides</span>
                    <span className="text-orange-600 font-bold group-hover:underline flex items-center gap-0.5">
                      Download PPTX →
                    </span>
                  </div>
                </div>

                {/* 2. Vector PDF */}
                <div
                  onClick={() => {
                    handleDownloadPDF();
                    setIsExportModalOpen(false);
                  }}
                  className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700/80 hover:border-rose-500 dark:hover:border-rose-500 bg-slate-50/60 dark:bg-slate-800/40 hover:bg-rose-50/30 dark:hover:bg-rose-950/20 cursor-pointer transition-all flex flex-col justify-between space-y-3 group shadow-xs hover:shadow-md"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-xl bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400">
                          <FileText className="w-4 h-4" />
                        </div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
                          Presentation PDF (.pdf)
                        </h4>
                      </div>
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300">
                        Print & Projector
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                      High-definition 16:9 landscape vector PDF document perfect for offline casting, printing, and client emails.
                    </p>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 font-semibold">
                    <span>1920x1080 Resolution</span>
                    <span className="text-rose-600 font-bold group-hover:underline flex items-center gap-0.5">
                      Download PDF →
                    </span>
                  </div>
                </div>

                {/* 3. Interactive Web HTML */}
                <div
                  onClick={() => {
                    handleDownloadInteractiveHtml();
                    setIsExportModalOpen(false);
                  }}
                  className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700/80 hover:border-cyan-500 dark:hover:border-cyan-500 bg-slate-50/60 dark:bg-slate-800/40 hover:bg-cyan-50/30 dark:hover:bg-cyan-950/20 cursor-pointer transition-all flex flex-col justify-between space-y-3 group shadow-xs hover:shadow-md"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-xl bg-cyan-100 dark:bg-cyan-950/80 text-cyan-600 dark:text-cyan-400">
                          <Globe className="w-4 h-4" />
                        </div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                          Interactive Web Deck (.html)
                        </h4>
                      </div>
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-cyan-100 dark:bg-cyan-950/80 text-cyan-700 dark:text-cyan-300">
                        Self-Contained
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                      Standalone offline web presentation. Open in Chrome/Safari/Edge with keyboard shortcuts (←/→/Space).
                    </p>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 font-semibold">
                    <span>Browser Playable Offline</span>
                    <span className="text-cyan-600 font-bold group-hover:underline flex items-center gap-0.5">
                      Download HTML →
                    </span>
                  </div>
                </div>

                {/* 4. Markdown / Script Outline */}
                <div
                  onClick={() => {
                    handleDownloadMarkdown();
                    setIsExportModalOpen(false);
                  }}
                  className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700/80 hover:border-purple-500 dark:hover:border-purple-500 bg-slate-50/60 dark:bg-slate-800/40 hover:bg-purple-50/30 dark:hover:bg-purple-950/20 cursor-pointer transition-all flex flex-col justify-between space-y-3 group shadow-xs hover:shadow-md"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-xl bg-purple-100 dark:bg-purple-950/80 text-purple-600 dark:text-purple-400">
                          <FileCode className="w-4 h-4" />
                        </div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                          Markdown Presentation (.md)
                        </h4>
                      </div>
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300">
                        Notion / Obsidian
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                      Structured Markdown with slide titles, concept summaries, bullet hierarchies, quotes, and notes.
                    </p>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 font-semibold">
                    <span>Full Script & Content</span>
                    <span className="text-purple-600 font-bold group-hover:underline flex items-center gap-0.5">
                      Download MD →
                    </span>
                  </div>
                </div>

                {/* 5. Speaker Notes Transcript */}
                <div
                  onClick={() => {
                    handleDownloadSpeakerNotes();
                    setIsExportModalOpen(false);
                  }}
                  className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700/80 hover:border-indigo-500 dark:hover:border-indigo-500 bg-slate-50/60 dark:bg-slate-800/40 hover:bg-indigo-50/30 dark:hover:bg-indigo-950/20 cursor-pointer transition-all flex flex-col justify-between space-y-3 group shadow-xs hover:shadow-md"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400">
                          <Volume2 className="w-4 h-4" />
                        </div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                          Speaker Talking Script (.txt)
                        </h4>
                      </div>
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300">
                        Teleprompter Cue
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                      Complete slide-by-slide verbal script with transition cues and audience engagement prompts.
                    </p>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 font-semibold">
                    <span>Formatted Text Transcript</span>
                    <span className="text-indigo-600 font-bold group-hover:underline flex items-center gap-0.5">
                      Download Script →
                    </span>
                  </div>
                </div>

                {/* 6. All Slides PNG Images ZIP */}
                <div
                  onClick={() => {
                    handleDownloadImagesZip();
                    setIsExportModalOpen(false);
                  }}
                  className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700/80 hover:border-emerald-500 dark:hover:border-emerald-500 bg-slate-50/60 dark:bg-slate-800/40 hover:bg-emerald-50/30 dark:hover:bg-emerald-950/20 cursor-pointer transition-all flex flex-col justify-between space-y-3 group shadow-xs hover:shadow-md"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400">
                          <FileArchive className="w-4 h-4" />
                        </div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                          All Slides as PNG (.zip)
                        </h4>
                      </div>
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300">
                        Full HD ZIP
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                      Every slide rendered into lossless high-resolution 1080p PNG images bundled in a ZIP archive.
                    </p>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 font-semibold">
                    <span>{currentProject.slides.length} PNG Files</span>
                    <span className="text-emerald-600 font-bold group-hover:underline flex items-center gap-0.5">
                      Download ZIP →
                    </span>
                  </div>
                </div>

                {/* 7. Current Slide Snapshot PNG */}
                <div
                  onClick={() => {
                    handleDownloadCurrentSlide();
                    setIsExportModalOpen(false);
                  }}
                  className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700/80 hover:border-teal-500 dark:hover:border-teal-500 bg-slate-50/60 dark:bg-slate-800/40 hover:bg-teal-50/30 dark:hover:bg-teal-950/20 cursor-pointer transition-all flex flex-col justify-between space-y-3 group shadow-xs hover:shadow-md"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-xl bg-teal-100 dark:bg-teal-950/80 text-teal-600 dark:text-teal-400">
                          <ImageIcon className="w-4 h-4" />
                        </div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                          Current Slide Snapshot (.png)
                        </h4>
                      </div>
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-teal-100 dark:bg-teal-950/80 text-teal-700 dark:text-teal-300">
                        Slide #{activeSlideIndex + 1}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                      Instant single-slide image capture of the currently selected slide in 1920x1080 HD.
                    </p>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 font-semibold">
                    <span>"{currentProject.slides[activeSlideIndex]?.title.substring(0, 24)}..."</span>
                    <span className="text-teal-600 font-bold group-hover:underline flex items-center gap-0.5">
                      Download PNG →
                    </span>
                  </div>
                </div>

                {/* 8. Printable 3-Slide Handout PDF */}
                <div
                  onClick={() => {
                    handleDownloadHandouts();
                    setIsExportModalOpen(false);
                  }}
                  className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700/80 hover:border-amber-500 dark:hover:border-amber-500 bg-slate-50/60 dark:bg-slate-800/40 hover:bg-amber-50/30 dark:hover:bg-amber-950/20 cursor-pointer transition-all flex flex-col justify-between space-y-3 group shadow-xs hover:shadow-md"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400">
                          <Printer className="w-4 h-4" />
                        </div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                          Printable Handouts PDF (.pdf)
                        </h4>
                      </div>
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300">
                        3-Up Notes
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                      A4 format with 3 slide thumbnails per page alongside lined margins for audience note-taking.
                    </p>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 font-semibold">
                    <span>Printable A4 Sheet</span>
                    <span className="text-amber-600 font-bold group-hover:underline flex items-center gap-0.5">
                      Download Handout →
                    </span>
                  </div>
                </div>

              </div>

            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-brand-600" />
                All exports generated client-side with 100% Free Lifetime Pass
              </span>
              <button
                type="button"
                onClick={() => setIsExportModalOpen(false)}
                className="px-4 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 font-bold text-xs transition-colors"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
