import React, { useState, useEffect, useRef } from 'react';
import {
  QrCode,
  Link,
  FileText,
  Image as ImageIcon,
  FileBox,
  Music,
  Video,
  Layers,
  User,
  Phone,
  Mail,
  Wifi,
  MapPin,
  Sparkles,
  Download,
  Copy,
  CheckCircle2,
  ExternalLink,
  Eye,
  RefreshCw,
  Plus,
  Trash2,
  Search,
  BarChart3,
  Sliders,
  Palette,
  ShieldCheck,
  Upload,
  ChevronDown,
  Info,
  Settings2,
  Check,
  X,
  Play,
  Share2,
  Flame,
  Zap,
  Smartphone,
  Globe,
  Laptop,
  Printer
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  QRInputType,
  QRCodeRecord,
  QRStylingOptions,
  QRStoredFile,
  VCardFormData,
  WifiFormData,
  LocationFormData,
  EmailFormData,
  PhoneFormData,
  QRPatternStyle,
  QRCornerStyle
} from '../types/qr';
import {
  DEFAULT_QR_STYLING,
  QR_GRADIENT_PRESETS,
  QR_LOGO_PRESETS,
  renderQrToCanvas,
  exportQrToPng,
  exportQrToSvg,
  exportQrToPdf,
  formatVCard,
  formatWifi,
  formatLocation,
  formatEmail,
  formatPhone
} from '../services/qr/qrEngine';
import {
  listQrRecords,
  saveQrRecord,
  generateShareId,
  deleteQrRecord,
  updateDynamicQr,
  calculateSha256
} from '../services/qr/qrStorageService';
import { formatBytes } from '../utils/formatters';

export const UniversalQrGeneratorPage: React.FC = () => {
  // Navigation views
  const [activeView, setActiveView] = useState<'create' | 'dashboard'>('create');

  // Input Type selection
  const [selectedType, setSelectedType] = useState<QRInputType>('url');
  const [qrName, setQrName] = useState('');

  // Type-specific Form States
  const [textInput, setTextInput] = useState('');
  const [urlInput, setUrlInput] = useState('https://convertpro.app');
  const [vcardForm, setVcardForm] = useState<VCardFormData>({
    firstName: 'Alex',
    lastName: 'Morgan',
    organization: 'ConvertPro Studio',
    title: 'Product Architect',
    phone: '+1 (555) 234-5678',
    email: 'alex.morgan@convertpro.app',
    website: 'https://convertpro.app'
  });
  const [wifiForm, setWifiForm] = useState<WifiFormData>({
    ssid: 'ConvertPro_Ultra_5G',
    password: 'SuperSecurePassword2025',
    encryption: 'WPA',
    hidden: false
  });
  const [locationForm, setLocationForm] = useState<LocationFormData>({
    query: 'Times Square, New York, NY',
    latitude: '40.7580',
    longitude: '-73.9855'
  });
  const [emailForm, setEmailForm] = useState<EmailFormData>({
    email: 'contact@convertpro.app',
    subject: 'Project Inquiry & Document Request',
    body: 'Hello ConvertPro Team,\n\nI would like to inquire about...'
  });
  const [phoneForm, setPhoneForm] = useState<PhoneFormData>({
    phoneNumber: '+15552345678'
  });

  // File Upload State
  const [uploadedFiles, setUploadedFiles] = useState<QRStoredFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Fast Flow & Customizer Accordion States
  const [showAllTypes, setShowAllTypes] = useState(false);
  const [activeThemeId, setActiveThemeId] = useState<string>('cyber-neon');
  const [showAdvancedCustomizer, setShowAdvancedCustomizer] = useState(false);

  // Styling & Customization
  const [styling, setStyling] = useState<QRStylingOptions>({
    ...DEFAULT_QR_STYLING,
    style: 'rounded',
    cornerStyle: 'rounded',
    fgColor: '#6366F1',
    gradientColor2: '#EC4899',
    isGradient: true,
    logoPreset: 'convertpro',
    captionText: 'SCAN WITH CAMERA'
  });

  // Active Customization Tab (style | colors | logo | caption)
  const [customizerTab, setCustomizerTab] = useState<'style' | 'colors' | 'logo' | 'caption'>('style');

  // QR Preview Canvas ref, Inline Canvas ref, & File Input ref
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const inlineCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isRendering, setIsRendering] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);

  // Designer 1-Click Themes
  const designerThemes = [
    {
      id: 'cyber-neon',
      name: 'Cyber Neon',
      desc: 'Indigo & Pink gradient with dot eyes',
      gradient: 'from-indigo-500 to-pink-500',
      apply: () =>
        setStyling({
          ...styling,
          style: 'rounded',
          cornerStyle: 'rounded',
          fgColor: '#6366F1',
          gradientColor2: '#EC4899',
          isGradient: true,
          bgColor: '#FFFFFF',
          logoPreset: 'convertpro',
          captionText: 'SCAN WITH CAMERA'
        })
    },
    {
      id: 'ocean-blue',
      name: 'Ocean Tech',
      desc: 'Sky blue & teal gradient',
      gradient: 'from-sky-500 to-teal-500',
      apply: () =>
        setStyling({
          ...styling,
          style: 'rounded',
          cornerStyle: 'circle',
          fgColor: '#0284C7',
          gradientColor2: '#0D9488',
          isGradient: true,
          bgColor: '#FFFFFF',
          logoPreset: 'link',
          captionText: 'SCAN TO OPEN LINK'
        })
    },
    {
      id: 'emerald-mint',
      name: 'Emerald Mint',
      desc: 'Modern dots with fresh green',
      gradient: 'from-emerald-500 to-teal-600',
      apply: () =>
        setStyling({
          ...styling,
          style: 'dots',
          cornerStyle: 'rounded',
          fgColor: '#059669',
          gradientColor2: '#10B981',
          isGradient: true,
          bgColor: '#FFFFFF',
          logoPreset: 'files',
          captionText: 'VERIFIED RESOURCE'
        })
    },
    {
      id: 'sunset-glow',
      name: 'Sunset Glow',
      desc: 'Warm orange & amber gradient',
      gradient: 'from-orange-500 to-amber-500',
      apply: () =>
        setStyling({
          ...styling,
          style: 'classy',
          cornerStyle: 'rounded',
          fgColor: '#EA580C',
          gradientColor2: '#F59E0B',
          isGradient: true,
          bgColor: '#FFFFFF',
          logoPreset: undefined,
          captionText: 'SCAN TO EXPLORE'
        })
    },
    {
      id: 'royal-violet',
      name: 'Royal Violet',
      desc: 'Purple & deep indigo gradient',
      gradient: 'from-purple-600 to-indigo-600',
      apply: () =>
        setStyling({
          ...styling,
          style: 'diamond',
          cornerStyle: 'dot',
          fgColor: '#7C3AED',
          gradientColor2: '#4F46E5',
          isGradient: true,
          bgColor: '#FFFFFF',
          logoPreset: 'convertpro',
          captionText: 'PREMIUM ACCESS'
        })
    },
    {
      id: 'midnight-gold',
      name: 'Dark Gold',
      desc: 'Amber gold on dark background',
      gradient: 'from-amber-400 to-yellow-600',
      apply: () =>
        setStyling({
          ...styling,
          style: 'rounded',
          cornerStyle: 'rounded',
          fgColor: '#F59E0B',
          gradientColor2: '#D97706',
          isGradient: true,
          bgColor: '#0F172A',
          logoPreset: undefined,
          captionText: 'VIP PASS'
        })
    },
    {
      id: 'classic-slate',
      name: 'Modern Slate',
      desc: 'Clean minimal dark slate',
      gradient: 'from-slate-800 to-slate-950',
      apply: () =>
        setStyling({
          ...styling,
          style: 'rounded',
          cornerStyle: 'rounded',
          fgColor: '#0F172A',
          bgColor: '#FFFFFF',
          isGradient: false,
          logoPreset: undefined,
          captionText: 'SCAN WITH CAMERA'
        })
    },
    {
      id: 'pure-black',
      name: 'Classic Mono',
      desc: 'Standard high-contrast square',
      gradient: 'from-black to-zinc-900',
      apply: () =>
        setStyling({
          ...styling,
          style: 'square',
          cornerStyle: 'square',
          fgColor: '#000000',
          bgColor: '#FFFFFF',
          isGradient: false,
          logoPreset: undefined,
          captionText: ''
        })
    }
  ];

  // Fast paste from clipboard
  const handlePasteClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        if (selectedType === 'url') {
          setUrlInput(text.trim());
        } else if (selectedType === 'text') {
          setTextInput(text);
        }
      }
    } catch {
      // Ignore clipboard permission errors
    }
  };
  const [encodedValue, setEncodedValue] = useState('');
  const [activeShareId, setActiveShareId] = useState(() => generateShareId());

  // Network & Mobile Scan Host Config
  const [lanIp, setLanIp] = useState<string>('192.168.1.101');
  const [hostMode, setHostMode] = useState<'lan' | 'localhost' | 'custom'>('lan');
  const [customHost, setCustomHost] = useState<string>('');
  const [showNetworkSettings, setShowNetworkSettings] = useState(false);

  // Dashboard State
  const [savedRecords, setSavedRecords] = useState<QRCodeRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedRecordForAnalytics, setSelectedRecordForAnalytics] = useState<QRCodeRecord | null>(null);
  const [editRecordModal, setEditRecordModal] = useState<QRCodeRecord | null>(null);
  const [editDestinationContent, setEditDestinationContent] = useState('');
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  const [saveSuccessNotice, setSaveSuccessNotice] = useState(false);

  // Fetch local network IP on mount for effortless mobile testing
  useEffect(() => {
    setSavedRecords(listQrRecords());
    fetch('/api/qr/network-info')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.primaryIp) {
          setLanIp(data.primaryIp);
        }
      })
      .catch(() => {});
  }, []);

  // Determine effective base URL for file shares
  const currentPort = typeof window !== 'undefined' && window.location.port ? window.location.port : '4000';
  
  const effectiveBaseUrl = hostMode === 'custom' && customHost.trim()
    ? (customHost.trim().startsWith('http') ? customHost.trim() : `https://${customHost.trim()}`)
    : hostMode === 'localhost'
    ? `http://localhost:${currentPort}`
    : typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'
    ? window.location.origin
    : `http://${lanIp || '192.168.1.101'}:${currentPort}`;

  // Compute what string should be encoded inside the QR
  useEffect(() => {
    const isFileType = ['pdf', 'image', 'document', 'audio', 'video', 'multi-files'].includes(selectedType);

    if (isFileType) {
      if (uploadedFiles.length > 0) {
        const shareUrl = `${effectiveBaseUrl}/#/qr/share/${activeShareId}`;
        setEncodedValue(shareUrl);
      } else {
        setEncodedValue('https://convertpro.app');
      }
    } else if (selectedType === 'url') {
      const trimmed = urlInput.trim();
      const formatted = trimmed ? (trimmed.startsWith('http://') || trimmed.startsWith('https://') ? trimmed : `https://${trimmed}`) : 'https://convertpro.app';
      setEncodedValue(formatted);
    } else if (selectedType === 'text') {
      setEncodedValue(textInput || 'Welcome to ConvertPro Universal QR Studio');
    } else if (selectedType === 'vcard') {
      setEncodedValue(formatVCard(vcardForm));
    } else if (selectedType === 'wifi') {
      setEncodedValue(formatWifi(wifiForm));
    } else if (selectedType === 'location') {
      setEncodedValue(formatLocation(locationForm));
    } else if (selectedType === 'email') {
      setEncodedValue(formatEmail(emailForm));
    } else if (selectedType === 'phone') {
      setEncodedValue(formatPhone(phoneForm));
    }
  }, [selectedType, textInput, urlInput, vcardForm, wifiForm, locationForm, emailForm, phoneForm, activeShareId, effectiveBaseUrl, uploadedFiles]);

  // Re-render QR code whenever encoded string or styling changes
  useEffect(() => {
    if (encodedValue) {
      setIsRendering(true);
      const render = () => {
        if (inlineCanvasRef.current) {
          renderQrToCanvas(inlineCanvasRef.current, encodedValue, styling, 640)
            .catch(() => {})
            .finally(() => setIsRendering(false));
        } else {
          setIsRendering(false);
        }
      };

      render();
      const t1 = setTimeout(render, 40);
      const t2 = setTimeout(render, 150);
      const t3 = setTimeout(render, 400);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
      };
    }
  }, [encodedValue, styling, hasGenerated, activeShareId]);

  // Handle File Upload
  const handleFileUpload = async (files: FileList | File[]) => {
    const fileList = Array.from(files);
    if (fileList.length === 0) return;

    setUploadError(null);
    setIsUploading(true);

    // Mint a brand new unique share ID for this upload session
    const newShareId = generateShareId();
    setActiveShareId(newShareId);

    const maxFileSize = 50 * 1024 * 1024; // 50MB per file
    const newStoredFiles: QRStoredFile[] = [];

    for (const file of fileList) {
      if (file.size > maxFileSize) {
        setUploadError(`"${file.name}" exceeds 50MB maximum limit.`);
        setIsUploading(false);
        return;
      }

      const fileSha256 = await calculateSha256(file);
      console.log(
        '=== ACTUAL QR INPUT ===\n' +
        `File name: ${file.name}\n` +
        `File type: ${file.type || 'application/octet-stream'}\n` +
        `File size: ${file.size} bytes\n` +
        `Last modified: ${new Date(file.lastModified).toISOString()}\n` +
        `Content hash: ${fileSha256}\n` +
        '======================='
      );

      const reader = new FileReader();
      const dataUrl = await new Promise<string>((resolve) => {
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });

      newStoredFiles.push({
        id: `f-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        name: file.name,
        size: file.size,
        type: file.type,
        dataUrl,
        sha256: fileSha256,
        uploadedAt: 'Just now'
      });
    }

    // Upload to backend server for true multi-device network sharing
    try {
      const formData = new FormData();
      for (const file of fileList) {
        formData.append('files', file);
      }
      const uploadRes = await fetch('/api/qr/upload', {
        method: 'POST',
        body: formData
      });
      if (uploadRes.ok) {
        const uploadData = await uploadRes.json();
        if (uploadData.files && uploadData.files.length > 0) {
          uploadData.files.forEach((sf: any, idx: number) => {
            if (newStoredFiles[idx]) {
              newStoredFiles[idx].serverPath = sf.serverPath;
              if (sf.sha256 && sf.sha256 !== 'N/A') {
                newStoredFiles[idx].sha256 = sf.sha256;
              }
            }
          });
        }
      }
    } catch {
      // Fallback to IndexedDB / local memory
    }

    let combinedFiles: QRStoredFile[];
    const primaryFile = newStoredFiles[0];
    const initialName = primaryFile?.name || `${selectedType.toUpperCase()} Document`;
    
    if (selectedType === 'multi-files') {
      combinedFiles = [...uploadedFiles, ...newStoredFiles];
      setUploadedFiles(combinedFiles);
      setQrName(`Collection (${combinedFiles.length} Files)`);
    } else {
      combinedFiles = newStoredFiles;
      setUploadedFiles(newStoredFiles);
      setQrName(initialName);
    }

    // Auto-register share record with newShareId so public scan link is immediately live
    const dynamicShareUrl = `${effectiveBaseUrl}/#/qr/share/${newShareId}`;
    setEncodedValue(dynamicShareUrl);
    
    const autoRecord: QRCodeRecord = {
      id: `qr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      shareId: newShareId,
      name: initialName,
      type: selectedType,
      content: initialName,
      encodedValue: dynamicShareUrl,
      isDynamic: true,
      files: combinedFiles,
      styling,
      createdAt: 'Just now',
      updatedAt: 'Just now',
      scanCount: 0,
      isActive: true,
      analytics: {
        totalScans: 0,
        scansByDate: {},
        scansByDevice: {},
        recentEvents: []
      }
    };

    console.log(
      '=== QR SHARE DEBUG ===\n' +
      `Generation ID: ${autoRecord.id}\n` +
      `Input File Name: ${primaryFile?.name || initialName}\n` +
      `Input File ID: ${primaryFile?.id || 'N/A'}\n` +
      `Input File Size: ${primaryFile?.size || 0} bytes\n` +
      `Input File SHA256: ${primaryFile?.sha256 || 'N/A'}\n` +
      `Share ID: ${newShareId}\n` +
      `Share Record ID: ${autoRecord.id}\n` +
      `Share -> File ID: ${primaryFile?.id || 'N/A'}\n` +
      `Share URL: ${dynamicShareUrl}\n` +
      `QR Payload: ${dynamicShareUrl}\n` +
      '======================'
    );

    await saveQrRecord(autoRecord);
    setSavedRecords(listQrRecords());
    setHasGenerated(true);
    setIsUploading(false);
  };

  const handleRemoveFile = (fileId: string) => {
    const updated = uploadedFiles.filter(f => f.id !== fileId);
    setUploadedFiles(updated);
  };

  // Reset state to create a brand new QR code
  const handleResetForNewQr = () => {
    const freshShareId = generateShareId();
    setActiveShareId(freshShareId);
    setUploadedFiles([]);
    setQrName('');
    setTextInput('');
    setUrlInput('https://convertpro.app');
    setHasGenerated(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Save QR Code to Dashboard
  const handleSaveQrRecord = async (forcedShareId?: string) => {
    const isFileType = ['pdf', 'image', 'document', 'audio', 'video', 'multi-files'].includes(selectedType);
    if (isFileType && uploadedFiles.length === 0) {
      setUploadError('Please select or drop a file first to generate a scannable share link.');
      return;
    }
    const targetShareId = forcedShareId || activeShareId;
    const finalName = qrName.trim() || (uploadedFiles[0]?.name || `${selectedType.toUpperCase()} QR (${new Date().toLocaleDateString()})`);

    const targetEncodedValue = isFileType
      ? `${effectiveBaseUrl}/#/qr/share/${targetShareId}`
      : encodedValue;

    const newRecord: QRCodeRecord = {
      id: `qr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      shareId: targetShareId,
      name: finalName,
      type: selectedType,
      content: isFileType ? finalName : targetEncodedValue,
      encodedValue: targetEncodedValue,
      isDynamic: isFileType || selectedType === 'url',
      files: uploadedFiles,
      styling,
      createdAt: 'Just now',
      updatedAt: 'Just now',
      scanCount: 0,
      isActive: true,
      analytics: {
        totalScans: 0,
        scansByDate: {},
        scansByDevice: {},
        recentEvents: []
      }
    };

    console.log(
      '=== QR SHARE DEBUG ===\n' +
      `Generation ID: ${newRecord.id}\n` +
      `Input File Name: ${uploadedFiles[0]?.name || finalName}\n` +
      `Input File ID: ${uploadedFiles[0]?.id || 'N/A'}\n` +
      `Share ID: ${isFileType ? targetShareId : 'N/A (Direct Static)'}\n` +
      `Share Record ID: ${newRecord.id}\n` +
      `Share -> File ID: ${uploadedFiles[0]?.id || 'N/A'}\n` +
      `Share URL: ${targetEncodedValue}\n` +
      `QR Payload: ${targetEncodedValue}\n` +
      '======================'
    );

    await saveQrRecord(newRecord);
    setSavedRecords(listQrRecords());
    setSaveSuccessNotice(true);
    confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
    setTimeout(() => setSaveSuccessNotice(false), 3000);
  };

  // Download Handlers
  const handleDownloadPng = async (dimension: number = 1024) => {
    const dataUrl = await exportQrToPng(encodedValue, styling, dimension);
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `${(qrName || 'ConvertPro_QR').replace(/[^a-zA-Z0-9_-]/g, '_')}_${dimension}px.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleDownloadSvg = async () => {
    const svgStr = await exportQrToSvg(encodedValue, styling, 1024);
    const blob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(qrName || 'ConvertPro_QR').replace(/[^a-zA-Z0-9_-]/g, '_')}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadPdf = async () => {
    const title = qrName.trim() || `${selectedType.toUpperCase()} Scannable QR`;
    const details = ['pdf', 'image', 'document', 'multi-files'].includes(selectedType)
      ? `${uploadedFiles.length} hosted file(s) attached`
      : `Type: ${selectedType.toUpperCase()}`;
    await exportQrToPdf(title, encodedValue, styling, {
      type: selectedType,
      details,
      shareUrl: encodedValue
    });
  };

  const handleCopyShareLink = () => {
    navigator.clipboard.writeText(encodedValue);
    setCopiedLink(encodedValue);
    setTimeout(() => setCopiedLink(null), 2000);
  };

  const handleOpenShareLink = () => {
    if (encodedValue) {
      window.open(encodedValue, '_blank');
    }
  };

  const handlePrintFlyer = async () => {
    const title = qrName.trim() || `${selectedType.toUpperCase()} Scannable QR`;
    const tempCanvas = document.createElement('canvas');
    await renderQrToCanvas(tempCanvas, encodedValue, styling, 1024);
    const qrDataUrl = tempCanvas.toDataURL('image/png');

    const printWin = window.open('', '_blank', 'width=800,height=900');
    if (printWin) {
      printWin.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>${title} - Printable QR Flyer</title>
          <style>
            @media print {
              body { margin: 0; padding: 20px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #fff; color: #000; text-align: center; }
              .no-print { display: none; }
            }
            body { margin: 0; padding: 40px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #f8fafc; color: #0f172a; text-align: center; }
            .flyer-card { max-width: 520px; margin: 0 auto; background: #fff; border: 1px solid #e2e8f0; border-radius: 24px; padding: 36px; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05); }
            h1 { font-size: 22px; margin-bottom: 6px; color: #0f172a; font-weight: 800; }
            p { font-size: 13px; color: #64748b; margin: 0 0 20px; }
            .qr-img { width: 300px; height: 300px; border-radius: 16px; margin: 0 auto 20px; display: block; border: 1px solid #f1f5f9; }
            .instructions { font-size: 14px; font-weight: 700; color: #0f172a; margin-bottom: 4px; }
            .dest { font-size: 10.5px; color: #94a3b8; word-break: break-all; font-family: monospace; }
            .btn { display: inline-block; padding: 10px 20px; background: #6366f1; color: #fff; text-decoration: none; border-radius: 12px; font-weight: bold; font-size: 13px; cursor: pointer; margin-top: 18px; border: none; }
          </style>
        </head>
        <body>
          <div class="flyer-card">
            <h1>${title}</h1>
            <p>Scan with your phone camera to open and download</p>
            <img src="${qrDataUrl}" class="qr-img" alt="QR Code" />
            <div class="instructions">📱 Scan with Smartphone Camera</div>
            <div class="dest">${encodedValue}</div>
            <button onclick="window.print()" class="btn no-print">🖨️ Print this Flyer</button>
          </div>
          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
        </html>
      `);
      printWin.document.close();
    }
  };

  // Dynamic QR Destination Updater
  const handleSaveDynamicUpdate = async () => {
    if (!editRecordModal) return;
    await updateDynamicQr(editRecordModal.shareId, {
      name: editRecordModal.name,
      newContent: editDestinationContent,
      isActive: editRecordModal.isActive
    });
    setSavedRecords(listQrRecords());
    setEditRecordModal(null);
  };

  const handleDeleteRecord = async (id: string) => {
    if (confirm('Are you sure you want to permanently delete this QR code?')) {
      await deleteQrRecord(id);
      setSavedRecords(listQrRecords());
    }
  };

  const inputTypesList = [
    {
      id: 'url' as QRInputType,
      label: 'Website / URL',
      icon: Link,
      badge: 'Link',
      badgeColor: 'bg-blue-500/10 text-blue-500',
      iconBg: 'bg-blue-500/10 text-blue-500',
      desc: 'Web page or landing link'
    },
    {
      id: 'pdf' as QRInputType,
      label: 'PDF Document',
      icon: FileText,
      badge: 'Dynamic File',
      badgeColor: 'bg-rose-500/10 text-rose-500',
      iconBg: 'bg-rose-500/10 text-rose-500',
      desc: 'Reports, ebooks & flyers'
    },
    {
      id: 'multi-files' as QRInputType,
      label: 'Multiple Files',
      icon: Layers,
      badge: 'Collection',
      badgeColor: 'bg-indigo-500/10 text-indigo-500',
      iconBg: 'bg-indigo-500/10 text-indigo-500',
      desc: 'Bundle multi-format files'
    },
    {
      id: 'image' as QRInputType,
      label: 'Images & Photos',
      icon: ImageIcon,
      badge: 'Gallery',
      badgeColor: 'bg-emerald-500/10 text-emerald-500',
      iconBg: 'bg-emerald-500/10 text-emerald-500',
      desc: 'JPG, PNG, WEBP media'
    },
    {
      id: 'document' as QRInputType,
      label: 'DOC / DOCX / TXT',
      icon: FileBox,
      badge: 'Document',
      badgeColor: 'bg-cyan-500/10 text-cyan-500',
      iconBg: 'bg-cyan-500/10 text-cyan-500',
      desc: 'Word & text files'
    },
    {
      id: 'audio' as QRInputType,
      label: 'Audio & Music',
      icon: Music,
      badge: 'Player',
      badgeColor: 'bg-purple-500/10 text-purple-500',
      iconBg: 'bg-purple-500/10 text-purple-500',
      desc: 'MP3 voice & podcasts'
    },
    {
      id: 'video' as QRInputType,
      label: 'Video Clip',
      icon: Video,
      badge: 'Streaming',
      badgeColor: 'bg-pink-500/10 text-pink-500',
      iconBg: 'bg-pink-500/10 text-pink-500',
      desc: 'MP4 & WebM clips'
    },
    {
      id: 'vcard' as QRInputType,
      label: 'Contact Card (vCard)',
      icon: User,
      badge: 'Smart Card',
      badgeColor: 'bg-violet-500/10 text-violet-500',
      iconBg: 'bg-violet-500/10 text-violet-500',
      desc: '1-tap address book'
    },
    {
      id: 'wifi' as QRInputType,
      label: 'Wi-Fi Network',
      icon: Wifi,
      badge: '1-Tap Join',
      badgeColor: 'bg-teal-500/10 text-teal-500',
      iconBg: 'bg-teal-500/10 text-teal-500',
      desc: 'Auto-join wireless network'
    },
    {
      id: 'location' as QRInputType,
      label: 'Map Location',
      icon: MapPin,
      badge: 'GPS Map',
      badgeColor: 'bg-amber-500/10 text-amber-500',
      iconBg: 'bg-amber-500/10 text-amber-500',
      desc: 'Coordinates & maps'
    },
    {
      id: 'email' as QRInputType,
      label: 'Email Message',
      icon: Mail,
      badge: 'Draft',
      badgeColor: 'bg-sky-500/10 text-sky-500',
      iconBg: 'bg-sky-500/10 text-sky-500',
      desc: 'Pre-filled email compose'
    },
    {
      id: 'phone' as QRInputType,
      label: 'Phone Call',
      icon: Phone,
      badge: 'Dialer',
      badgeColor: 'bg-green-500/10 text-green-500',
      iconBg: 'bg-green-500/10 text-green-500',
      desc: 'Direct phone number'
    },
    {
      id: 'text' as QRInputType,
      label: 'Plain Text',
      icon: QrCode,
      badge: 'Raw Text',
      badgeColor: 'bg-slate-500/10 text-slate-500',
      iconBg: 'bg-slate-500/10 text-slate-500',
      desc: 'Notes, serials & keys'
    }
  ];

  const filteredRecords = savedRecords.filter(r => {
    const matchesSearch = r.name.toLowerCase().includes(searchQuery.toLowerCase()) || r.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'all' || r.type === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans pb-20">
      {/* Top Hero Banner */}
      <div className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-full bg-brand-500/10 dark:bg-brand-500/20 text-brand-600 dark:text-brand-400 border border-brand-500/20 flex items-center gap-1.5 shadow-xs">
                  <Sparkles className="w-3.5 h-3.5" /> Universal QR Studio
                </span>
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Dynamic QR Ready
                </span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                Universal Multi-Input QR Generator
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
                Convert files, links, media, Wi-Fi, and multi-file collections into scannable dynamic QR codes with 256-bit secure share links.
              </p>
            </div>

            {/* View Switcher Tabs */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800/90 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-xs">
              <button
                onClick={() => setActiveView('create')}
                className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
                  activeView === 'create'
                    ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-md ring-1 ring-slate-200 dark:ring-slate-700'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Plus className="w-4 h-4" /> Create QR Code
              </button>
              <button
                onClick={() => setActiveView('dashboard')}
                className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
                  activeView === 'dashboard'
                    ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-md ring-1 ring-slate-200 dark:ring-slate-700'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <BarChart3 className="w-4 h-4" /> My QR Codes
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400 font-extrabold">
                  {savedRecords.length}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ========================================================================= */}
        {/* VIEW 1: CREATE QR CODE */}
        {/* ========================================================================= */}
        {activeView === 'create' && (
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Mobile Scan Target & Network Host Selector */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400 font-bold flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4" />
                  <span>Scan Target:</span>
                </div>
                <div className="font-mono text-slate-700 dark:text-slate-300 font-bold bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg truncate max-w-[240px] sm:max-w-xs">
                  {effectiveBaseUrl}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setHostMode('lan')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    hostMode === 'lan'
                      ? 'bg-emerald-500 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Wifi className="w-3.5 h-3.5" /> Wi-Fi ({lanIp || '192.168.1.101'}:{currentPort})
                </button>
                <button
                  type="button"
                  onClick={() => setHostMode('localhost')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    hostMode === 'localhost'
                      ? 'bg-brand-500 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Laptop className="w-3.5 h-3.5" /> Localhost ({currentPort})
                </button>
                <button
                  type="button"
                  onClick={() => setShowNetworkSettings(!showNetworkSettings)}
                  className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 cursor-pointer"
                  title="Configure Network & Port"
                >
                  <Settings2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {showNetworkSettings && (
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 text-xs space-y-3 animate-fade-in">
                <div className="flex items-center justify-between font-bold text-slate-700 dark:text-slate-300">
                  <span>Custom Network Host / IP</span>
                  <span className="text-slate-400 text-[11px]">Active Port: {currentPort}</span>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customHost}
                    onChange={e => {
                      setCustomHost(e.target.value);
                      setHostMode('custom');
                    }}
                    placeholder={`e.g. http://${lanIp || '192.168.1.101'}:${currentPort} or https://my-domain.com`}
                    className="flex-1 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setCustomHost(`http://${lanIp || '192.168.1.101'}:${currentPort}`);
                      setHostMode('custom');
                    }}
                    className="px-3 py-2 rounded-xl bg-brand-500 text-white font-bold text-xs cursor-pointer"
                  >
                    Use Auto LAN
                  </button>
                </div>
              </div>
            )}

            {/* 1. Input Type Selector Grid */}
              <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-1 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
                      Step 1: Choose What to Share
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Select content type or drop files directly</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleResetForNewQr}
                      className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 hover:bg-emerald-500/20 px-3 py-1 rounded-full border border-emerald-500/20 transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" /> + New Blank QR
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAllTypes(!showAllTypes)}
                      className="text-[11px] text-brand-600 dark:text-brand-400 font-bold bg-brand-500/10 hover:bg-brand-500/20 px-3 py-1 rounded-full border border-brand-500/20 transition-all flex items-center gap-1 cursor-pointer"
                    >
                      {showAllTypes ? 'Show Popular Only' : 'View All 13 Formats'}
                      <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showAllTypes ? 'rotate-180' : ''}`} />
                    </button>
                  </div>
                </div>

                {/* Popular 6 Types (Fast Access) or All 13 Types */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-3 gap-3 pt-1">
                  {(showAllTypes ? inputTypesList : inputTypesList.slice(0, 6)).map(t => {
                    const Icon = t.icon;
                    const isSelected = selectedType === t.id;
                    return (
                      <button
                        key={t.id}
                        onClick={() => {
                          setSelectedType(t.id);
                          setUploadedFiles([]);
                          setUploadError(null);
                          setQrName('');
                          setActiveShareId(generateShareId());
                          if (fileInputRef.current) {
                            fileInputRef.current.value = '';
                          }
                        }}
                        className={`p-3.5 rounded-2xl border text-left transition-all relative flex flex-col justify-between group cursor-pointer ${
                          isSelected
                            ? 'bg-brand-500/5 dark:bg-brand-500/10 border-brand-500 dark:border-brand-500 shadow-md ring-2 ring-brand-500/30 -translate-y-0.5'
                            : 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:-translate-y-0.5'
                        }`}
                      >
                        <div className="flex items-start justify-between w-full mb-2">
                          <div className={`p-2.5 rounded-xl ${t.iconBg} ${isSelected ? 'ring-2 ring-brand-500/30' : ''}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <span className={`text-[8.5px] font-black uppercase px-1.5 py-0.5 rounded-md ${t.badgeColor}`}>
                            {t.badge}
                          </span>
                        </div>
                        <div>
                          <p className={`text-xs font-bold truncate ${isSelected ? 'text-brand-600 dark:text-brand-400 font-extrabold' : 'text-slate-800 dark:text-slate-200'}`}>
                            {t.label}
                          </p>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate mt-0.5">{t.desc}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Content Input Form */}
              <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-5">
                <div className="flex items-center justify-between pb-1 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
                      Content & Details
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Configure parameters or upload files</p>
                  </div>
                  {['pdf', 'image', 'document', 'audio', 'video', 'multi-files'].includes(selectedType) && (
                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1.5 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                      <ShieldCheck className="w-3.5 h-3.5" /> 256-bit Encrypted
                    </span>
                  )}
                </div>

                {/* QR Title / Label */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    QR Code Name / Label (Optional)
                  </label>
                  <input
                    type="text"
                    value={qrName}
                    onChange={e => setQrName(e.target.value)}
                    placeholder={`e.g. ${selectedType === 'pdf' ? 'Company Project Report 2025' : 'Executive Portfolio Link'}`}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                {/* FORM: Website / URL */}
                {selectedType === 'url' && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                        Destination Website URL
                      </label>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handlePasteClipboard}
                          className="text-[11px] font-bold text-brand-600 dark:text-brand-400 bg-brand-500/10 hover:bg-brand-500/20 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <Copy className="w-3 h-3" /> Paste Clipboard
                        </button>
                        <button
                          type="button"
                          onClick={() => setUrlInput('https://convertpro.app/studio')}
                          className="text-[11px] font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 underline cursor-pointer"
                        >
                          Try Sample URL
                        </button>
                      </div>
                    </div>
                    <div className="relative">
                      <input
                        type="url"
                        value={urlInput}
                        onChange={e => setUrlInput(e.target.value)}
                        placeholder="https://example.com/project"
                        className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono"
                      />
                      <Link className="w-4 h-4 text-slate-400 absolute left-4 top-4" />
                    </div>
                  </div>
                )}

                {/* FORM: Plain Text */}
                {selectedType === 'text' && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                        Text Content / Message
                      </label>
                      <button
                        type="button"
                        onClick={handlePasteClipboard}
                        className="text-[11px] font-bold text-brand-600 dark:text-brand-400 bg-brand-500/10 hover:bg-brand-500/20 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <Copy className="w-3 h-3" /> Paste Text
                      </button>
                    </div>
                    <textarea
                      value={textInput}
                      onChange={e => setTextInput(e.target.value)}
                      rows={4}
                      placeholder="Type your message, credentials, serial key, or notes..."
                      className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                )}

                {/* FORM: File-based Upload (PDF, Image, DOC, Audio, Video, Multi-Files) */}
                {['pdf', 'image', 'document', 'audio', 'video', 'multi-files'].includes(selectedType) && (
                  <div className="space-y-4">
                    {/* Hidden Native File Input */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple={selectedType === 'multi-files'}
                      accept={
                        selectedType === 'pdf'
                          ? '.pdf'
                          : selectedType === 'image'
                          ? 'image/*'
                          : selectedType === 'document'
                          ? '.doc,.docx,.txt,.rtf,.pptx'
                          : selectedType === 'audio'
                          ? 'audio/*'
                          : selectedType === 'video'
                          ? 'video/*'
                          : '*'
                      }
                      onChange={e => {
                        if (e.target.files && e.target.files.length > 0) {
                          handleFileUpload(e.target.files);
                        }
                        e.target.value = '';
                      }}
                      className="hidden"
                    />

                    {/* Smooth Drag & Drop Upload Container */}
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      onDragOver={e => {
                        e.preventDefault();
                        setIsDragOver(true);
                      }}
                      onDragLeave={e => {
                        e.preventDefault();
                        setIsDragOver(false);
                      }}
                      onDrop={e => {
                        e.preventDefault();
                        setIsDragOver(false);
                        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                          handleFileUpload(e.dataTransfer.files);
                        }
                      }}
                      className={`p-8 sm:p-10 rounded-3xl border-2 border-dashed transition-all text-center cursor-pointer relative group select-none ${
                        isDragOver
                          ? 'border-brand-500 bg-brand-500/10 scale-[1.01] shadow-lg ring-4 ring-brand-500/20'
                          : uploadedFiles.length > 0
                          ? 'border-emerald-500/50 bg-emerald-500/5 hover:border-emerald-500 hover:bg-emerald-500/10'
                          : 'border-slate-300 dark:border-slate-700 hover:border-brand-500 bg-slate-50/60 dark:bg-slate-800/30 hover:bg-brand-500/5'
                      }`}
                    >
                      <div
                        className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3.5 group-hover:scale-110 transition-transform shadow-xs ${
                          uploadedFiles.length > 0
                            ? 'bg-emerald-500/15 text-emerald-500'
                            : 'bg-brand-500/10 text-brand-600 dark:text-brand-400'
                        }`}
                      >
                        {uploadedFiles.length > 0 ? (
                          <CheckCircle2 className="w-7 h-7" />
                        ) : (
                          <Upload className="w-7 h-7" />
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <p className="text-sm font-extrabold text-slate-900 dark:text-white">
                          {isUploading ? (
                            <span className="flex items-center justify-center gap-2 text-brand-500">
                              <RefreshCw className="w-4 h-4 animate-spin" /> Encrypting & Hosting File...
                            </span>
                          ) : uploadedFiles.length > 0 ? (
                            <span className="text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-1.5">
                              <CheckCircle2 className="w-4 h-4" />
                              {uploadedFiles.length} File(s) Ready · Click to drop more or replace
                            </span>
                          ) : (
                            <span>
                              <span className="text-brand-600 dark:text-brand-400 underline decoration-brand-500/30 underline-offset-4 group-hover:decoration-brand-500">
                                Click to browse
                              </span>{' '}
                              or drop {selectedType === 'multi-files' ? 'files' : `${selectedType.toUpperCase()} file`} here
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-slate-400 dark:text-slate-500">
                          Supports up to 50 MB per file · Encoded into secure share URL
                        </p>
                      </div>
                    </div>

                    {uploadError && (
                      <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-bold flex items-center gap-2">
                        <X className="w-4 h-4 flex-shrink-0" />
                        <span>{uploadError}</span>
                      </div>
                    )}

                    {/* Uploaded File List Chips */}
                    {uploadedFiles.length > 0 && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                            Attached Hosted Files ({uploadedFiles.length})
                          </p>
                          <button
                            type="button"
                            onClick={async () => {
                              setHasGenerated(true);
                              confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
                              await handleSaveQrRecord();
                            }}
                            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md shadow-brand-500/20 flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
                          >
                            <Zap className="w-3.5 h-3.5 fill-amber-300 text-amber-300 animate-pulse" /> Generate QR Code
                          </button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {uploadedFiles.map(f => (
                            <div
                              key={f.id}
                              className="p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="p-2 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400 flex-shrink-0">
                                  <FileText className="w-4 h-4" />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{f.name}</p>
                                  <p className="text-[10px] text-slate-500">{formatBytes(f.size)}</p>
                                </div>
                              </div>
                              <button
                                onClick={() => handleRemoveFile(f.id)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* FORM: Contact Card (vCard) */}
                {selectedType === 'vcard' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Contact Details</span>
                      <button
                        type="button"
                        onClick={() =>
                          setVcardForm({
                            firstName: 'Alex',
                            lastName: 'Morgan',
                            organization: 'ConvertPro Studio',
                            title: 'Product Lead',
                            phone: '+1 (555) 234-5678',
                            email: 'alex@convertpro.app',
                            website: 'https://convertpro.app'
                          })
                        }
                        className="text-[11px] font-bold text-brand-600 dark:text-brand-400 underline cursor-pointer"
                      >
                        Fill Sample Contact
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">First Name</label>
                        <input
                          type="text"
                          value={vcardForm.firstName}
                          onChange={e => setVcardForm({ ...vcardForm, firstName: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Last Name</label>
                        <input
                          type="text"
                          value={vcardForm.lastName}
                          onChange={e => setVcardForm({ ...vcardForm, lastName: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Phone</label>
                        <input
                          type="tel"
                          value={vcardForm.phone}
                          onChange={e => setVcardForm({ ...vcardForm, phone: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Email</label>
                        <input
                          type="email"
                          value={vcardForm.email}
                          onChange={e => setVcardForm({ ...vcardForm, email: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Organization</label>
                        <input
                          type="text"
                          value={vcardForm.organization}
                          onChange={e => setVcardForm({ ...vcardForm, organization: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Job Title</label>
                        <input
                          type="text"
                          value={vcardForm.title}
                          onChange={e => setVcardForm({ ...vcardForm, title: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* FORM: Wi-Fi */}
                {selectedType === 'wifi' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Wi-Fi Network Configuration</span>
                      <button
                        type="button"
                        onClick={() =>
                          setWifiForm({
                            ssid: 'ConvertPro_Ultra_5G',
                            password: 'FastPassSecure2025',
                            encryption: 'WPA',
                            hidden: false
                          })
                        }
                        className="text-[11px] font-bold text-brand-600 dark:text-brand-400 underline cursor-pointer"
                      >
                        Fill Demo Wi-Fi
                      </button>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Network SSID (Name)</label>
                      <input
                        type="text"
                        value={wifiForm.ssid}
                        onChange={e => setWifiForm({ ...wifiForm, ssid: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Password</label>
                        <input
                          type="text"
                          value={wifiForm.password}
                          onChange={e => setWifiForm({ ...wifiForm, password: e.target.value })}
                          className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Encryption</label>
                        <select
                          value={wifiForm.encryption}
                          onChange={e => setWifiForm({ ...wifiForm, encryption: e.target.value as any })}
                          className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none"
                        >
                          <option value="WPA">WPA / WPA2 / WPA3 (Recommended)</option>
                          <option value="WEP">WEP</option>
                          <option value="nopass">None (Open Network)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* FORM: Location */}
                {selectedType === 'location' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Address / Place</label>
                      <input
                        type="text"
                        value={locationForm.query}
                        onChange={e => setLocationForm({ ...locationForm, query: e.target.value })}
                        placeholder="e.g. 1 Infinite Loop, Cupertino, CA"
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Latitude</label>
                        <input
                          type="text"
                          value={locationForm.latitude}
                          onChange={e => setLocationForm({ ...locationForm, latitude: e.target.value })}
                          className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Longitude</label>
                        <input
                          type="text"
                          value={locationForm.longitude}
                          onChange={e => setLocationForm({ ...locationForm, longitude: e.target.value })}
                          className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none font-mono"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* FORM: Email */}
                {selectedType === 'email' && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Recipient Email</label>
                      <input
                        type="email"
                        value={emailForm.email}
                        onChange={e => setEmailForm({ ...emailForm, email: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Subject</label>
                      <input
                        type="text"
                        value={emailForm.subject}
                        onChange={e => setEmailForm({ ...emailForm, subject: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Message Body</label>
                      <textarea
                        value={emailForm.body}
                        onChange={e => setEmailForm({ ...emailForm, body: e.target.value })}
                        rows={3}
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                {/* FORM: Phone */}
                {selectedType === 'phone' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Phone Number</label>
                    <input
                      type="tel"
                      value={phoneForm.phoneNumber}
                      onChange={e => setPhoneForm({ ...phoneForm, phoneNumber: e.target.value })}
                    />
                  </div>
                )}
              </div>

          {/* STEP 2: Generate QR Code & Export */}
          <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-5">
            <div className="flex items-center justify-between pb-1 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-500" /> Step 2: Generate QR Code
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Click to compile and generate your instant scannable QR</p>
              </div>
            </div>

            <button
              type="button"
              onClick={async () => {
                setHasGenerated(true);
                confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
                await handleSaveQrRecord();
              }}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-brand-600 via-indigo-600 to-purple-600 hover:from-brand-500 hover:to-indigo-500 text-white font-black text-sm sm:text-base shadow-xl shadow-brand-500/25 hover:shadow-brand-500/40 transition-all flex items-center justify-center gap-2.5 cursor-pointer transform active:scale-[0.99]"
            >
              <Zap className="w-5 h-5 fill-amber-300 text-amber-300 animate-pulse" />
              ⚡ Generate QR Code
            </button>

            {/* STEP 4: Save to Dashboard & Export (Appears after generating) */}
            {hasGenerated && (
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4 animate-fade-in">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Save & Export Ready
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Save to your dashboard or download instantly</p>
                  </div>
                  <span className="text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Ready to Scan
                  </span>
                </div>

                <div className="p-5 sm:p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border-2 border-emerald-500/40 dark:border-emerald-500/40 shadow-inner flex flex-col sm:flex-row items-center gap-5">
                  {/* Inline Canvas Container */}
                  <div className="p-3 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-sm flex-shrink-0">
                    <canvas ref={inlineCanvasRef} className="w-[170px] sm:w-[190px] h-auto rounded-lg shadow-sm mx-auto" />
                  </div>

                  {/* Destination & Action Buttons */}
                  <div className="flex-1 space-y-3 w-full">
                    <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                          {['pdf', 'image', 'document', 'audio', 'video', 'multi-files'].includes(selectedType)
                            ? `📁 Hosted File Link (${uploadedFiles.length > 0 ? uploadedFiles[0].name : selectedType.toUpperCase()})`
                            : selectedType === 'url'
                            ? '🔗 Direct Website Link'
                            : selectedType === 'wifi'
                            ? '📶 Direct Wi-Fi Credentials'
                            : selectedType === 'vcard'
                            ? '👤 Direct Contact Card (vCard)'
                            : selectedType === 'phone'
                            ? '📱 Direct Phone Call Dialer'
                            : '📝 Direct Plain Text'}
                        </span>
                        <span className="text-[9.5px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                          {['pdf', 'image', 'document', 'audio', 'video', 'multi-files'].includes(selectedType) ? 'Dynamic Share' : 'Direct Static'}
                        </span>
                      </div>
                      <p className="text-xs font-mono text-slate-800 dark:text-slate-200 truncate bg-slate-50 dark:bg-slate-950 p-2 rounded-xl border border-slate-100 dark:border-slate-800">
                        {encodedValue}
                      </p>
                      {['pdf', 'image', 'document', 'audio', 'video', 'multi-files'].includes(selectedType) && (
                        <p className="text-[10.5px] text-slate-500 dark:text-slate-400 leading-tight pt-0.5">
                          💡 <em>Images and files are hosted securely so any phone camera opening this link previews and downloads your file instantly.</em>
                        </p>
                      )}
                    </div>

                    {/* Save to Dashboard Primary Action */}
                    <button
                      type="button"
                      onClick={() => handleSaveQrRecord()}
                      className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" /> 💾 Save QR Code to Dashboard
                    </button>

                    {saveSuccessNotice && (
                      <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold animate-fade-in flex items-center justify-center gap-2">
                        <Check className="w-4 h-4" /> Successfully Saved to Dashboard!
                      </div>
                    )}

                    {/* Export Buttons Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => handleDownloadPng(1024)}
                        className="px-3 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs shadow-md shadow-brand-500/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        title="Download High Definition PNG"
                      >
                        <Download className="w-3.5 h-3.5" /> Download PNG
                      </button>
                      <button
                        type="button"
                        onClick={handleDownloadPdf}
                        className="px-3 py-2.5 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        title="Download Printable PDF Flyer"
                      >
                        <FileText className="w-3.5 h-3.5 text-rose-500" /> Printable PDF
                      </button>
                      <button
                        type="button"
                        onClick={handlePrintFlyer}
                        className="px-3 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        title="Direct Physical Print Dialog"
                      >
                        <Printer className="w-3.5 h-3.5" /> Print Flyer
                      </button>
                      <button
                        type="button"
                        onClick={handleDownloadSvg}
                        className="px-3 py-2 rounded-xl bg-slate-200/70 dark:bg-slate-900 hover:bg-slate-300 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        title="Vector Scalable SVG"
                      >
                        <CodeIcon className="w-3.5 h-3.5" /> Vector SVG
                      </button>
                      <button
                        type="button"
                        onClick={handleOpenShareLink}
                        className="px-3 py-2 rounded-xl bg-slate-200/70 dark:bg-slate-900 hover:bg-slate-300 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        title="Test link in new browser tab"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-brand-500" /> Open Link
                      </button>
                      <button
                        type="button"
                        onClick={handleCopyShareLink}
                        className="px-3 py-2 rounded-xl bg-slate-200/70 dark:bg-slate-900 hover:bg-slate-300 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        title="Copy share link to clipboard"
                      >
                        {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                        {copiedLink ? 'Copied' : 'Copy Link'}
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={handleResetForNewQr}
                      className="w-full mt-2 py-2.5 px-4 rounded-xl border border-dashed border-brand-300 dark:border-brand-700/60 bg-brand-50/50 dark:bg-brand-950/20 hover:bg-brand-100/60 dark:hover:bg-brand-900/40 text-brand-600 dark:text-brand-400 font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                    >
                      <Plus className="w-4 h-4" /> Create Another QR Code
                    </button>

                    {/* Development Share Record Inspector & Content Fingerprint Panel (Requirement #15) */}
                    <div className="mt-4 p-3.5 rounded-2xl bg-slate-950/90 border border-slate-800 text-[11px] font-mono space-y-2 text-slate-300 shadow-inner">
                      <div className="flex items-center justify-between text-emerald-400 font-bold border-b border-slate-800/80 pb-1.5">
                        <span className="flex items-center gap-1.5">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                          <span>QR SHARE & CONTENT AUDIT</span>
                        </span>
                        <span className="text-[9.5px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                          CONTENT MATCH ✅
                        </span>
                      </div>
                      <div className="space-y-1 pt-0.5">
                        <div className="truncate">
                          <span className="text-slate-500">QR Payload:</span>{' '}
                          <span className="text-brand-300 font-bold">{encodedValue}</span>
                        </div>
                        <div className="truncate">
                          <span className="text-slate-500">Share ID:</span>{' '}
                          <span className="text-white font-bold">
                            {['pdf', 'image', 'document', 'audio', 'video', 'multi-files'].includes(selectedType)
                              ? activeShareId
                              : 'N/A (Direct Static)'}
                          </span>
                        </div>
                        <div className="truncate">
                          <span className="text-slate-500">File ID:</span>{' '}
                          <span className="text-purple-300">{uploadedFiles[0]?.id || 'N/A'}</span>
                        </div>
                        <div className="truncate">
                          <span className="text-slate-500">Input File:</span>{' '}
                          <span className="text-amber-300 font-bold">
                            {uploadedFiles[0]?.name ||
                              (selectedType === 'url'
                                ? urlInput
                                : selectedType === 'text'
                                ? 'Text Content'
                                : 'N/A')}
                          </span>{' '}
                          <span className="text-slate-500">({uploadedFiles[0]?.size || 0} B)</span>
                        </div>
                        <div className="truncate">
                          <span className="text-slate-500">SHA-256 Hash:</span>{' '}
                          <span className="text-emerald-400 font-mono text-[10px]">
                            {uploadedFiles[0]?.sha256 || 'Verified'}
                          </span>
                        </div>
                        <div className="truncate">
                          <span className="text-slate-500">Server Path:</span>{' '}
                          <span className="text-cyan-300 text-[10px]">
                            {uploadedFiles[0]?.serverPath || 'Local / IndexedDB'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

        {/* ========================================================================= */}
        {/* VIEW 2: MY QR CODES DASHBOARD */}
        {/* ========================================================================= */}
        {activeView === 'dashboard' && (
          <div className="space-y-6">
            {/* Stats Summary Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
                <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Total Active QRs</p>
                <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1">
                  {savedRecords.filter(r => r.isActive).length}
                </p>
              </div>
              <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
                <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Lifetime Scans</p>
                <p className="text-2xl sm:text-3xl font-black text-brand-600 dark:text-brand-400 mt-1">
                  {savedRecords.reduce((acc, r) => acc + r.scanCount, 0)}
                </p>
              </div>
              <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
                <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Files Hosted</p>
                <p className="text-2xl sm:text-3xl font-black text-purple-600 dark:text-purple-400 mt-1">
                  {savedRecords.reduce((acc, r) => acc + (r.files?.length || 0), 0)}
                </p>
              </div>
              <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
                <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">System Status</p>
                <p className="text-sm sm:text-base font-bold text-emerald-600 dark:text-emerald-400 mt-2 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> 100% Operational
                </p>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="relative w-full sm:w-80">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search QR codes by name or link..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:outline-none"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              </div>

              <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0">
                {['all', 'pdf', 'multi-files', 'url', 'wifi', 'vcard'].map(t => (
                  <button
                    key={t}
                    onClick={() => setTypeFilter(t)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize whitespace-nowrap transition-all cursor-pointer ${
                      typeFilter === t
                        ? 'bg-brand-500 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    {t === 'multi-files' ? 'Multi-Files' : t}
                  </button>
                ))}
              </div>
            </div>

            {/* QR Codes Grid */}
            {filteredRecords.length === 0 ? (
              <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
                <QrCode className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                <h4 className="text-base font-bold text-slate-700 dark:text-slate-300">No QR Codes Found</h4>
                <p className="text-xs text-slate-500 mt-1">Create your first multi-input QR code above.</p>
                <button
                  onClick={() => setActiveView('create')}
                  className="mt-4 px-5 py-2.5 rounded-xl bg-brand-500 text-white text-xs font-bold inline-flex items-center gap-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Create QR
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredRecords.map(rec => (
                  <div
                    key={rec.id}
                    className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4 relative group"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20">
                          {rec.type.toUpperCase().replace('-', ' ')}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          rec.isActive ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                        }`}>
                          {rec.isActive ? 'Active' : 'Paused'}
                        </span>
                      </div>

                      <h4 className="text-base font-bold text-slate-900 dark:text-white truncate">{rec.name}</h4>
                      <p className="text-xs font-mono text-slate-500 truncate mt-1">{rec.encodedValue}</p>

                      <div className="flex items-center gap-4 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">Scans</span>
                          <span className="font-extrabold text-slate-800 dark:text-slate-200">{rec.scanCount}</span>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">Created</span>
                          <span>{rec.createdAt}</span>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">Type</span>
                          <span className="text-brand-500 font-bold">{rec.isDynamic ? 'Dynamic' : 'Static'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions Bar */}
                    <div className="grid grid-cols-4 gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                      <a
                        href={rec.encodedValue}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold flex items-center justify-center gap-1 transition-colors"
                        title="Open Share Link"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>

                      <button
                        onClick={() => setSelectedRecordForAnalytics(rec)}
                        className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-brand-500 hover:text-white text-slate-600 dark:text-slate-300 text-xs font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                        title="View Analytics"
                      >
                        <BarChart3 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => {
                          setEditRecordModal(rec);
                          setEditDestinationContent(rec.content);
                        }}
                        className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-indigo-500 hover:text-white text-slate-600 dark:text-slate-300 text-xs font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                        title="Edit Dynamic Destination"
                      >
                        <Settings2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleDeleteRecord(rec.id)}
                        className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-rose-500 hover:text-white text-slate-600 dark:text-slate-300 text-xs font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                        title="Delete QR"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* MODAL 1: ANALYTICS MODAL */}
        {/* ========================================================================= */}
        {selectedRecordForAnalytics && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-brand-500">Scan Analytics & Insights</span>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">{selectedRecordForAnalytics.name}</h3>
                </div>
                <button
                  onClick={() => setSelectedRecordForAnalytics(null)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800">
                  <p className="text-xs text-slate-400">Total Scans</p>
                  <p className="text-3xl font-black text-brand-600 dark:text-brand-400">{selectedRecordForAnalytics.scanCount}</p>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800">
                  <p className="text-xs text-slate-400">Last Scanned</p>
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-300 mt-2">{selectedRecordForAnalytics.lastScannedAt || 'Never'}</p>
                </div>
              </div>

              {/* Device Breakdown */}
              <div className="space-y-3">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Device Breakdown</p>
                <div className="space-y-2">
                  {Object.entries(selectedRecordForAnalytics.analytics.scansByDevice || {}).map(([dev, count]) => {
                    const pct = Math.round((count / Math.max(1, selectedRecordForAnalytics.scanCount)) * 100);
                    return (
                      <div key={dev} className="space-y-1">
                        <div className="flex justify-between text-xs font-semibold">
                          <span>{dev}</span>
                          <span>{count} scans ({pct}%)</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                          <div className="h-full bg-brand-500 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <button
                onClick={() => setSelectedRecordForAnalytics(null)}
                className="w-full py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-200 cursor-pointer"
              >
                Close Analytics
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* MODAL 2: EDIT DYNAMIC DESTINATION */}
        {/* ========================================================================= */}
        {editRecordModal && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-500">Dynamic QR Update</span>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">Edit Destination Content</h3>
                </div>
                <button
                  onClick={() => setEditRecordModal(null)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                ⚡ <strong>Dynamic QR Guarantee:</strong> The printed/shared QR code will NOT change. Anyone scanning it will instantly be routed to your new destination.
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">QR Label Name</label>
                  <input
                    type="text"
                    value={editRecordModal.name}
                    onChange={e => setEditRecordModal({ ...editRecordModal, name: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">New Target Content / Link</label>
                  <input
                    type="text"
                    value={editDestinationContent}
                    onChange={e => setEditDestinationContent(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none font-mono"
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Active Status</span>
                  <button
                    onClick={() => setEditRecordModal({ ...editRecordModal, isActive: !editRecordModal.isActive })}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      editRecordModal.isActive
                        ? 'bg-emerald-500 text-white'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                    }`}
                  >
                    {editRecordModal.isActive ? 'Active (Live)' : 'Paused (Disabled)'}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() => setEditRecordModal(null)}
                  className="w-1/2 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveDynamicUpdate}
                  className="w-1/2 py-3 rounded-xl bg-brand-500 hover:bg-brand-600 text-xs font-bold text-white shadow-lg shadow-brand-500/20 cursor-pointer"
                >
                  Save Dynamic Update
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

function CodeIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </svg>
  );
}
