import QRCode from 'qrcode';
import { jsPDF } from 'jspdf';
import {
  QRStylingOptions,
  VCardFormData,
  WifiFormData,
  LocationFormData,
  EmailFormData,
  PhoneFormData
} from '../../types/qr';

export const DEFAULT_QR_STYLING: QRStylingOptions = {
  style: 'rounded',
  cornerStyle: 'rounded',
  fgColor: '#0F172A',
  bgColor: '#FFFFFF',
  isGradient: false,
  gradientColor2: '#3B82F6',
  gradientDirection: 'to-br',
  errorCorrectionLevel: 'M',
  logoSize: 0.22,
  logoBackground: true,
  margin: 2
};

// Preset gradient combinations
export const QR_GRADIENT_PRESETS = [
  { id: 'classic-dark', name: 'Midnight Slate', fg: '#0F172A', fg2: '#334155', bg: '#FFFFFF' },
  { id: 'cyber-neon', name: 'Cyber Neon', fg: '#6366F1', fg2: '#EC4899', bg: '#FFFFFF' },
  { id: 'ocean-blue', name: 'Ocean Breeze', fg: '#0284C7', fg2: '#0D9488', bg: '#FFFFFF' },
  { id: 'emerald-mint', name: 'Emerald Forest', fg: '#059669', fg2: '#10B981', bg: '#FFFFFF' },
  { id: 'sunset-amber', name: 'Sunset Glow', fg: '#EA580C', fg2: '#F59E0B', bg: '#FFFFFF' },
  { id: 'royal-violet', name: 'Royal Violet', fg: '#7C3AED', fg2: '#4F46E5', bg: '#FFFFFF' },
  { id: 'dark-gold', name: 'Dark Gold', fg: '#D97706', fg2: '#B45309', bg: '#0F172A' },
  { id: 'matrix-dark', name: 'Dark Matrix', fg: '#10B981', fg2: '#34D399', bg: '#0B0F19' }
];

// Preset center icons
export const QR_LOGO_PRESETS = [
  { id: 'convertpro', label: 'ConvertPro', icon: '⚡' },
  { id: 'link', label: 'Link / Web', icon: '🔗' },
  { id: 'pdf', label: 'PDF Document', icon: '📄' },
  { id: 'image', label: 'Image / Photo', icon: '🖼️' },
  { id: 'wifi', label: 'Wi-Fi Network', icon: '📶' },
  { id: 'phone', label: 'Call / Phone', icon: '📱' },
  { id: 'email', label: 'Email / Mail', icon: '✉️' },
  { id: 'user', label: 'Contact Card', icon: '👤' },
  { id: 'music', label: 'Audio / Music', icon: '🎵' },
  { id: 'video', label: 'Video / Clip', icon: '🎬' },
  { id: 'location', label: 'Location Map', icon: '📍' },
  { id: 'files', label: 'Multi-Files', icon: '📦' }
];

/**
 * Helper to check if a matrix position belongs to one of the 3 Corner Finder Patterns (7x7)
 */
function isFinderPattern(row: number, col: number, moduleCount: number): boolean {
  // Top-Left (0..6, 0..6)
  if (row < 7 && col < 7) return true;
  // Top-Right (0..6, moduleCount-7..moduleCount-1)
  if (row < 7 && col >= moduleCount - 7) return true;
  // Bottom-Left (moduleCount-7..moduleCount-1, 0..6)
  if (row >= moduleCount - 7 && col < 7) return true;
  return false;
}

/**
 * Helper to check if a module is in the center logo exclusion zone
 */
function isInLogoZone(row: number, col: number, moduleCount: number, logoSizeRatio: number): boolean {
  if (logoSizeRatio <= 0) return false;
  const center = moduleCount / 2;
  const radius = (moduleCount * logoSizeRatio) / 2 + 1.2;
  return Math.abs(row - center) < radius && Math.abs(col - center) < radius;
}

/**
 * Generate standard QR Matrix using qrcode library
 */
export function generateQrRawMatrix(
  value: string,
  errorCorrectionLevel: 'L' | 'M' | 'Q' | 'H' = 'M'
): { data: boolean[][]; size: number } {
  const qr = QRCode.create(value, {
    errorCorrectionLevel
  });

  const size = qr.modules.size;
  const matrix: boolean[][] = [];

  for (let r = 0; r < size; r++) {
    const row: boolean[] = [];
    for (let c = 0; c < size; c++) {
      row.push(Boolean(qr.modules.get(r, c)));
    }
    matrix.push(row);
  }

  return { data: matrix, size };
}

/**
 * Render fully styled, high-end QR code to an HTML5 Canvas
 */
export async function renderQrToCanvas(
  canvas: HTMLCanvasElement,
  value: string,
  styling: QRStylingOptions,
  targetSize: number = 800
): Promise<void> {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const ecLevel = styling.logoUrl || styling.logoPreset ? 'H' : styling.errorCorrectionLevel;
  const { data: matrix, size: moduleCount } = generateQrRawMatrix(value || 'https://convertpro.app', ecLevel);

  // Layout calculations
  const hasCaption = Boolean(styling.captionText?.trim());
  const captionHeight = hasCaption ? Math.round(targetSize * 0.14) : 0;
  const totalHeight = targetSize + captionHeight;

  canvas.width = targetSize;
  canvas.height = totalHeight;

  // Clear & Draw Canvas Background
  if (styling.bgColor === 'transparent') {
    ctx.clearRect(0, 0, targetSize, totalHeight);
  } else {
    ctx.fillStyle = styling.bgColor;
    ctx.fillRect(0, 0, targetSize, totalHeight);
  }

  const marginModules = styling.margin ?? 2;
  const totalGridSize = moduleCount + marginModules * 2;
  const cellSize = targetSize / totalGridSize;
  const offset = marginModules * cellSize;

  // Create Foreground Gradient or Solid Brush
  let fgBrush: string | CanvasGradient = styling.fgColor;
  if (styling.isGradient) {
    let grad: CanvasGradient;
    if (styling.gradientDirection === 'to-r') {
      grad = ctx.createLinearGradient(0, 0, targetSize, 0);
    } else if (styling.gradientDirection === 'to-b') {
      grad = ctx.createLinearGradient(0, 0, 0, targetSize);
    } else if (styling.gradientDirection === 'radial') {
      grad = ctx.createRadialGradient(
        targetSize / 2,
        targetSize / 2,
        10,
        targetSize / 2,
        targetSize / 2,
        targetSize / 1.4
      );
    } else {
      grad = ctx.createLinearGradient(0, 0, targetSize, targetSize);
    }
    grad.addColorStop(0, styling.fgColor);
    grad.addColorStop(1, styling.gradientColor2);
    fgBrush = grad;
  }

  // Draw QR Body Modules
  const logoActive = Boolean(styling.logoUrl || styling.logoPreset);
  const logoRatio = logoActive ? styling.logoSize || 0.22 : 0;

  for (let r = 0; r < moduleCount; r++) {
    for (let c = 0; c < moduleCount; c++) {
      if (isFinderPattern(r, c, moduleCount)) continue; // Handled separately
      if (logoActive && isInLogoZone(r, c, moduleCount, logoRatio)) continue; // Clear zone for logo

      if (matrix[r][c]) {
        const x = offset + c * cellSize;
        const y = offset + r * cellSize;
        ctx.fillStyle = fgBrush;

        if (styling.style === 'dots') {
          ctx.beginPath();
          ctx.arc(x + cellSize / 2, y + cellSize / 2, (cellSize / 2) * 0.88, 0, Math.PI * 2);
          ctx.fill();
        } else if (styling.style === 'rounded') {
          ctx.beginPath();
          ctx.roundRect(x + 0.5, y + 0.5, cellSize - 1, cellSize - 1, cellSize * 0.35);
          ctx.fill();
        } else if (styling.style === 'classy') {
          ctx.beginPath();
          ctx.roundRect(x + 0.5, y + 0.5, cellSize - 1, cellSize - 1, [
            (r + c) % 2 === 0 ? cellSize * 0.5 : 0,
            (r + c) % 2 === 1 ? cellSize * 0.5 : 0,
            (r + c) % 2 === 0 ? cellSize * 0.5 : 0,
            (r + c) % 2 === 1 ? cellSize * 0.5 : 0
          ]);
          ctx.fill();
        } else if (styling.style === 'diamond') {
          ctx.beginPath();
          ctx.moveTo(x + cellSize / 2, y);
          ctx.lineTo(x + cellSize, y + cellSize / 2);
          ctx.lineTo(x + cellSize / 2, y + cellSize);
          ctx.lineTo(x, y + cellSize / 2);
          ctx.closePath();
          ctx.fill();
        } else {
          // Classic Square
          ctx.fillRect(x, y, cellSize, cellSize);
        }
      }
    }
  }

  // Draw 3 Finder Corner Patterns
  const finderPositions = [
    { r: 0, c: 0 },
    { r: 0, c: moduleCount - 7 },
    { r: moduleCount - 7, c: 0 }
  ];

  finderPositions.forEach(({ r, c }) => {
    const x = offset + c * cellSize;
    const y = offset + r * cellSize;
    const fSize = 7 * cellSize;

    // Clear finder area background
    if (styling.bgColor !== 'transparent') {
      ctx.fillStyle = styling.bgColor;
      ctx.fillRect(x, y, fSize, fSize);
    }

    ctx.fillStyle = fgBrush;

    if (styling.cornerStyle === 'circle') {
      // Outer Circle
      ctx.beginPath();
      ctx.arc(x + fSize / 2, y + fSize / 2, fSize / 2, 0, Math.PI * 2);
      ctx.fill();

      // Inner Cutout
      ctx.fillStyle = styling.bgColor === 'transparent' ? '#FFFFFF' : styling.bgColor;
      ctx.beginPath();
      ctx.arc(x + fSize / 2, y + fSize / 2, (fSize / 2) - cellSize, 0, Math.PI * 2);
      ctx.fill();

      // Center Dot
      ctx.fillStyle = fgBrush;
      ctx.beginPath();
      ctx.arc(x + fSize / 2, y + fSize / 2, (fSize / 2) - 2 * cellSize, 0, Math.PI * 2);
      ctx.fill();
    } else if (styling.cornerStyle === 'rounded') {
      // Outer Rounded Square
      ctx.beginPath();
      ctx.roundRect(x, y, fSize, fSize, cellSize * 2);
      ctx.fill();

      // Inner Cutout
      ctx.fillStyle = styling.bgColor === 'transparent' ? '#FFFFFF' : styling.bgColor;
      ctx.beginPath();
      ctx.roundRect(x + cellSize, y + cellSize, fSize - 2 * cellSize, fSize - 2 * cellSize, cellSize * 1.2);
      ctx.fill();

      // Center Pill
      ctx.fillStyle = fgBrush;
      ctx.beginPath();
      ctx.roundRect(x + 2 * cellSize, y + 2 * cellSize, fSize - 4 * cellSize, fSize - 4 * cellSize, cellSize * 0.8);
      ctx.fill();
    } else if (styling.cornerStyle === 'dot') {
      // Outer Rounded
      ctx.beginPath();
      ctx.roundRect(x, y, fSize, fSize, cellSize * 2.2);
      ctx.fill();

      // Inner Cutout
      ctx.fillStyle = styling.bgColor === 'transparent' ? '#FFFFFF' : styling.bgColor;
      ctx.beginPath();
      ctx.roundRect(x + cellSize, y + cellSize, fSize - 2 * cellSize, fSize - 2 * cellSize, cellSize * 1.5);
      ctx.fill();

      // Center Circle Dot
      ctx.fillStyle = fgBrush;
      ctx.beginPath();
      ctx.arc(x + fSize / 2, y + fSize / 2, 1.5 * cellSize, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Classic Square
      ctx.fillRect(x, y, fSize, fSize);
      ctx.fillStyle = styling.bgColor === 'transparent' ? '#FFFFFF' : styling.bgColor;
      ctx.fillRect(x + cellSize, y + cellSize, fSize - 2 * cellSize, fSize - 2 * cellSize);
      ctx.fillStyle = fgBrush;
      ctx.fillRect(x + 2 * cellSize, y + 2 * cellSize, fSize - 4 * cellSize, fSize - 4 * cellSize);
    }
  });

  // Render Center Logo if enabled
  if (logoActive) {
    const lWidth = targetSize * logoRatio;
    const lX = (targetSize - lWidth) / 2;
    const lY = (targetSize - lWidth) / 2;

    // Draw protective background plate
    if (styling.logoBackground) {
      const platePadding = lWidth * 0.16;
      ctx.save();
      ctx.shadowColor = 'rgba(0, 0, 0, 0.18)';
      ctx.shadowBlur = 14;
      ctx.shadowOffsetY = 4;
      ctx.fillStyle = styling.bgColor === 'transparent' ? '#FFFFFF' : styling.bgColor;
      ctx.beginPath();
      ctx.roundRect(
        lX - platePadding,
        lY - platePadding,
        lWidth + platePadding * 2,
        lWidth + platePadding * 2,
        (lWidth + platePadding * 2) * 0.28
      );
      ctx.fill();
      ctx.restore();
    }

    // Render Preset Emoji/Icon or Uploaded Image
    if (styling.logoPreset) {
      const presetObj = QR_LOGO_PRESETS.find(p => p.id === styling.logoPreset);
      const iconChar = presetObj ? presetObj.icon : '⚡';
      ctx.font = `${Math.round(lWidth * 0.72)}px "Apple Color Emoji", "Segoe UI Emoji", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(iconChar, targetSize / 2, targetSize / 2);
    } else if (styling.logoUrl) {
      await new Promise<void>((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          ctx.save();
          ctx.beginPath();
          ctx.roundRect(lX, lY, lWidth, lWidth, lWidth * 0.2);
          ctx.clip();
          ctx.drawImage(img, lX, lY, lWidth, lWidth);
          ctx.restore();
          resolve();
        };
        img.onerror = () => resolve();
        img.src = styling.logoUrl!;
      });
    }
  }

  // Render Caption / Brand Text Banner below QR
  if (hasCaption) {
    const capY = targetSize + captionHeight * 0.45;
    ctx.fillStyle = styling.fgColor;
    ctx.font = `bold ${Math.round(captionHeight * 0.32)}px Inter, -apple-system, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(styling.captionText!, targetSize / 2, capY);

    if (styling.captionSubtext?.trim()) {
      ctx.fillStyle = styling.fgColor;
      ctx.globalAlpha = 0.65;
      ctx.font = `500 ${Math.round(captionHeight * 0.22)}px Inter, -apple-system, sans-serif`;
      ctx.fillText(styling.captionSubtext!, targetSize / 2, capY + captionHeight * 0.36);
      ctx.globalAlpha = 1.0;
    }
  }
}

/**
 * Generate Clean Scalable Vector SVG
 */
export async function exportQrToSvg(
  value: string,
  styling: QRStylingOptions,
  dimension: number = 800
): Promise<string> {
  const ecLevel = styling.logoUrl || styling.logoPreset ? 'H' : styling.errorCorrectionLevel;
  const { data: matrix, size: moduleCount } = generateQrRawMatrix(value || 'https://convertpro.app', ecLevel);

  const marginModules = styling.margin ?? 2;
  const totalGridSize = moduleCount + marginModules * 2;
  const cellSize = dimension / totalGridSize;
  const offset = marginModules * cellSize;

  const hasCaption = Boolean(styling.captionText?.trim());
  const captionHeight = hasCaption ? Math.round(dimension * 0.14) : 0;
  const totalHeight = dimension + captionHeight;

  let defs = '';
  let fgFill = styling.fgColor;

  if (styling.isGradient) {
    defs = `
      <defs>
        <linearGradient id="qrGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${styling.fgColor}" />
          <stop offset="100%" stop-color="${styling.gradientColor2}" />
        </linearGradient>
      </defs>
    `;
    fgFill = 'url(#qrGrad)';
  }

  let paths = '';
  const logoActive = Boolean(styling.logoUrl || styling.logoPreset);
  const logoRatio = logoActive ? styling.logoSize || 0.22 : 0;

  for (let r = 0; r < moduleCount; r++) {
    for (let c = 0; c < moduleCount; c++) {
      if (isFinderPattern(r, c, moduleCount)) continue;
      if (logoActive && isInLogoZone(r, c, moduleCount, logoRatio)) continue;

      if (matrix[r][c]) {
        const x = offset + c * cellSize;
        const y = offset + r * cellSize;

        if (styling.style === 'dots') {
          paths += `<circle cx="${x + cellSize / 2}" cy="${y + cellSize / 2}" r="${(cellSize / 2) * 0.88}" fill="${fgFill}" />`;
        } else if (styling.style === 'rounded') {
          paths += `<rect x="${x + 0.5}" y="${y + 0.5}" width="${cellSize - 1}" height="${cellSize - 1}" rx="${cellSize * 0.35}" fill="${fgFill}" />`;
        } else {
          paths += `<rect x="${x}" y="${y}" width="${cellSize}" height="${cellSize}" fill="${fgFill}" />`;
        }
      }
    }
  }

  // Corner Finders
  const finderPositions = [
    { r: 0, c: 0 },
    { r: 0, c: moduleCount - 7 },
    { r: moduleCount - 7, c: 0 }
  ];

  finderPositions.forEach(({ r, c }) => {
    const x = offset + c * cellSize;
    const y = offset + r * cellSize;
    const fSize = 7 * cellSize;

    if (styling.cornerStyle === 'circle') {
      paths += `
        <circle cx="${x + fSize / 2}" cy="${y + fSize / 2}" r="${fSize / 2}" fill="${fgFill}" />
        <circle cx="${x + fSize / 2}" cy="${y + fSize / 2}" r="${fSize / 2 - cellSize}" fill="${styling.bgColor === 'transparent' ? '#ffffff' : styling.bgColor}" />
        <circle cx="${x + fSize / 2}" cy="${y + fSize / 2}" r="${fSize / 2 - 2 * cellSize}" fill="${fgFill}" />
      `;
    } else if (styling.cornerStyle === 'rounded') {
      paths += `
        <rect x="${x}" y="${y}" width="${fSize}" height="${fSize}" rx="${cellSize * 2}" fill="${fgFill}" />
        <rect x="${x + cellSize}" y="${y + cellSize}" width="${fSize - 2 * cellSize}" height="${fSize - 2 * cellSize}" rx="${cellSize * 1.2}" fill="${styling.bgColor === 'transparent' ? '#ffffff' : styling.bgColor}" />
        <rect x="${x + 2 * cellSize}" y="${y + 2 * cellSize}" width="${fSize - 4 * cellSize}" height="${fSize - 4 * cellSize}" rx="${cellSize * 0.8}" fill="${fgFill}" />
      `;
    } else {
      paths += `
        <rect x="${x}" y="${y}" width="${fSize}" height="${fSize}" fill="${fgFill}" />
        <rect x="${x + cellSize}" y="${y + cellSize}" width="${fSize - 2 * cellSize}" height="${fSize - 2 * cellSize}" fill="${styling.bgColor === 'transparent' ? '#ffffff' : styling.bgColor}" />
        <rect x="${x + 2 * cellSize}" y="${y + 2 * cellSize}" width="${fSize - 4 * cellSize}" height="${fSize - 4 * cellSize}" fill="${fgFill}" />
      `;
    }
  });

  // Optional Caption in SVG
  let captionSvg = '';
  if (hasCaption) {
    const capY = dimension + captionHeight * 0.45;
    captionSvg = `
      <text x="${dimension / 2}" y="${capY}" font-family="Inter, -apple-system, sans-serif" font-weight="bold" font-size="${Math.round(captionHeight * 0.32)}" fill="${styling.fgColor}" text-anchor="middle">${styling.captionText}</text>
    `;
    if (styling.captionSubtext?.trim()) {
      captionSvg += `
        <text x="${dimension / 2}" y="${capY + captionHeight * 0.36}" font-family="Inter, -apple-system, sans-serif" font-weight="500" font-size="${Math.round(captionHeight * 0.22)}" fill="${styling.fgColor}" opacity="0.65" text-anchor="middle">${styling.captionSubtext}</text>
      `;
    }
  }

  const bgRect = styling.bgColor !== 'transparent'
    ? `<rect width="100%" height="100%" fill="${styling.bgColor}" />`
    : '';

  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${dimension} ${totalHeight}" width="${dimension}" height="${totalHeight}">
      ${defs}
      ${bgRect}
      ${paths}
      ${captionSvg}
    </svg>
  `.trim();
}

/**
 * Export high-resolution PNG image at exact dimension (512, 1024, 2048)
 */
export async function exportQrToPng(
  value: string,
  styling: QRStylingOptions,
  dimension: number = 1024
): Promise<string> {
  const canvas = document.createElement('canvas');
  await renderQrToCanvas(canvas, value, styling, dimension);
  return canvas.toDataURL('image/png');
}

/**
 * Export a clean printable 1-page PDF presentation flyer
 */
export async function exportQrToPdf(
  title: string,
  value: string,
  styling: QRStylingOptions,
  metaInfo?: { type: string; details?: string; shareUrl?: string }
): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 595.28 pt
  const pageHeight = doc.internal.pageSize.getHeight(); // 841.89 pt

  // Background
  doc.setFillColor('#F8FAFC');
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  // Decorative Top Accent Bar
  doc.setFillColor(styling.fgColor || '#0F172A');
  doc.rect(0, 0, pageWidth, 8, 'F');

  // Top Badge
  doc.setFillColor('#FFFFFF');
  doc.roundedRect(48, 48, 160, 24, 4, 4, 'F');
  doc.setTextColor('#3B82F6');
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('CONVERTPRO SCANNABLE QR', 58, 63);

  // Main Header Title
  doc.setTextColor('#0F172A');
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(24);
  const splitTitle = doc.splitTextToSize(title || 'Scan to Access Content', pageWidth - 96);
  doc.text(splitTitle, 48, 105);

  // Subtitle / Details
  if (metaInfo?.details) {
    doc.setTextColor('#64748B');
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(11);
    const splitDetails = doc.splitTextToSize(metaInfo.details, pageWidth - 96);
    doc.text(splitDetails, 48, 135);
  }

  // Central Card Container for QR
  const cardWidth = 440;
  const cardHeight = 490;
  const cardX = (pageWidth - cardWidth) / 2;
  const cardY = 165;

  doc.setFillColor('#FFFFFF');
  doc.roundedRect(cardX, cardY, cardWidth, cardHeight, 16, 16, 'F');

  // Top accent line on card
  doc.setFillColor('#E2E8F0');
  doc.rect(cardX + 24, cardY + 24, cardWidth - 48, 1, 'F');

  // Render QR Code onto temporary canvas
  const tempCanvas = document.createElement('canvas');
  await renderQrToCanvas(tempCanvas, value, styling, 1024);
  const qrBase64 = tempCanvas.toDataURL('image/png');

  const qrImageSize = 340;
  const qrImageX = (pageWidth - qrImageSize) / 2;
  const qrImageY = cardY + 45;

  doc.addImage(qrBase64, 'PNG', qrImageX, qrImageY, qrImageSize, qrImageSize);

  // Scan instruction pill below QR
  doc.setTextColor('#0F172A');
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('Scan with your smartphone camera', pageWidth / 2, qrImageY + qrImageSize + 35, { align: 'center' });

  doc.setTextColor('#94A3B8');
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(9.5);
  const targetLabel = metaInfo?.shareUrl || value;
  const truncatedUrl = targetLabel.length > 55 ? targetLabel.substring(0, 52) + '...' : targetLabel;
  doc.text(`Target Destination: ${truncatedUrl}`, pageWidth / 2, qrImageY + qrImageSize + 55, { align: 'center' });

  // Page Footer
  doc.setTextColor('#94A3B8');
  doc.setFontSize(8.5);
  doc.text('Generated with ConvertPro Universal QR Studio', 48, pageHeight - 35);
  doc.text(new Date().toLocaleDateString(), pageWidth - 100, pageHeight - 35);

  const fileName = `${(title || 'ConvertPro_QR').replace(/[^a-zA-Z0-9_-]/g, '_')}_Flyer.pdf`;
  doc.save(fileName);
}

// -------------------------------------------------------------
// Formatters for Standard QR Types
// -------------------------------------------------------------

export function formatVCard(data: VCardFormData): string {
  const lines: string[] = ['BEGIN:VCARD', 'VERSION:3.0'];
  lines.push(`N:${data.lastName || ''};${data.firstName || ''};;;`);
  lines.push(`FN:${[data.firstName, data.lastName].filter(Boolean).join(' ')}`);
  if (data.organization) lines.push(`ORG:${data.organization}`);
  if (data.title) lines.push(`TITLE:${data.title}`);
  if (data.phone) lines.push(`TEL;TYPE=WORK,VOICE:${data.phone}`);
  if (data.cellPhone) lines.push(`TEL;TYPE=CELL,VOICE:${data.cellPhone}`);
  if (data.email) lines.push(`EMAIL;TYPE=PREF,INTERNET:${data.email}`);
  if (data.website) lines.push(`URL:${data.website.startsWith('http') ? data.website : `https://${data.website}`}`);
  if (data.street || data.city || data.state || data.country) {
    lines.push(`ADR;TYPE=WORK:;;${data.street || ''};${data.city || ''};${data.state || ''};${data.zip || ''};${data.country || ''}`);
  }
  if (data.note) lines.push(`NOTE:${data.note}`);
  lines.push('END:VCARD');
  return lines.join('\n');
}

export function formatWifi(data: WifiFormData): string {
  const enc = data.encryption || 'WPA';
  const pass = data.password || '';
  const hidden = data.hidden ? 'true' : 'false';
  return `WIFI:S:${data.ssid};T:${enc};P:${pass};H:${hidden};;`;
}

export function formatLocation(data: LocationFormData): string {
  if (data.latitude && data.longitude) {
    return `https://maps.google.com/?q=${data.latitude},${data.longitude}`;
  }
  if (data.query) {
    return `https://maps.google.com/?q=${encodeURIComponent(data.query)}`;
  }
  return 'https://maps.google.com';
}

export function formatEmail(data: EmailFormData): string {
  const params: string[] = [];
  if (data.subject) params.push(`subject=${encodeURIComponent(data.subject)}`);
  if (data.body) params.push(`body=${encodeURIComponent(data.body)}`);
  const query = params.length > 0 ? `?${params.join('&')}` : '';
  return `mailto:${data.email}${query}`;
}

export function formatPhone(data: PhoneFormData): string {
  return `tel:${data.phoneNumber.replace(/[^\d+]/g, '')}`;
}
