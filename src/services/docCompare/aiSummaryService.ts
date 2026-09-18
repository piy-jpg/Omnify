/**
 * ConvertPro AI Document Comparison Client Service
 * Coordinates extraction, deterministic diffing, and AI semantic analysis with backend API.
 */

import {
  ExtractedDocument,
  ComparisonResult,
  ComparisonMode,
  SummaryStyle,
  ComparisonSummary
} from '../../types/docCompare';
import { DocumentExtractor } from './documentExtractor';
import { DiffEngine } from './diffEngine';

export class AISummaryService {
  /**
   * Run complete comparison workflow
   */
  static async runComparison(
    fileA: File,
    fileB: File,
    options: { mode?: ComparisonMode; style?: SummaryStyle } = {},
    onProgress?: (percent: number, msg: string) => void
  ): Promise<ComparisonResult> {
    const mode = options.mode || 'general';
    const style = options.style || 'detailed';

    // 1. Extract Document A
    onProgress?.(15, `Extracting content & structure from ${fileA.name}...`);
    const docA = await DocumentExtractor.extract(fileA);

    // 2. Extract Document B
    onProgress?.(45, `Extracting content & structure from ${fileB.name}...`);
    const docB = await DocumentExtractor.extract(fileB);

    // 3. Deterministic Diff (Source of Truth)
    onProgress?.(70, 'Running exact deterministic Myers/LCS difference engine...');
    const { changes, statistics, isIdentical } = DiffEngine.compare(docA, docB, mode);

    // 4. AI Semantic Analysis Layer
    onProgress?.(85, 'Synthesizing verified AI semantic changes & summary...');
    let summary: ComparisonSummary;

    try {
      summary = await this.fetchServerSummary(docA, docB, changes, statistics, mode, style);
    } catch (err) {
      console.warn('[AISummaryService] Backend AI offline, using client grounded engine:', err);
      summary = this.generateClientSummary(docA, docB, changes, statistics, mode, style);
    }

    onProgress?.(100, 'Comparison report generated successfully!');

    return {
      comparisonId: `cmp-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      fileA: docA,
      fileB: docB,
      mode,
      statistics,
      changes,
      summary,
      isIdentical,
      createdAt: Date.now()
    };
  }

  /**
   * Try calling server API for LLM-enhanced summary
   */
  private static async fetchServerSummary(
    docA: ExtractedDocument,
    docB: ExtractedDocument,
    changes: any[],
    statistics: any,
    mode: ComparisonMode,
    style: SummaryStyle
  ): Promise<ComparisonSummary> {
    const endpoints = ['/api/ai/compare', 'http://127.0.0.1:5000/api/ai/compare', 'http://localhost:5000/api/ai/compare'];

    for (const url of endpoints) {
      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            docA: { name: docA.name, size: docA.size, format: docA.format },
            docB: { name: docB.name, size: docB.size, format: docB.format },
            changes: changes.filter(c => c.type !== 'unchanged').slice(0, 40),
            statistics,
            options: { mode, style }
          })
        });

        if (res.ok) {
          const data = await res.json();
          if (data.success && data.summary) {
            return data.summary;
          }
        }
      } catch {}
    }

    throw new Error('Server AI comparison unavailable');
  }

  /**
   * Client Grounded Semantic Synthesizer (100% grounded in verified diffs)
   */
  private static generateClientSummary(
    docA: ExtractedDocument,
    docB: ExtractedDocument,
    changes: any[],
    statistics: any,
    mode: ComparisonMode,
    style: SummaryStyle
  ): ComparisonSummary {
    const meaningfulChanges = changes.filter(c => c.type !== 'unchanged');

    if (meaningfulChanges.length === 0) {
      return {
        style,
        mode,
        overviewText: 'Both documents are completely identical in content and structure. No meaningful differences detected.',
        keyChanges: [],
        sectionChanges: [],
        generatedAt: Date.now()
      };
    }

    const { addedCount, removedCount, modifiedCount, wordsAdded, wordsRemoved } = statistics;
    const parts: string[] = [];
    if (modifiedCount > 0) parts.push(`${modifiedCount} ${modifiedCount === 1 ? 'item was' : 'items were'} modified`);
    if (addedCount > 0) parts.push(`${addedCount} ${addedCount === 1 ? 'item was' : 'items were'} added`);
    if (removedCount > 0) parts.push(`${removedCount} ${removedCount === 1 ? 'item was' : 'items were'} removed`);

    const summaryText = parts.length > 0 ? parts.join(', ') : 'No alterations detected';
    const overviewText = `Compared "${docA.name}" with "${docB.name}": ${summaryText}. Total delta: +${wordsAdded} / -${wordsRemoved} words (${statistics.similarityScore}% similarity).`;

    const keyChanges: any[] = [];
    for (let i = 0; i < meaningfulChanges.length; i++) {
      const ch = meaningfulChanges[i];
      const orig = ch.originalText.trim();
      const upd = ch.updatedText.trim();

      if (ch.type === 'modified') {
        if (ch.semanticCategory === 'date' || /deadline|date|schedule/i.test(orig + upd)) {
          keyChanges.push({
            id: `kc-${i + 1}`,
            title: 'Timeline / Deadline Updated',
            category: 'Timeline',
            originalValue: orig,
            updatedValue: upd,
            description: `Timeline or deadline changed from "${orig}" to "${upd}".`,
            severity: 'high'
          });
        } else if (ch.semanticCategory === 'amount' || /[₹$€£]|budget|cost|price|fee/i.test(orig + upd)) {
          keyChanges.push({
            id: `kc-${i + 1}`,
            title: 'Financial Value / Budget Updated',
            category: 'Financial',
            originalValue: orig,
            updatedValue: upd,
            description: `Budget or pricing terms revised from "${orig}" to "${upd}".`,
            severity: 'high'
          });
        } else {
          keyChanges.push({
            id: `kc-${i + 1}`,
            title: `Modified: ${ch.location?.section || 'Content'}`,
            category: 'Content',
            originalValue: orig,
            updatedValue: upd,
            description: `Content adjusted in ${ch.location?.section || 'document body'}.`,
            severity: 'medium'
          });
        }
      } else if (ch.type === 'added') {
        keyChanges.push({
          id: `kc-${i + 1}`,
          title: `Added: ${ch.location?.section || 'New Section'}`,
          category: 'Addition',
          updatedValue: upd,
          description: `New content added: "${upd.slice(0, 100)}${upd.length > 100 ? '...' : ''}"`,
          severity: 'medium'
        });
      } else if (ch.type === 'removed') {
        keyChanges.push({
          id: `kc-${i + 1}`,
          title: `Removed: ${ch.location?.section || 'Section'}`,
          category: 'Removal',
          originalValue: orig,
          description: `Previous content removed: "${orig.slice(0, 100)}${orig.length > 100 ? '...' : ''}"`,
          severity: 'low'
        });
      }
    }

    const sectionMap = new Map();
    for (const ch of meaningfulChanges) {
      const sec = ch.location?.section || 'Main Body';
      if (!sectionMap.has(sec)) {
        sectionMap.set(sec, { sectionName: sec, changeType: ch.type, details: ch.type });
      }
    }

    return {
      style,
      mode,
      overviewText,
      keyChanges: keyChanges.slice(0, 20),
      sectionChanges: Array.from(sectionMap.values()),
      generatedAt: Date.now()
    };
  }
}
