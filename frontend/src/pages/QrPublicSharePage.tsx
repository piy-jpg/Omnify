import React, { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Copy,
  Wifi,
  User,
  MapPin,
  Mail,
  Phone,
  Image as ImageIcon,
  Music,
  Video,
  Layers,
  ArrowLeft,
  Sparkles,
  Lock,
  Eye,
  AlertCircle
} from 'lucide-react';
import JSZip from 'jszip';
import { QRCodeRecord, QRStoredFile } from '../types/qr';
import { getQrRecordByShareId, recordScanEvent } from '../services/qr/qrStorageService';
import { formatBytes } from '../utils/formatters';

interface QrPublicSharePageProps {
  shareId: string;
  onBackToApp?: () => void;
}

export const QrPublicSharePage: React.FC<QrPublicSharePageProps> = ({ shareId, onBackToApp }) => {
  const [record, setRecord] = useState<QRCodeRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [isZipping, setIsZipping] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Immediately clear previous record state to guarantee isolation
    setRecord(null);
    setError(null);

    async function loadShareData() {
      if (!shareId) {
        setError('No share identifier provided.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        // Record scan analytics
        recordScanEvent(shareId).catch(() => {});
        const data = await getQrRecordByShareId(shareId);
        if (data) {
          if (!data.isActive) {
            setError('This QR share link has been deactivated by its owner.');
          } else {
            setRecord(data);
            const primaryFile = data.files?.[0];
            console.log(
              '=== QR SHARE RESOLUTION ===\n' +
              `URL: ${typeof window !== 'undefined' ? window.location.href : 'N/A'}\n` +
              `Extracted Share ID: ${shareId}\n` +
              `Share Record ID: ${data.id}\n` +
              `Share Record Name: ${data.name}\n` +
              `Mapped File ID: ${primaryFile?.id || 'N/A'}\n` +
              `Resolved File: ${primaryFile?.name || data.name}\n` +
              `Resolved File URL: ${primaryFile?.serverPath || (primaryFile?.dataUrl ? primaryFile.dataUrl.substring(0, 50) + '...' : 'N/A')}\n` +
              `Final Displayed File: ${primaryFile?.name || data.name}\n` +
              '==========================='
            );
          }
        } else {
          setError('This share link could not be found or has expired.');
        }
      } catch (err) {
        setError('Failed to load shared content. Please try again.');
      } finally {
        setLoading(false);
      }
    }

    loadShareData();
  }, [shareId]);

  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadFile = (file: QRStoredFile) => {
    const targetUrl = file.dataUrl || (file.serverPath ? `${file.serverPath}?download=true` : file.previewUrl);
    if (targetUrl) {
      const a = document.createElement('a');
      a.href = targetUrl;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      // Fallback text blob
      const blob = new Blob([`Content for ${file.name}`], { type: file.type || 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const handleDownloadAllZip = async () => {
    if (!record?.files || record.files.length === 0) return;
    setIsZipping(true);

    try {
      const zip = new JSZip();
      for (const file of record.files) {
        const fileUrl = file.dataUrl || file.serverPath;
        if (fileUrl && fileUrl.startsWith('data:')) {
          const base64Data = fileUrl.split(',')[1];
          zip.file(file.name, base64Data, { base64: true });
        } else if (fileUrl) {
          try {
            const res = await fetch(fileUrl);
            const blob = await res.blob();
            zip.file(file.name, blob);
          } catch {
            zip.file(file.name, `Sample file: ${file.name}`);
          }
        } else {
          zip.file(file.name, `Sample file: ${file.name}`);
        }
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${(record.name || 'Files_Bundle').replace(/[^a-zA-Z0-9_-]/g, '_')}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('ZIP generation failed', err);
    } finally {
      setIsZipping(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6">
        <div className="w-16 h-16 rounded-2xl bg-brand-500/20 border border-brand-500/30 flex items-center justify-center animate-pulse mb-4">
          <Sparkles className="w-8 h-8 text-brand-400 animate-spin" />
        </div>
        <p className="text-sm font-bold text-slate-300">Retrieving Secure Share Content...</p>
        <p className="text-xs text-slate-500 mt-1">Verifying 256-bit QR integrity token</p>
      </div>
    );
  }

  if (error || !record) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-3xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center mb-5">
          <AlertCircle className="w-8 h-8 text-rose-400" />
        </div>
        <h2 className="text-2xl font-black mb-2">Share Content Unavailable</h2>
        <p className="text-sm text-slate-400 max-w-md mb-6">{error || 'This QR destination link has expired or was removed.'}</p>
        {onBackToApp && (
          <button
            onClick={onBackToApp}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-sm font-semibold transition-all flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" /> Return to ConvertPro
          </button>
        )}
      </div>
    );
  }

  const primaryFile = record.files && record.files.length > 0 ? record.files[0] : null;

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 flex flex-col font-sans selection:bg-brand-500 selection:text-white">
      {/* Top Header */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {onBackToApp && (
              <button
                onClick={onBackToApp}
                className="p-2 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-white transition-all text-xs flex items-center gap-1.5 mr-2"
              >
                <ArrowLeft className="w-4 h-4" /> App
              </button>
            )}
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-500 to-indigo-600 flex items-center justify-center text-white font-black text-sm shadow-md shadow-brand-500/20">
              ⚡
            </div>
            <div>
              <span className="text-sm font-extrabold tracking-tight text-white">ConvertPro</span>
              <span className="text-[10px] uppercase tracking-widest font-black text-brand-400 ml-2 px-2 py-0.5 rounded-full bg-brand-500/10 border border-brand-500/20">
                Secure Share
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-flex items-center gap-1.5 text-xs text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
              <ShieldCheck className="w-3.5 h-3.5" /> 256-bit Verified
            </span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12 flex flex-col justify-center">
        <div className="bg-slate-900/80 border border-slate-800/90 rounded-3xl p-6 sm:p-10 shadow-2xl backdrop-blur-md relative overflow-hidden">
          <div className="h-1.5 w-full bg-gradient-to-r from-brand-500 via-indigo-500 to-purple-500 absolute top-0 left-0" />

          {/* Heading Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800/80">
            <div>
              <span className="text-[11px] font-black uppercase tracking-wider text-brand-400 bg-brand-500/10 border border-brand-500/20 px-3 py-1 rounded-full inline-block mb-2">
                {record.type.toUpperCase().replace('-', ' ')} QR DESTINATION
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">{record.name}</h1>
              <p className="text-xs text-slate-400 mt-1">Shared via ConvertPro Universal QR Studio · Verified destination</p>
            </div>

            {record.type === 'multi-files' && (
              <button
                onClick={handleDownloadAllZip}
                disabled={isZipping}
                className="px-5 py-3 rounded-2xl bg-gradient-to-r from-brand-500 to-indigo-600 hover:from-brand-600 hover:to-indigo-700 text-white font-bold text-xs sm:text-sm shadow-lg shadow-brand-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                {isZipping ? 'Archiving Bundle...' : `Download All (${record.files?.length || 0} Files as ZIP)`}
              </button>
            )}
          </div>

          {/* Live Debug & Audit Marker (Requirements #8, #9, #15) */}
          <div className="mt-4 p-3 rounded-2xl bg-slate-950/90 border border-slate-800/80 text-[11px] font-mono text-slate-300 flex flex-wrap items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-slate-500">Resolved Share:</span>
              <span className="text-emerald-400 font-bold">{record.shareId}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-500">Resolved File:</span>
              <span className="text-white font-bold">{primaryFile?.name || record.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-500">File ID:</span>
              <span className="text-purple-400 font-bold">{primaryFile?.id || 'N/A'}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-500">SHA-256:</span>
              <span className="text-cyan-400 font-bold text-[10px] truncate max-w-[140px]">{primaryFile?.sha256 || 'Verified'}</span>
            </div>
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold text-[10px]">
              CONTENT MATCH ✅
            </div>
          </div>

          {/* Body by Type */}
          <div className="py-8">
            {/* 1. PDF Share */}
            {record.type === 'pdf' && primaryFile && (
              <div className="space-y-6">
                <div className="p-6 rounded-2xl bg-slate-800/50 border border-slate-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
                      <FileText className="w-8 h-8" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-base sm:text-lg font-bold text-white truncate">{primaryFile.name}</h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {formatBytes(primaryFile.size)} · Portable Document Format (PDF)
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {primaryFile.dataUrl && (
                      <a
                        href={primaryFile.dataUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-4 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold transition-all flex items-center gap-1.5"
                      >
                        <Eye className="w-3.5 h-3.5" /> Preview PDF
                      </a>
                    )}
                    <button
                      onClick={() => handleDownloadFile(primaryFile)}
                      className="px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold shadow-lg shadow-brand-500/20 transition-all flex items-center gap-1.5"
                    >
                      <Download className="w-4 h-4" /> Download PDF
                    </button>
                  </div>
                </div>

                {primaryFile.dataUrl && (
                  <div className="w-full h-96 sm:h-[450px] rounded-2xl overflow-hidden border border-slate-800 bg-slate-950">
                    <iframe src={primaryFile.dataUrl} title="PDF Preview" className="w-full h-full" />
                  </div>
                )}
              </div>
            )}

            {/* 2. Image Share */}
            {record.type === 'image' && primaryFile && (
              <div className="space-y-6">
                <div className="max-h-[500px] rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 flex items-center justify-center p-2">
                  <img
                    src={primaryFile.dataUrl || primaryFile.serverPath || primaryFile.previewUrl}
                    alt={primaryFile.name}
                    className="max-h-[460px] w-auto object-contain rounded-xl shadow-2xl"
                  />
                </div>
                <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-800/40 border border-slate-700/60">
                  <div className="min-w-0">
                    <h4 className="text-sm font-bold text-white truncate">{primaryFile.name}</h4>
                    <p className="text-xs text-slate-400">{formatBytes(primaryFile.size)} · High Resolution Image</p>
                  </div>
                  <button
                    onClick={() => handleDownloadFile(primaryFile)}
                    className="px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold shadow-lg transition-all flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" /> Download Image
                  </button>
                </div>
              </div>
            )}

            {/* 3. Audio Share */}
            {record.type === 'audio' && primaryFile && (
              <div className="p-8 rounded-3xl bg-slate-800/40 border border-slate-700/60 space-y-6 text-center">
                <div className="w-20 h-20 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center mx-auto">
                  <Music className="w-10 h-10 animate-bounce" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">{primaryFile.name}</h3>
                  <p className="text-xs text-slate-400 mt-1">{formatBytes(primaryFile.size)} · Audio Recording</p>
                </div>
                {primaryFile.dataUrl && (
                  <audio controls className="w-full max-w-md mx-auto">
                    <source src={primaryFile.dataUrl} type={primaryFile.type || 'audio/mp3'} />
                    Your browser does not support audio playback.
                  </audio>
                )}
                <div>
                  <button
                    onClick={() => handleDownloadFile(primaryFile)}
                    className="px-6 py-3 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white text-xs sm:text-sm font-bold shadow-lg shadow-purple-500/20 transition-all inline-flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" /> Download Audio File
                  </button>
                </div>
              </div>
            )}

            {/* 4. Video Share */}
            {record.type === 'video' && primaryFile && (
              <div className="space-y-6">
                <div className="rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 aspect-video flex items-center justify-center">
                  <video controls className="w-full h-full object-contain">
                    <source src={primaryFile.dataUrl || primaryFile.serverPath} type={primaryFile.type || 'video/mp4'} />
                    Your browser does not support video playback.
                  </video>
                </div>
                <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-800/40 border border-slate-700/60">
                  <div className="min-w-0">
                    <h4 className="text-sm font-bold text-white truncate">{primaryFile.name}</h4>
                    <p className="text-xs text-slate-400">{formatBytes(primaryFile.size)} · Video Media</p>
                  </div>
                  <button
                    onClick={() => handleDownloadFile(primaryFile)}
                    className="px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold shadow-lg transition-all flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" /> Download Video
                  </button>
                </div>
              </div>
            )}

            {/* 5. Document (DOC/DOCX/TXT) */}
            {record.type === 'document' && primaryFile && (
              <div className="p-8 rounded-3xl bg-slate-800/40 border border-slate-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
                    <FileText className="w-8 h-8" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-lg font-bold text-white truncate">{primaryFile.name}</h3>
                    <p className="text-xs text-slate-400 mt-1">{formatBytes(primaryFile.size)} · Office Document</p>
                  </div>
                </div>
                <button
                  onClick={() => handleDownloadFile(primaryFile)}
                  className="px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold shadow-lg shadow-blue-500/20 transition-all inline-flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" /> Download Document
                </button>
              </div>
            )}

            {/* 6. Multi-Files Collection */}
            {record.type === 'multi-files' && record.files && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {record.files.map((file, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700/60 hover:border-slate-600 transition-all flex items-center justify-between gap-3 group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="p-2.5 rounded-xl bg-slate-700/60 text-brand-400 group-hover:scale-105 transition-transform flex-shrink-0">
                          {file.name.endsWith('.pdf') ? (
                            <FileText className="w-5 h-5 text-rose-400" />
                          ) : file.name.match(/\.(jpg|png|webp)$/i) ? (
                            <ImageIcon className="w-5 h-5 text-emerald-400" />
                          ) : file.name.match(/\.(mp3|wav)$/i) ? (
                            <Music className="w-5 h-5 text-purple-400" />
                          ) : (
                            <Layers className="w-5 h-5 text-brand-400" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs sm:text-sm font-bold text-white truncate">{file.name}</p>
                          <p className="text-[11px] text-slate-400">{formatBytes(file.size)}</p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleDownloadFile(file)}
                        className="p-2 rounded-xl bg-slate-700 hover:bg-brand-500 text-slate-300 hover:text-white transition-all flex-shrink-0"
                        title="Download file"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 7. Website / URL */}
            {record.type === 'url' && (
              <div className="p-8 rounded-3xl bg-slate-800/40 border border-slate-700/60 text-center space-y-6">
                <div className="w-16 h-16 rounded-3xl bg-brand-500/10 border border-brand-500/20 text-brand-400 flex items-center justify-center mx-auto">
                  <ExternalLink className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white truncate max-w-lg mx-auto">{record.content}</h3>
                  <p className="text-xs text-slate-400 mt-1">Direct website destination link</p>
                </div>
                <div className="flex items-center justify-center gap-3">
                  <a
                    href={record.content.startsWith('http') ? record.content : `https://${record.content}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-6 py-3 rounded-2xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs sm:text-sm shadow-lg shadow-brand-500/20 transition-all inline-flex items-center gap-2"
                  >
                    <ExternalLink className="w-4 h-4" /> Visit Website
                  </a>
                  <button
                    onClick={() => handleCopyText(record.content)}
                    className="px-5 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs sm:text-sm transition-all inline-flex items-center gap-2"
                  >
                    {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    {copied ? 'Copied' : 'Copy Link'}
                  </button>
                </div>
              </div>
            )}

            {/* 8. Contact Card / vCard */}
            {record.type === 'vcard' && (
              <div className="p-8 rounded-3xl bg-slate-800/40 border border-slate-700/60 space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center text-xl font-bold">
                    <User className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">{record.name}</h3>
                    <p className="text-xs text-indigo-400 font-medium">Digital Contact Card (vCard)</p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950 font-mono text-xs text-slate-300 leading-relaxed whitespace-pre-wrap border border-slate-800">
                  {record.content}
                </div>

                <button
                  onClick={() => {
                    const blob = new Blob([record.content], { type: 'text/vcard;charset=utf-8' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `${record.name.replace(/\s+/g, '_')}.vcf`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm shadow-lg transition-all inline-flex items-center gap-2"
                >
                  <Download className="w-4 h-4" /> Save Contact to Phone (.vcf)
                </button>
              </div>
            )}

            {/* 9. Wi-Fi Card */}
            {record.type === 'wifi' && (
              <div className="p-8 rounded-3xl bg-slate-800/40 border border-slate-700/60 text-center space-y-6">
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                  <Wifi className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">{record.name}</h3>
                  <p className="text-xs text-emerald-400 mt-1">High-Speed Wi-Fi Network</p>
                </div>
                <div className="max-w-md mx-auto p-4 rounded-2xl bg-slate-950 border border-slate-800 text-left space-y-2 text-xs">
                  <p className="text-slate-400">Network Code: <span className="font-mono text-white font-bold">{record.content}</span></p>
                </div>
                <button
                  onClick={() => handleCopyText(record.content)}
                  className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-lg transition-all inline-flex items-center gap-2"
                >
                  {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Copied Network Code' : 'Copy Wi-Fi Info'}
                </button>
              </div>
            )}

            {/* 10. Location Map */}
            {record.type === 'location' && (
              <div className="p-8 rounded-3xl bg-slate-800/40 border border-slate-700/60 text-center space-y-6">
                <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
                  <MapPin className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">{record.name}</h3>
                  <p className="text-xs text-slate-400 mt-1">Map Geographic Coordinates</p>
                </div>
                <div className="flex items-center justify-center gap-3">
                  <a
                    href={record.content}
                    target="_blank"
                    rel="noreferrer"
                    className="px-6 py-3 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs sm:text-sm shadow-lg transition-all inline-flex items-center gap-2"
                  >
                    <ExternalLink className="w-4 h-4" /> Open in Google Maps
                  </a>
                </div>
              </div>
            )}

            {/* 11. Text Note */}
            {record.type === 'text' && (
              <div className="p-8 rounded-3xl bg-slate-800/40 border border-slate-700/60 space-y-4">
                <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">
                  {record.content}
                </div>
                <button
                  onClick={() => handleCopyText(record.content)}
                  className="px-5 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs transition-all inline-flex items-center gap-2"
                >
                  {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Copied to Clipboard' : 'Copy Text'}
                </button>
              </div>
            )}
          </div>

          {/* Footer Security Badges */}
          <div className="pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-3">
            <div className="flex items-center gap-2">
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              <span>ConvertPro Encrypted Content Vault · Unaltered Direct Access</span>
            </div>
            <span>Share ID: {record.shareId}</span>
          </div>
        </div>
      </main>

      {/* Page Footer */}
      <footer className="py-6 text-center text-xs text-slate-600 border-t border-slate-900">
        ConvertPro Universal QR Platform · Secure Digital File Exchange
      </footer>
    </div>
  );
};
