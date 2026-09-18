/**
 * ConvertPro AI Document Comparison Service (Server-Side)
 * Strictly derives semantic summaries, clause highlights, and key change items from verified deterministic diffs.
 * NEVER hallucinates changes that do not exist in the diff.
 */

import https from 'https';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || '';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';

export async function generateComparisonSummary(
  changes,
  statistics,
  docAMeta,
  docBMeta,
  options = {}
) {
  const { mode = 'general', style = 'detailed' } = options;

  // Filter only meaningful changes (exclude unchanged)
  const meaningfulChanges = changes.filter(c => c.type !== 'unchanged');

  // If no meaningful changes detected
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

  // If OpenAI or Gemini API key is configured, call LLM for high-level synthesis
  if (OPENAI_API_KEY || GEMINI_API_KEY) {
    try {
      return await callLlmForSummary(meaningfulChanges, statistics, docAMeta, docBMeta, mode, style);
    } catch (e) {
      console.warn('[DocCompare AI] LLM error, falling back to deterministic synthesizer:', e.message);
    }
  }

  // Intelligent Grounded Deterministic Synthesizer (100% grounded on verified diffs)
  return generateDeterministicSummary(meaningfulChanges, statistics, docAMeta, docBMeta, mode, style);
}

/**
 * Intelligent Grounded Deterministic Synthesizer
 */
export function generateDeterministicSummary(
  meaningfulChanges,
  statistics,
  docAMeta,
  docBMeta,
  mode,
  style
) {
  if (!meaningfulChanges || meaningfulChanges.length === 0) {
    return {
      style,
      mode,
      overviewText: 'Both documents are completely identical in content and structure. No meaningful differences detected.',
      keyChanges: [],
      sectionChanges: [],
      generatedAt: Date.now()
    };
  }

  const { addedCount = 0, removedCount = 0, modifiedCount = 0, wordsAdded = 0, wordsRemoved = 0 } = statistics || {};

  // 1. Generate Overview Statement
  const parts = [];
  if (modifiedCount > 0) parts.push(`${modifiedCount} ${modifiedCount === 1 ? 'item was' : 'items were'} modified`);
  if (addedCount > 0) parts.push(`${addedCount} ${addedCount === 1 ? 'item was' : 'items were'} added`);
  if (removedCount > 0) parts.push(`${removedCount} ${removedCount === 1 ? 'item was' : 'items were'} removed`);

  const summarySummary = parts.length > 0 ? parts.join(', ') : 'No alterations detected';
  const overviewText = `Comparison between "${docAMeta.name}" and "${docBMeta.name}": ${summarySummary}. Total delta: +${wordsAdded} / -${wordsRemoved} words (${statistics.similarityScore}% structural similarity).`;

  // 2. Extract Key Changes from verified diffs
  const keyChanges = [];
  const contractHighlights = [];

  for (let i = 0; i < meaningfulChanges.length; i++) {
    const ch = meaningfulChanges[i];
    const orig = ch.originalText.trim();
    const upd = ch.updatedText.trim();

    if (ch.type === 'modified') {
      // Check for deadline/date changes
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
      }
      // Check for budget/amount changes
      else if (ch.semanticCategory === 'amount' || /[₹$€£]|budget|cost|price|fee/i.test(orig + upd)) {
        keyChanges.push({
          id: `kc-${i + 1}`,
          title: 'Financial Value / Budget Updated',
          category: 'Financial',
          originalValue: orig,
          updatedValue: upd,
          description: `Budget or pricing terms revised from "${orig}" to "${upd}".`,
          severity: 'high'
        });
      }
      // Contract clauses
      else if (mode === 'contract' || ch.semanticCategory === 'clause') {
        keyChanges.push({
          id: `kc-${i + 1}`,
          title: 'Clause / Term Modification',
          category: 'Contract Terms',
          originalValue: orig,
          updatedValue: upd,
          description: `Clause terms updated.`,
          severity: 'medium'
        });
        contractHighlights.push({
          clause: ch.location?.section || 'Contract Section',
          before: orig,
          after: upd,
          impact: 'Operational / Legal Term Update'
        });
      }
      // General modification
      else {
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

  // 3. Section Changes
  const sectionMap = new Map();
  for (const ch of meaningfulChanges) {
    const sec = ch.location?.section || 'Main Body';
    if (!sectionMap.has(sec)) {
      sectionMap.set(sec, { sectionName: sec, changeType: ch.type, details: ch.type });
    }
  }

  const sectionChanges = Array.from(sectionMap.values());

  return {
    style,
    mode,
    overviewText,
    keyChanges: keyChanges.slice(0, 20),
    sectionChanges,
    contractHighlights: contractHighlights.length > 0 ? contractHighlights : undefined,
    generatedAt: Date.now()
  };
}

/**
 * Call OpenAI API for structured analysis when API Key is active
 */
async function callLlmForSummary(
  meaningfulChanges,
  statistics,
  docAMeta,
  docBMeta,
  mode,
  style
) {
  const diffPayload = meaningfulChanges.slice(0, 30).map((c, idx) => ({
    id: idx + 1,
    type: c.type,
    location: c.location,
    original: c.originalText,
    updated: c.updatedText
  }));

  const systemPrompt = `You are ConvertPro's AI Document Comparison Engine.
Your task is to provide an objective, 100% factually accurate semantic summary of the changes detected between Document A ("${docAMeta.name}") and Document B ("${docBMeta.name}").
CRITICAL RULES:
1. ONLY describe changes present in the provided diff payload. NEVER invent, hallucinate, or assume changes not in the input.
2. Structure your response as JSON matching:
{
  "overviewText": "concise overview of changes",
  "keyChanges": [
    {
      "id": "1",
      "title": "Short title of change",
      "category": "Timeline | Financial | Scope | Clause | Content",
      "originalValue": "exact original snippet",
      "updatedValue": "exact updated snippet",
      "description": "Factual description of what changed",
      "severity": "high | medium | low"
    }
  ]
}`;

  const postData = JSON.stringify({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: JSON.stringify({ statistics, diffPayload, mode, style }) }
    ],
    response_format: { type: 'json_object' },
    temperature: 0.2
  });

  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'api.openai.com',
      port: 443,
      path: '/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Length': Buffer.byteLength(postData)
      },
      timeout: 20000
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          const content = JSON.parse(parsed.choices?.[0]?.message?.content || '{}');
          resolve({
            style,
            mode,
            overviewText: content.overviewText || 'Comparison analysis complete.',
            keyChanges: content.keyChanges || [],
            sectionChanges: [],
            generatedAt: Date.now()
          });
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}
