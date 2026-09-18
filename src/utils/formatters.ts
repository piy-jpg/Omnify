export function formatBytes(bytes: number, decimals = 1): string {
  if (!bytes || isNaN(bytes) || bytes <= 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  if (i < 0) return '0 B';
  if (i >= sizes.length) return `${parseFloat((bytes / Math.pow(k, sizes.length - 1)).toFixed(dm))} ${sizes[sizes.length - 1]}`;
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export function getFileTypeBadge(ext: string): { bg: string; text: string; border: string } {
  const upper = (ext || '').toUpperCase().replace('.', '');
  switch (upper) {
    case 'PDF':
      return { bg: 'bg-rose-50 dark:bg-rose-950/40', text: 'text-rose-600 dark:text-rose-400', border: 'border-rose-200 dark:border-rose-900' };
    case 'DOC':
    case 'DOCX':
    case 'WORD':
      return { bg: 'bg-blue-50 dark:bg-blue-950/40', text: 'text-blue-600 dark:text-blue-400', border: 'border-blue-200 dark:border-blue-900' };
    case 'XLS':
    case 'XLSX':
    case 'EXCEL':
    case 'CSV':
      return { bg: 'bg-emerald-50 dark:bg-emerald-950/40', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-200 dark:border-emerald-900' };
    case 'PPT':
    case 'PPTX':
      return { bg: 'bg-orange-50 dark:bg-orange-950/40', text: 'text-orange-600 dark:text-orange-400', border: 'border-orange-200 dark:border-orange-900' };
    case 'JPG':
    case 'JPEG':
    case 'PNG':
    case 'WEBP':
    case 'HEIC':
    case 'BMP':
    case 'SVG':
      return { bg: 'bg-purple-50 dark:bg-purple-950/40', text: 'text-purple-600 dark:text-purple-400', border: 'border-purple-200 dark:border-purple-900' };
    default:
      return { bg: 'bg-slate-50 dark:bg-slate-800', text: 'text-slate-600 dark:text-slate-400', border: 'border-slate-200 dark:border-slate-700' };
  }
}

export function cleanFileName(rawName: string): string {
  if (!rawName || typeof rawName !== 'string') return 'Untitled Document';
  let cleaned = rawName.replace(/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}[-_ ]*/g, '');
  cleaned = cleaned.replace(/^\d{10,14}[-_ ]*/g, '');
  return cleaned.trim() || rawName;
}
