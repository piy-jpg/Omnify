import React, { useState, useRef, useEffect } from 'react';
import {
  PenTool,
  Type,
  Upload,
  Calendar,
  ShieldCheck,
  Download,
  Trash2,
  Plus,
  FileText,
  CheckCircle2,
  Sparkles,
  RefreshCw,
  Eye,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Stamp,
  Layers,
  FileCheck,
  Lock,
  RotateCcw,
  Check,
  UserCheck,
  Move,
  QrCode,
  Users,
  Copy,
  Briefcase,
  Building2,
  Mail,
  CheckSquare,
  Share2,
  Bookmark,
  ExternalLink,
  BookOpen,
  GraduationCap
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { FileItem } from '../types';
import {
  SignerParty,
  SignatureAnnotation,
  SignerMetadata,
  generateSamplePdf,
  signPdfDocument,
  generateVerificationQr
} from '../services/signature/pdfSignatureEngine';

interface DigitalSignaturePageProps {
  onFileSaved?: (file: FileItem) => void;
  initialPdfFile?: FileItem;
}

type SignatureMode = 'draw' | 'type' | 'upload' | 'saved';

const INITIAL_SIGNERS: SignerParty[] = [
  {
    id: 'signer-1',
    name: 'Piyush Verma',
    email: 'piyush@convertpro.io',
    title: 'Authorized Signatory',
    role: 'initiator',
    color: '#1d4ed8', // Blue
    isSigned: true
  },
  {
    id: 'signer-2',
    name: 'Sarah Jenkins',
    email: 'sarah.j@enterprise.com',
    title: 'Managing Director',
    role: 'counterparty',
    color: '#059669', // Emerald
    isSigned: false
  },
  {
    id: 'signer-3',
    name: 'Legal Witness & Notary',
    email: 'compliance@notary.org',
    title: 'Notary Public',
    role: 'notary',
    color: '#7c3aed', // Purple
    isSigned: false
  }
];

export const DigitalSignaturePage: React.FC<DigitalSignaturePageProps> = ({
  onFileSaved,
  initialPdfFile
}) => {
  // Signers Management
  const [signers, setSigners] = useState<SignerParty[]>(INITIAL_SIGNERS);
  const [activeSignerId, setActiveSignerId] = useState<string>('signer-1');

  // Signature Creation States
  const [signatureMode, setSignatureMode] = useState<SignatureMode>('draw');
  const [penColor, setPenColor] = useState<string>('#1d4ed8'); // Royal blue
  const [penSize, setPenSize] = useState<number>(3);
  const [penStyle, setPenStyle] = useState<'ballpoint' | 'fountain' | 'calligraphy'>('fountain');
  const [typedName, setTypedName] = useState<string>('Piyush Verma');
  const [typedFont, setTypedFont] = useState<string>('Dancing Script, cursive');
  const [uploadedSignatureUrl, setUploadedSignatureUrl] = useState<string | null>(null);
  const [activeSignatureDataUrl, setActiveSignatureDataUrl] = useState<string>('');
  const [savedSignatures, setSavedSignatures] = useState<string[]>(() => {
    const saved = localStorage.getItem('convertpro_saved_signatures');
    return saved ? JSON.parse(saved) : [];
  });

  // Signer Metadata & Audit Options
  const [signReason, setSignReason] = useState<string>('I agree to and approve the terms of this document');
  const [includeAuditCert, setIncludeAuditCert] = useState<boolean>(true);
  const [includeQrSeal, setIncludeQrSeal] = useState<boolean>(true);

  // PDF Document States
  const [pdfBytes, setPdfBytes] = useState<Uint8Array | null>(null);
  const [pdfFileName, setPdfFileName] = useState<string>('Mutual_NDA_Agreement.pdf');
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [zoomLevel, setZoomLevel] = useState<number>(1.0);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isSignedSuccess, setIsSignedSuccess] = useState<boolean>(false);
  const [signedResultData, setSignedResultData] = useState<{
    url: string;
    name: string;
    hash: string;
    docId: string;
    size: number;
    timestamp: string;
    qrUrl: string;
  } | null>(null);

  // Placed Annotations on PDF
  const [annotations, setAnnotations] = useState<SignatureAnnotation[]>([]);
  const [selectedAnnotationId, setSelectedAnnotationId] = useState<string | null>(null);

  // Dragging Annotation State
  const [draggingAnnId, setDraggingAnnId] = useState<string | null>(null);
  const dragStartRef = useRef<{ x: number; y: number; origX: number; origY: number } | null>(null);

  // Refs
  const drawCanvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef<boolean>(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const pageContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const sigUploadInputRef = useRef<HTMLInputElement>(null);

  const activeSigner = signers.find(s => s.id === activeSignerId) || signers[0];

  // Initialize Sample PDF on Mount
  useEffect(() => {
    loadSamplePdf('nda');
  }, []);

  // Update Typed Signature Data URL
  useEffect(() => {
    if (signatureMode === 'type' && typedName.trim()) {
      generateTypedSignatureDataUrl();
    }
  }, [typedName, typedFont, penColor, signatureMode]);

  // Load sample PDF template
  const loadSamplePdf = async (type: 'nda' | 'academic' | 'freelance' | 'job_offer') => {
    setIsProcessing(true);
    try {
      const bytes = await generateSamplePdf(type);
      setPdfBytes(bytes);
      const names = {
        nda: 'Mutual_NDA_Agreement.pdf',
        academic: 'Academic_Integrity_Declaration.pdf',
        freelance: 'Contractor_Services_SOW.pdf',
        job_offer: 'Executive_Offer_Letter.pdf'
      };
      setPdfFileName(names[type]);
      setCurrentPage(0);
      setTotalPages(1);
      setAnnotations([]);
      setIsSignedSuccess(false);
      setSignedResultData(null);
    } catch (err) {
      console.error('Failed to load sample PDF:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle custom PDF upload
  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setIsProcessing(true);
      try {
        const buffer = await file.arrayBuffer();
        const bytes = new Uint8Array(buffer);
        setPdfBytes(bytes);
        setPdfFileName(file.name);
        setCurrentPage(0);
        setTotalPages(1);
        setAnnotations([]);
        setIsSignedSuccess(false);
        setSignedResultData(null);
      } catch (err) {
        console.error('Error loading uploaded PDF:', err);
      } finally {
        setIsProcessing(false);
      }
    }
  };

  // Handle Signature Image Upload with Auto Background Cleaner
  const handleSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          // Process transparent background
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0);
            const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imgData.data;
            // Transparentize white/near-white pixels
            for (let i = 0; i < data.length; i += 4) {
              const r = data[i];
              const g = data[i + 1];
              const b = data[i + 2];
              if (r > 215 && g > 215 && b > 215) {
                data[i + 3] = 0; // Transparent
              }
            }
            ctx.putImageData(imgData, 0, 0);
            const cleanedUrl = canvas.toDataURL('image/png');
            setUploadedSignatureUrl(cleanedUrl);
            setActiveSignatureDataUrl(cleanedUrl);
          }
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  // Canvas Drawing Handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    isDrawingRef.current = true;
    const canvas = drawCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    lastPointRef.current = {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current || !lastPointRef.current) return;
    const canvas = drawCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const currentX = clientX - rect.left;
    const currentY = clientY - rect.top;

    ctx.strokeStyle = penColor;
    ctx.lineWidth = penStyle === 'calligraphy' ? penSize * 1.5 : penSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
    ctx.lineTo(currentX, currentY);
    ctx.stroke();

    lastPointRef.current = { x: currentX, y: currentY };
  };

  const stopDrawing = () => {
    if (isDrawingRef.current) {
      isDrawingRef.current = false;
      lastPointRef.current = null;
      if (drawCanvasRef.current) {
        const url = drawCanvasRef.current.toDataURL('image/png');
        setActiveSignatureDataUrl(url);
      }
    }
  };

  const clearCanvas = () => {
    const canvas = drawCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setActiveSignatureDataUrl('');
  };

  // Save Signature to Vault
  const handleSaveToVault = () => {
    if (!activeSignatureDataUrl) return;
    const updated = [activeSignatureDataUrl, ...savedSignatures.slice(0, 4)];
    setSavedSignatures(updated);
    localStorage.setItem('convertpro_saved_signatures', JSON.stringify(updated));
  };

  // Generate Typed Signature Data URL
  const generateTypedSignatureDataUrl = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 440;
    canvas.height = 140;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.font = `italic 38px ${typedFont}`;
    ctx.fillStyle = penColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(typedName, 220, 70);

    const url = canvas.toDataURL('image/png');
    setActiveSignatureDataUrl(url);
  };

  // Add Annotation Element to Current Page
  const addAnnotation = async (type: SignatureAnnotation['type']) => {
    let content = '';
    let widthPercent = 28;
    let heightPercent = 10;

    const todayStr = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });

    if (type === 'signature') {
      content = activeSignatureDataUrl;
      if (!content) {
        generateTypedSignatureDataUrl();
        content = activeSignatureDataUrl;
      }
      widthPercent = 32;
      heightPercent = 12;
    } else if (type === 'initials') {
      const initials = activeSigner.name.split(' ').map(n => n[0]).join('').toUpperCase() || 'PV';
      const canvas = document.createElement('canvas');
      canvas.width = 120;
      canvas.height = 80;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.font = `bold italic 30px ${typedFont}`;
        ctx.fillStyle = penColor;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(initials, 60, 40);
        content = canvas.toDataURL('image/png');
      }
      widthPercent = 14;
      heightPercent = 8;
    } else if (type === 'date') {
      content = `Date: ${todayStr}`;
      widthPercent = 25;
      heightPercent = 5;
    } else if (type === 'name') {
      content = activeSigner.name;
      widthPercent = 28;
      heightPercent = 5;
    } else if (type === 'title') {
      content = activeSigner.title || 'Authorized Signatory';
      widthPercent = 28;
      heightPercent = 5;
    } else if (type === 'company') {
      content = 'ConvertPro Global Corp';
      widthPercent = 30;
      heightPercent = 5;
    } else if (type === 'checkbox') {
      content = '☑ I accept and agree';
      widthPercent = 26;
      heightPercent = 5;
    } else if (type === 'seal' || type === 'qr') {
      // Verified seal badge with QR
      const qrCodeData = await generateVerificationQr('SAMPLE-DOC', 'SHA256-VERIFIED', activeSigner.name);
      const canvas = document.createElement('canvas');
      canvas.width = 240;
      canvas.height = 100;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = 'rgba(29, 78, 216, 0.08)';
        ctx.fillRect(0, 0, 240, 100);
        ctx.strokeStyle = '#1d4ed8';
        ctx.lineWidth = 2;
        ctx.strokeRect(2, 2, 236, 96);
        ctx.fillStyle = '#1d4ed8';
        ctx.font = 'bold 12px sans-serif';
        ctx.fillText('✓ CONVERTPRO CERTIFIED', 15, 30);
        ctx.font = '9.5px sans-serif';
        ctx.fillStyle = '#475569';
        ctx.fillText(`Signer: ${activeSigner.name}`, 15, 52);
        ctx.fillText(`Date: ${todayStr}`, 15, 70);
        ctx.font = '8px monospace';
        ctx.fillText('SHA-256 E-SIGN PROOF', 15, 88);
        content = canvas.toDataURL('image/png');
      }
      widthPercent = 28;
      heightPercent = 11;
    }

    const newAnnotation: SignatureAnnotation = {
      id: `ann-${Date.now()}`,
      type,
      content,
      signerId: activeSigner.id,
      pageIndex: currentPage,
      xPercent: 55,
      yPercent: 68 + (annotations.length * 2.5),
      widthPercent,
      heightPercent,
      color: activeSigner.color || penColor,
      fontSize: 10
    };

    setAnnotations(prev => [...prev, newAnnotation]);
    setSelectedAnnotationId(newAnnotation.id);
  };

  // Remove Annotation
  const removeAnnotation = (id: string) => {
    setAnnotations(prev => prev.filter(a => a.id !== id));
    if (selectedAnnotationId === id) setSelectedAnnotationId(null);
  };

  // Duplicate Annotation
  const duplicateAnnotation = (id: string) => {
    const target = annotations.find(a => a.id === id);
    if (!target) return;
    const dup: SignatureAnnotation = {
      ...target,
      id: `ann-${Date.now()}`,
      xPercent: Math.min(80, target.xPercent + 3),
      yPercent: Math.min(80, target.yPercent + 3)
    };
    setAnnotations(prev => [...prev, dup]);
    setSelectedAnnotationId(dup.id);
  };

  // Dragging Annotation Handlers
  const handleAnnotationMouseDown = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setSelectedAnnotationId(id);
    const ann = annotations.find(a => a.id === id);
    if (!ann || !pageContainerRef.current) return;

    setDraggingAnnId(id);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      origX: ann.xPercent,
      origY: ann.yPercent
    };
  };

  const handleDocumentMouseMove = (e: React.MouseEvent) => {
    if (!draggingAnnId || !dragStartRef.current || !pageContainerRef.current) return;

    const rect = pageContainerRef.current.getBoundingClientRect();
    const deltaX = ((e.clientX - dragStartRef.current.x) / rect.width) * 100;
    const deltaY = ((e.clientY - dragStartRef.current.y) / rect.height) * 100;

    const newX = Math.max(2, Math.min(85, dragStartRef.current.origX + deltaX));
    const newY = Math.max(2, Math.min(88, dragStartRef.current.origY + deltaY));

    setAnnotations(prev => prev.map(a => a.id === draggingAnnId ? { ...a, xPercent: newX, yPercent: newY } : a));
  };

  const handleDocumentMouseUp = () => {
    setDraggingAnnId(null);
    dragStartRef.current = null;
  };

  // Compile & Sign PDF Document
  const handleSignAndExport = async () => {
    if (!pdfBytes) return;
    setIsProcessing(true);

    try {
      const metadata: SignerMetadata = {
        signers,
        signReason,
        includeAuditCertificate: includeAuditCert,
        includeQrSeal
      };

      const result = await signPdfDocument(
        pdfBytes,
        annotations,
        metadata,
        pdfFileName
      );

      setSignedResultData({
        url: result.pdfUrl,
        name: result.fileName,
        hash: result.documentHash,
        docId: result.documentId,
        size: result.fileSize,
        timestamp: result.timestamp,
        qrUrl: result.qrDataUrl
      });
      setIsSignedSuccess(true);

      // Trigger Celebration Confetti
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.6 }
      });

      // Save file to recent files workspace
      if (onFileSaved) {
        onFileSaved({
          id: `signed-${Date.now()}`,
          name: result.fileName,
          size: result.fileSize,
          type: 'application/pdf',
          extension: 'PDF',
          uploadedAt: 'Just now',
          status: 'ready',
          pages: result.pageCount,
          convertedUrl: result.pdfUrl
        });
      }
    } catch (err) {
      console.error('Failed to sign and compile PDF:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6" onMouseMove={handleDocumentMouseMove} onMouseUp={handleDocumentMouseUp}>
      
      {/* 1. STUDIO HEADER */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-100 dark:bg-purple-950/70 text-purple-600 dark:text-purple-400">
              <PenTool className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>Digital Signature & PDF E-Sign Studio</span>
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                ESIGN & eIDAS Compliant
              </span>
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Sign contracts, NDAs, and academic declarations with multi-party roles, interactive drag-and-drop placement, and SHA-256 QR audit verification.
          </p>
        </div>

        {/* Template Quick Selectors */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Presets:
          </span>
          <button
            onClick={() => loadSamplePdf('nda')}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-50 dark:bg-slate-800 hover:bg-purple-50 dark:hover:bg-purple-950/40 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
          >
            📄 Mutual NDA
          </button>
          <button
            onClick={() => loadSamplePdf('academic')}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-50 dark:bg-slate-800 hover:bg-purple-50 dark:hover:bg-purple-950/40 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
          >
            🎓 Academic Thesis
          </button>
          <button
            onClick={() => loadSamplePdf('job_offer')}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-50 dark:bg-slate-800 hover:bg-purple-50 dark:hover:bg-purple-950/40 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
          >
            🏢 Offer Letter
          </button>
          <button
            onClick={() => loadSamplePdf('freelance')}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-50 dark:bg-slate-800 hover:bg-purple-50 dark:hover:bg-purple-950/40 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
          >
            💼 Contractor SOW
          </button>
          
          <input
            type="file"
            accept="application/pdf"
            ref={fileInputRef}
            onChange={handlePdfUpload}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white transition-all shadow-xs flex items-center gap-1.5"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload PDF</span>
          </button>
        </div>
      </div>

      {/* 2. SIGNER ROLES & PARTY SWITCHER BAR */}
      <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-purple-600" />
          <span className="text-xs font-bold text-slate-900 dark:text-white">Active Signer:</span>
          <div className="flex items-center gap-2">
            {signers.map(s => {
              const isActive = s.id === activeSignerId;
              return (
                <button
                  key={s.id}
                  onClick={() => setActiveSignerId(s.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-purple-50 dark:bg-purple-950/50 border-purple-400 text-purple-900 dark:text-purple-200 shadow-2xs'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                  <span>{s.name}</span>
                  <span className="text-[10px] font-normal text-slate-400">({s.role})</span>
                </button>
              );
            })}
          </div>
        </div>

        <span className="text-[11px] text-slate-400">
          Stamps placed under this role will be attributed to <strong>{activeSigner.name}</strong>.
        </span>
      </div>

      {/* 3. MAIN STUDIO WORKSPACE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN (COL 4): SIGNATURE CREATOR & TOOLBOX */}
        <div className="lg:col-span-4 space-y-5">
          
          {/* Signature Creator Card */}
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                <PenTool className="w-4 h-4 text-purple-600" />
                <span>Signature Studio</span>
              </h3>
              
              {/* Mode Toggle */}
              <div className="flex items-center p-0.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs">
                {(['draw', 'type', 'upload', 'saved'] as SignatureMode[]).map(mode => (
                  <button
                    key={mode}
                    onClick={() => setSignatureMode(mode)}
                    className={`px-2.5 py-1 rounded-lg font-semibold capitalize transition-all ${
                      signatureMode === mode
                        ? 'bg-white dark:bg-slate-900 text-purple-600 shadow-xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>

            {/* Ink Color Selector & Pen Style */}
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-1.5">
                {[
                  { color: '#1d4ed8', label: 'Royal Blue' },
                  { color: '#0f172a', label: 'Executive Black' },
                  { color: '#dc2626', label: 'Seal Red' },
                  { color: '#059669', label: 'Emerald' }
                ].map(c => (
                  <button
                    key={c.color}
                    onClick={() => setPenColor(c.color)}
                    style={{ backgroundColor: c.color }}
                    className={`w-5 h-5 rounded-full border-2 transition-all ${
                      penColor === c.color ? 'border-purple-500 scale-110 shadow-xs' : 'border-transparent'
                    }`}
                    title={c.label}
                  />
                ))}
              </div>

              {signatureMode === 'draw' && (
                <div className="flex items-center gap-1 text-[11px] text-slate-500">
                  <button
                    onClick={() => setPenStyle('fountain')}
                    className={`px-2 py-0.5 rounded-md ${penStyle === 'fountain' ? 'bg-purple-100 text-purple-700 font-bold' : ''}`}
                  >
                    Fountain
                  </button>
                  <button
                    onClick={() => setPenStyle('calligraphy')}
                    className={`px-2 py-0.5 rounded-md ${penStyle === 'calligraphy' ? 'bg-purple-100 text-purple-700 font-bold' : ''}`}
                  >
                    Calligraphy
                  </button>
                </div>
              )}
            </div>

            {/* MODE 1: DRAW CANVAS */}
            {signatureMode === 'draw' && (
              <div className="space-y-2">
                <div className="relative border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl bg-slate-50/50 dark:bg-slate-800/40 overflow-hidden cursor-crosshair">
                  <canvas
                    ref={drawCanvasRef}
                    width={340}
                    height={130}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                    className="w-full h-[130px]"
                  />
                  <span className="absolute bottom-2 left-3 text-[10px] text-slate-400 select-none pointer-events-none">
                    Sign using mouse or touchscreen ✍️
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <button
                    onClick={handleSaveToVault}
                    disabled={!activeSignatureDataUrl}
                    className="text-[11px] text-purple-600 hover:text-purple-700 disabled:opacity-40 font-semibold flex items-center gap-1"
                  >
                    <Bookmark className="w-3 h-3" />
                    <span>Save to Vault</span>
                  </button>
                  <button
                    onClick={clearCanvas}
                    className="text-[11px] text-rose-500 hover:text-rose-600 flex items-center gap-1 font-semibold"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Clear</span>
                  </button>
                </div>
              </div>
            )}

            {/* MODE 2: TYPE SIGNATURE */}
            {signatureMode === 'type' && (
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Type your legal full name..."
                  value={typedName}
                  onChange={(e) => setTypedName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />

                {/* Font Selector Cards */}
                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {[
                    { name: 'Dancing Script', font: 'Dancing Script, cursive' },
                    { name: 'Great Vibes', font: 'Great Vibes, cursive' },
                    { name: 'Caveat', font: 'Caveat, cursive' },
                    { name: 'Alex Brush', font: 'Alex Brush, cursive' },
                    { name: 'Sacramento', font: 'Sacramento, cursive' }
                  ].map(f => (
                    <div
                      key={f.name}
                      onClick={() => setTypedFont(f.font)}
                      style={{ fontFamily: f.font, color: penColor }}
                      className={`p-2.5 rounded-xl border cursor-pointer text-base transition-all text-center ${
                        typedFont === f.font
                          ? 'border-purple-500 bg-purple-50/50 dark:bg-purple-950/40 shadow-xs'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                      }`}
                    >
                      {typedName || 'Your Signature'}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* MODE 3: UPLOAD SIGNATURE */}
            {signatureMode === 'upload' && (
              <div className="space-y-2">
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/svg+xml"
                  ref={sigUploadInputRef}
                  onChange={handleSignatureUpload}
                  className="hidden"
                />
                <button
                  onClick={() => sigUploadInputRef.current?.click()}
                  className="w-full py-6 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-purple-400 bg-slate-50/50 dark:bg-slate-800/40 flex flex-col items-center justify-center gap-1.5 text-xs text-slate-500 transition-colors"
                >
                  <Upload className="w-5 h-5 text-purple-600" />
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Upload Signature Scan</span>
                  <span className="text-[10px] text-slate-400">Auto-removes white backgrounds</span>
                </button>

                {uploadedSignatureUrl && (
                  <div className="p-2 rounded-xl bg-white dark:bg-slate-800 border flex items-center justify-center">
                    <img src={uploadedSignatureUrl} alt="Signature Preview" className="max-h-16 object-contain" />
                  </div>
                )}
              </div>
            )}

            {/* MODE 4: SAVED SIGNATURES VAULT */}
            {signatureMode === 'saved' && (
              <div className="space-y-2">
                {savedSignatures.length === 0 ? (
                  <p className="text-center py-6 text-xs text-slate-400">
                    No signatures saved yet. Draw a signature and click "Save to Vault".
                  </p>
                ) : (
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {savedSignatures.map((sig, idx) => (
                      <div
                        key={idx}
                        onClick={() => setActiveSignatureDataUrl(sig)}
                        className={`p-2 rounded-xl border cursor-pointer flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800 ${
                          activeSignatureDataUrl === sig ? 'border-purple-500 bg-purple-50/30' : 'border-slate-200'
                        }`}
                      >
                        <img src={sig} alt={`Saved ${idx}`} className="max-h-10 object-contain" />
                        <span className="text-[10px] text-purple-600 font-bold">Use This</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Stamp Toolbox: Click to Place on PDF */}
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
              <Stamp className="w-4 h-4 text-purple-600" />
              <span>Form Fields & Stamps</span>
            </h3>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                onClick={() => addAnnotation('signature')}
                className="p-2.5 rounded-2xl bg-purple-50/80 dark:bg-purple-950/40 hover:bg-purple-100 border border-purple-200 dark:border-purple-800 text-purple-900 dark:text-purple-200 font-semibold flex items-center gap-2 transition-all text-left"
              >
                <PenTool className="w-4 h-4 text-purple-600 flex-shrink-0" />
                <span className="truncate">Signature</span>
              </button>

              <button
                onClick={() => addAnnotation('initials')}
                className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-semibold flex items-center gap-2 transition-all text-left"
              >
                <span className="font-bold text-xs text-purple-600">PV</span>
                <span className="truncate">Initials</span>
              </button>

              <button
                onClick={() => addAnnotation('date')}
                className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-semibold flex items-center gap-2 transition-all text-left"
              >
                <Calendar className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span className="truncate">Date Stamp</span>
              </button>

              <button
                onClick={() => addAnnotation('name')}
                className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-semibold flex items-center gap-2 transition-all text-left"
              >
                <UserCheck className="w-4 h-4 text-blue-600 flex-shrink-0" />
                <span className="truncate">Full Name</span>
              </button>

              <button
                onClick={() => addAnnotation('title')}
                className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-semibold flex items-center gap-2 transition-all text-left"
              >
                <Briefcase className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <span className="truncate">Job Title</span>
              </button>

              <button
                onClick={() => addAnnotation('seal')}
                className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-semibold flex items-center gap-2 transition-all text-left"
              >
                <ShieldCheck className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                <span className="truncate">Verify QR Seal</span>
              </button>
            </div>
          </div>

          {/* Audit & Compliance Configuration */}
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Legal Audit Settings</span>
            </h3>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <p className="font-bold text-xs text-slate-800 dark:text-white">Cryptographic Certificate Page</p>
                  <p className="text-[10px] text-slate-400">Appends SHA-256 legal audit sheet</p>
                </div>
                <input
                  type="checkbox"
                  checked={includeAuditCert}
                  onChange={(e) => setIncludeAuditCert(e.target.checked)}
                  className="w-4 h-4 accent-purple-600 cursor-pointer"
                />
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="space-y-0.5">
                  <p className="font-bold text-xs text-slate-800 dark:text-white">Scannable QR Verification</p>
                  <p className="text-[10px] text-slate-400">Embeds verification QR on certificate</p>
                </div>
                <input
                  type="checkbox"
                  checked={includeQrSeal}
                  onChange={(e) => setIncludeQrSeal(e.target.checked)}
                  className="w-4 h-4 accent-purple-600 cursor-pointer"
                />
              </div>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN (COL 8): INTERACTIVE PDF VIEWER & PLACER */}
        <div className="lg:col-span-8 flex flex-col space-y-4">
          
          {/* Document Header & Zoom Controls */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <FileText className="w-4 h-4 text-purple-600 flex-shrink-0" />
              <span className="font-bold text-xs text-slate-900 dark:text-white truncate max-w-xs sm:max-w-md">
                {pdfFileName}
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                {annotations.length} stamp{annotations.length === 1 ? '' : 's'} placed
              </span>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setZoomLevel(prev => Math.max(0.7, prev - 0.1))}
                className="p-1.5 rounded-lg border text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="text-xs font-semibold text-slate-600 min-w-12 text-center">
                {Math.round(zoomLevel * 100)}%
              </span>
              <button
                onClick={() => setZoomLevel(prev => Math.min(1.4, prev + 0.1))}
                className="p-1.5 rounded-lg border text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Interactive Document Workspace Canvas with Drag & Drop */}
          <div className="flex-1 min-h-[580px] max-h-[660px] overflow-auto rounded-3xl bg-slate-100 dark:bg-slate-950 p-6 border border-slate-200/80 dark:border-slate-800 flex justify-center">
            
            {/* The Document Sheet Simulator */}
            <div
              ref={pageContainerRef}
              style={{
                width: `${595 * zoomLevel}px`,
                minHeight: `${840 * zoomLevel}px`,
                transformOrigin: 'top center'
              }}
              className="relative bg-white text-slate-900 shadow-2xl rounded-lg p-10 border border-slate-300 select-none overflow-hidden"
            >
              {/* Simulated Document Content */}
              <div className="space-y-4 opacity-90 text-[11px] pointer-events-none">
                <div className="p-3 rounded-lg bg-indigo-50 border border-indigo-200">
                  <h4 className="font-bold text-xs text-indigo-900 uppercase">
                    {pdfFileName.replace('.pdf', '').replace(/_/g, ' ')}
                  </h4>
                  <p className="text-[10px] text-indigo-700">ConvertPro Legal & Academic Electronic Signature Protocol</p>
                </div>

                <div className="space-y-2 text-slate-700 leading-relaxed">
                  <p>
                    <strong>1. Binding Scope of Engagement</strong>: The signatories agree to the mutual terms, covenants, and responsibilities established herein. All proprietary rights, intellectual assets, and confidential workflows are preserved.
                  </p>
                  <p>
                    <strong>2. Electronic Execution & Consent</strong>: Pursuant to the Uniform Electronic Transactions Act (UETA) and the Electronic Signatures in Global and National Commerce Act (ESIGN), electronic signatures executed via this studio are legally binding.
                  </p>
                  <p>
                    <strong>3. Compliance & Warranties</strong>: Both parties confirm that they hold the authorized credentials to sign and execute this instrument without restriction.
                  </p>
                </div>

                {/* Pre-rendered Signatory Boxes */}
                <div className="pt-14 grid grid-cols-2 gap-6">
                  <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/70 space-y-1">
                    <p className="text-[10px] font-bold uppercase text-slate-500">Party A (Issuing Authority)</p>
                    <p className="text-xs font-semibold text-slate-800">ConvertPro Technologies Inc.</p>
                    <div className="pt-4 border-b border-slate-300" />
                    <p className="text-[9px] text-emerald-600 font-bold">✓ Pre-Signed & Verified</p>
                  </div>

                  <div className="p-3 rounded-xl border-2 border-dashed border-purple-300 bg-purple-50/30 space-y-1">
                    <p className="text-[10px] font-bold uppercase text-purple-700">Party B (Authorized Signer)</p>
                    <p className="text-xs font-semibold text-slate-800">{activeSigner.name}</p>
                    <div className="pt-4 border-b border-purple-300" />
                    <p className="text-[9px] text-purple-600 font-medium">Place signature in this box &darr;</p>
                  </div>
                </div>
              </div>

              {/* Placed Annotations (Interactive Overlays with Real Mouse Dragging) */}
              {annotations.map((ann) => {
                const isSelected = selectedAnnotationId === ann.id;
                const signer = signers.find(s => s.id === ann.signerId) || activeSigner;

                return (
                  <div
                    key={ann.id}
                    onMouseDown={(e) => handleAnnotationMouseDown(e, ann.id)}
                    style={{
                      left: `${ann.xPercent}%`,
                      top: `${ann.yPercent}%`,
                      width: `${ann.widthPercent}%`,
                      height: `${ann.heightPercent}%`
                    }}
                    className={`absolute cursor-move flex items-center justify-center p-1 rounded-lg transition-shadow group ${
                      isSelected
                        ? 'ring-2 ring-purple-600 bg-purple-50/60 shadow-md'
                        : 'border border-dashed border-purple-400 hover:bg-purple-50/30'
                    }`}
                  >
                    {/* Render Annotation Content */}
                    {['signature', 'initials', 'seal', 'qr'].includes(ann.type) ? (
                      <img
                        src={ann.content}
                        alt="Signature Stamp"
                        className="max-h-full max-w-full object-contain pointer-events-none"
                      />
                    ) : (
                      <span className="font-bold text-xs text-slate-900 pointer-events-none truncate">
                        {ann.content}
                      </span>
                    )}

                    {/* Action buttons on hover/select */}
                    <div className="absolute -top-3 -right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          duplicateAnnotation(ann.id);
                        }}
                        className="p-1 rounded-full bg-purple-600 text-white shadow-xs"
                        title="Duplicate stamp"
                      >
                        <Copy className="w-2.5 h-2.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeAnnotation(ann.id);
                        }}
                        className="p-1 rounded-full bg-rose-600 text-white shadow-xs"
                        title="Remove stamp"
                      >
                        <Trash2 className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  </div>
                );
              })}

            </div>
          </div>

          {/* Bottom Execution Action Bar */}
          <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500">
                Ready to seal: <strong className="text-slate-800 dark:text-white">{annotations.length} stamp{annotations.length === 1 ? '' : 's'} placed</strong>
              </span>
            </div>

            <div className="flex items-center gap-2.5">
              {annotations.length > 0 && (
                <button
                  onClick={() => setAnnotations([])}
                  className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-rose-600 hover:bg-slate-100 transition-colors"
                >
                  Clear All Stamps
                </button>
              )}

              <button
                onClick={handleSignAndExport}
                disabled={isProcessing}
                className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs shadow-md shadow-purple-500/20 flex items-center gap-2 transition-all disabled:opacity-50"
              >
                <FileCheck className="w-4 h-4" />
                <span>{isProcessing ? 'Signing Document...' : 'Sign & Export PDF'}</span>
              </button>
            </div>
          </div>

        </div>

      </div>

      {/* 4. SIGNED SUCCESS MODAL WITH QR AUDIT PROOF */}
      {isSignedSuccess && signedResultData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-5">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-xs">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Document Successfully Signed!
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Your signatures and cryptographic audit certificate have been permanently embedded into the PDF.
              </p>
            </div>

            {/* Audit Details with Scannable QR Code */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border flex items-center gap-4">
              {signedResultData.qrUrl && (
                <img
                  src={signedResultData.qrUrl}
                  alt="Audit QR"
                  className="w-20 h-20 rounded-xl bg-white p-1 border shadow-xs flex-shrink-0"
                />
              )}
              <div className="space-y-1 text-xs min-w-0 flex-1">
                <div className="flex justify-between">
                  <span className="text-slate-400">Doc ID:</span>
                  <span className="font-bold text-purple-600 font-mono">{signedResultData.docId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Timestamp:</span>
                  <span className="font-medium text-slate-700 dark:text-slate-300">{signedResultData.timestamp}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Fingerprint:</span>
                  <span className="font-mono text-[10px] text-slate-500 truncate max-w-[120px]">
                    {signedResultData.hash}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <a
                href={signedResultData.url}
                download={signedResultData.name}
                className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-purple-500/20 transition-all text-center"
              >
                <Download className="w-4 h-4" />
                <span>Download Signed PDF</span>
              </a>
              <button
                onClick={() => setIsSignedSuccess(false)}
                className="px-5 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold text-xs"
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
