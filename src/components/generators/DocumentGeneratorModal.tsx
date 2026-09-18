import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Download,
  FileText,
  Receipt,
  FileSpreadsheet,
  Check,
  Plus,
  Trash2,
  RefreshCw,
  Eye,
  BarChart3,
  Layers
} from 'lucide-react';
import confetti from 'canvas-confetti';
import jsPDF from 'jspdf';
import { DocumentGenerator, ResumeData, InvoiceData, ReportData } from '../../services/documentGenerator';
import { FileItem } from '../../types';

interface DocumentGeneratorModalProps {
  onClose: () => void;
  onFileGenerated: (newFile: FileItem) => void;
}

export const DocumentGeneratorModal: React.FC<DocumentGeneratorModalProps> = ({
  onClose,
  onFileGenerated
}) => {
  const [activeTab, setActiveTab] = useState<'resume' | 'invoice' | 'report'>('resume');

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
      },
      {
        title: 'Senior Software Engineer',
        company: 'Veloce Data Systems',
        period: '2020 — 2023',
        points: [
          'Designed scalable microservices architecture using Node.js and Redis queues.',
          'Integrated end-to-end OCR and AI document search indexing.'
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
      { description: 'Custom Neural OCR Fine-Tuning & Integration', quantity: 1, rate: 850 },
      { description: 'Cloud GPU Dedicated Conversion Pipeline Setup', quantity: 1, rate: 450 }
    ],
    taxRate: 8.5,
    notes: 'Payment is due within 14 business days. Direct ACH or Wire transfers accepted.'
  });

  // Report form state
  const [reportData, setReportData] = useState<ReportData>({
    title: 'Executive Quarterly Document Operations Report',
    author: 'Piyush Verma (Lead Architect)',
    date: 'September 2026',
    executiveSummary: 'This comprehensive report outlines quarterly operational efficiency, bandwidth optimization savings, and neural OCR accuracy across enterprise conversion pipelines.',
    sections: [
      { title: '1. Conversion Throughput & GPU Utilization', content: 'Serverless GPU workers increased throughput by 608% while maintaining average response latency below 280ms.' },
      { title: '2. Security Audit & Zero-Retention Compliance', content: 'Audited by external cybersecurity firm with SOC2 Type II compliance achieved. Rolling 24-hour auto-purge purges all temporary memory buffers.' },
      { title: '3. Q4 Strategic Roadmap', content: 'Planned initiatives include batch multi-file vector embeddings and collaborative document editing workspaces.' }
    ],
    metrics: [
      { label: 'Throughput', value: '8,500/min', change: '+608%' },
      { label: 'Latency', value: '278 ms', change: '-42%' },
      { label: 'Compression Avg', value: '64%', change: '+82%' }
    ]
  });

  const [isGenerating, setIsGenerating] = useState(false);

  const generateReportPDF = (data: ReportData): { blob: Blob; downloadName: string } => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setFillColor(30, 41, 59);
    doc.rect(0, 0, pageWidth, 35, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(255, 255, 255);
    doc.text(data.title, 15, 18);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(203, 213, 225);
    doc.text(`Author: ${data.author}  |  ${data.date}`, 15, 27);

    let y = 48;

    // Executive Summary
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(79, 70, 229);
    doc.text('EXECUTIVE SUMMARY', 15, y);
    doc.setDrawColor(226, 232, 240);
    doc.line(15, y + 2, pageWidth - 15, y + 2);
    y += 8;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(51, 65, 85);
    const splitSummary = doc.splitTextToSize(data.executiveSummary, pageWidth - 30);
    doc.text(splitSummary, 15, y);
    y += splitSummary.length * 5 + 10;

    // KPI Metrics row
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(15, y, pageWidth - 30, 24, 3, 3, 'F');
    data.metrics.forEach((m, i) => {
      const xPos = 25 + (i * 60);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(15, 23, 42);
      doc.text(m.value, xPos, y + 10);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text(m.label, xPos, y + 16);
      doc.setTextColor(16, 185, 129);
      doc.text(m.change, xPos + 28, y + 10);
    });
    y += 34;

    // Sections
    data.sections.forEach(s => {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text(s.title, 15, y);
      y += 6;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(71, 85, 105);
      const splitContent = doc.splitTextToSize(s.content, pageWidth - 30);
      doc.text(splitContent, 15, y);
      y += splitContent.length * 4.5 + 8;
    });

    const blob = doc.output('blob');
    return {
      blob,
      downloadName: `Executive_Report_${Date.now()}.pdf`
    };
  };

  const handleGeneratePDF = () => {
    setIsGenerating(true);

    setTimeout(() => {
      let resultBlob: Blob;
      let fileName: string;

      if (activeTab === 'resume') {
        const res = DocumentGenerator.generateResumePDF(resumeData);
        resultBlob = res.blob;
        fileName = res.downloadName;
      } else if (activeTab === 'invoice') {
        const res = DocumentGenerator.generateInvoicePDF(invoiceData);
        resultBlob = res.blob;
        fileName = res.downloadName;
      } else {
        const res = generateReportPDF(reportData);
        resultBlob = res.blob;
        fileName = res.downloadName;
      }

      // Download file
      const url = URL.createObjectURL(resultBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      // Save to recent files
      const newFileItem: FileItem = {
        id: `gen-${Date.now()}`,
        name: fileName,
        size: resultBlob.size,
        type: 'application/pdf',
        extension: 'PDF',
        uploadedAt: 'Just now',
        status: 'ready',
        pages: activeTab === 'report' ? 3 : 1
      };
      onFileGenerated(newFileItem);

      setIsGenerating(false);
      confetti({ particleCount: 80, spread: 60 });
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                AI Document Generator
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Create executive resumes, invoices, and reports with live PDF generation
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

        {/* Template Selector Tabs */}
        <div className="px-6 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2 bg-slate-50/30 dark:bg-slate-800/20">
          <button
            onClick={() => setActiveTab('resume')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'resume'
                ? 'bg-amber-500 text-white shadow-sm shadow-amber-500/30'
                : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Professional Resume</span>
          </button>

          <button
            onClick={() => setActiveTab('invoice')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'invoice'
                ? 'bg-amber-500 text-white shadow-sm shadow-amber-500/30'
                : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
            }`}
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>Commercial Invoice</span>
          </button>

          <button
            onClick={() => setActiveTab('report')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'report'
                ? 'bg-amber-500 text-white shadow-sm shadow-amber-500/30'
                : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Executive Report</span>
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {activeTab === 'resume' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Full Name</label>
                  <input
                    type="text"
                    value={resumeData.fullName}
                    onChange={(e) => setResumeData({ ...resumeData, fullName: e.target.value })}
                    className="w-full mt-1 px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Professional Title</label>
                  <input
                    type="text"
                    value={resumeData.role}
                    onChange={(e) => setResumeData({ ...resumeData, role: e.target.value })}
                    className="w-full mt-1 px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Email Address</label>
                  <input
                    type="text"
                    value={resumeData.email}
                    onChange={(e) => setResumeData({ ...resumeData, email: e.target.value })}
                    className="w-full mt-1 px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Phone & Location</label>
                  <input
                    type="text"
                    value={`${resumeData.phone} | ${resumeData.location}`}
                    onChange={(e) => {
                      const [p, l] = e.target.value.split('|');
                      setResumeData({ ...resumeData, phone: p?.trim() || '', location: l?.trim() || '' });
                    }}
                    className="w-full mt-1 px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Executive Summary</label>
                <textarea
                  rows={3}
                  value={resumeData.summary}
                  onChange={(e) => setResumeData({ ...resumeData, summary: e.target.value })}
                  className="w-full mt-1 p-3 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Skills (Comma separated)</label>
                <input
                  type="text"
                  value={resumeData.skills.join(', ')}
                  onChange={(e) => setResumeData({ ...resumeData, skills: e.target.value.split(',').map(s => s.trim()) })}
                  className="w-full mt-1 px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>
            </div>
          )}

          {activeTab === 'invoice' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Invoice #</label>
                  <input
                    type="text"
                    value={invoiceData.invoiceNumber}
                    onChange={(e) => setInvoiceData({ ...invoiceData, invoiceNumber: e.target.value })}
                    className="w-full mt-1 px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Date</label>
                  <input
                    type="text"
                    value={invoiceData.date}
                    onChange={(e) => setInvoiceData({ ...invoiceData, date: e.target.value })}
                    className="w-full mt-1 px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Client Name</label>
                  <input
                    type="text"
                    value={invoiceData.clientName}
                    onChange={(e) => setInvoiceData({ ...invoiceData, clientName: e.target.value })}
                    className="w-full mt-1 px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Line Items</label>
                {invoiceData.items.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2">
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => {
                        const newItems = [...invoiceData.items];
                        newItems[idx].description = e.target.value;
                        setInvoiceData({ ...invoiceData, items: newItems });
                      }}
                      className="col-span-7 px-3 py-1.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                    />
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => {
                        const newItems = [...invoiceData.items];
                        newItems[idx].quantity = parseFloat(e.target.value) || 0;
                        setInvoiceData({ ...invoiceData, items: newItems });
                      }}
                      className="col-span-2 px-3 py-1.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-center"
                    />
                    <input
                      type="number"
                      value={item.rate}
                      onChange={(e) => {
                        const newItems = [...invoiceData.items];
                        newItems[idx].rate = parseFloat(e.target.value) || 0;
                        setInvoiceData({ ...invoiceData, items: newItems });
                      }}
                      className="col-span-3 px-3 py-1.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-right"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'report' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Report Title</label>
                  <input
                    type="text"
                    value={reportData.title}
                    onChange={(e) => setReportData({ ...reportData, title: e.target.value })}
                    className="w-full mt-1 px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Author & Date</label>
                  <input
                    type="text"
                    value={`${reportData.author} | ${reportData.date}`}
                    onChange={(e) => {
                      const [a, d] = e.target.value.split('|');
                      setReportData({ ...reportData, author: a?.trim() || '', date: d?.trim() || '' });
                    }}
                    className="w-full mt-1 px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Executive Summary</label>
                <textarea
                  rows={3}
                  value={reportData.executiveSummary}
                  onChange={(e) => setReportData({ ...reportData, executiveSummary: e.target.value })}
                  className="w-full mt-1 p-3 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Sections</label>
                {reportData.sections.map((sec, i) => (
                  <div key={i} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-1.5">
                    <input
                      type="text"
                      value={sec.title}
                      onChange={(e) => {
                        const newSec = [...reportData.sections];
                        newSec[i].title = e.target.value;
                        setReportData({ ...reportData, sections: newSec });
                      }}
                      className="w-full px-2.5 py-1 rounded-lg text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                    />
                    <textarea
                      rows={2}
                      value={sec.content}
                      onChange={(e) => {
                        const newSec = [...reportData.sections];
                        newSec[i].content = e.target.value;
                        setReportData({ ...reportData, sections: newSec });
                      }}
                      className="w-full p-2.5 rounded-lg text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            Rendered with 300 DPI vector PDF typography
          </span>

          <button
            onClick={handleGeneratePDF}
            disabled={isGenerating}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-bold text-xs shadow-md transition-all"
          >
            {isGenerating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            <span>Generate & Download PDF</span>
          </button>
        </div>

      </div>
    </div>
  );
};
