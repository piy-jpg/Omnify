/**
 * Types for ConvertPro AI Writer Engine
 */

export type WritingContentType =
  | 'email'
  | 'formal_notice'
  | 'official_letter'
  | 'application'
  | 'leave_application'
  | 'complaint_letter'
  | 'request_letter'
  | 'cover_letter'
  | 'followup_email'
  | 'business_email'
  | 'professional_message'
  | 'announcement'
  | 'memo'
  | 'report'
  | 'proposal'
  | 'meeting_minutes'
  | 'custom';

export type WritingTone =
  | 'formal'
  | 'professional'
  | 'friendly'
  | 'polite'
  | 'persuasive'
  | 'concise'
  | 'academic';

export type WritingLength = 'short' | 'medium' | 'detailed';

export type WritingLanguage = 'English' | 'Hindi' | 'Hinglish' | string;

export interface SmartTemplateFields {
  recipient?: string;
  sender?: string;
  subject?: string;
  title?: string;
  purpose?: string;
  organization?: string;
  date?: string;
  audience?: string;
  contactInfo?: string;
  reason?: string;
  details?: string;
  additionalNotes?: string;
}

export interface WritingRequest {
  type: WritingContentType;
  tone: WritingTone;
  length: WritingLength;
  language: WritingLanguage;
  userInput: string;
  smartFields?: SmartTemplateFields;
}

export interface WritingResponse {
  success: boolean;
  type: WritingContentType;
  subject?: string;
  title?: string;
  content: string;
  rawFormattedText?: string;
  version?: number;
  wordCount?: number;
  charCount?: number;
  error?: string;
}

export type AIEditActionType =
  | 'improve'
  | 'make_shorter'
  | 'make_formal'
  | 'make_friendlier'
  | 'fix_grammar'
  | 'rewrite'
  | 'translate';

export interface AIEditRequest {
  action: AIEditActionType;
  content: string;
  targetLanguage?: string;
  subject?: string;
  title?: string;
  type?: WritingContentType;
}

export interface AIEditResponse {
  success: boolean;
  content: string;
  subject?: string;
  title?: string;
  action: AIEditActionType;
  error?: string;
}

export interface WritingVersion {
  id: string;
  versionNumber: number;
  subject?: string;
  title?: string;
  content: string;
  timestamp: string;
  actionTrigger?: string;
}

export interface WritingHistoryItem {
  id: string;
  type: WritingContentType;
  typeLabel: string;
  tone: WritingTone;
  language: WritingLanguage;
  userInputSnippet: string;
  subject?: string;
  title?: string;
  content: string;
  timestamp: string;
  createdAt: number;
}
