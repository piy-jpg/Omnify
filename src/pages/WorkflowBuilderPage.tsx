import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Workflow,
  Sparkles,
  Play,
  Plus,
  Trash2,
  Copy,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  ArrowDown,
  CheckCircle2,
  Clock,
  Settings2,
  FileArchive,
  QrCode,
  Download,
  Upload,
  FolderOpen,
  Image as ImageIcon,
  Crop,
  Wand2,
  AudioWaveform,
  Mic,
  Languages,
  ShieldCheck,
  Archive,
  RefreshCw,
  ExternalLink,
  Layers,
  Zap,
  Info,
  Check,
  Share2,
  HardDrive,
  FileText,
  FileCode,
  Sliders,
  FileCheck,
  Volume2,
  Eye,
  AlertTriangle,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Search,
  GitMerge,
  ScanLine,
  FileBox,
  Video,
  Cloud,
  X,
  History,
  Maximize2,
  SlidersHorizontal,
  CornerDownRight,
  Split,
  MapPin,
  CheckCircle,
  Boxes,
  File,
  Edit3,
  Bookmark,
  FolderKanban,
  CheckCheck
} from 'lucide-react';
import {
  WorkflowNode,
  WorkflowConnection,
  NodeCatalogItem,
  WORKFLOW_NODE_CATALOG,
  INTERACTIVE_TEMPLATES,
  INITIAL_WORKFLOW_HISTORY,
  WorkflowHistoryItem,
  SavedWorkflow,
  areDataTypesCompatible,
  generateWorkflowFromPrompt,
  validateWorkflowNodes,
  WorkflowValidationReport,
  executeWorkflowGraph,
  WorkflowProgressUpdate,
  WorkflowExecutionState,
  WorkflowNodeStatus,
  WorkflowExecutionResult,
  WorkflowOutputFile
} from '../services/workflow/workflowEngine';
import { FileItem } from '../types';
import { formatBytes } from '../utils/formatters';
import JSZip from 'jszip';
import QRCode from 'qrcode';

interface WorkflowBuilderPageProps {
  onFileGenerated?: (file: FileItem) => void;
  onOpenCloudStorage?: () => void;
}

const QUICK_PROMPT_CHIPS = [
  { label: '🛍️ E-Commerce WebP Catalog', prompt: 'Take product images, auto-crop 1:1 square, convert to WebP, add watermark, and bundle in ZIP' },
  { label: '🎙️ Podcast Mastering & Transcribe', prompt: 'Ingest audio, isolate voice, transcribe with Whisper AI, create show notes, and translate to Spanish' },
  { label: '⚖️ Legal PII Sanitizer', prompt: 'Extract text with OCR, mask sensitive PII emails and SSNs, create summary, and generate archive' },
  { label: '🎓 Lecture Study Pack', prompt: 'Take my lecture PDF, extract text, summarize it, translate summary into Hindi, create DOCX and ZIP everything' },
  { label: '🔀 Smart PDF + Image Branching', prompt: 'If file is PDF extract OCR and summarize, else resize images to 1:1 and convert to WebP' }
];

const INITIAL_SAVED_WORKFLOWS: SavedWorkflow[] = [
  {
    id: 'saved-wf-1',
    name: 'E-Commerce Image Optimizer',
    description: 'Auto-crops to 1:1, Lanczos scales to 2048px WebP, overlays branded watermark and bundles in ZIP.',
    nodes: INTERACTIVE_TEMPLATES[0].nodes.map((n, idx) => ({ ...n, id: `node-s1-${idx}` })),
    stepsCount: INTERACTIVE_TEMPLATES[0].nodes.length,
    inputDataType: 'IMAGE[]',
    outputDataType: 'ZIP ARCHIVE',
    createdAt: 'Sep 15, 2026',
    lastRunAt: 'Today, 2:30 PM',
    runCount: 14
  },
  {
    id: 'saved-wf-2',
    name: 'Podcast Mastering & Transcriber',
    description: 'Extracts speech stem, normalizes loudness to -16 LUFS, generates Whisper AI transcription & translation.',
    nodes: INTERACTIVE_TEMPLATES[1].nodes.map((n, idx) => ({ ...n, id: `node-s2-${idx}` })),
    stepsCount: INTERACTIVE_TEMPLATES[1].nodes.length,
    inputDataType: 'AUDIO STREAM',
    outputDataType: 'ZIP ARCHIVE',
    createdAt: 'Sep 12, 2026',
    lastRunAt: 'Yesterday',
    runCount: 8
  },
  {
    id: 'saved-wf-3',
    name: 'Legal PII Masking & Summary',
    description: 'Extracts OCR text from confidential documents, masks SSNs and emails, creates executive digest.',
    nodes: INTERACTIVE_TEMPLATES[2].nodes.map((n, idx) => ({ ...n, id: `node-s3-${idx}` })),
    stepsCount: INTERACTIVE_TEMPLATES[2].nodes.length,
    inputDataType: 'PDF / SCAN',
    outputDataType: 'ZIP ARCHIVE',
    createdAt: 'Sep 10, 2026',
    lastRunAt: '3 days ago',
    runCount: 5
  }
];

export const WorkflowBuilderPage: React.FC<WorkflowBuilderPageProps> = ({
  onFileGenerated,
  onOpenCloudStorage
}) => {
  // Workflow Metadata
  const [workflowId, setWorkflowId] = useState<string>(() => `wf-${Date.now()}`);
  const [workflowTitle, setWorkflowTitle] = useState<string>('E-Commerce Image Optimizer');
  const [workflowDescription, setWorkflowDescription] = useState<string>('Auto-crops to 1:1, Lanczos scales to 2048px WebP, overlays branded watermark and bundles in ZIP.');

  // Current Canvas Nodes & Selected Node for Inspector
  const [nodes, setNodes] = useState<WorkflowNode[]>(() => {
    return INTERACTIVE_TEMPLATES[0].nodes.map((n, idx) => ({
      ...n,
      id: `node-${Date.now()}-${idx}`,
      status: 'WAITING' as WorkflowNodeStatus,
      statusMessage: idx === 0 ? 'No files attached' : 'Waiting for input',
      progressPercent: 0,
      processedCount: 0,
      totalCount: 0
    }));
  });

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(() => {
    return nodes[0]?.id || null;
  });

  // Track Unsaved Changes Snapshot
  const [lastSavedSnapshot, setLastSavedSnapshot] = useState<string>(() => {
    return JSON.stringify(INTERACTIVE_TEMPLATES[0].nodes);
  });

  const hasUnsavedChanges = useMemo(() => {
    if (nodes.length === 0) return false;
    return JSON.stringify(nodes) !== lastSavedSnapshot;
  }, [nodes, lastSavedSnapshot]);

  // Saved Workflows ("My Workflows" Manager)
  const [savedWorkflows, setSavedWorkflows] = useState<SavedWorkflow[]>(() => {
    try {
      const stored = localStorage.getItem('omnify_saved_workflows');
      if (stored) return JSON.parse(stored);
    } catch {}
    return INITIAL_SAVED_WORKFLOWS;
  });

  const [showMyWorkflowsModal, setShowMyWorkflowsModal] = useState(false);

  // New Workflow Modals State
  const [showNewWorkflowModal, setShowNewWorkflowModal] = useState(false);
  const [showUnsavedConfirmModal, setShowUnsavedConfirmModal] = useState(false);
  const [newWfTab, setNewWfTab] = useState<'blank' | 'ai' | 'template'>('blank');
  const [newWfName, setNewWfName] = useState('My Workflow');
  const [newWfDesc, setNewWfDesc] = useState('');
  const [newWfAiPrompt, setNewWfAiPrompt] = useState('');

  // AI Prompt Builder State
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [aiNotice, setAiNotice] = useState<string | null>(null);
  const aiInputRef = useRef<HTMLInputElement>(null);

  // Left Library Search & Category Filter
  const [librarySearch, setLibrarySearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Interactive Modals & Drawers
  const [showTemplatesModal, setShowTemplatesModal] = useState(false);
  const [showHistoryDrawer, setShowHistoryDrawer] = useState(false);
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [historyItems, setHistoryItems] = useState<WorkflowHistoryItem[]>(INITIAL_WORKFLOW_HISTORY);

  // Canvas Viewport Pan & Zoom
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const canvasViewportRef = useRef<HTMLDivElement>(null);

  // Real Input & File Attachment State
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [showRunInputDialog, setShowRunInputDialog] = useState(false);
  const [lastExecutionResult, setLastExecutionResult] = useState<WorkflowExecutionResult | null>(null);
  const [showOutputFilesList, setShowOutputFilesList] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const jsonImportRef = useRef<HTMLInputElement>(null);

  // Execution & Progress State
  const [isRunning, setIsRunning] = useState(false);
  const [activeStepIndex, setActiveStepIndex] = useState<number>(-1);
  const [runProgress, setRunProgress] = useState<number>(0);
  const [showExecutionDrawer, setShowExecutionDrawer] = useState(false);
  const [executionLogs, setExecutionLogs] = useState<string[]>([]);
  const [executionResultZip, setExecutionResultZip] = useState<{ blob: Blob; url: string } | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [showQrModal, setShowQrModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [saveToast, setSaveToast] = useState(false);
  const [applyChangesToast, setApplyChangesToast] = useState(false);

  // Validation Report
  const validation: WorkflowValidationReport = useMemo(() => validateWorkflowNodes(nodes), [nodes]);
  const selectedNode = nodes.find(n => n.id === selectedNodeId) || null;

  // Computed total file size
  const totalBytes = useMemo(() => {
    return uploadedFiles.reduce((sum, f) => sum + f.size, 0);
  }, [uploadedFiles]);

  // Real Execution State Machine
  // DRAFT -> VALIDATED -> WAITING_FOR_INPUT -> READY_TO_RUN -> RUNNING -> COMPLETED / FAILED / CANCELLED
  const workflowState: WorkflowExecutionState = useMemo(() => {
    if (isRunning) return 'RUNNING';
    if (lastExecutionResult) {
      return lastExecutionResult.success ? 'COMPLETED' : 'FAILED';
    }
    if (!validation.isValid) return 'DRAFT';
    if (uploadedFiles.length === 0) return 'WAITING_FOR_INPUT';
    return 'READY_TO_RUN';
  }, [isRunning, lastExecutionResult, validation.isValid, uploadedFiles.length]);

  // Save to My Workflows in localStorage
  const handleSaveToMyWorkflows = () => {
    const inputNode = nodes.find(n => n.category === 'input');
    const outputNode = nodes.find(n => n.category === 'output');

    const updatedItem: SavedWorkflow = {
      id: workflowId,
      name: workflowTitle.trim() || 'Untitled Automation Workflow',
      description: workflowDescription.trim() || 'Custom multi-step automation pipeline',
      nodes: nodes,
      stepsCount: nodes.length,
      inputDataType: inputNode?.inputDataType || (nodes.length > 0 ? nodes[0].inputDataType : 'ANY / FILE'),
      outputDataType: outputNode?.outputDataType || (nodes.length > 0 ? nodes[nodes.length - 1].outputDataType : 'CUSTOM'),
      createdAt: savedWorkflows.find(w => w.id === workflowId)?.createdAt || 'Today',
      lastRunAt: lastExecutionResult ? 'Just now' : (savedWorkflows.find(w => w.id === workflowId)?.lastRunAt || 'Not run yet'),
      runCount: (savedWorkflows.find(w => w.id === workflowId)?.runCount || 0)
    };

    setSavedWorkflows(prev => {
      const filtered = prev.filter(w => w.id !== workflowId);
      const updated = [updatedItem, ...filtered];
      try {
        localStorage.setItem('omnify_saved_workflows', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    setLastSavedSnapshot(JSON.stringify(nodes));
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 2000);
  };

  // Auto-sync active workflow updates into savedWorkflows so it's always visible in My Workflows
  useEffect(() => {
    setSavedWorkflows(prev => {
      const existingIndex = prev.findIndex(w => w.id === workflowId);
      if (existingIndex === -1) return prev;
      
      const inputNode = nodes.find(n => n.category === 'input');
      const outputNode = nodes.find(n => n.category === 'output');
      const updated = [...prev];
      updated[existingIndex] = {
        ...updated[existingIndex],
        name: workflowTitle.trim() || 'Untitled Automation Workflow',
        description: workflowDescription.trim() || 'Custom multi-step automation pipeline',
        nodes: nodes,
        stepsCount: nodes.length,
        inputDataType: inputNode?.inputDataType || (nodes.length > 0 ? nodes[0].inputDataType : 'ANY / FILE'),
        outputDataType: outputNode?.outputDataType || (nodes.length > 0 ? nodes[nodes.length - 1].outputDataType : 'CUSTOM'),
      };
      try {
        localStorage.setItem('omnify_saved_workflows', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  }, [nodes, workflowTitle, workflowDescription, workflowId]);

  // Load a Saved Workflow into Studio
  const handleLoadSavedWorkflow = (saved: SavedWorkflow) => {
    setWorkflowId(saved.id);
    setWorkflowTitle(saved.name);
    setWorkflowDescription(saved.description);
    setNodes(saved.nodes.map((n, idx) => ({
      ...n,
      id: `node-${Date.now()}-${idx}`,
      status: 'WAITING' as WorkflowNodeStatus,
      statusMessage: idx === 0 ? 'No files attached' : 'Waiting for input',
      progressPercent: 0,
      processedCount: 0,
      totalCount: 0
    })));
    setSelectedNodeId(saved.nodes[0]?.id || null);
    setUploadedFiles([]);
    setLastExecutionResult(null);
    setLastSavedSnapshot(JSON.stringify(saved.nodes));
    setShowMyWorkflowsModal(false);
    handleAutoLayout();
  };

  // Delete Saved Workflow
  const handleDeleteSavedWorkflow = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSavedWorkflows(prev => {
      const updated = prev.filter(w => w.id !== id);
      try {
        localStorage.setItem('omnify_saved_workflows', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  // Trigger New Workflow Creation
  const handleRequestNewWorkflow = () => {
    setNewWfName('My Workflow');
    setNewWfDesc('');
    setNewWfTab('blank');
    setShowNewWorkflowModal(true);
  };

  // Create Genuinely Blank Workflow
  const handleCreateBlankWorkflow = (name?: string, desc?: string) => {
    const freshId = `wf-${Date.now()}`;
    const freshTitle = name?.trim() || newWfName.trim() || 'My Workflow';
    const freshDesc = desc?.trim() || newWfDesc.trim() || '';

    setWorkflowId(freshId);
    setWorkflowTitle(freshTitle);
    setWorkflowDescription(freshDesc);

    // 0 nodes, 0 connections, 0 files, fresh canvas
    setNodes([]);
    setSelectedNodeId(null);
    setUploadedFiles([]);
    setLastExecutionResult(null);
    setExecutionResultZip(null);
    setQrCodeUrl(null);
    setIsRunning(false);
    setRunProgress(0);
    setActiveStepIndex(-1);
    setAiReviewPending(false);
    setAiNotice(null);
    setAiPrompt('');
    setZoomLevel(100);
    setPanOffset({ x: 0, y: 0 });

    const newSavedWf: SavedWorkflow = {
      id: freshId,
      name: freshTitle,
      description: freshDesc || 'Custom automation workflow',
      nodes: [],
      stepsCount: 0,
      inputDataType: 'ANY / FILE',
      outputDataType: 'CUSTOM',
      createdAt: 'Just now',
      lastRunAt: 'Not run yet',
      runCount: 0
    };

    setSavedWorkflows(prev => {
      const filtered = prev.filter(w => w.id !== freshId);
      const updated = [newSavedWf, ...filtered];
      try {
        localStorage.setItem('omnify_saved_workflows', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    setLastSavedSnapshot(JSON.stringify([]));
    setShowNewWorkflowModal(false);
    setShowUnsavedConfirmModal(false);
  };

  // Handle files attached by user
  const handleFilesSelected = (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;

    setUploadedFiles(fileArray);
    setLastExecutionResult(null);

    const sizeStr = formatBytes(fileArray.reduce((sum, f) => sum + f.size, 0));

    // Update node statuses to WAITING with actual file counts
    setNodes(prev => prev.map((n) => {
      if (n.category === 'input') {
        return {
          ...n,
          status: 'WAITING' as WorkflowNodeStatus,
          statusMessage: `${fileArray.length} file(s) attached (${sizeStr})`,
          processedCount: 0,
          totalCount: fileArray.length
        };
      }
      return {
        ...n,
        status: 'WAITING' as WorkflowNodeStatus,
        statusMessage: 'Ready for input',
        processedCount: 0,
        totalCount: fileArray.length
      };
    }));
  };

  // Auto-Layout Nodes Neatly with smart branching offset
  const handleAutoLayout = () => {
    if (nodes.length === 0) return;
    let currentX = 60;
    const isBranching = nodes.some(n => n.type === 'logic_router' || n.type === 'logic_file_type' || n.type === 'logic_if');

    setNodes(prev => prev.map((node, i) => {
      if (isBranching && (node.branchId === 'branch-pdf' || node.title.toLowerCase().includes('pdf') || node.title.toLowerCase().includes('ocr'))) {
        return { ...node, position: { x: 580 + (i % 2) * 280, y: 70 } };
      }
      if (isBranching && (node.branchId === 'branch-img' || node.title.toLowerCase().includes('crop') || node.title.toLowerCase().includes('webp'))) {
        return { ...node, position: { x: 580 + (i % 2) * 280, y: 340 } };
      }
      const newPos = { x: currentX, y: 160 };
      currentX += 300;
      return { ...node, position: newPos };
    }));

    setTimeout(handleFitWorkflow, 50);
  };

  // Auto-Fit Entire Workflow to Canvas Viewport
  const handleFitWorkflow = () => {
    if (!canvasViewportRef.current || nodes.length === 0) {
      setZoomLevel(100);
      setPanOffset({ x: 0, y: 0 });
      return;
    }

    const containerW = canvasViewportRef.current.clientWidth || 800;
    const containerH = canvasViewportRef.current.clientHeight || 560;

    const minX = Math.min(...nodes.map(n => n.position.x));
    const maxX = Math.max(...nodes.map(n => n.position.x)) + 300;
    const minY = Math.min(...nodes.map(n => n.position.y));
    const maxY = Math.max(...nodes.map(n => n.position.y)) + 240;

    const totalW = Math.max(maxX - minX + 80, 400);
    const totalH = Math.max(maxY - minY + 80, 300);

    const fitScale = Math.min(1.1, Math.max(0.5, Math.min((containerW - 60) / totalW, (containerH - 60) / totalH)));
    const targetZoom = Math.round(fitScale * 100);

    setZoomLevel(targetZoom);
    setPanOffset({
      x: Math.round((containerW - totalW * fitScale) / 2 - minX * fitScale + 20),
      y: Math.max(10, Math.round((containerH - totalH * fitScale) / 2 - minY * fitScale))
    });
  };

  // Wheel Zoom & Pan handler
  const handleCanvasWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const zoomDelta = e.deltaY < 0 ? 5 : -5;
      setZoomLevel(prev => Math.min(180, Math.max(50, prev + zoomDelta)));
    } else {
      setPanOffset(prev => ({
        x: prev.x - e.deltaX * 0.8,
        y: prev.y - e.deltaY * 0.8
      }));
    }
  };

  // Canvas Mouse Drag Panning
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.workflow-node-card') || (e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('input')) return;
    setIsPanning(true);
    setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPanning) return;
    setPanOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  // AI Workflow Generator
  const [aiReviewPending, setAiReviewPending] = useState(false);
  const handleBuildWorkflowWithAI = (customText?: string) => {
    const textToUse = customText || aiPrompt;
    if (!textToUse.trim()) {
      alert('Please describe what you want to automate in the prompt box.');
      return;
    }

    setIsGeneratingAi(true);
    setTimeout(() => {
      const generatedNodes = generateWorkflowFromPrompt(textToUse);
      setNodes(generatedNodes);
      setSelectedNodeId(generatedNodes[0]?.id || null);
      setIsGeneratingAi(false);
      setAiReviewPending(true);
      setAiNotice(`✨ AI generated ${generatedNodes.length}-step workflow. Review workflow before running.`);
      setTimeout(handleFitWorkflow, 100);
    }, 500);
  };

  // Add Node from Catalog
  const handleAddNodeFromCatalog = (item: NodeCatalogItem) => {
    const maxX = nodes.length > 0 ? nodes.reduce((max, n) => Math.max(max, n.position.x), 50) : -210;
    const newNode: WorkflowNode = {
      id: `node-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      type: item.type,
      title: item.title,
      category: item.category,
      description: item.description,
      iconName: item.iconName,
      inputDataType: item.inputDataType,
      outputDataType: item.outputDataType,
      processingSummary: item.processingSummary,
      inputs: [{ id: 'in-1', name: 'Input', type: 'any' }],
      outputs: [{ id: 'out-1', name: 'Output', type: 'any' }],
      config: { ...item.defaultConfig },
      status: 'WAITING',
      statusMessage: item.category === 'input' ? (uploadedFiles.length > 0 ? `${uploadedFiles.length} file(s) attached` : 'No files attached') : 'Waiting for input',
      position: { x: maxX + 270, y: 160 }
    };

    setNodes(prev => [...prev, newNode]);
    setSelectedNodeId(newNode.id);
  };

  // Delete Node
  const handleDeleteNode = (nodeId: string) => {
    setNodes(prev => prev.filter(n => n.id !== nodeId));
    if (selectedNodeId === nodeId) {
      setSelectedNodeId(null);
    }
  };

  // Duplicate Node
  const handleDuplicateNode = (nodeId: string) => {
    const source = nodes.find(n => n.id === nodeId);
    if (!source) return;

    const dup: WorkflowNode = {
      ...source,
      id: `node-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      title: `${source.title} (Copy)`,
      position: { x: source.position.x + 30, y: source.position.y + 30 }
    };

    setNodes(prev => [...prev, dup]);
    setSelectedNodeId(dup.id);
  };

  // Update Config for a Node
  const handleUpdateNodeConfig = (nodeId: string, updates: Partial<WorkflowNode['config']>) => {
    setNodes(prev => prev.map(n => n.id === nodeId ? { ...n, config: { ...n.config, ...updates } } : n));
  };

  // Update Title
  const handleUpdateNodeMeta = (nodeId: string, updates: Partial<WorkflowNode>) => {
    setNodes(prev => prev.map(n => n.id === nodeId ? { ...n, ...updates } : n));
  };

  // Load Template
  const handleApplyTemplate = (tpl: typeof INTERACTIVE_TEMPLATES[0]) => {
    const mapped = tpl.nodes.map((n, idx) => ({
      ...n,
      id: `node-${Date.now()}-${idx}`,
      status: 'WAITING' as WorkflowNodeStatus,
      statusMessage: idx === 0 ? (uploadedFiles.length > 0 ? `${uploadedFiles.length} file(s) attached` : 'No files attached') : 'Waiting for input'
    }));
    setWorkflowTitle(tpl.title);
    setWorkflowDescription(tpl.description);
    setNodes(mapped);
    setSelectedNodeId(mapped[0]?.id || null);
    setShowTemplatesModal(false);
    setShowNewWorkflowModal(false);
    handleAutoLayout();
  };

  // Export Workflow as JSON
  const handleExportJson = () => {
    const dataStr = JSON.stringify({
      version: '2.0',
      id: workflowId,
      title: workflowTitle,
      description: workflowDescription,
      exportedAt: new Date().toISOString(),
      nodes
    }, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${workflowTitle.replace(/\s+/g, '_')}_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Import Workflow JSON
  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const parsed = JSON.parse(evt.target?.result as string);
        if (parsed && Array.isArray(parsed.nodes)) {
          if (parsed.title) setWorkflowTitle(parsed.title);
          if (parsed.description) setWorkflowDescription(parsed.description);
          setNodes(parsed.nodes);
          setSelectedNodeId(parsed.nodes[0]?.id || null);
          handleAutoLayout();
        }
      } catch {
        alert('Invalid workflow JSON file.');
      }
    };
    reader.readAsText(file);
  };

  // Trigger Run Dialog
  const handleTriggerRun = () => {
    if (!validation.isValid) {
      setShowValidationModal(true);
      return;
    }
    setShowRunInputDialog(true);
  };

  // Execute Workflow Graph
  const handleStartRealExecution = async () => {
    if (uploadedFiles.length === 0) {
      alert('Please upload files before starting execution.');
      return;
    }

    setShowRunInputDialog(false);
    setIsRunning(true);
    setShowExecutionDrawer(true);
    setActiveStepIndex(0);
    setRunProgress(5);
    setExecutionLogs([
      `[${new Date().toLocaleTimeString()}] Pipeline started: Processing batch of ${uploadedFiles.length} file(s) across ${nodes.length} nodes...`
    ]);

    // Reset all node statuses
    setNodes(prev => prev.map((n, idx) => ({
      ...n,
      status: (idx === 0 ? 'RUNNING' : 'QUEUED') as WorkflowNodeStatus,
      statusMessage: idx === 0 ? `Preparing ${uploadedFiles.length} file(s)` : 'Waiting in queue',
      progressPercent: 0,
      processedCount: 0,
      totalCount: uploadedFiles.length
    })));

    try {
      const result = await executeWorkflowGraph({
        nodes,
        userFiles: uploadedFiles,
        onProgress: (update: WorkflowProgressUpdate) => {
          setActiveStepIndex(update.nodeIndex);
          setRunProgress(update.overallProgress);
          
          setNodes(prev => prev.map((n, idx) => {
            if (idx === update.nodeIndex) {
              return {
                ...n,
                status: update.nodeStatus,
                statusMessage: update.statusMessage,
                progressPercent: update.nodeProgress,
                processedCount: update.processedCount,
                totalCount: update.totalCount
              };
            } else if (idx < update.nodeIndex) {
              return {
                ...n,
                status: 'COMPLETED' as WorkflowNodeStatus,
                statusMessage: `Completed (${update.totalCount}/${update.totalCount})`,
                progressPercent: 100,
                processedCount: update.totalCount,
                totalCount: update.totalCount
              };
            }
            return n;
          }));

          if (update.logMessage) {
            setExecutionLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${update.logMessage}`]);
          }
        }
      });

      setLastExecutionResult(result);
      setExecutionResultZip({ blob: result.zipBlob, url: result.zipUrl });
      if (result.qrCodeUrl) {
        setQrCodeUrl(result.qrCodeUrl);
      }

      setRunProgress(100);
      setIsRunning(false);
      setExecutionLogs(prev => [
        ...prev,
        `[${new Date().toLocaleTimeString()}] ✓ All ${nodes.length} nodes finished in ${result.durationFormatted}! Master ZIP archive (${formatBytes(result.totalOutputSize)}) ready with ${result.outputFiles.length} artifacts.`
      ]);

      // Add to History
      const newHistory: WorkflowHistoryItem = {
        id: `hist-${Date.now()}`,
        workflowTitle: workflowTitle || (nodes[0]?.title ? `${nodes[0].title} Pipeline` : 'Omnify Custom Pipeline'),
        executedAt: `Today, ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
        relativeTime: 'Today',
        status: result.success ? 'success' : 'partial',
        fileCount: result.inputFilesCount,
        fileType: 'Multi-Format Stream',
        durationFormatted: result.durationFormatted,
        stepsCount: result.totalSteps,
        zipSizeFormatted: formatBytes(result.totalOutputSize)
      };
      setHistoryItems(prev => [newHistory, ...prev]);

    } catch (error: any) {
      setIsRunning(false);
      setExecutionLogs(prev => [
        ...prev,
        `[${new Date().toLocaleTimeString()}] ✕ Execution failed: ${error?.message || 'Unknown error'}`
      ]);
    }
  };

  // Node Category Theme
  const getCategoryTheme = (category: string) => {
    switch (category) {
      case 'input':
        return {
          border: 'border-t-blue-500',
          bg: 'bg-blue-500/10',
          text: 'text-blue-400',
          badge: 'bg-blue-900/60 text-blue-300 border-blue-700/50'
        };
      case 'document':
        return {
          border: 'border-t-rose-500',
          bg: 'bg-rose-500/10',
          text: 'text-rose-400',
          badge: 'bg-rose-900/60 text-rose-300 border-rose-700/50'
        };
      case 'image':
        return {
          border: 'border-t-purple-500',
          bg: 'bg-purple-500/10',
          text: 'text-purple-400',
          badge: 'bg-purple-900/60 text-purple-300 border-purple-700/50'
        };
      case 'video':
        return {
          border: 'border-t-amber-500',
          bg: 'bg-amber-500/10',
          text: 'text-amber-400',
          badge: 'bg-amber-900/60 text-amber-300 border-amber-700/50'
        };
      case 'audio':
        return {
          border: 'border-t-indigo-500',
          bg: 'bg-indigo-500/10',
          text: 'text-indigo-400',
          badge: 'bg-indigo-900/60 text-indigo-300 border-indigo-700/50'
        };
      case 'ai':
        return {
          border: 'border-t-emerald-500',
          bg: 'bg-emerald-500/10',
          text: 'text-emerald-400',
          badge: 'bg-emerald-900/60 text-emerald-300 border-emerald-700/50'
        };
      case 'logic':
        return {
          border: 'border-t-fuchsia-500',
          bg: 'bg-fuchsia-500/10',
          text: 'text-fuchsia-400',
          badge: 'bg-fuchsia-900/60 text-fuchsia-300 border-fuchsia-700/50'
        };
      case 'output':
        return {
          border: 'border-t-cyan-500',
          bg: 'bg-cyan-500/10',
          text: 'text-cyan-400',
          badge: 'bg-cyan-900/60 text-cyan-300 border-cyan-700/50'
        };
      default:
        return {
          border: 'border-t-slate-500',
          bg: 'bg-slate-500/10',
          text: 'text-slate-400',
          badge: 'bg-slate-800 text-slate-300 border-slate-700'
        };
    }
  };

  const getNodeIcon = (category: string) => {
    switch (category) {
      case 'input': return <Upload className="w-4 h-4 text-blue-400" />;
      case 'document': return <FileBox className="w-4 h-4 text-rose-400" />;
      case 'image': return <ImageIcon className="w-4 h-4 text-purple-400" />;
      case 'video': return <Video className="w-4 h-4 text-amber-400" />;
      case 'audio': return <AudioWaveform className="w-4 h-4 text-indigo-400" />;
      case 'ai': return <Sparkles className="w-4 h-4 text-emerald-400" />;
      case 'logic': return <GitMerge className="w-4 h-4 text-fuchsia-400" />;
      case 'output': return <FileArchive className="w-4 h-4 text-cyan-400" />;
      default: return <Workflow className="w-4 h-4 text-slate-400" />;
    }
  };

  const getNodeStatusBadge = (status: WorkflowNodeStatus, node: WorkflowNode) => {
    switch (status) {
      case 'RUNNING':
        return (
          <span className="text-cyan-300 bg-cyan-950/90 border border-cyan-500/60 px-2 py-0.5 rounded-full font-bold animate-pulse flex items-center gap-1 text-[9px] shadow-sm">
            <RefreshCw className="w-2.5 h-2.5 animate-spin text-cyan-400" />
            {node.progressPercent !== undefined && node.progressPercent > 0 ? `${node.progressPercent}%` : 'RUNNING'}
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="text-emerald-300 bg-emerald-950/90 border border-emerald-500/60 px-2 py-0.5 rounded-full font-bold flex items-center gap-1 text-[9px] shadow-sm">
            <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
            COMPLETED
          </span>
        );
      case 'FAILED':
        return (
          <span className="text-rose-300 bg-rose-950/90 border border-rose-500/60 px-2 py-0.5 rounded-full font-bold text-[9px] shadow-sm">
            FAILED
          </span>
        );
      case 'QUEUED':
        return (
          <span className="text-amber-300 bg-amber-950/90 border border-amber-500/60 px-2 py-0.5 rounded-full font-bold text-[9px] shadow-sm">
            QUEUED
          </span>
        );
      case 'SKIPPED':
        return (
          <span className="text-slate-400 bg-slate-800 border border-slate-700 px-2 py-0.5 rounded-full font-medium text-[9px]">
            SKIPPED
          </span>
        );
      case 'WAITING':
      default:
        return (
          <span className="text-slate-400 bg-slate-800/90 border border-slate-700/80 px-2 py-0.5 rounded-full font-medium text-[9px]">
            WAITING
          </span>
        );
    }
  };

  const filteredCatalog = WORKFLOW_NODE_CATALOG.filter(item => {
    const matchesCat = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch = item.title.toLowerCase().includes(librarySearch.toLowerCase()) ||
                          item.description.toLowerCase().includes(librarySearch.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="space-y-3 pb-16 flex flex-col min-h-[calc(100vh-5.5rem)]">
      
      {/* Hidden Master File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={(e) => {
          if (e.target.files) handleFilesSelected(e.target.files);
        }}
        className="hidden"
      />

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 1. TOP HEADER WITH WORKFLOW TITLE & TOOLBAR */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-purple-950 p-4 sm:p-5 text-white border border-indigo-500/20 shadow-xl space-y-3.5 relative overflow-hidden">
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-br from-brand-500/30 to-purple-500/30 text-brand-300 border border-brand-400/30 shadow-inner">
              <Workflow className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-extrabold tracking-tight text-white uppercase">
                  {workflowTitle}
                </h1>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  REAL INPUT ENGINE
                </span>
              </div>
              <p className="text-xs text-slate-300">
                {workflowDescription || 'Visual node automation canvas with multi-tool chaining, data schemas & branching'}
              </p>
            </div>
          </div>

          {/* Top Quick Actions (Includes ＋ New Workflow, My Workflows, Validate, Run) */}
          <div className="flex flex-wrap items-center gap-2">
            
            {/* ＋ NEW WORKFLOW PRIMARY BUTTON */}
            <button
              onClick={handleRequestNewWorkflow}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white text-xs font-extrabold border border-brand-400/40 shadow-md hover:shadow-brand-500/25 transition-all flex items-center gap-1.5 hover:scale-102 active:scale-98"
              title="Create a new blank workflow"
            >
              <Plus className="w-4 h-4 text-brand-200" />
              <span>＋ New Workflow</span>
            </button>

            {/* MY WORKFLOWS LIBRARY BUTTON */}
            <button
              onClick={() => setShowMyWorkflowsModal(true)}
              className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/15 transition-all flex items-center gap-1.5"
              title="Open My Saved Workflows"
            >
              <FolderKanban className="w-3.5 h-3.5 text-cyan-300" />
              <span>My Workflows</span>
            </button>

            {/* VALIDATE WORKFLOW BUTTON */}
            <button
              onClick={() => setShowValidationModal(true)}
              className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
                validation.isValid
                  ? 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border-emerald-500/40'
                  : 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border-amber-500/40'
              }`}
              title="Check connections and parameter schemas"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>✓ Validate</span>
            </button>

            {/* SAVE WORKFLOW BUTTON */}
            <button
              onClick={handleSaveToMyWorkflows}
              className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/15 transition-all flex items-center gap-1.5"
              title="Save to My Workflows"
            >
              <Bookmark className="w-3.5 h-3.5 text-amber-300" />
              <span>{saveToast ? 'Saved ✓' : 'Save'}</span>
            </button>

            <button
              onClick={() => setShowTemplatesModal(true)}
              className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/15 transition-all flex items-center gap-1.5"
            >
              <Boxes className="w-3.5 h-3.5 text-indigo-300" />
              <span>Templates</span>
            </button>

            <button
              onClick={() => setShowHistoryDrawer(true)}
              className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/15 transition-all flex items-center gap-1.5"
            >
              <History className="w-3.5 h-3.5 text-purple-300" />
              <span>History</span>
            </button>

            <button
              onClick={handleExportJson}
              className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/15 transition-all flex items-center gap-1.5"
            >
              <FileCode className="w-3.5 h-3.5 text-cyan-300" />
              <span>Export</span>
            </button>

            <label className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/15 transition-all flex items-center gap-1.5 cursor-pointer">
              <Upload className="w-3.5 h-3.5 text-emerald-300" />
              <span>Import</span>
              <input
                ref={jsonImportRef}
                type="file"
                accept=".json"
                onChange={handleImportJson}
                className="hidden"
              />
            </label>

            {/* REAL INPUT-DRIVEN RUN WORKFLOW BUTTON */}
            <button
              onClick={handleTriggerRun}
              disabled={isRunning || nodes.length === 0}
              className={`px-5 py-2 rounded-2xl text-xs sm:text-sm font-extrabold shadow-lg transition-all flex items-center gap-2 ${
                isRunning
                  ? 'bg-brand-700 text-white cursor-wait opacity-90'
                  : nodes.length === 0
                  ? 'bg-slate-700 text-slate-400 cursor-not-allowed opacity-60'
                  : 'bg-gradient-to-r from-emerald-500 via-teal-600 to-indigo-600 hover:from-emerald-600 hover:to-indigo-700 text-white shadow-emerald-500/25 hover:shadow-xl hover:scale-102 active:scale-98'
              }`}
            >
              {isRunning ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                  <span>Running ({runProgress}%)...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-white" />
                  <span>▶ Run Workflow</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* AI Natural Language Prompt Builder */}
        <div className="relative z-10 pt-2 border-t border-white/10 space-y-2">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="relative flex-1">
              <Sparkles className="w-4 h-4 text-purple-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                ref={aiInputRef}
                type="text"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleBuildWorkflowWithAI()}
                placeholder="✨ Describe your automation (e.g. 'Take lecture PDF, extract text, summarize, translate to Hindi, create DOCX and ZIP everything')..."
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-black/40 border border-indigo-500/30 text-white text-xs sm:text-sm placeholder-slate-400 focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-500/20"
              />
            </div>

            <button
              onClick={() => handleBuildWorkflowWithAI()}
              disabled={isGeneratingAi}
              className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-brand-600 via-indigo-600 to-purple-600 hover:from-brand-500 hover:to-purple-500 text-white text-xs sm:text-sm font-extrabold shadow-md transition-all flex items-center justify-center gap-2 flex-shrink-0"
            >
              {isGeneratingAi ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Designing Pipeline...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>Build Workflow with AI</span>
                </>
              )}
            </button>
          </div>

          {/* Quick Prompt Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar text-[11px]">
            <span className="text-slate-400 font-bold flex-shrink-0 text-[10px] uppercase tracking-wider">
              Quick Prompts:
            </span>
            {QUICK_PROMPT_CHIPS.map((chip, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setAiPrompt(chip.prompt);
                  handleBuildWorkflowWithAI(chip.prompt);
                }}
                className="px-2.5 py-0.5 rounded-full bg-white/10 hover:bg-white/20 text-slate-200 border border-white/10 transition-colors flex-shrink-0 font-medium text-[10px]"
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>

        {/* AI REVIEW BANNER WITH ＋ NEW WORKFLOW ACTION */}
        {aiReviewPending && (
          <div className="p-3 rounded-2xl bg-gradient-to-r from-purple-900/90 via-indigo-900/90 to-slate-900/90 border border-purple-400/40 text-white flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xl animate-in slide-in-from-top-2 duration-200">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-400/30">
                <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
              </div>
              <div>
                <p className="text-xs font-extrabold text-white flex items-center gap-1.5">
                  <span>✨ AI generated {nodes.length}-step workflow</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">Ready for Review</span>
                </p>
                <p className="text-[11px] text-purple-200">
                  Review the data flow schema and parameters on the canvas below before running.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => {
                  handleFitWorkflow();
                  setAiReviewPending(false);
                }}
                className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/20 transition-all flex items-center gap-1"
              >
                <Eye className="w-3.5 h-3.5 text-cyan-300" />
                <span>Review Workflow</span>
              </button>

              <button
                onClick={() => {
                  setAiReviewPending(false);
                  handleTriggerRun();
                }}
                className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-xs font-extrabold shadow-lg shadow-emerald-500/25 transition-all flex items-center gap-1.5 hover:scale-102 active:scale-98"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>Run Workflow</span>
              </button>

              {/* ＋ NEW WORKFLOW BUTTON IN AI BANNER */}
              <button
                onClick={() => {
                  setAiReviewPending(false);
                  handleRequestNewWorkflow();
                }}
                className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/20 transition-all flex items-center gap-1"
                title="Start a new workflow"
              >
                <Plus className="w-3.5 h-3.5 text-amber-300" />
                <span>＋ New Workflow</span>
              </button>
            </div>
          </div>
        )}

        {!aiReviewPending && aiNotice && (
          <div className="p-2.5 rounded-xl bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-200">
            <Sparkles className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <span>{aiNotice}</span>
          </div>
        )}
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 2. WORKFLOW OVERVIEW BAR (Live Lifecycle Metrics) */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div className="p-2.5 px-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs">
        
        {/* Left Live Metrics */}
        <div className="flex flex-wrap items-center gap-3 text-slate-700 dark:text-slate-300">
          <span className="font-extrabold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-brand-500" />
            {workflowTitle}
          </span>

          <span className="text-slate-300 dark:text-slate-700">•</span>
          {validation.isValid ? (
            <div className="flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400">
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Validated ✓</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 font-bold text-amber-600 dark:text-amber-400">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Draft (Warnings)</span>
            </div>
          )}

          <span className="text-slate-300 dark:text-slate-700">•</span>
          <span className="font-semibold">{nodes.length} Steps</span>

          <span className="text-slate-300 dark:text-slate-700">•</span>
          <span className="font-mono text-slate-500">IN: <strong className="text-slate-700 dark:text-slate-300">{validation.inputDataType}</strong></span>

          <span className="text-slate-300 dark:text-slate-700">•</span>
          <span className="font-mono text-slate-500">OUT: <strong className="text-brand-600 dark:text-brand-400">{validation.outputDataType}</strong></span>

          <span className="text-slate-300 dark:text-slate-700">•</span>
          {workflowState === 'RUNNING' ? (
            <span className="font-bold text-cyan-400 animate-pulse">● Running ({runProgress}%)</span>
          ) : workflowState === 'COMPLETED' ? (
            <span className="font-bold text-emerald-500">✓ Completed ({lastExecutionResult?.durationFormatted})</span>
          ) : uploadedFiles.length > 0 ? (
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">Ready to Run ({uploadedFiles.length} files)</span>
          ) : (
            <span className="text-slate-400 dark:text-slate-500 font-medium">Not Run</span>
          )}
        </div>

        {/* Right Action Cluster */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setShowValidationModal(true)}
            className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold transition-colors flex items-center gap-1"
          >
            <CheckCheck className="w-3 h-3 text-emerald-500" />
            <span>Validate</span>
          </button>
          <button
            onClick={handleSaveToMyWorkflows}
            className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold transition-colors flex items-center gap-1"
          >
            <Bookmark className="w-3 h-3 text-amber-500" />
            <span>{saveToast ? 'Saved ✓' : 'Save'}</span>
          </button>
          <button
            onClick={() => {
              const copy = nodes.map(n => ({ ...n, id: `node-${Date.now()}-${Math.random().toString(36).substr(2, 4)}` }));
              setNodes(copy);
            }}
            className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold transition-colors"
          >
            Duplicate
          </button>
          <button
            onClick={() => {
              navigator.clipboard?.writeText(window.location.href);
              setCopiedLink(true);
              setTimeout(() => setCopiedLink(false), 2000);
            }}
            className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold transition-colors flex items-center gap-1"
          >
            <Share2 className="w-3 h-3 text-brand-500" />
            <span>{copiedLink ? 'Copied!' : 'Share'}</span>
          </button>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 3. 3-COLUMN STUDIO LAYOUT */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 flex-1 items-stretch">
        
        {/* ── LEFT COLUMN: NODE LIBRARY (3 COLS) ── */}
        <div className="lg:col-span-3 flex flex-col rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm overflow-hidden h-[640px]">
          
          {/* Header & Search */}
          <div className="p-3.5 border-b border-slate-100 dark:border-slate-800 space-y-2 bg-slate-50/50 dark:bg-slate-800/30">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-800 dark:text-white flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
                Node Library
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                {filteredCatalog.length} actions
              </span>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={librarySearch}
                onChange={(e) => setLibrarySearch(e.target.value)}
                placeholder="Search tools & models..."
                className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 border border-slate-200 dark:border-slate-700 focus:border-brand-500 focus:outline-none"
              />
            </div>

            {/* Categorized Filter Tabs */}
            <div className="flex items-center gap-1 overflow-x-auto pb-0.5 no-scrollbar">
              {['all', 'input', 'document', 'image', 'video', 'audio', 'ai', 'logic', 'output'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase transition-colors flex-shrink-0 ${
                    selectedCategory === cat
                      ? 'bg-brand-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Node Items List */}
          <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5 divide-y divide-slate-100 dark:divide-slate-800/40">
            {filteredCatalog.map((item) => (
              <div
                key={item.type}
                onClick={() => handleAddNodeFromCatalog(item)}
                className="pt-1.5 first:pt-0 group flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-all"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 group-hover:scale-105 group-hover:bg-brand-50 dark:group-hover:bg-brand-950/60 group-hover:text-brand-600 transition-all flex-shrink-0">
                    {getNodeIcon(item.category)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate group-hover:text-brand-600 dark:group-hover:text-brand-400">
                      {item.title}
                    </p>
                    <p className="text-[10px] font-mono text-slate-400 truncate">
                      {item.inputDataType} &rarr; {item.outputDataType}
                    </p>
                  </div>
                </div>

                <button
                  className="p-1 rounded-lg text-slate-400 group-hover:text-brand-600 dark:group-hover:text-brand-400 group-hover:bg-brand-50 dark:group-hover:bg-brand-950/60 transition-colors"
                  title="Add node to canvas"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* ── CENTER COLUMN: VISUAL WORKFLOW CANVAS (6 COLS) ── */}
        <div
          ref={canvasViewportRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onWheel={handleCanvasWheel}
          className="lg:col-span-6 flex flex-col rounded-3xl bg-slate-950 border border-slate-800 shadow-2xl relative overflow-hidden h-[640px] cursor-grab active:cursor-grabbing"
        >
          {/* Floating Canvas Navigation Bar */}
          <div className="absolute top-3.5 left-3.5 z-20 flex items-center gap-1.5 p-1 rounded-2xl bg-slate-900/90 backdrop-blur-md border border-slate-800 text-slate-300 shadow-lg">
            <button
              onClick={() => setZoomLevel(prev => Math.min(160, prev + 10))}
              className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <span className="text-[10px] font-mono font-bold px-1 text-slate-400">
              {zoomLevel}%
            </span>
            <button
              onClick={() => setZoomLevel(prev => Math.max(50, prev - 10))}
              className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <div className="h-4 w-[1px] bg-slate-800 mx-0.5" />
            <button
              onClick={handleFitWorkflow}
              className="px-2 py-1 rounded-xl hover:bg-slate-800 text-[10px] font-bold text-slate-300 hover:text-white transition-colors flex items-center gap-1"
              title="Fit Workflow to Viewport"
            >
              <Maximize2 className="w-3 h-3 text-cyan-400" />
              <span>Fit</span>
            </button>
            <button
              onClick={handleAutoLayout}
              className="px-2 py-1 rounded-xl hover:bg-slate-800 text-[10px] font-bold text-slate-300 hover:text-white transition-colors flex items-center gap-1"
              title="Auto Align Nodes"
            >
              <RotateCcw className="w-3 h-3 text-emerald-400" />
              <span>Auto-Layout</span>
            </button>
          </div>

          {/* Canvas Input Status Indicator */}
          <div className="absolute top-3.5 right-3.5 z-20 flex items-center gap-2">
            {uploadedFiles.length === 0 ? (
              <button
                onClick={() => setShowRunInputDialog(true)}
                className="px-3 py-1 rounded-full text-[10px] font-bold bg-amber-950/80 hover:bg-amber-900/90 backdrop-blur-md border border-amber-600/60 text-amber-300 shadow-md flex items-center gap-1.5 transition-all"
              >
                <Upload className="w-3 h-3" />
                <span>No Input Attached • [+ Attach Files]</span>
              </button>
            ) : (
              <div className="px-3 py-1 rounded-full text-[10px] font-bold bg-slate-900/90 backdrop-blur-md border border-slate-800 text-slate-300 shadow-md flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Input: {uploadedFiles.length} {uploadedFiles.length === 1 ? 'File' : 'Files'} ({formatBytes(totalBytes)})</span>
              </div>
            )}
          </div>

          {/* Mini-Map in Bottom-Right */}
          <div className="absolute bottom-3.5 right-3.5 z-20 w-36 h-24 rounded-2xl bg-slate-900/90 backdrop-blur-md border border-slate-800 p-2 shadow-xl flex flex-col justify-between pointer-events-none">
            <div className="flex items-center justify-between text-[9px] font-mono text-slate-400">
              <span>MINI-MAP</span>
              <span>{nodes.length} Nodes</span>
            </div>
            <div className="relative w-full h-14 bg-slate-950 rounded-lg border border-slate-800 overflow-hidden flex items-center justify-center">
              {nodes.length === 0 ? (
                <span className="text-[9px] text-slate-600 font-mono">Empty Canvas</span>
              ) : (
                <div className="flex items-center gap-1">
                  {nodes.map((n, i) => (
                    <div
                      key={i}
                      className={`w-3.5 h-3.5 rounded ${n.id === selectedNodeId ? 'bg-brand-500 ring-1 ring-white' : 'bg-slate-700'}`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Canvas Viewport with Radial Matrix Grid */}
          <div
            className="flex-1 overflow-x-auto overflow-y-auto p-12 relative flex items-center select-none"
            style={{
              backgroundImage: 'radial-gradient(#334155 1.3px, transparent 1.3px)',
              backgroundSize: '24px 24px',
              transform: `scale(${zoomLevel / 100}) translate(${panOffset.x}px, ${panOffset.y}px)`,
              transformOrigin: 'top left',
              transition: isPanning ? 'none' : 'transform 0.15s ease-out'
            }}
          >
            {nodes.length === 0 ? (
              /* BLANK CANVAS STATE (Exact specification) */
              <div className="mx-auto text-center py-20 px-8 max-w-lg space-y-5 rounded-3xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                <div className="w-16 h-16 rounded-3xl bg-slate-900 border border-slate-700/80 text-brand-400 flex items-center justify-center mx-auto shadow-2xl">
                  <Workflow className="w-8 h-8 text-brand-400" />
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-lg font-extrabold text-white tracking-tight">
                    Start building your workflow
                  </h3>
                  <p className="text-xs text-slate-400">
                    Drag an action from the Node Library or add your first step below.
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  <button
                    onClick={() => handleAddNodeFromCatalog(WORKFLOW_NODE_CATALOG[0])}
                    className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white text-xs font-extrabold shadow-lg hover:shadow-brand-500/25 transition-all flex items-center gap-2 hover:scale-102 active:scale-98"
                  >
                    <Plus className="w-4 h-4" />
                    <span>＋ Add your first action</span>
                  </button>

                  <button
                    onClick={() => {
                      aiInputRef.current?.focus();
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-xs font-extrabold border border-white/20 shadow-md transition-all flex items-center gap-1.5 hover:scale-102 active:scale-98"
                  >
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>✨ Build with AI</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-8 min-w-fit pr-24">
                {nodes.map((node, idx) => {
                  const isSelected = selectedNodeId === node.id;
                  const isLast = idx === nodes.length - 1;
                  const nextNode = !isLast ? nodes[idx + 1] : null;
                  const isConnectionValid = nextNode ? areDataTypesCompatible(node.outputDataType, nextNode.inputDataType) : true;
                  const theme = getCategoryTheme(node.category);

                  return (
                    <React.Fragment key={node.id}>
                      {/* Node Card Component */}
                      <div
                        onClick={() => setSelectedNodeId(node.id)}
                        className={`workflow-node-card w-72 rounded-2xl p-4 transition-all cursor-pointer relative group border-t-4 ${theme.border} ${
                          isSelected
                            ? 'bg-slate-900 border-x-2 border-b-2 border-brand-500 shadow-2xl shadow-brand-500/25 ring-4 ring-brand-500/15 scale-102'
                            : 'bg-slate-900/95 border-x border-b border-slate-800 hover:border-slate-700 hover:bg-slate-850 shadow-lg'
                        }`}
                      >
                        {/* Node Card Header */}
                        <div className="flex items-center justify-between mb-2.5">
                          <div className="flex items-center gap-1.5">
                            <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-300 font-mono text-[9px] font-bold flex items-center justify-center">
                              {idx + 1}
                            </span>
                            <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${theme.badge}`}>
                              {node.category}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            {getNodeStatusBadge(node.status, node)}
                          </div>
                        </div>

                        {/* Node Title & Description */}
                        <div className="flex items-start gap-2.5">
                          <div className={`p-2 rounded-xl ${theme.bg} ${theme.text} border border-slate-700/60 flex-shrink-0`}>
                            {getNodeIcon(node.category)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="text-xs font-bold text-white truncate">
                              {node.title}
                            </h3>
                            <p className="text-[10px] text-slate-400 line-clamp-2 mt-0.5 leading-relaxed">
                              {node.description}
                            </p>
                          </div>
                        </div>

                        {/* Intelligent Input -> Output Schema */}
                        <div className="mt-3 p-2 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1 text-[10px] font-mono">
                          <div className="flex items-center justify-between text-slate-400">
                            <span className="text-slate-500">IN:</span>
                            <span className="text-slate-300 font-bold">{node.inputDataType}</span>
                          </div>
                          <div className="flex items-center justify-between text-slate-400">
                            <span className="text-slate-500">OUT:</span>
                            <span className="text-brand-400 font-bold">{node.outputDataType}</span>
                          </div>
                        </div>

                        {/* Live Processing Status on Node */}
                        <div className="mt-2 text-[10px] flex items-center justify-between font-medium">
                          <span className={node.status === 'COMPLETED' ? 'text-emerald-400' : node.status === 'RUNNING' ? 'text-cyan-300' : 'text-slate-500'}>
                            {node.statusMessage || (node.category === 'input' && uploadedFiles.length === 0 ? 'No files attached' : 'Ready')}
                          </span>
                          <span className="text-[9px] font-mono text-slate-600">
                            {node.type}
                          </span>
                        </div>

                        {/* Node Actions Toolbar */}
                        <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px]">
                          <span className="text-slate-500 text-[9px] truncate max-w-[130px]">
                            {node.processingSummary}
                          </span>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDuplicateNode(node.id);
                              }}
                              className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
                              title="Duplicate Node"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteNode(node.id);
                              }}
                              className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-rose-400 transition-colors"
                              title="Delete Node"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* INTELLIGENT DATA TYPE CONNECTOR WITH TYPE COMPATIBILITY */}
                      {!isLast && (
                        <div className="flex flex-col items-center justify-center flex-shrink-0 relative group/conn">
                          <div className={`px-2 py-0.5 rounded-md border text-[9px] font-mono font-bold mb-1 shadow-xs transition-all ${
                            isConnectionValid
                              ? 'bg-slate-900 border-slate-800 text-brand-300'
                              : 'bg-rose-950 border-rose-500 text-rose-300 animate-pulse ring-2 ring-rose-500/30'
                          }`}>
                            {isConnectionValid ? node.outputDataType : `✕ Incompatible: ${node.outputDataType} → ${nextNode?.inputDataType}`}
                          </div>

                          <div className="flex items-center">
                            <div className={`w-14 h-1 rounded-full relative overflow-hidden ${
                              isConnectionValid
                                ? 'bg-gradient-to-r from-brand-500 via-indigo-500 to-purple-500'
                                : 'bg-rose-600'
                            }`}>
                              {isRunning && isConnectionValid && (
                                <div className="absolute inset-0 bg-white w-4 h-full rounded-full animate-flow-particles" />
                              )}
                            </div>
                            <ArrowRight className={`w-4 h-4 -ml-2 z-10 ${isConnectionValid ? 'text-brand-400' : 'text-rose-400'}`} />
                          </div>
                        </div>
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT COLUMN: COMPLETE INSPECTOR PANEL ── */}
        <div className="lg:col-span-3 flex flex-col rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm overflow-hidden h-[640px]">
          
          <div className="p-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-800 dark:text-white flex items-center gap-1.5">
              <Settings2 className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
              Inspector Panel
            </span>
            {selectedNode && (
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 border border-brand-200/60 dark:border-brand-800">
                {selectedNode.category}
              </span>
            )}
          </div>

          {/* Inspector Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {!selectedNode ? (
              <div className="text-center py-24 text-slate-400 space-y-2">
                <Settings2 className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-700" />
                <p className="text-xs font-bold text-slate-600 dark:text-slate-400">No Node Selected</p>
                <p className="text-[11px] text-slate-400">Click any node on the canvas to configure parameters.</p>
              </div>
            ) : (
              <div className="space-y-4 text-xs">
                
                {/* Step Name */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                    Step Name
                  </label>
                  <input
                    type="text"
                    value={selectedNode.title}
                    onChange={(e) => handleUpdateNodeMeta(selectedNode.id, { title: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-semibold"
                  />
                </div>

                {/* Input Binding Badge */}
                <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-[11px] text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>Input: {selectedNode.inputDataType} &rarr; Output: {selectedNode.outputDataType}</span>
                </div>

                {/* IMAGE RESIZER CONTROLS (Exact user specification) */}
                {selectedNode.type === 'img_resize' && (
                  <div className="space-y-3 pt-1 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 block">
                      Resize Image Parameters
                    </span>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1.5">
                        Mode
                      </label>
                      <div className="grid grid-cols-3 gap-1.5">
                        {[
                          { id: 'aspect_ratio', label: 'Aspect Ratio' },
                          { id: 'fixed_size', label: 'Fixed Size' },
                          { id: 'custom', label: 'Custom' }
                        ].map((m) => (
                          <button
                            key={m.id}
                            onClick={() => handleUpdateNodeConfig(selectedNode.id, { resizeMode: m.id as any })}
                            className={`py-1.5 px-2 rounded-xl text-[10px] font-bold border transition-all ${
                              (selectedNode.config.resizeMode || 'aspect_ratio') === m.id
                                ? 'bg-brand-500 text-white border-brand-500 shadow-xs'
                                : 'bg-slate-100 dark:bg-slate-800 border-transparent text-slate-600 dark:text-slate-300'
                            }`}
                          >
                            {m.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                        Ratio
                      </label>
                      <select
                        value={selectedNode.config.aspectRatio || '1:1'}
                        onChange={(e) => handleUpdateNodeConfig(selectedNode.id, { aspectRatio: e.target.value as any })}
                        className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                      >
                        <option value="1:1">1:1 Square (Shopify / Instagram / Feed)</option>
                        <option value="9:16">9:16 Vertical (TikTok / Reels / Shorts)</option>
                        <option value="16:9">16:9 Landscape (YouTube / Desktop)</option>
                        <option value="4:5">4:5 Portrait Carousel</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                        Resolution
                      </label>
                      <select
                        value={selectedNode.config.resizeWidth || 2048}
                        onChange={(e) => handleUpdateNodeConfig(selectedNode.id, {
                          resizeWidth: Number(e.target.value),
                          resizeHeight: Number(e.target.value)
                        })}
                        className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-mono"
                      >
                        <option value={2048}>2048 px (Ultra HD)</option>
                        <option value={1080}>1080 px (Standard HD)</option>
                        <option value={800}>800 px (Web Optimized)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                        Format
                      </label>
                      <select
                        value={selectedNode.config.targetImageFormat || 'webp'}
                        onChange={(e) => handleUpdateNodeConfig(selectedNode.id, { targetImageFormat: e.target.value as any })}
                        className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-mono"
                      >
                        <option value="webp">WebP (High Efficiency)</option>
                        <option value="png">PNG (Lossless Transparency)</option>
                        <option value="jpeg">JPEG (Universal Compatibility)</option>
                        <option value="avif">AVIF (Next-Gen Compression)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                        Quality ({selectedNode.config.imageQuality || 85}%)
                      </label>
                      <input
                        type="range"
                        min="40"
                        max="100"
                        value={selectedNode.config.imageQuality || 85}
                        onChange={(e) => handleUpdateNodeConfig(selectedNode.id, { imageQuality: Number(e.target.value) })}
                        className="w-full"
                      />
                    </div>
                  </div>
                )}

                {/* AI Summarizer */}
                {selectedNode.type === 'ai_summarize' && (
                  <div className="space-y-3 pt-1 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 block">
                      AI Summarizer Configuration
                    </span>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                        Model Engine
                      </label>
                      <select
                        value={selectedNode.config.aiModel || 'gemini-flash'}
                        onChange={(e) => handleUpdateNodeConfig(selectedNode.id, { aiModel: e.target.value as any })}
                        className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                      >
                        <option value="gemini-flash">Gemini 1.5 Flash (Ultra Fast)</option>
                        <option value="gemini-pro">Gemini 1.5 Pro (Deep Reasoning)</option>
                        <option value="gpt-4o-mini">GPT-4o Mini</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                        Summary Length
                      </label>
                      <select
                        value={selectedNode.config.summaryLength || 'bullet_points'}
                        onChange={(e) => handleUpdateNodeConfig(selectedNode.id, { summaryLength: e.target.value as any })}
                        className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                      >
                        <option value="bullet_points">Executive Bullet Points</option>
                        <option value="brief">1-Paragraph TL;DR</option>
                        <option value="detailed">Comprehensive Deep Dive</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* Watermark Config */}
                {selectedNode.type === 'img_watermark' && (
                  <div className="space-y-3 pt-1 border-t border-slate-100 dark:border-slate-800">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                        Watermark Text
                      </label>
                      <input
                        type="text"
                        value={selectedNode.config.watermarkText || 'Omnify'}
                        onChange={(e) => handleUpdateNodeConfig(selectedNode.id, { watermarkText: e.target.value })}
                        className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                        Opacity ({selectedNode.config.watermarkOpacity || 80}%)
                      </label>
                      <input
                        type="range"
                        min="10"
                        max="100"
                        value={selectedNode.config.watermarkOpacity || 80}
                        onChange={(e) => handleUpdateNodeConfig(selectedNode.id, { watermarkOpacity: Number(e.target.value) })}
                        className="w-full"
                      />
                    </div>
                  </div>
                )}

                {/* Apply Changes Button */}
                <button
                  onClick={() => {
                    setApplyChangesToast(true);
                    setTimeout(() => setApplyChangesToast(false), 1500);
                  }}
                  className="w-full py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{applyChangesToast ? 'Changes Applied ✓' : 'Apply Changes'}</span>
                </button>

              </div>
            )}
          </div>
        </div>

      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 4. CREATE NEW WORKFLOW MODAL */}
      {/* ───────────────────────────────────────────────────────────── */}
      {showNewWorkflowModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-800 text-slate-100 p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-brand-500/20 text-brand-400 border border-brand-500/30">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white">
                    Create New Workflow
                  </h3>
                  <p className="text-xs text-slate-400">
                    Initialize a fresh workflow stream.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowNewWorkflowModal(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            {/* Creation Form */}
            <div className="space-y-3.5 p-4 rounded-2xl bg-slate-950 border border-slate-800">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Workflow Name
                </label>
                <input
                  type="text"
                  value={newWfName}
                  onChange={(e) => setNewWfName(e.target.value)}
                  placeholder="My Workflow"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={newWfDesc}
                  onChange={(e) => setNewWfDesc(e.target.value)}
                  placeholder="What do you want to automate?"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-brand-500"
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-800">
              <button
                onClick={() => setShowNewWorkflowModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleCreateBlankWorkflow()}
                className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-extrabold shadow-md transition-all flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Create Workflow</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 5. MY WORKFLOWS LIBRARY MODAL */}
      {/* ───────────────────────────────────────────────────────────── */}
      {showMyWorkflowsModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-2xl rounded-3xl bg-slate-900 border border-slate-800 text-slate-100 p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col animate-in zoom-in-95 duration-150">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                  <FolderKanban className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white">
                    My Workflows
                  </h3>
                  <p className="text-xs text-slate-400">
                    Re-run or edit your saved automation recipes anytime.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowMyWorkflowsModal(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {savedWorkflows.length === 0 ? (
                <div className="text-center py-12 text-slate-400 space-y-2">
                  <Bookmark className="w-8 h-8 mx-auto text-slate-600" />
                  <p className="text-xs font-bold text-slate-300">No Saved Workflows Yet</p>
                  <p className="text-[11px] text-slate-500">Design a workflow on the canvas and click "Save" to keep it here.</p>
                </div>
              ) : (
                savedWorkflows.map((wf) => (
                  <div
                    key={wf.id}
                    className="p-4 rounded-2xl bg-slate-950 border border-slate-800 hover:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all"
                  >
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white truncate">{wf.name}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-brand-950 border border-brand-800 text-brand-400 font-mono">
                          {wf.stepsCount} Steps
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 line-clamp-1">{wf.description}</p>
                      <p className="text-[10px] text-slate-500 font-mono">
                        Schema: {wf.inputDataType} &rarr; {wf.outputDataType} • Last Run: {wf.lastRunAt || 'Never'}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => {
                          handleLoadSavedWorkflow(wf);
                          setShowRunInputDialog(true);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-extrabold shadow-sm transition-all flex items-center gap-1"
                      >
                        <Play className="w-3.5 h-3.5 fill-white" />
                        <span>▶ Run</span>
                      </button>

                      <button
                        onClick={() => handleLoadSavedWorkflow(wf)}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition-colors flex items-center gap-1"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Edit</span>
                      </button>

                      <button
                        onClick={(e) => handleDeleteSavedWorkflow(wf.id, e)}
                        className="p-1.5 rounded-xl hover:bg-rose-950/60 text-slate-500 hover:text-rose-400 transition-colors"
                        title="Delete Workflow"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-2 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setShowMyWorkflowsModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 6. RUN WORKFLOW — REAL INPUT DIALOG (Exact user specification) */}
      {/* ───────────────────────────────────────────────────────────── */}
      {showRunInputDialog && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-slate-800 text-slate-100 p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            
            <div className="flex items-start justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-white">
                  Run {workflowTitle}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Upload your files to begin execution.
                </p>
              </div>
              <button
                onClick={() => setShowRunInputDialog(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            {/* Drop Zone */}
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); }}
              onDrop={(e) => {
                e.preventDefault();
                if (e.dataTransfer.files) handleFilesSelected(e.dataTransfer.files);
              }}
              className="p-8 rounded-2xl bg-slate-950 border-2 border-dashed border-slate-700 hover:border-brand-500 hover:bg-slate-900 cursor-pointer text-center space-y-2 transition-all group"
            >
              <div className="w-12 h-12 rounded-2xl bg-brand-500/20 text-brand-400 border border-brand-500/30 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                <Upload className="w-6 h-6" />
              </div>
              <p className="text-xs font-bold text-white">
                Drop files here
              </p>
              <p className="text-[11px] text-slate-400">
                or <span className="text-brand-400 underline font-semibold">Select Files</span>
              </p>
            </div>

            {/* File Counter & Size */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-400">
                {uploadedFiles.length === 0 ? '0 files selected' : `${uploadedFiles.length} file(s) selected`}
              </span>
              {uploadedFiles.length > 0 && (
                <span className="font-mono text-emerald-400 font-bold">
                  {formatBytes(totalBytes)}
                </span>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-800">
              <button
                onClick={() => setShowRunInputDialog(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors"
              >
                Cancel
              </button>

              <button
                onClick={handleStartRealExecution}
                disabled={uploadedFiles.length === 0}
                className={`px-5 py-2 rounded-xl text-xs font-extrabold shadow-md transition-all flex items-center gap-1.5 ${
                  uploadedFiles.length === 0
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                    : 'bg-gradient-to-r from-emerald-500 via-teal-600 to-indigo-600 hover:from-emerald-600 hover:to-indigo-700 text-white shadow-emerald-500/25 hover:scale-102 active:scale-98'
                }`}
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Start Workflow</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 7. VALIDATION REPORT MODAL */}
      {/* ───────────────────────────────────────────────────────────── */}
      {showValidationModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-slate-800 text-slate-100 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <CheckCheck className={`w-5 h-5 ${validation.isValid ? 'text-emerald-400' : 'text-amber-400'}`} />
                <h3 className="text-base font-extrabold text-white">
                  Workflow Pre-Flight Validation
                </h3>
              </div>
              <button onClick={() => setShowValidationModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Status:</span>
                <span className={`font-bold ${validation.isValid ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {validation.isValid ? '✓ Validated & Ready' : '✕ Action Required'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Total Steps:</span>
                <span className="font-bold text-white">{validation.totalSteps}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Input Schema:</span>
                <span className="font-mono font-bold text-brand-400">{validation.inputDataType}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Output Schema:</span>
                <span className="font-mono font-bold text-cyan-400">{validation.outputDataType}</span>
              </div>
            </div>

            {validation.errors.length > 0 && (
              <div className="p-3 rounded-2xl bg-rose-950/40 border border-rose-800 space-y-1 text-xs">
                <span className="font-bold text-rose-400 block">Errors ({validation.errors.length}):</span>
                {validation.errors.map((err, i) => (
                  <p key={i} className="text-rose-200 text-[11px] flex items-start gap-1.5">
                    <span>•</span>
                    <span>{err}</span>
                  </p>
                ))}
              </div>
            )}

            {validation.warnings.length > 0 && (
              <div className="p-3 rounded-2xl bg-amber-950/40 border border-amber-800 space-y-1 text-xs">
                <span className="font-bold text-amber-400 block">Warnings ({validation.warnings.length}):</span>
                {validation.warnings.map((warn, i) => (
                  <p key={i} className="text-amber-200 text-[11px] flex items-start gap-1.5">
                    <span>•</span>
                    <span>{warn}</span>
                  </p>
                ))}
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowValidationModal(false)}
                className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 8. UNSAVED CHANGES CONFIRMATION DIALOG */}
      {/* ───────────────────────────────────────────────────────────── */}
      {showUnsavedConfirmModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-slate-800 text-slate-100 p-6 shadow-2xl space-y-4">
            <div className="flex items-start gap-3.5">
              <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex-shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white">
                  You have unsaved changes
                </h3>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  Creating a new workflow will replace your current canvas. Would you like to save before creating a new workflow?
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setShowUnsavedConfirmModal(false)}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowUnsavedConfirmModal(false);
                  setShowNewWorkflowModal(true);
                }}
                className="px-3.5 py-2 rounded-xl bg-rose-600/80 hover:bg-rose-600 text-white text-xs font-bold transition-colors"
              >
                Discard & New
              </button>
              <button
                onClick={() => {
                  handleSaveToMyWorkflows();
                  setShowUnsavedConfirmModal(false);
                  setShowNewWorkflowModal(true);
                }}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold shadow-md transition-all"
              >
                Save & New
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 9. TEMPLATES PREVIEW MODAL */}
      {/* ───────────────────────────────────────────────────────────── */}
      {showTemplatesModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-3xl rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-150">
            
            <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  Interactive Recipe Templates
                </h3>
                <p className="text-xs text-slate-400">
                  Preview and load production multi-tool pipelines with 1 click.
                </p>
              </div>
              <button
                onClick={() => setShowTemplatesModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <div className="p-4 sm:p-6 overflow-y-auto space-y-4">
              {INTERACTIVE_TEMPLATES.map((tpl) => (
                <div
                  key={tpl.id}
                  className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-brand-500 dark:hover:border-brand-500 bg-slate-50/50 dark:bg-slate-800/40 space-y-3 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 border border-brand-200/60">
                        {tpl.badge}
                      </span>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-1">
                        {tpl.title}
                      </h4>
                    </div>
                    <button
                      onClick={() => handleApplyTemplate(tpl)}
                      className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-sm transition-all flex items-center gap-1.5"
                    >
                      <span>Use Template</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {tpl.description}
                  </p>

                  {/* Flow Diagram */}
                  <div className="flex flex-wrap items-center gap-1.5 p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                    {tpl.flowSummary.map((step, sIdx) => (
                      <React.Fragment key={sIdx}>
                        <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800">{step}</span>
                        {sIdx < tpl.flowSummary.length - 1 && <span className="text-brand-500 font-bold">&rarr;</span>}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 10. WORKFLOW HISTORY DRAWER */}
      {/* ───────────────────────────────────────────────────────────── */}
      {showHistoryDrawer && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-2xl rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-150">
            
            <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  Workflow Execution History
                </h3>
              </div>
              <button
                onClick={() => setShowHistoryDrawer(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <div className="p-4 sm:p-6 overflow-y-auto space-y-3">
              {historyItems.map((item) => (
                <div
                  key={item.id}
                  className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`p-2 rounded-xl flex-shrink-0 ${item.status === 'success' ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600' : 'bg-rose-100 dark:bg-rose-950 text-rose-600'}`}>
                      {item.status === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <X className="w-4 h-4" />}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 dark:text-white truncate">
                        {item.workflowTitle}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {item.fileCount} file(s) ({item.fileType}) • {item.stepsCount} steps • {item.executedAt}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="font-mono text-slate-500 font-semibold text-[11px]">
                      {item.durationFormatted}
                    </span>
                    {item.zipSizeFormatted && (
                      <span className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-[10px] font-bold text-slate-700 dark:text-slate-300">
                        {item.zipSizeFormatted}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 11. REAL EXECUTION & RESULTS MODAL */}
      {/* ───────────────────────────────────────────────────────────── */}
      {showExecutionDrawer && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-800 text-slate-100 p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${isRunning ? 'bg-cyan-400 animate-ping' : (lastExecutionResult?.success ? 'bg-emerald-400' : 'bg-rose-400')}`} />
                <h3 className="text-sm font-extrabold uppercase tracking-wider text-white">
                  {isRunning ? 'WORKFLOW RUNNING' : (lastExecutionResult?.success ? '🎉 Workflow Complete' : '✕ Workflow Failed')}
                </h3>
              </div>
              {!isRunning && (
                <button
                  onClick={() => setShowExecutionDrawer(false)}
                  className="text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Real Progress Bar */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">
                  {isRunning
                    ? `Processing (${uploadedFiles.length} ${uploadedFiles.length === 1 ? 'file' : 'files'})`
                    : `${lastExecutionResult?.inputFilesCount || uploadedFiles.length} files processed • ${lastExecutionResult?.successfulCount || uploadedFiles.length} successful • ${lastExecutionResult?.failedCount || 0} failed`}
                </span>
                <span className="font-extrabold text-emerald-400">{runProgress}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-brand-500 via-indigo-500 to-emerald-400 transition-all duration-300 rounded-full"
                  style={{ width: `${runProgress}%` }}
                />
              </div>
            </div>

            {/* Real Execution Step Items */}
            <div className="max-h-52 overflow-y-auto space-y-1.5 p-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs font-mono">
              {nodes.map((node) => (
                <div key={node.id} className="flex items-center justify-between p-1.5 rounded-lg bg-slate-900/40">
                  <div className="flex items-center gap-2 min-w-0 flex-1 pr-2">
                    {node.status === 'COMPLETED' ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                    ) : node.status === 'RUNNING' ? (
                      <RefreshCw className="w-3.5 h-3.5 text-cyan-400 animate-spin flex-shrink-0" />
                    ) : node.status === 'FAILED' ? (
                      <X className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
                    ) : (
                      <span className="w-3.5 h-3.5 rounded-full border border-slate-700 inline-block flex-shrink-0" />
                    )}
                    <span className={`truncate text-xs ${node.status === 'COMPLETED' ? 'text-slate-300' : 'text-slate-500'}`}>
                      {node.title}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 flex-shrink-0">
                    {node.status === 'COMPLETED'
                      ? `${node.processedCount || uploadedFiles.length}/${node.totalCount || uploadedFiles.length}`
                      : node.status === 'RUNNING'
                      ? `${node.processedCount || 0}/${node.totalCount || uploadedFiles.length}`
                      : `0/${node.totalCount || uploadedFiles.length || 1}`}
                  </span>
                </div>
              ))}
            </div>

            {/* Output Summary Card if Completed */}
            {!isRunning && lastExecutionResult && (
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                  OUTPUT
                </span>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileArchive className="w-5 h-5 text-brand-400" />
                    <div>
                      <p className="text-xs font-bold text-white truncate max-w-[200px]">
                        {workflowTitle.replace(/\s+/g, '_')}_Output.zip
                      </p>
                      <p className="text-[10px] font-mono text-slate-400">
                        {formatBytes(lastExecutionResult.totalOutputSize)} • {lastExecutionResult.outputFiles.length} artifacts
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setShowOutputFilesList(!showOutputFilesList)}
                    className="text-[11px] font-bold text-cyan-400 hover:underline"
                  >
                    {showOutputFilesList ? 'Hide Files' : 'View Files'}
                  </button>
                </div>

                {showOutputFilesList && (
                  <div className="pt-2 border-t border-slate-800/80 max-h-32 overflow-y-auto space-y-1 pr-1">
                    {lastExecutionResult.outputFiles.map((outF, oIdx) => (
                      <div
                        key={oIdx}
                        className="p-1.5 rounded-lg bg-slate-900 flex items-center justify-between text-[11px]"
                      >
                        <span className="truncate text-slate-300 font-mono">{outF.name}</span>
                        <a
                          href={outF.url}
                          download={outF.name}
                          className="text-[10px] text-brand-400 hover:underline font-bold"
                        >
                          Get
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Results Action Buttons */}
            {!isRunning && executionResultZip && (
              <div className="space-y-2 pt-1">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const a = document.createElement('a');
                      a.href = executionResultZip.url;
                      a.download = `${workflowTitle.replace(/\s+/g, '_')}_Output.zip`;
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                    }}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download ZIP</span>
                  </button>

                  <button
                    onClick={() => {
                      navigator.clipboard?.writeText(window.location.href);
                      setCopiedLink(true);
                      setTimeout(() => setCopiedLink(false), 2000);
                    }}
                    className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold border border-slate-700 flex items-center gap-1"
                  >
                    <Share2 className="w-3.5 h-3.5 text-brand-400" />
                    <span>{copiedLink ? 'Copied' : 'Share'}</span>
                  </button>

                  {qrCodeUrl && (
                    <button
                      onClick={() => setShowQrModal(true)}
                      className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold border border-slate-700 flex items-center gap-1"
                    >
                      <QrCode className="w-3.5 h-3.5 text-brand-400" />
                      <span>QR</span>
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => {
                      setShowExecutionDrawer(false);
                      setShowRunInputDialog(true);
                    }}
                    className="flex-1 py-2 rounded-xl bg-brand-600/80 hover:bg-brand-600 text-white text-xs font-extrabold transition-all flex items-center justify-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>▶ Run Again</span>
                  </button>

                  <button
                    onClick={() => setShowExecutionDrawer(false)}
                    className="py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all flex items-center gap-1"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-cyan-400" />
                    <span>✏️ Edit Workflow</span>
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 12. QR CODE SHARE MODAL */}
      {/* ───────────────────────────────────────────────────────────── */}
      {showQrModal && qrCodeUrl && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 text-center space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                Instant Mobile Transfer
              </span>
              <button
                onClick={() => setShowQrModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-white rounded-2xl border border-slate-200 inline-block shadow-md">
              <img
                src={qrCodeUrl}
                alt="Workflow Result QR"
                className="w-48 h-48 mx-auto"
              />
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Scan with your mobile camera to transfer the generated pipeline bundle.
            </p>

            <button
              onClick={() => {
                navigator.clipboard?.writeText(window.location.href);
                setCopiedLink(true);
                setTimeout(() => setCopiedLink(false), 2000);
              }}
              className="w-full py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 transition-colors flex items-center justify-center gap-1.5"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Share2 className="w-3.5 h-3.5" />}
              <span>{copiedLink ? 'Link Copied!' : 'Copy Workflow Share Link'}</span>
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
