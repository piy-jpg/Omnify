/**
 * Types and Data Contracts for ConvertPro AI Document Comparison
 */

export type DocFormat = 'pdf' | 'doc' | 'docx' | 'txt' | 'ppt' | 'pptx' | 'jpg' | 'jpeg' | 'png' | 'webp';

export type ComparisonMode = 'general' | 'contract' | 'resume' | 'report';

export type SummaryStyle = 'quick' | 'detailed' | 'key_changes' | 'section_by_section' | 'executive';

export type ViewMode = 'side_by_side' | 'unified' | 'changes_only' | 'original_only' | 'new_only';

export type ChangeType = 'added' | 'removed' | 'modified' | 'moved' | 'unchanged';

export interface DocLocation {
  page?: number;
  slide?: number;
  section?: string;
  line?: number;
  tableIndex?: number;
  tableRow?: number;
  tableCol?: number;
}

export interface WordDiffToken {
  value: string;
  type: 'added' | 'removed' | 'unchanged';
}

export interface DiffChangeItem {
  id: string;
  type: ChangeType;
  location: DocLocation;
  originalText: string;
  updatedText: string;
  wordDiffs?: WordDiffToken[];
  confidence: number;
  semanticCategory?: 'date' | 'amount' | 'clause' | 'deadline' | 'skill' | 'title' | 'general' | 'table_cell';
  semanticImpact?: string;
  movedFromLocation?: DocLocation;
}

export interface DocStructureElement {
  id: string;
  type: 'heading' | 'paragraph' | 'list_item' | 'table' | 'slide' | 'header_footer';
  text: string;
  location: DocLocation;
  headingLevel?: number;
  tableData?: string[][];
  slideTitle?: string;
}

export interface ExtractedDocument {
  name: string;
  size: number;
  format: DocFormat;
  rawText: string;
  elements: DocStructureElement[];
  pageCount: number;
  slideCount: number;
  wordCount: number;
  charCount: number;
  detectedLanguage: string;
  mimeType: string;
  ocrConfidence?: number;
  extractedAt: number;
  previewUrl?: string;
}

export interface ComparisonStatistics {
  totalChanges: number;
  addedCount: number;
  removedCount: number;
  modifiedCount: number;
  movedCount: number;
  unchangedCount: number;
  originalWordCount: number;
  newWordCount: number;
  wordsAdded: number;
  wordsRemoved: number;
  originalCharCount: number;
  newCharCount: number;
  similarityScore: number; // 0 - 100%
}

export interface KeyChangeSummaryItem {
  id: string;
  title: string;
  category: string;
  originalValue?: string;
  updatedValue?: string;
  description: string;
  severity: 'high' | 'medium' | 'low';
}

export interface ComparisonSummary {
  style: SummaryStyle;
  mode: ComparisonMode;
  overviewText: string;
  keyChanges: KeyChangeSummaryItem[];
  sectionChanges: {
    sectionName: string;
    changeType: ChangeType;
    details: string;
  }[];
  contractHighlights?: {
    clause: string;
    before: string;
    after: string;
    impact: string;
  }[];
  generatedAt: number;
}

export interface ComparisonResult {
  comparisonId: string;
  fileA: ExtractedDocument;
  fileB: ExtractedDocument;
  mode: ComparisonMode;
  statistics: ComparisonStatistics;
  changes: DiffChangeItem[];
  summary: ComparisonSummary;
  isIdentical: boolean;
  createdAt: number;
}

export interface RecentComparisonRecord {
  id: string;
  title: string;
  fileAName: string;
  fileBName: string;
  fileASize: number;
  fileBSize: number;
  fileAFormat: string;
  fileBFormat: string;
  changeCount: number;
  mode: ComparisonMode;
  comparedAt: string;
  timestamp: number;
  statistics: ComparisonStatistics;
  summaryOverview: string;
  result: ComparisonResult;
}
