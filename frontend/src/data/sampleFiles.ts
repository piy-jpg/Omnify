import { FileItem, StorageInfo, UserNotification } from '../types';

export const INITIAL_RECENT_FILES: FileItem[] = [
  {
    id: 'file-1',
    name: 'Resume.pdf',
    size: 2400000,
    type: 'application/pdf',
    extension: 'PDF',
    uploadedAt: '2 hours ago',
    status: 'ready',
    pages: 2,
    originalSize: 2400000,
    category: 'pdf'
  },
  {
    id: 'file-2',
    name: 'Project_Report.docx',
    size: 1200000,
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    extension: 'DOCX',
    uploadedAt: 'Yesterday',
    status: 'ready',
    pages: 14,
    originalSize: 1200000,
    category: 'document'
  },
  {
    id: 'file-3',
    name: 'Landscape.jpg',
    size: 3600000,
    type: 'image/jpeg',
    extension: 'JPG',
    uploadedAt: 'Yesterday',
    status: 'ready',
    originalSize: 3600000,
    category: 'image'
  },
  {
    id: 'file-4',
    name: 'Notes.pdf',
    size: 1100000,
    type: 'application/pdf',
    extension: 'PDF',
    uploadedAt: '2 days ago',
    status: 'ready',
    pages: 5,
    originalSize: 1100000,
    category: 'pdf'
  },
  {
    id: 'file-5',
    name: 'Presentation.pptx',
    size: 4800000,
    type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    extension: 'PPTX',
    uploadedAt: '3 days ago',
    status: 'ready',
    pages: 22,
    originalSize: 4800000,
    category: 'document'
  },
  {
    id: 'file-6',
    name: 'Invoice.png',
    size: 2100000,
    type: 'image/png',
    extension: 'PNG',
    uploadedAt: '3 days ago',
    status: 'ready',
    originalSize: 2100000,
    category: 'image'
  }
];

export const INITIAL_STORAGE: StorageInfo = {
  usedBytes: 2576980377, // ~2.4 GB
  totalBytes: 2199023255552, // 2 TB (2,000 GB) Free by Default
  usedFormatted: '2.4 GB',
  totalFormatted: '2 TB',
  percentage: 0.1, // 0.1% used
  filesCount: 42,
  byCategory: {
    pdf: 1150000000, // ~1.15 GB
    documents: 780000000, // ~0.78 GB
    images: 560000000, // ~0.56 GB
    other: 86980377 // ~0.09 GB
  }
};

export const INITIAL_NOTIFICATIONS: UserNotification[] = [
  {
    id: 'notif-storage-2tb',
    title: '2 TB Free Storage Active',
    message: 'Your ConvertPro workspace is provisioned with 2 TB (2,000 GB) lifetime cloud storage for free!',
    time: 'Just now',
    type: 'feature',
    read: false
  },
  {
    id: 'notif-1',
    title: 'Conversion Completed',
    message: 'Your file "Resume.pdf" was compressed by 64% (2.4 MB → 860 KB).',
    time: '10m ago',
    type: 'conversion',
    read: false
  },
  {
    id: 'notif-2',
    title: 'AI Summary Ready',
    message: 'Document intelligence report generated for "Project_Report.docx".',
    time: '1h ago',
    type: 'feature',
    read: false
  },
  {
    id: 'notif-3',
    title: 'Security Notice',
    message: 'Temporary files older than 24 hours were purged per your privacy policy.',
    time: '5h ago',
    type: 'security',
    read: true
  }
];

export const INITIAL_AI_CHAT = [
  {
    id: 'm1',
    sender: 'assistant' as const,
    content: `👋 Hello Piyush! I am your **ConvertPro AI Document Assistant**.\n\nI can analyze your uploaded files, generate summaries, extract tables, answer complex questions, and compare documents.\n\nTry asking me anything about **"Project_Report.docx"** or choose an instant prompt below!`,
    timestamp: '10:45 AM',
    suggestedActions: [
      'What are the main points of this document?',
      'Summarize executive takeaways in 3 bullets',
      'Generate 5 multiple-choice quiz questions',
      'Extract all financial numbers and metrics'
    ]
  },
  {
    id: 'm2',
    sender: 'user' as const,
    content: 'What are the main points of this document?',
    timestamp: '10:46 AM'
  },
  {
    id: 'm3',
    sender: 'assistant' as const,
    content: `Here are the **five key points** extracted from **"Project_Report.docx"**:\n\n1. **Q3 Milestones Achieved**: The core migration to cloud microservices was completed 2 weeks ahead of target schedule, cutting server latency by **42%**.\n2. **Conversion Pipeline Scaling**: File conversion throughput increased from 1,200/min to **8,500/min** with the new async GPU workers.\n3. **User Retention**: SaaS conversion rate improved to **4.8%** (up from 3.2% in Q2) following the launch of the AI Document Assistant.\n4. **Security & Compliance**: Zero-retention auto-purge was audited and passed SOC2 Type II compliance with zero critical findings.\n5. **Next Quarter Objectives**: Target rollout of batch OCR, custom document template builder, and team collaboration workspaces.`,
    timestamp: '10:46 AM',
    citations: ['Page 2 (Section 1.3)', 'Page 6 (Table 3.1)', 'Page 11 (Conclusion)'],
    suggestedActions: [
      'Draft an email summary to leadership',
      'Extract the financial table from page 6',
      'Generate a 5-question test on these points'
    ]
  }
];
