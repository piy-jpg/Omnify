/**
 * ConvertPro Comparison Report Export Service
 * Generates and downloads PDF, DOCX, and TXT audit reports.
 */

import jsPDF from 'jspdf';
import JSZip from 'jszip';
import { ComparisonResult } from '../../types/docCompare';

export class ExportReportService {
  /**
   * Export as PDF
   */
  static async exportPdf(result: ComparisonResult): Promise<void> {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let y = 20;

    // Header & Banner
    doc.setFillColor(79, 70, 229); // Brand Indigo
    doc.rect(0, 0, pageWidth, 28, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('ConvertPro AI Document Comparison Report', 14, 14);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated on ${new Date(result.createdAt).toLocaleString()} | ID: ${result.comparisonId}`, 14, 22);

    y = 38;
    doc.setTextColor(30, 41, 59);

    // Document Metadata Box
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(14, y, pageWidth - 28, 26, 3, 3, 'F');
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Document A (Original):', 18, y + 8);
    doc.setFont('helvetica', 'normal');
    doc.text(`${result.fileA.name} (${(result.fileA.size / 1024).toFixed(1)} KB, ${result.fileA.wordCount} words)`, 65, y + 8);

    doc.setFont('helvetica', 'bold');
    doc.text('Document B (Updated):', 18, y + 16);
    doc.setFont('helvetica', 'normal');
    doc.text(`${result.fileB.name} (${(result.fileB.size / 1024).toFixed(1)} KB, ${result.fileB.wordCount} words)`, 65, y + 16);

    y += 34;

    // Statistics Grid
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Comparison Statistics', 14, y);
    y += 6;

    const stats = result.statistics;
    const statBoxes = [
      { label: 'Total Changes', val: stats.totalChanges.toString(), color: [79, 70, 229] },
      { label: 'Added', val: `+${stats.addedCount} items`, color: [16, 185, 129] },
      { label: 'Removed', val: `-${stats.removedCount} items`, color: [239, 68, 68] },
      { label: 'Modified', val: `${stats.modifiedCount} items`, color: [245, 158, 11] },
      { label: 'Similarity', val: `${stats.similarityScore}%`, color: [59, 130, 246] }
    ];

    const boxWidth = (pageWidth - 28 - (statBoxes.length - 1) * 3) / statBoxes.length;
    for (let i = 0; i < statBoxes.length; i++) {
      const box = statBoxes[i];
      const bx = 14 + i * (boxWidth + 3);
      doc.setFillColor(241, 245, 249);
      doc.roundedRect(bx, y, boxWidth, 16, 2, 2, 'F');

      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text(box.label, bx + 3, y + 5);

      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(box.color[0], box.color[1], box.color[2]);
      doc.text(box.val, bx + 3, y + 12);
    }

    y += 24;

    // AI Change Summary
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text('AI Executive Summary', 14, y);
    y += 6;

    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
    const splitOverview = doc.splitTextToSize(result.summary.overviewText, pageWidth - 28);
    doc.text(splitOverview, 14, y);
    y += splitOverview.length * 5 + 4;

    // Key Changes
    if (result.summary.keyChanges && result.summary.keyChanges.length > 0) {
      if (y > pageHeight - 40) {
        doc.addPage();
        y = 20;
      }

      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 41, 59);
      doc.text('Key Verified Changes:', 14, y);
      y += 6;

      for (const kc of result.summary.keyChanges) {
        if (y > pageHeight - 25) {
          doc.addPage();
          y = 20;
        }

        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(79, 70, 229);
        doc.text(`• [${kc.category}] ${kc.title}`, 14, y);
        y += 4.5;

        doc.setFont('helvetica', 'normal');
        doc.setTextColor(71, 85, 105);
        const splitDesc = doc.splitTextToSize(kc.description, pageWidth - 32);
        doc.text(splitDesc, 18, y);
        y += splitDesc.length * 4.5 + 2;
      }
    }

    // Detailed Changelog
    const meaningful = result.changes.filter(c => c.type !== 'unchanged');
    if (meaningful.length > 0) {
      if (y > pageHeight - 40) {
        doc.addPage();
        y = 20;
      } else {
        y += 6;
      }

      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 41, 59);
      doc.text('Detailed Changelog List:', 14, y);
      y += 6;

      for (let idx = 0; idx < meaningful.length; idx++) {
        if (y > pageHeight - 35) {
          doc.addPage();
          y = 20;
        }

        const ch = meaningful[idx];
        const typeColor = ch.type === 'added' ? [16, 185, 129] : ch.type === 'removed' ? [239, 68, 68] : [245, 158, 11];
        
        doc.setFillColor(typeColor[0], typeColor[1], typeColor[2]);
        doc.circle(17, y - 1, 1.5, 'F');

        doc.setFontSize(8.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(typeColor[0], typeColor[1], typeColor[2]);
        doc.text(`#${idx + 1} [${ch.type.toUpperCase()}] ${ch.location.section || 'General'}`, 22, y);
        y += 4.5;

        if (ch.originalText) {
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(220, 38, 38);
          const splitOrig = doc.splitTextToSize(`- ${ch.originalText}`, pageWidth - 36);
          doc.text(splitOrig, 22, y);
          y += splitOrig.length * 4 + 1;
        }

        if (ch.updatedText) {
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(22, 101, 52);
          const splitUpd = doc.splitTextToSize(`+ ${ch.updatedText}`, pageWidth - 36);
          doc.text(splitUpd, 22, y);
          y += splitUpd.length * 4 + 2;
        }

        y += 2;
      }
    }

    doc.save(`Comparison_Report_${Date.now()}.pdf`);
  }

  /**
   * Export as Plain Text / Markdown Changelog
   */
  static exportTxt(result: ComparisonResult): void {
    let content = `# CONVERTPRO AI DOCUMENT COMPARISON REPORT\n`;
    content += `Generated: ${new Date(result.createdAt).toLocaleString()}\n`;
    content += `Comparison ID: ${result.comparisonId}\n`;
    content += `--------------------------------------------------\n\n`;

    content += `## DOCUMENT INFORMATION\n`;
    content += `Document A (Original): ${result.fileA.name} (${result.fileA.wordCount} words)\n`;
    content += `Document B (New):      ${result.fileB.name} (${result.fileB.wordCount} words)\n\n`;

    content += `## STATISTICS\n`;
    content += `- Total Changes: ${result.statistics.totalChanges}\n`;
    content += `- Added Items:   ${result.statistics.addedCount} (+${result.statistics.wordsAdded} words)\n`;
    content += `- Removed Items: ${result.statistics.removedCount} (-${result.statistics.wordsRemoved} words)\n`;
    content += `- Modified Items: ${result.statistics.modifiedCount}\n`;
    content += `- Similarity:    ${result.statistics.similarityScore}%\n\n`;

    content += `## AI EXECUTIVE SUMMARY\n`;
    content += `${result.summary.overviewText}\n\n`;

    if (result.summary.keyChanges?.length) {
      content += `## KEY CHANGES\n`;
      result.summary.keyChanges.forEach((kc, i) => {
        content += `${i + 1}. [${kc.category}] ${kc.title}: ${kc.description}\n`;
      });
      content += `\n`;
    }

    content += `## ITEM-BY-ITEM CHANGELOG\n`;
    const meaningful = result.changes.filter(c => c.type !== 'unchanged');
    meaningful.forEach((ch, i) => {
      content += `\n[Change #${i + 1}] Type: ${ch.type.toUpperCase()} | Section: ${ch.location.section || 'General'}\n`;
      if (ch.originalText) content += `(-) ORIGINAL: ${ch.originalText}\n`;
      if (ch.updatedText)  content += `(+) UPDATED:  ${ch.updatedText}\n`;
    });

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Comparison_Report_${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  /**
   * Export as DOCX
   */
  static async exportDocx(result: ComparisonResult): Promise<void> {
    const zip = new JSZip();

    // Standard minimal openxml docx structure
    zip.file('[Content_Types].xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`);

    zip.file('_rels/.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`);

    const meaningful = result.changes.filter(c => c.type !== 'unchanged');

    let paragraphsXml = `
      <w:p><w:pPr><w:pStyle w:val="Heading1"/></w:pPr><w:r><w:t>ConvertPro AI Document Comparison Report</w:t></w:r></w:p>
      <w:p><w:r><w:t>Generated on: ${new Date(result.createdAt).toLocaleString()}</w:t></w:r></w:p>
      <w:p><w:r><w:t>Document A: ${result.fileA.name} | Document B: ${result.fileB.name}</w:t></w:r></w:p>
      <w:p><w:pPr><w:pStyle w:val="Heading2"/></w:pPr><w:r><w:t>AI Summary</w:t></w:r></w:p>
      <w:p><w:r><w:t>${result.summary.overviewText}</w:t></w:r></w:p>
      <w:p><w:pPr><w:pStyle w:val="Heading2"/></w:pPr><w:r><w:t>Detailed Changes</w:t></w:r></w:p>
    `;

    for (const ch of meaningful) {
      paragraphsXml += `
        <w:p><w:r><w:b/><w:t>[${ch.type.toUpperCase()}] Section: ${ch.location.section || 'General'}</w:t></w:r></w:p>
      `;
      if (ch.originalText) {
        paragraphsXml += `<w:p><w:r><w:t>[-] ${ch.originalText}</w:t></w:r></w:p>`;
      }
      if (ch.updatedText) {
        paragraphsXml += `<w:p><w:r><w:t>[+] ${ch.updatedText}</w:t></w:r></w:p>`;
      }
    }

    zip.file('word/document.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    ${paragraphsXml}
  </w:body>
</w:document>`);

    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Comparison_Report_${Date.now()}.docx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  /**
   * Export as JSON
   */
  static exportJson(result: ComparisonResult): void {
    const jsonStr = JSON.stringify(result, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Comparison_Report_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  /**
   * Export as Markdown
   */
  static exportMarkdown(result: ComparisonResult): void {
    let content = `# AI Document Comparison Report\n\n`;
    content += `**Generated:** ${new Date(result.createdAt).toLocaleString()}  \n`;
    content += `**Comparison ID:** \`${result.comparisonId}\`  \n`;
    content += `**Domain Mode:** ${result.mode.toUpperCase()}  \n\n`;
    content += `## Documents Compared\n\n`;
    content += `| Document | Filename | Format | Word Count | Size |\n`;
    content += `|---|---|---|---|---|\n`;
    content += `| **Original (A)** | ${result.fileA.name} | ${result.fileA.format.toUpperCase()} | ${result.fileA.wordCount} words | ${(result.fileA.size / 1024).toFixed(1)} KB |\n`;
    content += `| **New (B)** | ${result.fileB.name} | ${result.fileB.format.toUpperCase()} | ${result.fileB.wordCount} words | ${(result.fileB.size / 1024).toFixed(1)} KB |\n\n`;
    content += `## Executive Summary\n\n${result.summary.overviewText}\n\n`;
    content += `## Comparison Statistics\n\n`;
    content += `- **Total Meaningful Changes:** ${result.statistics.totalChanges}\n`;
    content += `- **Additions:** +${result.statistics.addedCount} items (+${result.statistics.wordsAdded} words)\n`;
    content += `- **Removals:** -${result.statistics.removedCount} items (-${result.statistics.wordsRemoved} words)\n`;
    content += `- **Modifications:** ${result.statistics.modifiedCount} items\n`;
    content += `- **Similarity Score:** ${result.statistics.similarityScore}%\n\n`;

    if (result.summary.keyChanges?.length) {
      content += `## Key Verified Changes\n\n`;
      result.summary.keyChanges.forEach((kc, i) => {
        content += `### ${i + 1}. [${kc.category}] ${kc.title}\n`;
        content += `${kc.description}\n\n`;
        if (kc.originalValue) content += `- **Before:** \`${kc.originalValue}\`\n`;
        if (kc.updatedValue) content += `- **After:** \`${kc.updatedValue}\`\n\n`;
      });
    }

    content += `## Itemized Changelog\n\n`;
    const meaningful = result.changes.filter(c => c.type !== 'unchanged');
    meaningful.forEach((ch, i) => {
      content += `#### #${i + 1} [${ch.type.toUpperCase()}] ${ch.location.section || 'General'} (Line ${ch.location.line || 1})\n`;
      if (ch.originalText) content += `> **[-] Previous:** ${ch.originalText}\n\n`;
      if (ch.updatedText) content += `> **[+] Updated:** ${ch.updatedText}\n\n`;
      if (ch.semanticImpact) content += `*Impact:* ${ch.semanticImpact}\n\n`;
    });

    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Comparison_Report_${Date.now()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
}
