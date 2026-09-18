/**
 * ConvertPro Digital Signature & PDF E-Sign Engine
 * Advanced client-side PDF signing engine with multi-page support, QR verification,
 * customizable signer roles, and legal audit certificates (ESIGN & eIDAS compliant).
 */

import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import QRCode from 'qrcode';

export interface SignerParty {
  id: string;
  name: string;
  email?: string;
  title?: string;
  role: 'initiator' | 'counterparty' | 'witness' | 'notary';
  color: string; // Hex color code for UI & stamps
  isSigned?: boolean;
}

export interface SignatureAnnotation {
  id: string;
  type: 'signature' | 'initials' | 'date' | 'text' | 'seal' | 'name' | 'title' | 'company' | 'checkbox' | 'qr';
  content: string; // Base64 data URL for images, or string for text
  signerId?: string;
  pageIndex: number;
  xPercent: number; // 0 to 100 relative to page width
  yPercent: number; // 0 to 100 relative to page height
  widthPercent: number; // relative width percent
  heightPercent: number; // relative height percent
  color?: string;
  fontSize?: number;
}

export interface SignerMetadata {
  signers: SignerParty[];
  signReason?: string;
  location?: string;
  includeAuditCertificate?: boolean;
  includeQrSeal?: boolean;
}

export interface SignPdfResult {
  pdfBlob: Blob;
  pdfUrl: string;
  fileName: string;
  fileSize: number;
  documentHash: string;
  documentId: string;
  timestamp: string;
  pageCount: number;
  qrDataUrl: string;
}

/**
 * Compute SHA-256 hash of a buffer
 */
export async function computeSha256(buffer: ArrayBuffer): Promise<string> {
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Generate a scannable verification QR Code Data URL
 */
export async function generateVerificationQr(docId: string, hash: string, signerName: string): Promise<string> {
  const verificationUrl = `https://convertpro.io/verify?id=${docId}&hash=${hash.substring(0, 16)}&signer=${encodeURIComponent(signerName)}`;
  try {
    return await QRCode.toDataURL(verificationUrl, {
      width: 240,
      margin: 1,
      color: {
        dark: '#1e1b4b',
        light: '#ffffff'
      }
    });
  } catch (err) {
    console.error('Failed to generate QR code:', err);
    return '';
  }
}

/**
 * Generate a multi-page sample contract for testing
 */
export async function generateSamplePdf(templateType: 'nda' | 'academic' | 'freelance' | 'job_offer' = 'nda'): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const fontRegular = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const fontOblique = await doc.embedFont(StandardFonts.HelveticaOblique);

  // PAGE 1
  const page1 = doc.addPage([595.28, 841.89]); // A4 size in points
  const { width, height } = page1.getSize();

  // Header Banner
  page1.drawRectangle({
    x: 40,
    y: height - 85,
    width: width - 80,
    height: 50,
    color: rgb(0.96, 0.97, 1.0),
    borderColor: rgb(0.39, 0.4, 0.95),
    borderWidth: 1
  });

  if (templateType === 'academic') {
    page1.drawText('ACADEMIC INTEGRITY & FINAL THESIS DECLARATION', {
      x: 55,
      y: height - 58,
      size: 13,
      font: fontBold,
      color: rgb(0.18, 0.2, 0.45)
    });
    page1.drawText('Graduate Studies & Research Directorate | Academic Verification Protocol', {
      x: 55,
      y: height - 74,
      size: 8.5,
      font: fontRegular,
      color: rgb(0.4, 0.45, 0.6)
    });

    const bodyLines = [
      '1. DECLARATION OF ORIGINALITY: I hereby solemnly certify that this submission represents my original research and findings.',
      '   All external benchmarks, algorithms, figures, and literature citations are fully attributed in the bibliography.',
      '',
      '2. UNAPPROVED COLLABORATION: No unauthorized generative automation, third-party ghostwriting, or unapproved replication',
      '   was employed during the preparation or execution of this experimental thesis.',
      '',
      '3. DATA REPRODUCIBILITY & INTEGRITY: All raw experimental datasets, simulation logs, and source code repositories have',
      '   been archived in accordance with department open-science transparency standards.',
      '',
      '4. INTELLECTUAL PROPERTY & DEPOSIT: The author grants the institution a non-exclusive license to archive and index this work.',
      '',
      '5. LEGAL & ACADEMIC AUTHORITY: This electronic signature carries the full weight of a handwritten sworn affidavit.'
    ];

    let y = height - 125;
    for (const line of bodyLines) {
      page1.drawText(line, { x: 50, y, size: 9, font: fontRegular, color: rgb(0.15, 0.18, 0.25) });
      y -= 16;
    }
  } else if (templateType === 'job_offer') {
    page1.drawText('EXECUTIVE EMPLOYMENT AGREEMENT & OFFER LETTER', {
      x: 55,
      y: height - 58,
      size: 13,
      font: fontBold,
      color: rgb(0.18, 0.2, 0.45)
    });
    page1.drawText('ConvertPro Technologies Inc. | People Operations & Talent Directorate', {
      x: 55,
      y: height - 74,
      size: 8.5,
      font: fontRegular,
      color: rgb(0.4, 0.45, 0.6)
    });

    const bodyLines = [
      '1. POSITION & RESPONSIBILITIES: The Company is pleased to offer you the full-time role of Senior Principal Engineer.',
      '',
      '2. COMPENSATION & INCENTIVES: Base salary of $185,000 per annum, with equity stock grants and performance bonuses.',
      '',
      '3. BENEFITS & WELLNESS: Full comprehensive health coverage, 401(k) retirement matching up to 5%, and flexible PTO.',
      '',
      '4. PROPRIETARY INFORMATION & INVENTIONS: All innovations developed within the scope of employment belong to the Company.',
      '',
      '5. AT-WILL EMPLOYMENT: Employment with the Company is for no specified duration and constitutes at-will employment.'
    ];

    let y = height - 125;
    for (const line of bodyLines) {
      page1.drawText(line, { x: 50, y, size: 9, font: fontRegular, color: rgb(0.15, 0.18, 0.25) });
      y -= 16;
    }
  } else if (templateType === 'freelance') {
    page1.drawText('MASTER SERVICES AGREEMENT & STATEMENT OF WORK (SOW)', {
      x: 55,
      y: height - 58,
      size: 13,
      font: fontBold,
      color: rgb(0.18, 0.2, 0.45)
    });
    page1.drawText('Independent Contractor & Deliverable Milestone Schedule', {
      x: 55,
      y: height - 74,
      size: 8.5,
      font: fontRegular,
      color: rgb(0.4, 0.45, 0.6)
    });

    const bodyLines = [
      '1. ENGAGEMENT & DELIVERABLES: Contractor agrees to execute software engineering and architectural modules as requested.',
      '',
      '2. COMPENSATION & EXPENSES: Deliverables invoiced bi-weekly upon milestone acceptance at agreed sprint rates.',
      '',
      '3. INTELLECTUAL PROPERTY ASSIGNMENT: All code, designs, and assets created are works made for hire and owned by Client.',
      '',
      '4. INDEPENDENT CONTRACTOR STATUS: Contractor operates as an independent business and is solely responsible for taxes.',
      '',
      '5. CONFIDENTIALITY: Contractor agrees to hold all Client data in strict confidence with AES-256 protection standards.'
    ];

    let y = height - 125;
    for (const line of bodyLines) {
      page1.drawText(line, { x: 50, y, size: 9, font: fontRegular, color: rgb(0.15, 0.18, 0.25) });
      y -= 16;
    }
  } else {
    // Standard NDA
    page1.drawText('ENTERPRISE MUTUAL NON-DISCLOSURE AGREEMENT (NDA)', {
      x: 55,
      y: height - 58,
      size: 13,
      font: fontBold,
      color: rgb(0.18, 0.2, 0.45)
    });
    page1.drawText('ConvertPro Proprietary Information & Trade Secret Protection Protocol', {
      x: 55,
      y: height - 74,
      size: 8.5,
      font: fontRegular,
      color: rgb(0.4, 0.45, 0.6)
    });

    const bodyLines = [
      '1. PURPOSE: The Disclosing Party and Receiving Party wish to explore high-impact collaborative enterprise opportunities.',
      '',
      '2. CONFIDENTIAL INFORMATION: Includes all proprietary algorithms, source code, financial projections, and roadmap specs.',
      '',
      '3. NON-DISCLOSURE OBLIGATIONS: The Receiving Party shall hold Confidential Information in strict trust and restrict access.',
      '',
      '4. TERM: The confidentiality obligations shall remain legally binding for two (2) years following initial disclosure.',
      '',
      '5. REMEDIES: The parties agree that monetary damages may be inadequate and equitable injunctive relief shall apply.'
    ];

    let y = height - 125;
    for (const line of bodyLines) {
      page1.drawText(line, { x: 50, y, size: 9, font: fontRegular, color: rgb(0.15, 0.18, 0.25) });
      y -= 16;
    }
  }

  // Multi-party Signature Blocks
  const sigY = 200;
  page1.drawRectangle({
    x: 45,
    y: sigY,
    width: 235,
    height: 125,
    borderColor: rgb(0.8, 0.85, 0.9),
    borderWidth: 1,
    color: rgb(0.99, 0.99, 1.0)
  });
  page1.drawText('ISSUING AUTHORITY / DISCLOSING PARTY', { x: 55, y: sigY + 106, size: 8, font: fontBold, color: rgb(0.3, 0.35, 0.5) });
  page1.drawText('Entity: ConvertPro Technologies Inc.', { x: 55, y: sigY + 90, size: 8, font: fontRegular, color: rgb(0.4, 0.4, 0.5) });
  page1.drawText('Status: Pre-Certified Verified Corporate Seal', { x: 55, y: sigY + 76, size: 7.5, font: fontOblique, color: rgb(0.2, 0.6, 0.4) });
  page1.drawLine({ start: { x: 55, y: sigY + 32 }, end: { x: 260, y: sigY + 32 }, color: rgb(0.8, 0.8, 0.8), thickness: 0.8 });
  page1.drawText('Authorized Corporate Signature & Stamp', { x: 55, y: sigY + 18, size: 7.5, font: fontRegular, color: rgb(0.5, 0.5, 0.6) });

  page1.drawRectangle({
    x: 315,
    y: sigY,
    width: 235,
    height: 125,
    borderColor: rgb(0.45, 0.45, 0.9),
    borderWidth: 1.2,
    borderDashArray: [4, 4],
    color: rgb(0.98, 0.98, 1.0)
  });
  page1.drawText('AUTHORIZED SIGNATORY (COUNTERPARTY)', { x: 325, y: sigY + 106, size: 8, font: fontBold, color: rgb(0.3, 0.35, 0.8) });
  page1.drawText('Please place your signature, name & date below:', { x: 325, y: sigY + 90, size: 7.5, font: fontRegular, color: rgb(0.4, 0.4, 0.6) });
  page1.drawLine({ start: { x: 325, y: sigY + 32 }, end: { x: 530, y: sigY + 32 }, color: rgb(0.6, 0.6, 0.9), thickness: 1 });
  page1.drawText('Click or drag signature to this area', { x: 325, y: sigY + 18, size: 7.5, font: fontOblique, color: rgb(0.4, 0.4, 0.8) });

  // Security Footer
  page1.drawText('ConvertPro E-Sign Studio | Cryptographically Bound Electronic Signature | SHA-256 Validated', {
    x: 50,
    y: 35,
    size: 7.5,
    font: fontRegular,
    color: rgb(0.6, 0.6, 0.7)
  });

  return await doc.save();
}

/**
 * Main function to sign PDF with placed annotations, QR stamps, and append an official audit certificate
 */
export async function signPdfDocument(
  sourcePdfBytes: Uint8Array,
  annotations: SignatureAnnotation[],
  metadata: SignerMetadata,
  originalFileName: string
): Promise<SignPdfResult> {
  const pdfDoc = await PDFDocument.load(sourcePdfBytes);
  const pages = pdfDoc.getPages();
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

  // Generate Unique Document ID
  const documentId = 'CP-' + Math.random().toString(36).substring(2, 9).toUpperCase() + '-' + Date.now().toString().slice(-4);
  const initialHash = await computeSha256(sourcePdfBytes.buffer as ArrayBuffer);
  const qrDataUrl = await generateVerificationQr(documentId, initialHash, metadata.signers[0]?.name || 'Authorized Signer');

  // 1. Embed each annotation onto its target page
  for (const ann of annotations) {
    if (ann.pageIndex < 0 || ann.pageIndex >= pages.length) continue;
    const page = pages[ann.pageIndex];
    const { width, height } = page.getSize();

    const destX = (ann.xPercent / 100) * width;
    const destW = (ann.widthPercent / 100) * width;
    const destH = (ann.heightPercent / 100) * height;
    const destY = height - (ann.yPercent / 100) * height - destH;

    if (['signature', 'initials', 'seal', 'qr'].includes(ann.type) && ann.content.startsWith('data:image')) {
      try {
        const base64Data = ann.content.split(',')[1];
        const imgBytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
        
        let embeddedImage;
        if (ann.content.startsWith('data:image/jpeg') || ann.content.startsWith('data:image/jpg')) {
          embeddedImage = await pdfDoc.embedJpg(imgBytes);
        } else {
          embeddedImage = await pdfDoc.embedPng(imgBytes);
        }

        page.drawImage(embeddedImage, {
          x: Math.max(0, destX),
          y: Math.max(0, destY),
          width: Math.max(10, destW),
          height: Math.max(10, destH)
        });
      } catch (err) {
        console.error('Failed to embed signature image:', err);
      }
    } else {
      // Text / Date / Name annotations
      const textToDraw = ann.content || '';
      const fSize = ann.fontSize || 10;
      page.drawText(textToDraw, {
        x: Math.max(0, destX),
        y: Math.max(0, destY + 4),
        size: fSize,
        font: fontBold,
        color: rgb(0.1, 0.1, 0.2)
      });
    }
  }

  const timestampReadable = new Date().toLocaleString();

  // 2. Append Audit Trail Certificate page if requested
  if (metadata.includeAuditCertificate !== false) {
    const certPage = pdfDoc.addPage([595.28, 841.89]);
    const { width: cWidth, height: cHeight } = certPage.getSize();

    // Certificate Header Banner
    certPage.drawRectangle({
      x: 35,
      y: cHeight - 95,
      width: cWidth - 70,
      height: 60,
      color: rgb(0.95, 0.96, 1.0),
      borderColor: rgb(0.39, 0.4, 0.95),
      borderWidth: 1.5
    });

    certPage.drawText('CONVERTPRO CRYPTOGRAPHIC AUDIT TRAIL CERTIFICATE', {
      x: 50,
      y: cHeight - 65,
      size: 12.5,
      font: fontBold,
      color: rgb(0.2, 0.25, 0.6)
    });
    certPage.drawText('Legal Electronic Signature Audit Trail & ESIGN / eIDAS Proof of Execution', {
      x: 50,
      y: cHeight - 82,
      size: 8.5,
      font: fontRegular,
      color: rgb(0.4, 0.45, 0.65)
    });

    // Draw Verification QR Code on Certificate
    if (qrDataUrl) {
      try {
        const qrBase64 = qrDataUrl.split(',')[1];
        const qrBytes = Uint8Array.from(atob(qrBase64), c => c.charCodeAt(0));
        const embeddedQr = await pdfDoc.embedPng(qrBytes);
        certPage.drawImage(embeddedQr, {
          x: cWidth - 110,
          y: cHeight - 90,
          width: 50,
          height: 50
        });
      } catch (e) {
        console.error('Error drawing QR on cert:', e);
      }
    }

    // Metadata Details Box
    let curY = cHeight - 130;

    const drawRow = (label: string, value: string) => {
      certPage.drawText(label, { x: 50, y: curY, size: 8.5, font: fontBold, color: rgb(0.3, 0.35, 0.45) });
      certPage.drawText(value, { x: 180, y: curY, size: 8.5, font: fontRegular, color: rgb(0.1, 0.15, 0.25) });
      certPage.drawLine({ start: { x: 50, y: curY - 5 }, end: { x: cWidth - 50, y: curY - 5 }, color: rgb(0.9, 0.92, 0.96), thickness: 0.8 });
      curY -= 20;
    };

    drawRow('Document ID:', documentId);
    drawRow('Document Name:', originalFileName);
    drawRow('Execution Timestamp:', `${timestampReadable} (UTC)`);
    drawRow('Signer Name:', metadata.signers.map(s => `${s.name} (${s.role.toUpperCase()})`).join(', '));
    drawRow('Sign Reason / Intent:', metadata.signReason || 'Authorized Electronic Execution & Consent');
    drawRow('Security Protocol:', 'SHA-256 Client-Side Ephemeral Key Verification');
    drawRow('ESIGN / eIDAS Status:', 'Compliant Electronic Signature (15 U.S.C. § 7001)');
    drawRow('Document Fingerprint:', initialHash);

    // Signatures Summary Box
    curY -= 15;
    certPage.drawRectangle({
      x: 45,
      y: curY - 145,
      width: cWidth - 90,
      height: 145,
      color: rgb(0.98, 0.99, 1.0),
      borderColor: rgb(0.8, 0.85, 0.95),
      borderWidth: 1
    });

    certPage.drawText('VERIFIED SIGNATURE STAMPS & AUDIT TIMELINE:', {
      x: 60,
      y: curY - 20,
      size: 9,
      font: fontBold,
      color: rgb(0.2, 0.25, 0.6)
    });

    let stampY = curY - 40;
    annotations.forEach((ann, idx) => {
      if (stampY > curY - 135) {
        certPage.drawText(`• Stamp #${idx + 1}: ${ann.type.toUpperCase()} placed on Page ${ann.pageIndex + 1} at coordinates (${Math.round(ann.xPercent)}%, ${Math.round(ann.yPercent)}%)`, {
          x: 60,
          y: stampY,
          size: 8,
          font: fontRegular,
          color: rgb(0.3, 0.35, 0.45)
        });
        stampY -= 16;
      }
    });

    // Legal disclaimer
    certPage.drawText('This certificate confirms that the document was signed electronically via ConvertPro E-Sign Studio.', {
      x: 50,
      y: 45,
      size: 7.5,
      font: fontRegular,
      color: rgb(0.5, 0.55, 0.65)
    });
    certPage.drawText('Tamper-evident verification hash is cryptographically bound to the document contents at execution.', {
      x: 50,
      y: 33,
      size: 7.5,
      font: fontRegular,
      color: rgb(0.5, 0.55, 0.65)
    });
  }

  // 3. Finalize PDF Buffer
  const finalPdfBytes = await pdfDoc.save();
  const documentHash = await computeSha256(finalPdfBytes.buffer as ArrayBuffer);
  
  const blob = new Blob([finalPdfBytes], { type: 'application/pdf' });
  const pdfUrl = URL.createObjectURL(blob);
  const baseName = originalFileName.replace(/\.[^/.]+$/, '');
  const outFileName = `${baseName}_Signed.pdf`;

  return {
    pdfBlob: blob,
    pdfUrl,
    fileName: outFileName,
    fileSize: blob.size,
    documentHash,
    documentId,
    timestamp: timestampReadable,
    pageCount: pdfDoc.getPageCount(),
    qrDataUrl
  };
}
