import React, { useState } from 'react';
import { 
  HelpCircle, 
  Search, 
  ChevronDown, 
  ChevronUp, 
  Send, 
  CheckCircle2, 
  LifeBuoy, 
  ShieldCheck, 
  Zap, 
  FileQuestion,
  BookOpen
} from 'lucide-react';

export const HelpSupportPage: React.FC = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [ticketSent, setTicketSent] = useState(false);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  const faqs = [
    {
      q: 'Is Omnify really 100% free with unlimited conversions?',
      a: 'Yes! Omnify is completely free for all users. You get unlimited daily file conversions, full AI Document Assistant tools, Neural OCR extraction, and 2 TB free cloud storage with zero credit cards or subscriptions required.'
    },
    {
      q: 'How does Omnify protect sensitive private documents?',
      a: 'Omnify processes documents directly on the client-side inside your browser wherever possible. For server-assisted tasks, end-to-end TLS 1.3 encryption and an audited 24-hour auto-purge schedule guarantee that your files are permanently destroyed after processing.'
    },
    {
      q: 'What is the maximum file size and batch conversion limit?',
      a: 'You can convert multiple files in parallel with large file uploads up to 2 GB per single file, completely free of charge.'
    },
    {
      q: 'Can I extract text and tables from multi-page scanned PDF documents?',
      a: 'Yes! Omnify Neural OCR automatically detects layout bounding boxes, table rows, and columns across multi-page scans and formats them into editable Word DOCX or CSV files.'
    },
    {
      q: 'How does the AI Document Assistant interact with my uploaded documents?',
      a: 'The AI assistant runs in temporary session memory. You can ask questions, generate multiple choice MCQ quizzes, create executive briefs, or compare two documents side-by-side without any query limits.'
    }
  ];

  const handleSendTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message) return;
    setTicketSent(true);
    setTimeout(() => {
      setTicketSent(false);
      setSubject('');
      setMessage('');
    }, 2500);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      
      {/* Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-800 via-brand-800 to-purple-900 text-white p-6 sm:p-8 shadow-lg">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/15 backdrop-blur-md">
            <LifeBuoy className="w-3.5 h-3.5 text-indigo-200" />
            <span>Help & Documentation Center</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Knowledge Base, FAQs & 24/7 Priority Support
          </h1>

          <p className="text-xs sm:text-sm text-indigo-100/90 leading-relaxed">
            Find answers to common questions about file formats, encryption policies, API integrations, or reach out directly to our engineering support team.
          </p>
        </div>
      </div>

      {/* System Status Banner */}
      <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between text-xs font-bold text-emerald-800 dark:text-emerald-300">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>All Omnify Conversion Clusters & GPU Workers Operational</span>
        </div>
        <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">99.99% Uptime</span>
      </div>

      {/* FAQ & Support Ticket Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left: FAQs */}
        <div className="lg:col-span-7 space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">
            Frequently Asked Questions
          </h2>

          <div className="space-y-3">
            {faqs.map((faq, i) => {
              const isOpen = openFaq === i;
              return (
                <div
                  key={i}
                  className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : i)}
                    className="w-full flex items-center justify-between p-4 text-left font-bold text-xs text-slate-900 dark:text-white hover:text-brand-600 transition-colors"
                  >
                    <span>{faq.q}</span>
                    {isOpen ? <ChevronUp className="w-4 h-4 text-brand-600" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                  </button>

                  {isOpen && (
                    <div className="px-4 pb-4 text-xs text-slate-600 dark:text-slate-400 leading-relaxed border-t border-slate-100 dark:border-slate-800 pt-3">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Direct Ticket Form */}
        <div className="lg:col-span-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">
            Contact Engineering Support
          </h2>

          <form onSubmit={handleSendTicket} className="space-y-3 text-xs">
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300">Topic / Subject</label>
              <input
                type="text"
                placeholder="e.g. PDF to Excel formatting question"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full mt-1 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300">Message</label>
              <textarea
                rows={4}
                placeholder="Describe your issue or feature request in detail..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full mt-1 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
            >
              {ticketSent ? <CheckCircle2 className="w-4 h-4 text-emerald-300" /> : <Send className="w-4 h-4" />}
              <span>{ticketSent ? 'Support Ticket Dispatched!' : 'Submit Support Request'}</span>
            </button>
          </form>
        </div>

      </div>

    </div>
  );
};
