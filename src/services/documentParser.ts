import JSZip from 'jszip';

export interface ParsedDocumentResult {
  fileName: string;
  fileType: string;
  extractedText: string;
  estimatedSlideCount: number;
  extractedTitle: string;
  extractedSections: {
    heading: string;
    content: string[];
  }[];
}

/**
 * Extract clean text from DOCX files by reading word/document.xml
 */
async function parseDocxFile(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const zip = await JSZip.loadAsync(arrayBuffer);
    const docXmlFile = zip.file('word/document.xml');
    if (!docXmlFile) {
      throw new Error('Invalid DOCX format: word/document.xml not found');
    }
    const xmlContent = await docXmlFile.async('string');

    // Parse XML paragraphs
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlContent, 'text/xml');
    const paragraphs = xmlDoc.getElementsByTagName('w:p');

    const lines: string[] = [];
    for (let i = 0; i < paragraphs.length; i++) {
      const p = paragraphs[i];
      const textNodes = p.getElementsByTagName('w:t');
      let pText = '';
      for (let j = 0; j < textNodes.length; j++) {
        pText += textNodes[j].textContent || '';
      }
      if (pText.trim()) {
        lines.push(pText.trim());
      }
    }

    return lines.join('\n\n');
  } catch (err) {
    console.warn('DOCX zip parse fallback:', err);
    return await file.text();
  }
}

/**
 * Extract clean text from PPTX files by reading ppt/slides/slide*.xml
 */
async function parsePptxFile(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const zip = await JSZip.loadAsync(arrayBuffer);
    const slideFiles = Object.keys(zip.files).filter(name =>
      name.startsWith('ppt/slides/slide') && name.endsWith('.xml')
    );

    // Sort slides numerically
    slideFiles.sort((a, b) => {
      const numA = parseInt(a.replace(/[^0-9]/g, ''), 10) || 0;
      const numB = parseInt(b.replace(/[^0-9]/g, ''), 10) || 0;
      return numA - numB;
    });

    const parser = new DOMParser();
    const slideTexts: string[] = [];

    for (const slidePath of slideFiles) {
      const slideXml = await zip.files[slidePath].async('string');
      const xmlDoc = parser.parseFromString(slideXml, 'text/xml');
      const textNodes = xmlDoc.getElementsByTagName('a:t');
      const parts: string[] = [];
      for (let i = 0; i < textNodes.length; i++) {
        const t = textNodes[i].textContent?.trim();
        if (t) parts.push(t);
      }
      if (parts.length > 0) {
        slideTexts.push(parts.join('\n'));
      }
    }

    return slideTexts.join('\n\n--- SLIDE BREAK ---\n\n');
  } catch (err) {
    console.warn('PPTX zip parse fallback:', err);
    return await file.text();
  }
}

/**
 * Extract text from PDF files using binary string regex decoding
 */
async function parsePdfFile(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    let rawStr = '';

    // Chunked byte conversion
    const chunkSize = 8192;
    for (let i = 0; i < bytes.length; i += chunkSize) {
      const chunk = bytes.subarray(i, Math.min(i + chunkSize, bytes.length));
      rawStr += String.fromCharCode.apply(null, Array.from(chunk));
    }

    // Extract text in parentheses (Tj / TJ operators)
    const textMatches: string[] = [];
    const tjRegex = /\(([^)]+)\)\s*Tj/g;
    let match;
    while ((match = tjRegex.exec(rawStr)) !== null) {
      const clean = match[1].replace(/\\([()\\])/g, '$1').trim();
      if (clean.length > 1) {
        textMatches.push(clean);
      }
    }

    // Also look for TJ array blocks: [(text) 12 (more)] TJ
    const arrayRegex = /\[(.*?)\]\s*TJ/g;
    while ((match = arrayRegex.exec(rawStr)) !== null) {
      const inner = match[1];
      const innerMatches = inner.match(/\(([^)]+)\)/g);
      if (innerMatches) {
        const line = innerMatches.map(m => m.slice(1, -1).replace(/\\([()\\])/g, '$1')).join('');
        if (line.trim().length > 1) {
          textMatches.push(line.trim());
        }
      }
    }

    if (textMatches.length > 5) {
      return textMatches.join('\n');
    }

    // Fallback: extract printable ASCII sequences
    const asciiLines = rawStr.match(/[\w\s.,;:?!'""\-()\/]{20,}/g) || [];
    return asciiLines.filter(l => !l.includes('obj') && !l.includes('endobj') && !l.includes('stream')).join('\n\n');
  } catch (err) {
    console.warn('PDF stream extract fallback:', err);
    return `Content extracted from ${file.name}`;
  }
}

/**
 * Main Document Parser entry point
 */
export async function parseUploadedDocument(file: File): Promise<ParsedDocumentResult> {
  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  let extractedText = '';

  if (ext === 'docx') {
    extractedText = await parseDocxFile(file);
  } else if (ext === 'pptx') {
    extractedText = await parsePptxFile(file);
  } else if (ext === 'pdf') {
    extractedText = await parsePdfFile(file);
  } else {
    // txt, md, csv, json, etc.
    extractedText = await file.text();
  }

  // Clean text
  extractedText = extractedText
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  // If text is too short or empty, provide sensible fallback
  if (!extractedText || extractedText.length < 10) {
    extractedText = `Summary of ${file.name.replace(/\.[^/.]+$/, '')}\n\nKey Insights and Strategic Framework extracted from ${file.name}.`;
  }

  // Extract structured sections
  const lines = extractedText.split('\n').map(l => l.trim()).filter(Boolean);
  const titleCandidate = lines[0] || file.name.replace(/\.[^/.]+$/, '');
  const extractedTitle = titleCandidate.length > 70 ? titleCandidate.substring(0, 67) + '...' : titleCandidate;

  const sections: { heading: string; content: string[] }[] = [];
  let currentHeading = 'Overview';
  let currentItems: string[] = [];

  for (const line of lines.slice(1)) {
    if (line.startsWith('#') || line.endsWith(':') || (line.length < 50 && line === line.toUpperCase())) {
      if (currentItems.length > 0) {
        sections.push({ heading: currentHeading, content: currentItems });
        currentItems = [];
      }
      currentHeading = line.replace(/^[#\s*]+/, '').replace(/:$/, '').trim();
    } else {
      currentItems.push(line);
    }
  }

  if (currentItems.length > 0) {
    sections.push({ heading: currentHeading, content: currentItems });
  }

  // Estimate slide count (roughly 1 slide per 100-150 words or per section, clamped between 5 and 20)
  const wordCount = extractedText.split(/\s+/).length;
  const estimatedSlideCount = Math.max(5, Math.min(20, Math.ceil(wordCount / 120)));

  return {
    fileName: file.name,
    fileType: ext.toUpperCase(),
    extractedText,
    estimatedSlideCount,
    extractedTitle,
    extractedSections: sections
  };
}
