/**
 * ConvertPro Universal Image Tools Engine
 * High-performance client-side image processing algorithms:
 * - Color grading & filters
 * - Precision cropping, rotation & resizing
 * - Passport & ID photo sheet generation (US, EU, India, Visa, Student ID)
 * - Canvas styler, padding, gradients & mockup frames
 * - Text & logo watermarking
 * - Multi-format encoding & batch ZIP packaging
 */

import JSZip from 'jszip';

export interface ImageFilterSettings {
  preset: string;
  brightness: number; // 0 - 200
  contrast: number;   // 0 - 200
  saturation: number; // 0 - 200
  hueRotate: number;  // -180 to 180
  blur: number;       // 0 - 20
  sepia: number;      // 0 - 100
  grayscale: number;  // 0 - 100
  invert: number;     // 0 - 100
  opacity: number;    // 0 - 100
}

export interface ImageTransformSettings {
  rotation: number; // 0, 90, 180, 270
  flipH: boolean;
  flipV: boolean;
  aspectRatio: 'original' | '1:1' | '4:5' | '9:16' | '16:9' | '4:3' | '3:2' | 'custom';
  resizeMode: 'none' | 'percent' | 'dimensions';
  scalePercent: number; // 25, 50, 75, 100, 200
  customWidth: number;
  customHeight: number;
  maintainAspectRatio: boolean;
}

export interface PassportIdSettings {
  standard: 'us_passport' | 'eu_passport' | 'india_passport' | 'visa_2x2' | 'driver_license' | 'student_id';
  sheetLayout: 'single' | '2x2' | '2x4' | '3x3';
  includeCutBorders: boolean;
  backgroundColor: string;
}

export interface CanvasStylerSettings {
  padding: number; // 0 to 80px
  borderRadius: number; // 0 to 40px
  shadowIntensity: 'none' | 'soft' | 'medium' | 'deep' | 'neon';
  backgroundType: 'transparent' | 'solid' | 'gradient';
  solidColor: string;
  gradientPreset: string;
}

export interface WatermarkSettings {
  enabled: boolean;
  type: 'text' | 'image';
  text: string;
  fontFamily: string;
  fontSize: number;
  textColor: string;
  opacity: number; // 0.1 to 1.0
  rotation: number; // -45 to 45
  position: 'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'tiled';
  logoDataUrl?: string | null;
  logoScale: number; // 0.1 to 1.0
}

export const FILTER_PRESETS: Record<string, Partial<ImageFilterSettings>> = {
  none: { brightness: 100, contrast: 100, saturation: 100, hueRotate: 0, blur: 0, sepia: 0, grayscale: 0, invert: 0, opacity: 100 },
  vibrant: { brightness: 110, contrast: 120, saturation: 140, hueRotate: 0, blur: 0, sepia: 0, grayscale: 0, invert: 0, opacity: 100 },
  cinematic: { brightness: 105, contrast: 130, saturation: 115, hueRotate: 350, blur: 0, sepia: 10, grayscale: 0, invert: 0, opacity: 100 },
  vintage: { brightness: 100, contrast: 110, saturation: 80, hueRotate: 0, blur: 0, sepia: 45, grayscale: 0, invert: 0, opacity: 100 },
  noir: { brightness: 105, contrast: 140, saturation: 0, hueRotate: 0, blur: 0, sepia: 0, grayscale: 100, invert: 0, opacity: 100 },
  cyberpunk: { brightness: 115, contrast: 135, saturation: 165, hueRotate: 290, blur: 0, sepia: 0, grayscale: 0, invert: 0, opacity: 100 },
  warm_sunset: { brightness: 110, contrast: 115, saturation: 130, hueRotate: 15, blur: 0, sepia: 25, grayscale: 0, invert: 0, opacity: 100 },
  cold_arctic: { brightness: 105, contrast: 115, saturation: 90, hueRotate: 190, blur: 0, sepia: 0, grayscale: 0, invert: 0, opacity: 100 },
  hdr: { brightness: 110, contrast: 145, saturation: 135, hueRotate: 0, blur: 0, sepia: 0, grayscale: 0, invert: 0, opacity: 100 }
};

export const PASSPORT_STANDARDS: Record<PassportIdSettings['standard'], { name: string; desc: string; width: number; height: number }> = {
  us_passport: { name: 'US Passport / Visa (2x2")', desc: '600 x 600 px @ 300 DPI', width: 600, height: 600 },
  eu_passport: { name: 'Schengen / EU Passport (35x45mm)', desc: '413 x 531 px @ 300 DPI', width: 413, height: 531 },
  india_passport: { name: 'India / UK Passport (35x45mm)', desc: '413 x 531 px @ 300 DPI', width: 413, height: 531 },
  visa_2x2: { name: 'International Visa 2x2"', desc: '600 x 600 px square photo', width: 600, height: 600 },
  driver_license: { name: 'Driver License / National ID (30x40mm)', desc: '354 x 472 px standard ID', width: 354, height: 472 },
  student_id: { name: 'Student / College ID (25x35mm)', desc: '295 x 413 px portrait card', width: 295, height: 413 }
};

export const GRADIENT_PRESETS: Record<string, { name: string; css: string; stops: [string, string] }> = {
  sunset: { name: 'Sunset Glow', css: 'linear-gradient(135deg, #f97316 0%, #ec4899 100%)', stops: ['#f97316', '#ec4899'] },
  ocean: { name: 'Ocean Wave', css: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)', stops: ['#06b6d4', '#3b82f6'] },
  purple_haze: { name: 'Neon Purple', css: 'linear-gradient(135deg, #8b5cf6 0%, #d946ef 100%)', stops: ['#8b5cf6', '#d946ef'] },
  emerald: { name: 'Forest Emerald', css: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', stops: ['#10b981', '#059669'] },
  dark_slate: { name: 'Hyper Dark', css: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', stops: ['#1e293b', '#0f172a'] },
  cosmic: { name: 'Cosmic Sky', css: 'linear-gradient(135deg, #312e81 0%, #1e1b4b 100%)', stops: ['#312e81', '#1e1b4b'] }
};

/**
 * Build CSS filter string
 */
export function buildFilterCssString(f: ImageFilterSettings): string {
  return `brightness(${f.brightness}%) contrast(${f.contrast}%) saturate(${f.saturation}%) hue-rotate(${f.hueRotate}deg) blur(${f.blur}px) sepia(${f.sepia}%) grayscale(${f.grayscale}%) invert(${f.invert}%) opacity(${f.opacity}%)`;
}

/**
 * Render complete processed image onto canvas
 */
export async function processImageOnCanvas(
  sourceImage: HTMLImageElement,
  filters: ImageFilterSettings,
  transforms: ImageTransformSettings,
  canvasStyler: CanvasStylerSettings,
  watermark: WatermarkSettings
): Promise<{ blob: Blob; dataUrl: string; width: number; height: number }> {
  let origW = sourceImage.naturalWidth || sourceImage.width;
  let origH = sourceImage.naturalHeight || sourceImage.height;

  // 1. Calculate Crop / Aspect Ratio dimensions
  let srcX = 0;
  let srcY = 0;
  let srcW = origW;
  let srcH = origH;

  if (transforms.aspectRatio !== 'original' && transforms.aspectRatio !== 'custom') {
    let targetRatio = 1;
    if (transforms.aspectRatio === '1:1') targetRatio = 1;
    else if (transforms.aspectRatio === '4:5') targetRatio = 4 / 5;
    else if (transforms.aspectRatio === '9:16') targetRatio = 9 / 16;
    else if (transforms.aspectRatio === '16:9') targetRatio = 16 / 9;
    else if (transforms.aspectRatio === '4:3') targetRatio = 4 / 3;
    else if (transforms.aspectRatio === '3:2') targetRatio = 3 / 2;

    const currentRatio = origW / origH;
    if (currentRatio > targetRatio) {
      srcW = origH * targetRatio;
      srcX = (origW - srcW) / 2;
    } else {
      srcH = origW / targetRatio;
      srcY = (origH - srcH) / 2;
    }
  }

  // 2. Calculate Final Content Dimensions
  let finalContentW = srcW;
  let finalContentH = srcH;

  if (transforms.resizeMode === 'percent') {
    const scale = Math.max(0.1, transforms.scalePercent / 100);
    finalContentW = Math.round(srcW * scale);
    finalContentH = Math.round(srcH * scale);
  } else if (transforms.resizeMode === 'dimensions' && transforms.customWidth > 0 && transforms.customHeight > 0) {
    finalContentW = transforms.customWidth;
    finalContentH = transforms.customHeight;
  }

  // Swap dimensions if rotated 90 or 270
  const is90or270 = transforms.rotation === 90 || transforms.rotation === 270;
  const rotatedW = is90or270 ? finalContentH : finalContentW;
  const rotatedH = is90or270 ? finalContentW : finalContentH;

  // 3. Canvas Total Size (including Canvas Padding)
  const pad = canvasStyler.padding || 0;
  const totalW = rotatedW + pad * 2;
  const totalH = rotatedH + pad * 2;

  const canvas = document.createElement('canvas');
  canvas.width = totalW;
  canvas.height = totalH;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Could not get Canvas 2D context');

  // Draw Background
  if (canvasStyler.backgroundType === 'solid') {
    ctx.fillStyle = canvasStyler.solidColor || '#ffffff';
    ctx.fillRect(0, 0, totalW, totalH);
  } else if (canvasStyler.backgroundType === 'gradient') {
    const gInfo = GRADIENT_PRESETS[canvasStyler.gradientPreset] || GRADIENT_PRESETS.sunset;
    const gradient = ctx.createLinearGradient(0, 0, totalW, totalH);
    gradient.addColorStop(0, gInfo.stops[0]);
    gradient.addColorStop(1, gInfo.stops[1]);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, totalW, totalH);
  }

  // Shadow settings
  if (canvasStyler.shadowIntensity !== 'none' && pad > 0) {
    ctx.save();
    if (canvasStyler.shadowIntensity === 'soft') {
      ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
      ctx.shadowBlur = 20;
      ctx.shadowOffsetY = 8;
    } else if (canvasStyler.shadowIntensity === 'medium') {
      ctx.shadowColor = 'rgba(0, 0, 0, 0.35)';
      ctx.shadowBlur = 35;
      ctx.shadowOffsetY = 15;
    } else if (canvasStyler.shadowIntensity === 'deep') {
      ctx.shadowColor = 'rgba(0, 0, 0, 0.55)';
      ctx.shadowBlur = 50;
      ctx.shadowOffsetY = 25;
    } else if (canvasStyler.shadowIntensity === 'neon') {
      ctx.shadowColor = 'rgba(147, 51, 234, 0.6)';
      ctx.shadowBlur = 40;
      ctx.shadowOffsetY = 0;
    }
    // Draw dummy shadow box
    ctx.fillStyle = '#ffffff';
    roundRect(ctx, pad, pad, rotatedW, rotatedH, canvasStyler.borderRadius);
    ctx.fill();
    ctx.restore();
  }

  // Draw Inner Image with Filters & Transformations
  ctx.save();
  if (canvasStyler.borderRadius > 0) {
    roundRect(ctx, pad, pad, rotatedW, rotatedH, canvasStyler.borderRadius);
    ctx.clip();
  }

  // Translate to center of image area
  ctx.translate(pad + rotatedW / 2, pad + rotatedH / 2);

  if (transforms.rotation > 0) {
    ctx.rotate((transforms.rotation * Math.PI) / 180);
  }
  if (transforms.flipH || transforms.flipV) {
    ctx.scale(transforms.flipH ? -1 : 1, transforms.flipV ? -1 : 1);
  }

  ctx.filter = buildFilterCssString(filters);
  ctx.drawImage(
    sourceImage,
    srcX,
    srcY,
    srcW,
    srcH,
    -finalContentW / 2,
    -finalContentH / 2,
    finalContentW,
    finalContentH
  );
  ctx.restore();

  // 4. Apply Watermark
  if (watermark.enabled && watermark.text.trim()) {
    ctx.save();
    ctx.filter = 'none';
    ctx.globalAlpha = Math.max(0.1, watermark.opacity);
    ctx.fillStyle = watermark.textColor || '#ffffff';
    ctx.font = `bold ${watermark.fontSize || 24}px ${watermark.fontFamily || 'sans-serif'}`;
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 4;

    const text = watermark.text.trim();
    const textMetrics = ctx.measureText(text);
    const tw = textMetrics.width;
    const th = watermark.fontSize;

    if (watermark.position === 'tiled') {
      ctx.rotate((watermark.rotation * Math.PI) / 180);
      const stepX = tw + 80;
      const stepY = th + 60;
      for (let x = -totalW; x < totalW * 2; x += stepX) {
        for (let y = -totalH; y < totalH * 2; y += stepY) {
          ctx.fillText(text, x, y);
        }
      }
    } else {
      let wx = totalW / 2 - tw / 2;
      let wy = totalH / 2 + th / 3;

      if (watermark.position === 'top-left') {
        wx = 20 + pad;
        wy = 40 + pad;
      } else if (watermark.position === 'top-right') {
        wx = totalW - tw - 20 - pad;
        wy = 40 + pad;
      } else if (watermark.position === 'bottom-left') {
        wx = 20 + pad;
        wy = totalH - 20 - pad;
      } else if (watermark.position === 'bottom-right') {
        wx = totalW - tw - 20 - pad;
        wy = totalH - 20 - pad;
      }

      ctx.fillText(text, wx, wy);
    }
    ctx.restore();
  }

  const blob = await new Promise<Blob>((resolve) => {
    canvas.toBlob((b) => resolve(b || new Blob()), 'image/jpeg', 0.95);
  });
  const dataUrl = canvas.toDataURL('image/jpeg', 0.95);

  return { blob, dataUrl, width: totalW, height: totalH };
}

/**
 * Helper to draw rounded rectangle
 */
function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

/**
 * Generate Printable Passport Photo Sheet Grid
 */
export async function generatePassportPhotoSheet(
  sourceImage: HTMLImageElement,
  settings: PassportIdSettings
): Promise<{ blob: Blob; dataUrl: string; width: number; height: number }> {
  const std = PASSPORT_STANDARDS[settings.standard] || PASSPORT_STANDARDS.us_passport;
  const photoW = std.width;
  const photoH = std.height;

  // Render individual cropped passport photo
  const photoCanvas = document.createElement('canvas');
  photoCanvas.width = photoW;
  photoCanvas.height = photoH;
  const photoCtx = photoCanvas.getContext('2d');
  if (!photoCtx) throw new Error('Canvas 2D failed');

  // Fill Background
  photoCtx.fillStyle = settings.backgroundColor || '#ffffff';
  photoCtx.fillRect(0, 0, photoW, photoH);

  // Center crop source image onto passport size
  const origW = sourceImage.naturalWidth || sourceImage.width;
  const origH = sourceImage.naturalHeight || sourceImage.height;
  const targetRatio = photoW / photoH;
  const currentRatio = origW / origH;

  let srcX = 0, srcY = 0, srcW = origW, srcH = origH;
  if (currentRatio > targetRatio) {
    srcW = origH * targetRatio;
    srcX = (origW - srcW) / 2;
  } else {
    srcH = origW / targetRatio;
    srcY = (origH - srcH) / 2;
  }

  photoCtx.drawImage(sourceImage, srcX, srcY, srcW, srcH, 0, 0, photoW, photoH);

  if (settings.includeCutBorders) {
    photoCtx.strokeStyle = 'rgba(0, 0, 0, 0.15)';
    photoCtx.lineWidth = 2;
    photoCtx.strokeRect(0, 0, photoW, photoH);
  }

  // If single photo requested
  if (settings.sheetLayout === 'single') {
    const blob = await new Promise<Blob>((res) => photoCanvas.toBlob((b) => res(b || new Blob()), 'image/jpeg', 0.98));
    return { blob, dataUrl: photoCanvas.toDataURL('image/jpeg', 0.98), width: photoW, height: photoH };
  }

  // 4x6 inch standard print sheet @ 300 DPI = 1200 x 1800 px (or 1800 x 1200 px landscape)
  let cols = 2;
  let rows = 2;
  if (settings.sheetLayout === '2x4') { cols = 4; rows = 2; }
  if (settings.sheetLayout === '3x3') { cols = 3; rows = 3; }

  const gap = 30;
  const margin = 40;
  const sheetW = margin * 2 + cols * photoW + (cols - 1) * gap;
  const sheetH = margin * 2 + rows * photoH + (rows - 1) * gap;

  const sheetCanvas = document.createElement('canvas');
  sheetCanvas.width = sheetW;
  sheetCanvas.height = sheetH;
  const sheetCtx = sheetCanvas.getContext('2d');
  if (!sheetCtx) throw new Error('Canvas failed');

  // White sheet background
  sheetCtx.fillStyle = '#ffffff';
  sheetCtx.fillRect(0, 0, sheetW, sheetH);

  // Draw grid
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = margin + c * (photoW + gap);
      const y = margin + r * (photoH + gap);
      sheetCtx.drawImage(photoCanvas, x, y, photoW, photoH);

      if (settings.includeCutBorders) {
        sheetCtx.strokeStyle = '#cccccc';
        sheetCtx.setLineDash([6, 6]);
        sheetCtx.strokeRect(x - 2, y - 2, photoW + 4, photoH + 4);
        sheetCtx.setLineDash([]);
      }
    }
  }

  // Header banner info
  sheetCtx.fillStyle = '#64748b';
  sheetCtx.font = '14px sans-serif';
  sheetCtx.fillText(`ConvertPro Photo Studio — ${std.name} (${cols * rows} Photos)`, margin, margin - 15);

  const blob = await new Promise<Blob>((res) => sheetCanvas.toBlob((b) => res(b || new Blob()), 'image/jpeg', 0.98));
  return { blob, dataUrl: sheetCanvas.toDataURL('image/jpeg', 0.98), width: sheetW, height: sheetH };
}

/**
 * Multi-Format Converter to specific MIME type
 */
export async function convertImageFormat(
  sourceImage: HTMLImageElement,
  format: 'image/jpeg' | 'image/png' | 'image/webp' | 'image/bmp',
  quality: number = 0.92
): Promise<{ blob: Blob; dataUrl: string; size: number }> {
  const canvas = document.createElement('canvas');
  canvas.width = sourceImage.naturalWidth || sourceImage.width;
  canvas.height = sourceImage.naturalHeight || sourceImage.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D failed');

  if (format === 'image/jpeg') {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  ctx.drawImage(sourceImage, 0, 0);

  const blob = await new Promise<Blob>((res) => {
    canvas.toBlob((b) => res(b || new Blob()), format, quality);
  });

  const dataUrl = canvas.toDataURL(format, quality);
  return { blob, dataUrl, size: blob.size };
}

export interface ImageGridTile {
  index: number;
  row: number;
  col: number;
  fileName: string;
  blob: Blob;
  dataUrl: string;
  width: number;
  height: number;
}

/**
 * Split Image into N x M Grid Tiles (e.g. 3x3 for Instagram, 3x1 for Carousels)
 */
export async function splitImageIntoGrid(
  sourceImage: HTMLImageElement,
  rows: number = 3,
  cols: number = 3,
  outputFormat: 'image/jpeg' | 'image/png' = 'image/jpeg',
  quality: number = 0.95
): Promise<ImageGridTile[]> {
  const origW = sourceImage.naturalWidth || sourceImage.width;
  const origH = sourceImage.naturalHeight || sourceImage.height;

  const tileW = Math.floor(origW / cols);
  const tileH = Math.floor(origH / rows);

  const tiles: ImageGridTile[] = [];
  const ext = outputFormat === 'image/png' ? 'png' : 'jpg';

  let count = 1;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const tileCanvas = document.createElement('canvas');
      tileCanvas.width = tileW;
      tileCanvas.height = tileH;
      const tileCtx = tileCanvas.getContext('2d');
      if (tileCtx) {
        tileCtx.drawImage(
          sourceImage,
          c * tileW,
          r * tileH,
          tileW,
          tileH,
          0,
          0,
          tileW,
          tileH
        );

        const blob = await new Promise<Blob>((res) => {
          tileCanvas.toBlob((b) => res(b || new Blob()), outputFormat, quality);
        });
        const dataUrl = tileCanvas.toDataURL(outputFormat, quality);
        const padIndex = String(count).padStart(2, '0');

        tiles.push({
          index: count,
          row: r + 1,
          col: c + 1,
          fileName: `tile_r${r + 1}_c${c + 1}_${padIndex}.${ext}`,
          blob,
          dataUrl,
          width: tileW,
          height: tileH
        });
        count++;
      }
    }
  }

  return tiles;
}

/**
 * Chroma Key / Background Color Eraser (Client-side transparent PNG cutout)
 */
export async function eraseBackgroundColor(
  sourceImage: HTMLImageElement,
  targetColor: { r: number; g: number; b: number } = { r: 255, g: 255, b: 255 },
  tolerance: number = 35,
  feathering: number = 10
): Promise<{ blob: Blob; dataUrl: string }> {
  const w = sourceImage.naturalWidth || sourceImage.width;
  const h = sourceImage.naturalHeight || sourceImage.height;

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D failed');

  ctx.drawImage(sourceImage, 0, 0);
  const imgData = ctx.getImageData(0, 0, w, h);
  const d = imgData.data;

  const tr = targetColor.r;
  const tg = targetColor.g;
  const tb = targetColor.b;
  const tolSq = tolerance * tolerance;
  const maxTolSq = (tolerance + feathering) * (tolerance + feathering);

  for (let i = 0; i < d.length; i += 4) {
    const dr = d[i] - tr;
    const dg = d[i + 1] - tg;
    const db = d[i + 2] - tb;
    const distSq = (dr * dr + dg * dg + db * db) / 3;

    if (distSq <= tolSq) {
      // Complete transparent
      d[i + 3] = 0;
    } else if (distSq < maxTolSq && feathering > 0) {
      // Soft feather transition
      const factor = (distSq - tolSq) / (maxTolSq - tolSq);
      d[i + 3] = Math.round(d[i + 3] * factor);
    }
  }

  ctx.putImageData(imgData, 0, 0);

  const blob = await new Promise<Blob>((res) => {
    canvas.toBlob((b) => res(b || new Blob()), 'image/png');
  });

  return { blob, dataUrl: canvas.toDataURL('image/png') };
}

/**
 * Package Image Tiles into downloadable ZIP
 */
export async function bundleImageTilesZip(tiles: ImageGridTile[], zipName: string = 'Image_Grid_Tiles.zip'): Promise<void> {
  const zip = new JSZip();
  for (const t of tiles) {
    zip.file(t.fileName, t.blob);
  }

  const content = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
  const url = URL.createObjectURL(content);
  const a = document.createElement('a');
  a.href = url;
  a.download = zipName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

export interface MemeSettings {
  topText: string;
  bottomText: string;
  fontSize: number; // 24 to 72
  textColor: string;
  strokeColor: string;
  strokeWidth: number;
}

/**
 * Render Viral Meme Graphic with Impact typography
 */
export async function renderMemeImage(
  sourceImage: HTMLImageElement,
  settings: MemeSettings
): Promise<{ blob: Blob; dataUrl: string; width: number; height: number }> {
  const w = sourceImage.naturalWidth || sourceImage.width;
  const h = sourceImage.naturalHeight || sourceImage.height;

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas context failed');

  // Draw base image
  ctx.drawImage(sourceImage, 0, 0, w, h);

  // Configure typography
  const fontSizePx = Math.max(20, Math.round((settings.fontSize / 1000) * w));
  ctx.font = `900 ${fontSizePx}px Impact, "Arial Black", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = settings.textColor || '#ffffff';
  ctx.strokeStyle = settings.strokeColor || '#000000';
  ctx.lineWidth = Math.max(2, Math.round(fontSizePx * (settings.strokeWidth / 100)));
  ctx.lineJoin = 'round';

  const drawMemeText = (text: string, yPos: number) => {
    if (!text) return;
    const upperText = text.toUpperCase();
    ctx.strokeText(upperText, w / 2, yPos, w * 0.95);
    ctx.fillText(upperText, w / 2, yPos, w * 0.95);
  };

  // Top caption
  if (settings.topText) {
    drawMemeText(settings.topText, fontSizePx + 20);
  }

  // Bottom caption
  if (settings.bottomText) {
    drawMemeText(settings.bottomText, h - fontSizePx - 20);
  }

  const blob = await new Promise<Blob>((res) => {
    canvas.toBlob((b) => res(b || new Blob()), 'image/jpeg', 0.95);
  });

  return { blob, dataUrl: canvas.toDataURL('image/jpeg', 0.95), width: w, height: h };
}

export interface CensorRegion {
  id: string;
  xPercent: number; // 0 - 100
  yPercent: number; // 0 - 100
  wPercent: number; // 0 - 100
  hPercent: number; // 0 - 100
  mode: 'pixelate' | 'blur' | 'blackout';
}

/**
 * Apply Privacy Censor & Redactions (Pixelate, Blur, Blackout box)
 */
export async function applyCensorRedactions(
  sourceImage: HTMLImageElement,
  regions: CensorRegion[]
): Promise<{ blob: Blob; dataUrl: string; width: number; height: number }> {
  const w = sourceImage.naturalWidth || sourceImage.width;
  const h = sourceImage.naturalHeight || sourceImage.height;

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas context failed');

  ctx.drawImage(sourceImage, 0, 0, w, h);

  for (const r of regions) {
    const rx = Math.round((r.xPercent / 100) * w);
    const ry = Math.round((r.yPercent / 100) * h);
    const rw = Math.round((r.wPercent / 100) * w);
    const rh = Math.round((r.hPercent / 100) * h);

    if (rw <= 0 || rh <= 0) continue;

    if (r.mode === 'blackout') {
      ctx.fillStyle = '#000000';
      ctx.fillRect(rx, ry, rw, rh);
    } else if (r.mode === 'pixelate') {
      // Pixelate region
      const pixelSize = Math.max(8, Math.round(rw / 10));
      const offCanvas = document.createElement('canvas');
      offCanvas.width = Math.max(1, Math.floor(rw / pixelSize));
      offCanvas.height = Math.max(1, Math.floor(rh / pixelSize));
      const offCtx = offCanvas.getContext('2d');
      if (offCtx) {
        offCtx.imageSmoothingEnabled = false;
        offCtx.drawImage(canvas, rx, ry, rw, rh, 0, 0, offCanvas.width, offCanvas.height);
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(offCanvas, 0, 0, offCanvas.width, offCanvas.height, rx, ry, rw, rh);
        ctx.imageSmoothingEnabled = true;
      }
    } else if (r.mode === 'blur') {
      // Box blur approximation
      ctx.save();
      ctx.filter = 'blur(12px)';
      ctx.drawImage(canvas, rx, ry, rw, rh, rx, ry, rw, rh);
      ctx.restore();
    }
  }

  const blob = await new Promise<Blob>((res) => {
    canvas.toBlob((b) => res(b || new Blob()), 'image/jpeg', 0.95);
  });

  return { blob, dataUrl: canvas.toDataURL('image/jpeg', 0.95), width: w, height: h };
}

