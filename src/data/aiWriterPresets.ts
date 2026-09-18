/**
 * AI Writer Presets, Content Types, Tones, and Example Prompts
 */

import {
  Mail,
  FileText,
  Building2,
  FileCheck,
  CalendarX,
  AlertCircle,
  HelpCircle,
  Briefcase,
  Send,
  MessageSquare,
  Megaphone,
  StickyNote,
  BarChart3,
  Lightbulb,
  Users,
  Edit3,
  FileSignature
} from 'lucide-react';
import { WritingContentType, WritingTone, WritingLength, WritingLanguage } from '../types/aiWriter';

export interface ContentTypePreset {
  id: WritingContentType;
  label: string;
  category: 'email' | 'official' | 'business' | 'general';
  description: string;
  iconName: string;
  placeholder: string;
  hasSubject: boolean;
  hasTitle: boolean;
  defaultTone: WritingTone;
  smartFields: ('recipient' | 'sender' | 'subject' | 'purpose' | 'organization' | 'date' | 'audience' | 'reason' | 'contactInfo')[];
}

export const CONTENT_TYPE_PRESETS: ContentTypePreset[] = [
  {
    id: 'email',
    label: 'Email',
    category: 'email',
    description: 'Standard professional email with clear subject, greeting, body, and closing.',
    iconName: 'Mail',
    placeholder: 'e.g., Ask my professor for an extension on the project assignment because I was unwell...',
    hasSubject: true,
    hasTitle: false,
    defaultTone: 'professional',
    smartFields: ['recipient', 'subject', 'purpose']
  },
  {
    id: 'business_email',
    label: 'Business Email',
    category: 'email',
    description: 'High-impact corporate email for stakeholders, executives, and clients.',
    iconName: 'Briefcase',
    placeholder: 'e.g., Update client on Q3 deliverables and schedule a follow-up review meeting next Tuesday...',
    hasSubject: true,
    hasTitle: false,
    defaultTone: 'professional',
    smartFields: ['recipient', 'subject', 'purpose']
  },
  {
    id: 'followup_email',
    label: 'Follow-Up Email',
    category: 'email',
    description: 'Polite reminder or follow-up on previous discussions, interviews, or proposals.',
    iconName: 'Send',
    placeholder: 'e.g., Follow up with hiring manager after my software engineer interview yesterday...',
    hasSubject: true,
    hasTitle: false,
    defaultTone: 'polite',
    smartFields: ['recipient', 'subject', 'purpose']
  },
  {
    id: 'leave_application',
    label: 'Leave Application',
    category: 'official',
    description: 'Formal leave request for college, university, school, or corporate office.',
    iconName: 'CalendarX',
    placeholder: 'e.g., I need leave from college tomorrow and day after because I have severe fever...',
    hasSubject: true,
    hasTitle: false,
    defaultTone: 'formal',
    smartFields: ['recipient', 'reason', 'date']
  },
  {
    id: 'application',
    label: 'Application',
    category: 'official',
    description: 'General administrative or institutional application letter.',
    iconName: 'FileCheck',
    placeholder: 'e.g., Apply for a replacement college ID card after losing my previous one...',
    hasSubject: true,
    hasTitle: false,
    defaultTone: 'formal',
    smartFields: ['recipient', 'subject', 'reason']
  },
  {
    id: 'formal_notice',
    label: 'Formal Notice',
    category: 'official',
    description: 'Institutional or corporate notice for bulletin boards, students, or employees.',
    iconName: 'Megaphone',
    placeholder: 'e.g., Announce that the office will remain closed tomorrow due to maintenance...',
    hasSubject: false,
    hasTitle: true,
    defaultTone: 'formal',
    smartFields: ['organization', 'audience', 'date', 'contactInfo']
  },
  {
    id: 'official_letter',
    label: 'Official Letter',
    category: 'official',
    description: 'Authoritative official letter with header, date, recipient address, and formal sign-off.',
    iconName: 'FileSignature',
    placeholder: 'e.g., Letter to municipal corporation regarding frequent water supply issues in our locality...',
    hasSubject: true,
    hasTitle: false,
    defaultTone: 'formal',
    smartFields: ['recipient', 'sender', 'subject', 'purpose']
  },
  {
    id: 'complaint_letter',
    label: 'Complaint Letter',
    category: 'official',
    description: 'Constructive formal complaint highlighting specific grievances and desired resolution.',
    iconName: 'AlertCircle',
    placeholder: 'e.g., Complaint to internet provider about 3 days of connection outage and demand bill credit...',
    hasSubject: true,
    hasTitle: false,
    defaultTone: 'formal',
    smartFields: ['recipient', 'subject', 'reason']
  },
  {
    id: 'request_letter',
    label: 'Request Letter',
    category: 'official',
    description: 'Formal request for documents, permissions, approvals, or certificates.',
    iconName: 'HelpCircle',
    placeholder: 'e.g., Request college administration for issuing my official transcripts and migration certificate...',
    hasSubject: true,
    hasTitle: false,
    defaultTone: 'formal',
    smartFields: ['recipient', 'subject', 'purpose']
  },
  {
    id: 'cover_letter',
    label: 'Cover Letter',
    category: 'business',
    description: 'Persuasive job application cover letter highlighting skills, background, and enthusiasm.',
    iconName: 'FileText',
    placeholder: 'e.g., Apply for Senior Product Designer role with 4 years experience in SaaS and UI design...',
    hasSubject: true,
    hasTitle: false,
    defaultTone: 'persuasive',
    smartFields: ['recipient', 'purpose']
  },
  {
    id: 'professional_message',
    label: 'Professional Message',
    category: 'business',
    description: 'Polished direct message for Slack, Microsoft Teams, WhatsApp, or LinkedIn.',
    iconName: 'MessageSquare',
    placeholder: 'e.g., Message teammate to review pull request #142 before end of day...',
    hasSubject: false,
    hasTitle: false,
    defaultTone: 'professional',
    smartFields: ['recipient', 'purpose']
  },
  {
    id: 'announcement',
    label: 'Announcement',
    category: 'general',
    description: 'Public or organizational broadcast communicating events, launches, or updates.',
    iconName: 'Megaphone',
    placeholder: 'e.g., Announce the launch of our new mobile app beta testing program to users...',
    hasSubject: false,
    hasTitle: true,
    defaultTone: 'friendly',
    smartFields: ['organization', 'audience', 'date']
  },
  {
    id: 'memo',
    label: 'Memo (Memorandum)',
    category: 'business',
    description: 'Internal company memo formatted with To, From, Date, and Subject.',
    iconName: 'StickyNote',
    placeholder: 'e.g., Update staff on new hybrid work policy guidelines starting next month...',
    hasSubject: true,
    hasTitle: false,
    defaultTone: 'professional',
    smartFields: ['recipient', 'sender', 'subject', 'date']
  },
  {
    id: 'report',
    label: 'Report Summary',
    category: 'business',
    description: 'Structured summary report with executive overview, findings, and key takeaways.',
    iconName: 'BarChart3',
    placeholder: 'e.g., Summary report on quarterly website conversion rates and server uptime performance...',
    hasSubject: false,
    hasTitle: true,
    defaultTone: 'academic',
    smartFields: ['organization', 'purpose', 'date']
  },
  {
    id: 'proposal',
    label: 'Proposal',
    category: 'business',
    description: 'Business or project proposal outlining objectives, methodology, and expected ROI.',
    iconName: 'Lightbulb',
    placeholder: 'e.g., Proposal to upgrade cloud database infrastructure for faster response times...',
    hasSubject: false,
    hasTitle: true,
    defaultTone: 'persuasive',
    smartFields: ['recipient', 'purpose']
  },
  {
    id: 'meeting_minutes',
    label: 'Meeting Minutes',
    category: 'business',
    description: 'Clean record of meeting discussion points, decisions made, and assigned action items.',
    iconName: 'Users',
    placeholder: 'e.g., Minutes of product sprint planning meeting discussing user onboarding flow...',
    hasSubject: false,
    hasTitle: true,
    defaultTone: 'concise',
    smartFields: ['organization', 'date', 'audience']
  },
  {
    id: 'custom',
    label: 'Custom Document',
    category: 'general',
    description: 'Flexible AI writing tailored to any unique custom communication requirement.',
    iconName: 'Edit3',
    placeholder: 'e.g., Draft a speech, newsletter article, personal thank you note, or formal agreement...',
    hasSubject: false,
    hasTitle: true,
    defaultTone: 'professional',
    smartFields: ['purpose', 'audience']
  }
];

export interface ToneOption {
  id: WritingTone;
  label: string;
  description: string;
  icon: string;
}

export const TONE_OPTIONS: ToneOption[] = [
  { id: 'formal', label: 'Formal', description: 'Strict corporate and institutional etiquette', icon: '🎩' },
  { id: 'professional', label: 'Professional', description: 'Polished, clear, and business-ready', icon: '💼' },
  { id: 'friendly', label: 'Friendly', description: 'Warm, approachable, and engaging', icon: '😊' },
  { id: 'polite', label: 'Polite', description: 'Courteous and respectful tone', icon: '🤝' },
  { id: 'persuasive', label: 'Persuasive', description: 'Compelling call-to-action & confidence', icon: '🎯' },
  { id: 'concise', label: 'Concise', description: 'Direct, brief, and to-the-point', icon: '⚡' },
  { id: 'academic', label: 'Academic', description: 'Scholarly, structured, and analytical', icon: '🎓' }
];

export interface LengthOption {
  id: WritingLength;
  label: string;
  description: string;
}

export const LENGTH_OPTIONS: LengthOption[] = [
  { id: 'short', label: 'Short', description: '1-2 concise paragraphs' },
  { id: 'medium', label: 'Medium', description: 'Standard balanced length' },
  { id: 'detailed', label: 'Detailed', description: 'Comprehensive in-depth coverage' }
];

export interface LanguageOption {
  id: WritingLanguage;
  label: string;
  nativeLabel: string;
}

export const LANGUAGE_OPTIONS: LanguageOption[] = [
  { id: 'English', label: 'English', nativeLabel: 'English (US/UK)' },
  { id: 'Hindi', label: 'Hindi', nativeLabel: 'हिंदी' },
  { id: 'Hinglish', label: 'Hinglish', nativeLabel: 'Hinglish (Hindi in Roman)' }
];

export interface ExamplePrompt {
  title: string;
  rawText: string;
  type: WritingContentType;
  tone: WritingTone;
}

export const EXAMPLE_PROMPTS: ExamplePrompt[] = [
  {
    title: 'Sick Leave from College',
    rawText: 'I need leave from college tomorrow and day after because I have severe fever and doctor advised bed rest.',
    type: 'leave_application',
    tone: 'formal'
  },
  {
    title: 'Formal Holiday Notice',
    rawText: 'Create a notice informing students and faculty that the university will remain closed tomorrow on account of maintenance.',
    type: 'formal_notice',
    tone: 'formal'
  },
  {
    title: 'Project Status Update Email',
    rawText: 'Write a professional email to my project manager giving update that Phase 1 testing is 100% complete and ready for deployment.',
    type: 'business_email',
    tone: 'professional'
  },
  {
    title: 'Internet Service Complaint',
    rawText: 'Write a strong complaint letter to my telecom provider because my broadband internet has been down for 48 hours without resolution.',
    type: 'complaint_letter',
    tone: 'formal'
  },
  {
    title: 'Job Interview Follow-Up',
    rawText: 'Follow up politely with the recruiter after my technical round interview yesterday, thanking them and asking for next steps.',
    type: 'followup_email',
    tone: 'polite'
  }
];
