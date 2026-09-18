import React, { useRef } from 'react';
import {
  Upload,
  FileText,
  FileSpreadsheet,
  FileCode,
  Image as ImageIcon,
  ArrowLeftRight,
  Trash2,
  RefreshCw,
  Eye,
  CheckCircle2,
  Sparkles,
  Info
} from 'lucide-react';
import { ExtractedDocument, ComparisonMode } from '../../types/docCompare';
import { formatBytes } from '../../utils/formatters';

interface CompareDropzoneProps {
  fileA: File | null;
  fileB: File | null;
  extractedA: ExtractedDocument | null;
  extractedB: ExtractedDocument | null;
  isExtractingA: boolean;
  isExtractingB: boolean;
  onFileASelected: (file: File) => void;
  onFileBSelected: (file: File) => void;
  onSwapFiles: () => void;
  onRemoveFileA: () => void;
  onRemoveFileB: () => void;
  onPreviewFile: (file: ExtractedDocument) => void;
  onCompare: () => void;
  isComparing: boolean;
  comparisonMode: ComparisonMode;
  onModeChange: (mode: ComparisonMode) => void;
}

export const SAMPLE_COMPARISONS = [
  {
    id: 'sample-contract',
    title: '📜 SaaS Enterprise Agreement (v1.0 vs v2.2)',
    badge: 'Legal & Contract Terms',
    description: 'Liability cap ($50k → $250k), SLA uptime (99.5% → 99.99%), fee ($4.5k → $6.2k/mo), added GDPR DPA.',
    mode: 'contract' as ComparisonMode,
    nameA: 'Master_SaaS_Agreement_v1.0.docx',
    nameB: 'Master_SaaS_Agreement_v2.2.docx',
    contentA: `# MASTER SERVICES AGREEMENT (v1.0)
This Master Services Agreement ("Agreement") is made between CloudVanguard Inc. ("Provider") and Enterprise Client Corp. ("Customer").

1. SCOPE OF SERVICES
Provider agrees to deliver multi-tenant cloud data processing infrastructure and workflow automation tools in accordance with Schedule A.

2. SUBSCRIPTION FEES & PAYMENT TERMS
Customer shall pay a recurring monthly fee of $4,500.00 USD per cluster instance. Invoices are due net 30 days from billing date. Late payments incur a 1.0% per month interest fee.

3. SERVICE LEVEL AGREEMENT (SLA)
Provider warrants a monthly system availability uptime of 99.50%, measured over any calendar month, excluding scheduled maintenance windows announced 48 hours in advance.

4. LIMITATION OF LIABILITY
Neither party's cumulative aggregate liability arising out of or related to this Agreement shall exceed $50,000.00 USD. Neither party shall be liable for indirect or consequential damages.

5. TERM AND TERMINATION
The initial term shall be twelve (12) months. Either party may terminate this Agreement without cause by providing thirty (30) days written notice prior to term expiration.

6. NOTICES
All official legal notices shall be sent via courier or facsimile transmission to the address specified in Section 10.

7. GOVERNING LAW
This Agreement shall be governed and interpreted under the laws of the State of Delaware, USA, without regard to conflicts of law provisions.`,
    contentB: `# MASTER SERVICES AGREEMENT (v2.2)
This Master Services Agreement ("Agreement") is made between CloudVanguard Inc. ("Provider") and Enterprise Client Corp. ("Customer").

1. SCOPE OF SERVICES
Provider agrees to deliver multi-tenant cloud data processing infrastructure and workflow automation tools in accordance with Schedule A.

2. SUBSCRIPTION FEES & PAYMENT TERMS
Customer shall pay a recurring monthly fee of $6,200.00 USD per cluster instance. Invoices are due net 45 days from billing date. Late payments incur a 1.5% per month interest fee.

3. SERVICE LEVEL AGREEMENT (SLA)
Provider warrants a monthly system availability uptime of 99.99%, measured over any calendar month, excluding scheduled maintenance windows announced 72 hours in advance.

4. LIMITATION OF LIABILITY
Neither party's cumulative aggregate liability arising out of or related to this Agreement shall exceed $250,000.00 USD. Neither party shall be liable for indirect or consequential damages.

5. DATA PROTECTION ADDENDUM (GDPR & CCPA)
Provider shall comply with all applicable global data protection regulations, including the European General Data Protection Regulation (EU) 2016/679 and California Consumer Privacy Act. Provider shall maintain ISO 27001 and SOC-2 Type II certifications.

6. TERM AND TERMINATION
The initial term shall be twelve (12) months. Either party may terminate this Agreement without cause by providing sixty (60) days written notice prior to term expiration.

7. NOTICES
All official legal notices shall be delivered by certified electronic mail or registered postal courier to the designated legal counsel email address.

8. GOVERNING LAW
This Agreement shall be governed and interpreted under the laws of the State of Delaware, USA, without regard to conflicts of law provisions.`
  },
  {
    id: 'sample-resume',
    title: '💼 Senior AI Engineer Resume (2025 vs 2026)',
    badge: 'Resume / CV Update',
    description: 'Experience (5+ → 7+ yrs), Principal AI Architect promotion, PyTorch/LangChain skills, GCP ML certification.',
    mode: 'resume' as ComparisonMode,
    nameA: 'Alex_Chen_Resume_2025.pdf',
    nameB: 'Alex_Chen_Resume_2026.pdf',
    contentA: `# ALEX CHEN
Lead Full-Stack & ML Engineer | alex.chen@email.com | (555) 234-5678 | San Francisco, CA

PROFESSIONAL SUMMARY
Dynamic software engineer with 5+ years of experience designing high-throughput web applications, REST APIs, and foundational machine learning classifiers.

TECHNICAL SKILLS
Languages: Python, TypeScript, JavaScript, SQL, C++
Frameworks: React.js, Node.js, Express, TensorFlow, FastAPI, Docker
Cloud & Databases: AWS (EC2, S3, RDS), PostgreSQL, Redis, Kubernetes

EXPERIENCE
Senior ML Engineer | Apex AI Systems (Jan 2023 - Dec 2024)
- Built automated image feature extraction pipelines processing 2M daily documents.
- Reduced inference latency by 35% through ONNX runtime optimizations.
- Supervised a team of 4 junior engineers building REST microservices.

Software Engineer | Nexus Digital Labs (Jun 2020 - Dec 2022)
- Developed scalable customer dashboard in React and Tailwind CSS.
- Maintained database migrations and ETL scripts handling 50GB daily transactions.

EDUCATION & CERTIFICATIONS
B.S. in Computer Science | Stanford University (2016 - 2020)
- AWS Certified Cloud Practitioner`,
    contentB: `# ALEX CHEN
Lead Full-Stack & AI Architect | alex.chen@email.com | (555) 234-5678 | San Francisco, CA

PROFESSIONAL SUMMARY
Innovative AI Architect with 7+ years of experience engineering production generative AI platforms, low-latency LLM inference pipelines, and distributed cloud systems.

TECHNICAL SKILLS
Languages: Python, TypeScript, Rust, Go, SQL, C++
Frameworks: React 19, Node.js, Next.js, PyTorch 2.4, LangChain, vLLM, TensorRT-LLM
Cloud & Databases: GCP (Vertex AI, GKE), AWS, PostgreSQL, Qdrant Vector DB, Redis

EXPERIENCE
Principal AI Architect | Omnify Suite & Apex AI (Jan 2025 - Present)
- Architected enterprise neural diff and document comparison engine processing 10M+ operations monthly.
- Deployed multi-agent RAG pipelines with sub-200ms semantic similarity retrieval.
- Reduced LLM token costs by 48% via prompt caching and speculative decoding.

Senior ML Engineer | Apex AI Systems (Jan 2023 - Dec 2024)
- Built automated image feature extraction pipelines processing 2M daily documents.
- Reduced inference latency by 35% through ONNX runtime optimizations.
- Supervised a team of 4 junior engineers building REST microservices.

EDUCATION & CERTIFICATIONS
B.S. in Computer Science | Stanford University (2016 - 2020)
- Google Cloud Certified Professional Machine Learning Engineer (2025)
- AWS Certified Solutions Architect - Professional`
  },
  {
    id: 'sample-report',
    title: '📊 Financial Review Report (Q3 vs Q4)',
    badge: 'Earnings & Performance',
    description: 'Revenue ($14.2M → $19.8M, +39.4%), EBITDA margin (22.4% → 28.3%), APAC regional expansion.',
    mode: 'report' as ComparisonMode,
    nameA: 'Quarterly_Financial_Review_Q3.pdf',
    nameB: 'Quarterly_Financial_Review_Q4.pdf',
    contentA: `# OMNIFY GLOBAL TECHNOLOGIES - Q3 FINANCIAL REVIEW

1. EXECUTIVE SUMMARY
In the third quarter of FY2026, Omnify recorded total revenue of $14,200,000 USD representing a 16.5% increase year-over-year. Operating costs remained tightly managed.

2. REVENUE BREAKDOWN
- North America Enterprise: $9,200,000 USD
- EMEA Region: $3,800,000 USD
- Developer API Subscriptions: $1,200,000 USD

3. PROFITABILITY & MARGINS
- Gross Profit: $10,650,000 USD (75.0% Gross Margin)
- Operating EBITDA: $3,180,000 USD (22.4% EBITDA Margin)
- Net Income: $1,850,000 USD

4. STRATEGIC OUTLOOK
We forecast full-year FY2026 revenue between $58M and $62M. R&D investments will remain at 18% of operating expenses.`,
    contentB: `# OMNIFY GLOBAL TECHNOLOGIES - Q4 FINANCIAL REVIEW

1. EXECUTIVE SUMMARY
In the fourth quarter of FY2026, Omnify recorded total revenue of $19,800,000 USD representing a 39.4% increase year-over-year. Operating scale demonstrated significant operating leverage.

2. REVENUE BREAKDOWN
- North America Enterprise: $11,500,000 USD
- EMEA Region: $5,200,000 USD
- APAC Emerging Markets: $3,100,000 USD
- Developer API Subscriptions: $0 USD (Merged into Enterprise)

3. PROFITABILITY & MARGINS
- Gross Profit: $15,640,000 USD (79.0% Gross Margin)
- Operating EBITDA: $5,603,000 USD (28.3% EBITDA Margin)
- Net Income: $3,420,000 USD

4. STRATEGIC OUTLOOK
Following the successful APAC launch, we have increased full-year FY2027 revenue guidance to $85M - $90M. Capital expenditures will expand by $4.5M to support GPU cluster buildouts.`
  }
];

export const CompareDropzone: React.FC<CompareDropzoneProps> = ({
  fileA,
  fileB,
  extractedA,
  extractedB,
  isExtractingA,
  isExtractingB,
  onFileASelected,
  onFileBSelected,
  onSwapFiles,
  onRemoveFileA,
  onRemoveFileB,
  onPreviewFile,
  onCompare,
  isComparing,
  comparisonMode,
  onModeChange
}) => {
  const inputARef = useRef<HTMLInputElement>(null);
  const inputBRef = useRef<HTMLInputElement>(null);

  const getFormatIcon = (format?: string) => {
    switch (format) {
      case 'pdf': return <FileText className="w-6 h-6 text-rose-500" />;
      case 'docx':
      case 'doc': return <FileText className="w-6 h-6 text-blue-500" />;
      case 'pptx':
      case 'ppt': return <FileSpreadsheet className="w-6 h-6 text-amber-500" />;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'webp': return <ImageIcon className="w-6 h-6 text-emerald-500" />;
      default: return <FileCode className="w-6 h-6 text-indigo-500" />;
    }
  };

  const handleLoadSample = (sample: typeof SAMPLE_COMPARISONS[0]) => {
    const fA = new File([sample.contentA], sample.nameA, { type: 'text/plain' });
    const fB = new File([sample.contentB], sample.nameB, { type: 'text/plain' });
    onModeChange(sample.mode);
    onFileASelected(fA);
    onFileBSelected(fB);
  };

  return (
    <div className="space-y-6">
      {/* 1. Quick Sample Comparison Presets */}
      <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-brand-950/40 via-slate-900 to-indigo-950/40 border border-brand-500/20 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-brand-500/20 text-brand-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white">
                1-Click Interactive Sample Comparisons
              </h4>
              <p className="text-[11px] text-slate-400">
                Instantly load real document pairs to test semantic diffs, key changes & audit exports.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
          {SAMPLE_COMPARISONS.map((sample) => (
            <button
              key={sample.id}
              onClick={() => handleLoadSample(sample)}
              className="p-3 rounded-2xl bg-slate-900/90 hover:bg-brand-950/60 border border-slate-800 hover:border-brand-500/40 text-left transition-all group flex flex-col justify-between space-y-1.5 hover:scale-101 active:scale-99 shadow-xs"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-white group-hover:text-brand-300 truncate">
                  {sample.title}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed">
                {sample.description}
              </p>
              <div className="flex items-center justify-between pt-1">
                <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  {sample.badge}
                </span>
                <span className="text-[10px] text-brand-400 font-bold group-hover:underline">
                  Load & Compare →
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 2. Mode Selector & Quick Presets */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-brand-600 dark:text-brand-400" />
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Comparison Domain:</span>
        </div>
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800">
          {(['general', 'contract', 'resume', 'report'] as ComparisonMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => onModeChange(mode)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
                comparisonMode === mode
                  ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-brand-300 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {mode === 'contract' ? '📜 Contract / Legal' : mode === 'resume' ? '💼 Resume / CV' : mode === 'report' ? '📊 Academic Report' : '📄 General Document'}
            </button>
          ))}
        </div>
      </div>

      {/* Dual Upload Area (VS Layout) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
        
        {/* DOCUMENT A (ORIGINAL) */}
        <div className="flex flex-col rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm relative overflow-hidden group hover:border-brand-400 dark:hover:border-brand-600 transition-all">
          <div className="flex items-center justify-between mb-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              <span className="w-2 h-2 rounded-full bg-slate-400"></span>
              Document A &bull; Original Version
            </span>
            {fileA && (
              <div className="flex items-center gap-1">
                {extractedA && (
                  <button
                    onClick={() => onPreviewFile(extractedA)}
                    title="Preview Document"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => inputARef.current?.click()}
                  title="Replace File"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-950/40 transition-all"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
                <button
                  onClick={onRemoveFileA}
                  title="Remove File"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          <input
            ref={inputARef}
            type="file"
            accept=".pdf,.docx,.doc,.pptx,.ppt,.txt,.jpg,.jpeg,.png,.webp"
            onChange={(e) => {
              if (e.target.files?.[0]) onFileASelected(e.target.files[0]);
            }}
            className="hidden"
          />

          {!fileA ? (
            <div
              onClick={() => inputARef.current?.click()}
              className="flex-1 min-h-[160px] flex flex-col items-center justify-center text-center cursor-pointer p-6 space-y-3"
            >
              <div className="w-12 h-12 rounded-2xl bg-brand-50 dark:bg-brand-950/50 text-brand-600 dark:text-brand-400 flex items-center justify-center">
                <Upload className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  Select Original Document
                </h4>
                <p className="text-xs text-slate-500">
                  Drop PDF, DOCX, PPTX, TXT, or Image here
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4 py-2">
              <div className="flex items-start gap-3">
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  {getFormatIcon(extractedA?.format)}
                </div>
                <div className="space-y-1 min-w-0 flex-1">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                    {fileA.name}
                  </h4>
                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                    <span>{formatBytes(fileA.size)}</span>
                    <span>&bull;</span>
                    <span className="uppercase font-bold text-slate-700 dark:text-slate-300">{extractedA?.format || fileA.name.split('.').pop()}</span>
                    {extractedA && (
                      <>
                        <span>&bull;</span>
                        <span>{extractedA.wordCount} words</span>
                        {extractedA.pageCount > 1 && (
                          <>
                            <span>&bull;</span>
                            <span>{extractedA.pageCount} pages</span>
                          </>
                        )}
                        {extractedA.slideCount > 0 && (
                          <>
                            <span>&bull;</span>
                            <span>{extractedA.slideCount} slides</span>
                          </>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>

              {isExtractingA ? (
                <div className="flex items-center gap-2 text-xs font-semibold text-brand-600 dark:text-brand-400 animate-pulse">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Extracting document structure & text...</span>
                </div>
              ) : (
                <div className="flex items-center justify-between text-xs text-slate-500 bg-slate-50 dark:bg-slate-850 p-3 rounded-xl">
                  <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Structure Extracted
                  </span>
                  <span>Lang: <strong className="text-slate-700 dark:text-slate-300">{extractedA?.detectedLanguage || 'English'}</strong></span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* SWAP BUTTON IN THE CENTER */}
        <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
          <button
            onClick={onSwapFiles}
            title="Swap Document A and Document B"
            className="p-3 rounded-2xl bg-slate-900 text-white shadow-xl hover:bg-brand-600 hover:scale-110 active:scale-95 transition-all flex items-center justify-center border-2 border-white dark:border-slate-800"
          >
            <ArrowLeftRight className="w-5 h-5" />
          </button>
        </div>

        {/* DOCUMENT B (NEW / UPDATED VERSION) */}
        <div className="flex flex-col rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm relative overflow-hidden group hover:border-emerald-400 dark:hover:border-emerald-600 transition-all">
          <div className="flex items-center justify-between mb-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              Document B &bull; New / Updated Version
            </span>
            {fileB && (
              <div className="flex items-center gap-1">
                {extractedB && (
                  <button
                    onClick={() => onPreviewFile(extractedB)}
                    title="Preview Document"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => inputBRef.current?.click()}
                  title="Replace File"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-all"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
                <button
                  onClick={onRemoveFileB}
                  title="Remove File"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          <input
            ref={inputBRef}
            type="file"
            accept=".pdf,.docx,.doc,.pptx,.ppt,.txt,.jpg,.jpeg,.png,.webp"
            onChange={(e) => {
              if (e.target.files?.[0]) onFileBSelected(e.target.files[0]);
            }}
            className="hidden"
          />

          {!fileB ? (
            <div
              onClick={() => inputBRef.current?.click()}
              className="flex-1 min-h-[160px] flex flex-col items-center justify-center text-center cursor-pointer p-6 space-y-3"
            >
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <Upload className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  Select New Version
                </h4>
                <p className="text-xs text-slate-500">
                  Drop PDF, DOCX, PPTX, TXT, or Image here
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4 py-2">
              <div className="flex items-start gap-3">
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  {getFormatIcon(extractedB?.format)}
                </div>
                <div className="space-y-1 min-w-0 flex-1">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                    {fileB.name}
                  </h4>
                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                    <span>{formatBytes(fileB.size)}</span>
                    <span>&bull;</span>
                    <span className="uppercase font-bold text-slate-700 dark:text-slate-300">{extractedB?.format || fileB.name.split('.').pop()}</span>
                    {extractedB && (
                      <>
                        <span>&bull;</span>
                        <span>{extractedB.wordCount} words</span>
                        {extractedB.pageCount > 1 && (
                          <>
                            <span>&bull;</span>
                            <span>{extractedB.pageCount} pages</span>
                          </>
                        )}
                        {extractedB.slideCount > 0 && (
                          <>
                            <span>&bull;</span>
                            <span>{extractedB.slideCount} slides</span>
                          </>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>

              {isExtractingB ? (
                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 animate-pulse">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Extracting document structure & text...</span>
                </div>
              ) : (
                <div className="flex items-center justify-between text-xs text-slate-500 bg-slate-50 dark:bg-slate-850 p-3 rounded-xl">
                  <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Structure Extracted
                  </span>
                  <span>Lang: <strong className="text-slate-700 dark:text-slate-300">{extractedB?.detectedLanguage || 'English'}</strong></span>
                </div>
              )}
            </div>
          )}
        </div>

      </div>

      {/* Mobile Swap Button */}
      <div className="md:hidden flex justify-center">
        <button
          onClick={onSwapFiles}
          disabled={!fileA && !fileB}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold disabled:opacity-50"
        >
          <ArrowLeftRight className="w-4 h-4" />
          <span>⇄ Swap Document Roles</span>
        </button>
      </div>

      {/* Primary Compare Action Button */}
      <div className="flex justify-center pt-2">
        <button
          onClick={onCompare}
          disabled={!fileA || !fileB || isExtractingA || isExtractingB || isComparing}
          className="flex items-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-brand-600 via-indigo-600 to-purple-600 text-white font-extrabold text-sm shadow-xl shadow-brand-500/25 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          {isComparing ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Analyzing & Comparing Documents...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>Compare Documents</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
