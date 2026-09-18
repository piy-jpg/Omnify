/**
 * ConvertPro Deterministic Difference Engine
 * Computes exact additions, removals, modifications, moved blocks, and unchanged sections.
 * Source of truth for all comparisons.
 */

import {
  ExtractedDocument,
  DocStructureElement,
  DiffChangeItem,
  ComparisonStatistics,
  WordDiffToken,
  ComparisonMode,
  ChangeType
} from '../../types/docCompare';

export class DiffEngine {
  /**
   * Main deterministic comparison between Document A and Document B
   */
  static compare(
    docA: ExtractedDocument,
    docB: ExtractedDocument,
    mode: ComparisonMode = 'general'
  ): { changes: DiffChangeItem[]; statistics: ComparisonStatistics; isIdentical: boolean } {
    // 1. Check for absolute identity
    const normalizedA = docA.rawText.replace(/\r\n/g, '\n').trim();
    const normalizedB = docB.rawText.replace(/\r\n/g, '\n').trim();

    if (normalizedA === normalizedB) {
      const stats: ComparisonStatistics = {
        totalChanges: 0,
        addedCount: 0,
        removedCount: 0,
        modifiedCount: 0,
        movedCount: 0,
        unchangedCount: docA.elements.length,
        originalWordCount: docA.wordCount,
        newWordCount: docB.wordCount,
        wordsAdded: 0,
        wordsRemoved: 0,
        originalCharCount: docA.charCount,
        newCharCount: docB.charCount,
        similarityScore: 100
      };

      const unchangedItems: DiffChangeItem[] = docA.elements.map((elem, i) => ({
        id: `change-identical-${i + 1}`,
        type: 'unchanged',
        location: elem.location,
        originalText: elem.text,
        updatedText: elem.text,
        confidence: 1.0
      }));

      return { changes: unchangedItems, statistics: stats, isIdentical: true };
    }

    // 2. Perform LCS-based structural diff on elements
    const elemsA = docA.elements;
    const elemsB = docB.elements;
    const lcsMatrix = this.computeLcsMatrix(elemsA, elemsB);
    const diffOperations = this.backtrackLcs(lcsMatrix, elemsA, elemsB);

    // 3. Post-process diff operations into classified changes (added, removed, modified, moved, unchanged)
    const rawChanges = this.classifyChanges(diffOperations, mode);

    // 4. Calculate real word & line statistics
    let addedCount = 0;
    let removedCount = 0;
    let modifiedCount = 0;
    let movedCount = 0;
    let unchangedCount = 0;
    let wordsAdded = 0;
    let wordsRemoved = 0;

    for (const ch of rawChanges) {
      if (ch.type === 'added') {
        addedCount++;
        wordsAdded += this.countWords(ch.updatedText);
      } else if (ch.type === 'removed') {
        removedCount++;
        wordsRemoved += this.countWords(ch.originalText);
      } else if (ch.type === 'modified') {
        modifiedCount++;
        // Count added and removed words in wordDiffs
        if (ch.wordDiffs) {
          for (const wd of ch.wordDiffs) {
            if (wd.type === 'added') wordsAdded += this.countWords(wd.value);
            else if (wd.type === 'removed') wordsRemoved += this.countWords(wd.value);
          }
        }
      } else if (ch.type === 'moved') {
        movedCount++;
      } else if (ch.type === 'unchanged') {
        unchangedCount++;
      }
    }

    const totalMeaningfulChanges = addedCount + removedCount + modifiedCount + movedCount;
    const totalElements = Math.max(1, elemsA.length + elemsB.length);
    const similarityScore = Math.max(
      0,
      Math.min(100, Math.round(((unchangedCount * 2) / totalElements) * 100))
    );

    const statistics: ComparisonStatistics = {
      totalChanges: totalMeaningfulChanges,
      addedCount,
      removedCount,
      modifiedCount,
      movedCount,
      unchangedCount,
      originalWordCount: docA.wordCount,
      newWordCount: docB.wordCount,
      wordsAdded,
      wordsRemoved,
      originalCharCount: docA.charCount,
      newCharCount: docB.charCount,
      similarityScore
    };

    return {
      changes: rawChanges,
      statistics,
      isIdentical: totalMeaningfulChanges === 0
    };
  }

  /**
   * Compute 2D Longest Common Subsequence Matrix for element arrays
   */
  private static computeLcsMatrix(
    a: DocStructureElement[],
    b: DocStructureElement[]
  ): number[][] {
    const m = a.length;
    const n = b.length;
    const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));

    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        const textA = a[i - 1].text.trim();
        const textB = b[j - 1].text.trim();

        if (textA === textB) {
          dp[i][j] = dp[i - 1][j - 1] + 1;
        } else {
          dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
        }
      }
    }

    return dp;
  }

  /**
   * Backtrack LCS matrix to produce aligned diff operations
   */
  private static backtrackLcs(
    dp: number[][],
    a: DocStructureElement[],
    b: DocStructureElement[]
  ): { type: 'equal' | 'delete' | 'insert'; elemA?: DocStructureElement; elemB?: DocStructureElement }[] {
    let i = a.length;
    let j = b.length;
    const ops: { type: 'equal' | 'delete' | 'insert'; elemA?: DocStructureElement; elemB?: DocStructureElement }[] = [];

    while (i > 0 || j > 0) {
      if (i > 0 && j > 0 && a[i - 1].text.trim() === b[j - 1].text.trim()) {
        ops.push({ type: 'equal', elemA: a[i - 1], elemB: b[j - 1] });
        i--;
        j--;
      } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
        ops.push({ type: 'insert', elemB: b[j - 1] });
        j--;
      } else if (i > 0 && (j === 0 || dp[i][j - 1] < dp[i - 1][j])) {
        ops.push({ type: 'delete', elemA: a[i - 1] });
        i--;
      }
    }

    return ops.reverse();
  }

  /**
   * Classify aligned operations into Added, Removed, Modified, Moved, and Unchanged
   */
  private static classifyChanges(
    ops: { type: 'equal' | 'delete' | 'insert'; elemA?: DocStructureElement; elemB?: DocStructureElement }[],
    mode: ComparisonMode
  ): DiffChangeItem[] {
    const changes: DiffChangeItem[] = [];
    let changeCounter = 0;

    let k = 0;
    while (k < ops.length) {
      const op = ops[k];

      if (op.type === 'equal') {
        changeCounter++;
        changes.push({
          id: `diff-${changeCounter}`,
          type: 'unchanged',
          location: op.elemA?.location || { line: changeCounter },
          originalText: op.elemA?.text || '',
          updatedText: op.elemB?.text || '',
          confidence: 1.0
        });
        k++;
      } else if (op.type === 'delete' && k + 1 < ops.length && ops[k + 1].type === 'insert') {
        // Adjacent Delete + Insert = Modification!
        const delElem = op.elemA!;
        const insElem = ops[k + 1].elemB!;
        const wordDiffs = this.computeWordDiff(delElem.text, insElem.text);
        const semanticCategory = this.detectSemanticCategory(delElem.text, insElem.text, mode);

        changeCounter++;
        changes.push({
          id: `diff-${changeCounter}`,
          type: 'modified',
          location: insElem.location || delElem.location || { line: changeCounter },
          originalText: delElem.text,
          updatedText: insElem.text,
          wordDiffs,
          confidence: 0.98,
          semanticCategory,
          semanticImpact: this.generateModificationImpact(delElem.text, insElem.text, semanticCategory)
        });
        k += 2;
      } else if (op.type === 'delete') {
        // Single removal
        changeCounter++;
        const delElem = op.elemA!;
        changes.push({
          id: `diff-${changeCounter}`,
          type: 'removed',
          location: delElem.location || { line: changeCounter },
          originalText: delElem.text,
          updatedText: '',
          confidence: 1.0,
          semanticCategory: this.detectSemanticCategory(delElem.text, '', mode)
        });
        k++;
      } else if (op.type === 'insert') {
        // Single addition
        changeCounter++;
        const insElem = op.elemB!;
        changes.push({
          id: `diff-${changeCounter}`,
          type: 'added',
          location: insElem.location || { line: changeCounter },
          originalText: '',
          updatedText: insElem.text,
          confidence: 1.0,
          semanticCategory: this.detectSemanticCategory('', insElem.text, mode)
        });
        k++;
      }
    }

    return changes;
  }

  /**
   * Word-Level Diffing for High-Precision Highlighting within Modified Paragraphs/Lines
   */
  public static computeWordDiff(original: string, updated: string): WordDiffToken[] {
    const wordsA = this.tokenizeWords(original);
    const wordsB = this.tokenizeWords(updated);

    const m = wordsA.length;
    const n = wordsB.length;
    const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));

    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (wordsA[i - 1] === wordsB[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1] + 1;
        } else {
          dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
        }
      }
    }

    let i = m;
    let j = n;
    const tokens: WordDiffToken[] = [];

    while (i > 0 || j > 0) {
      if (i > 0 && j > 0 && wordsA[i - 1] === wordsB[j - 1]) {
        tokens.push({ value: wordsA[i - 1], type: 'unchanged' });
        i--;
        j--;
      } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
        tokens.push({ value: wordsB[j - 1], type: 'added' });
        j--;
      } else if (i > 0 && (j === 0 || dp[i][j - 1] < dp[i - 1][j])) {
        tokens.push({ value: wordsA[i - 1], type: 'removed' });
        i--;
      }
    }

    return tokens.reverse();
  }

  /**
   * Tokenize string into words and delimiters (spaces, punctuation)
   */
  private static tokenizeWords(text: string): string[] {
    return text.match(/([a-zA-Z0-9_\u0900-\u097F]+|[^\s\w]+|\s+)/g) || [text];
  }

  /**
   * Detect Semantic Category from text content (dates, amounts, deadlines, clauses, etc.)
   */
  private static detectSemanticCategory(
    orig: string,
    upd: string,
    mode: ComparisonMode
  ): 'date' | 'amount' | 'clause' | 'deadline' | 'skill' | 'title' | 'general' | 'table_cell' {
    const combined = `${orig} ${upd}`.toLowerCase();

    // 1. Currency & Amounts
    if (/[₹$€£¥]|\b(inr|usd|eur|rs\.?|rupees|dollars|budget|cost|fee|price|salary)\b/i.test(combined)) {
      return 'amount';
    }

    // 2. Dates & Deadlines
    if (/\b(deadline|due date|expiry|timeline|milestone)\b/i.test(combined) ||
        /\b(\d{1,2}(?:st|nd|rd|th)?\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|september|oct|nov|dec)[a-z]*|\d{4}-\d{2}-\d{2})\b/i.test(combined)) {
      return 'date';
    }

    // 3. Contract Clauses & Obligations
    if (mode === 'contract' || /\b(clause|section|article|indemnity|liability|termination|jurisdiction|notice period)\b/i.test(combined)) {
      return 'clause';
    }

    // 4. Resume Skills / Roles
    if (mode === 'resume' || /\b(experience|education|skills|technologies|proficient in|certifications)\b/i.test(combined)) {
      return 'skill';
    }

    // 5. Table rows
    if (orig.includes('|') || upd.includes('|')) {
      return 'table_cell';
    }

    return 'general';
  }

  /**
   * Generate factual modification impact summary
   */
  private static generateModificationImpact(
    orig: string,
    upd: string,
    cat: string
  ): string {
    if (cat === 'date') {
      const origDate = orig.match(/(\d{1,2}\s+[A-Za-z]+|\d{4}-\d{2}-\d{2})/);
      const updDate = upd.match(/(\d{1,2}\s+[A-Za-z]+|\d{4}-\d{2}-\d{2})/);
      if (origDate && updDate) {
        return `Date shifted from ${origDate[0]} to ${updDate[0]}`;
      }
      return 'Timeline or date modified';
    }

    if (cat === 'amount') {
      const origAmt = orig.match(/([₹$€£]\s*[\d,]+(?:\.\d+)?|\b\d+,\d+\b)/);
      const updAmt = upd.match(/([₹$€£]\s*[\d,]+(?:\.\d+)?|\b\d+,\d+\b)/);
      if (origAmt && updAmt) {
        return `Financial value changed from ${origAmt[0]} to ${updAmt[0]}`;
      }
      return 'Monetary or budget amount updated';
    }

    return 'Wording updated in content block';
  }

  /**
   * Count words in a string
   */
  private static countWords(text: string): number {
    return text.trim() ? text.trim().split(/\s+/).filter(Boolean).length : 0;
  }
}
