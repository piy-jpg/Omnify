import React, { useState } from 'react';
import { 
  Sparkles, 
  FileText, 
  Receipt, 
  BarChart3, 
  Download, 
  Check, 
  RefreshCw,
  Plus,
  Trash2,
  Layers,
  ArrowRight,
  Presentation
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { DocumentGenerator, ResumeData, InvoiceData, ReportData } from '../services/documentGenerator';
import { FileItem } from '../types';

interface DocumentGeneratorsPageProps {
  onFileGenerated: (file: FileItem) => void;
  onOpenPresentationGenerator?: () => void;
}

export const DocumentGeneratorsPage: React.FC<DocumentGeneratorsPageProps> = ({
  onFileGenerated,
  onOpenPresentationGenerator
}) => {
  const [activeTemplate, setActiveTemplate] = useState<'resume' | 'invoice' | 'report'>('resume');
  const [isGenerating, setIsGenerating] = useState(false);

  // Resume form state
  const [resumeData, setResumeData] = useState<ResumeData>({
    fullName: 'Piyush Verma',
    role: 'Senior Full Stack & AI Solutions Engineer',
    email: 'piyush.verma@example.com',
    phone: '+1 (555) 382-9901',
    location: 'San Francisco, CA',
    summary: 'Seasoned engineer with 7+ years of experience architecting cloud document workflows, real-time AI agents, and high-performance SaaS applications with 99.99% uptime.',
    skills: ['TypeScript', 'React', 'Node.js', 'Next.js', 'Python', 'TailwindCSS', 'PostgreSQL', 'Docker', 'AWS', 'LLM Prompt Engineering'],
    experience: [
      {
        title: 'Lead SaaS Architect',
        company: 'CloudMatrix Technologies',
        period: '2023 — Present',
        points: [
          'Led development of high-throughput document processing pipeline handling 10M+ operations monthly.',
          'Reduced client latency by 45% using Edge workers and client-side WebAssembly transformations.',
          'Mentored team of 12 full-stack engineers and drove agile sprint planning.'
        ]
      }
    ],
    education: [
      { degree: 'B.S. in Computer Science', school: 'University of California, Berkeley', year: '2020' }
    ]
  });

  // Invoice form state
  const [invoiceData, setInvoiceData] = useState<InvoiceData>({
    invoiceNumber: 'INV-2026-089',
    date: 'Sep 17, 2026',
    dueDate: 'Oct 01, 2026',
    clientName: 'Acme Global Ventures LLC',
    clientEmail: 'billing@acmeglobal.com',
    clientAddress: '500 Market St, Suite 400, San Francisco CA',
    senderName: 'ConvertPro Studio / Piyush Verma',
    senderEmail: 'piyush@convertpro.app',
    items: [
      { description: 'ConvertPro Enterprise SaaS Annual License', quantity: 1, rate: 1200 },
      { description: 'Custom Neural OCR Fine-Tuning & Integration', quantity: 1, rate: 850 }
    ],
    taxRate: 8.5,
    notes: 'Payment is due within 14 business days.'
  });

  const handleGenerate = () => {
    setIsGenerating(true);

    setTimeout(() => {
      let resultBlob: Blob;
      let fileName: string;

      if (activeTemplate === 'resume') {
        const res = DocumentGenerator.generateResumePDF(resumeData);
        resultBlob = res.blob;
        fileName = res.downloadName;
      } else {
        const res = DocumentGenerator.generateInvoicePDF(invoiceData);
        resultBlob = res.blob;
        fileName = res.downloadName;
      }

      const url = URL.createObjectURL(resultBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      const newFile: FileItem = {
        id: `gen-${Date.now()}`,
        name: fileName,
        size: resultBlob.size,
        type: 'application/pdf',
        extension: 'PDF',
        uploadedAt: 'Just now',
        status: 'ready',
        pages: 1
      };
      onFileGenerated(newFile);

      setIsGenerating(false);
      confetti({ particleCount: 80, spread: 60 });
    }, 500);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      
      {/* Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-700 via-orange-600 to-brand-700 text-white p-6 sm:p-8 shadow-lg shadow-amber-900/10">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/15 backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-amber-200" />
            <span>AI Document Creation Studio</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Generate Resumes, Invoices & Reports in Seconds
          </h1>

          <p className="text-xs sm:text-sm text-amber-100/90 leading-relaxed">
            Fill in the details or let AI generate professional vector PDF layouts ready for commercial dispatch.
          </p>
        </div>
      </div>

      {/* AI Presentation Generator Featured Spotlight */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white p-5 sm:p-6 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-amber-300">
            <Presentation className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-extrabold text-white">
                AI Presentation Generator
              </h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-amber-400 text-slate-950">
                NEW
              </span>
            </div>
            <p className="text-xs text-purple-100/90 max-w-xl">
              Turn any topic, text, or document into a professional 16:9 presentation with 112+ presets and real editable PPTX export.
            </p>
          </div>
        </div>

        <button
          onClick={onOpenPresentationGenerator}
          className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-purple-900 font-bold text-xs shadow-md transition-all flex items-center gap-1.5 flex-shrink-0"
        >
          <span>Open Presentation Generator</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Template Chooser & Editor */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm space-y-6">
        
        {/* Template Selector */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={() => setActiveTemplate('resume')}
            className={`p-4 rounded-2xl border text-left transition-all ${
              activeTemplate === 'resume'
                ? 'bg-amber-50/70 dark:bg-amber-950/40 border-amber-500 shadow-xs'
                : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-100 dark:bg-amber-900/60 text-amber-600">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900 dark:text-white">Executive Resume Builder</h3>
                <p className="text-[11px] text-slate-400">300 DPI vector PDF with modern typography</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => setActiveTemplate('invoice')}
            className={`p-4 rounded-2xl border text-left transition-all ${
              activeTemplate === 'invoice'
                ? 'bg-amber-50/70 dark:bg-amber-950/40 border-amber-500 shadow-xs'
                : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-orange-100 dark:bg-orange-900/60 text-orange-600">
                <Receipt className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900 dark:text-white">Commercial Invoice Generator</h3>
                <p className="text-[11px] text-slate-400">Automated subtotal & tax calculation</p>
              </div>
            </div>
          </button>
        </div>

        {/* Live Form */}
        {activeTemplate === 'resume' && (
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Full Name</label>
                <input
                  type="text"
                  value={resumeData.fullName}
                  onChange={(e) => setResumeData({ ...resumeData, fullName: e.target.value })}
                  className="w-full mt-1 px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Job Title</label>
                <input
                  type="text"
                  value={resumeData.role}
                  onChange={(e) => setResumeData({ ...resumeData, role: e.target.value })}
                  className="w-full mt-1 px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Executive Summary</label>
              <textarea
                rows={3}
                value={resumeData.summary}
                onChange={(e) => setResumeData({ ...resumeData, summary: e.target.value })}
                className="w-full mt-1 p-3 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
              />
            </div>
          </div>
        )}

        {activeTemplate === 'invoice' && (
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Invoice Number</label>
                <input
                  type="text"
                  value={invoiceData.invoiceNumber}
                  onChange={(e) => setInvoiceData({ ...invoiceData, invoiceNumber: e.target.value })}
                  className="w-full mt-1 px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Client Name</label>
                <input
                  type="text"
                  value={invoiceData.clientName}
                  onChange={(e) => setInvoiceData({ ...invoiceData, clientName: e.target.value })}
                  className="w-full mt-1 px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Tax Rate (%)</label>
                <input
                  type="number"
                  value={invoiceData.taxRate}
                  onChange={(e) => setInvoiceData({ ...invoiceData, taxRate: Number(e.target.value) })}
                  className="w-full mt-1 px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>
        )}

        {/* Generate Action */}
        <button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-bold text-xs shadow-md shadow-amber-600/20 transition-all"
        >
          {isGenerating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          <span>{isGenerating ? 'Compiling PDF Objects...' : 'Generate & Download PDF'}</span>
        </button>

      </div>

    </div>
  );
};
