export type QRInputType =
  | 'text'
  | 'url'
  | 'pdf'
  | 'image'
  | 'document'
  | 'audio'
  | 'video'
  | 'multi-files'
  | 'vcard'
  | 'phone'
  | 'email'
  | 'wifi'
  | 'location';

export interface QRStoredFile {
  id: string;
  name: string;
  size: number;
  type: string;
  storageKey?: string;
  dataUrl?: string;
  serverPath?: string;
  previewUrl?: string;
  sha256?: string;
  contentHash?: string;
  uploadedAt: string;
}

export type QRPatternStyle = 'square' | 'rounded' | 'dots' | 'classy' | 'diamond';
export type QRCornerStyle = 'square' | 'rounded' | 'circle' | 'dot';
export type QRErrorCorrection = 'L' | 'M' | 'Q' | 'H';
export type QRGradientDirection = 'to-r' | 'to-b' | 'to-br' | 'radial';

export interface QRStylingOptions {
  style: QRPatternStyle;
  cornerStyle: QRCornerStyle;
  fgColor: string;
  bgColor: string;
  isGradient: boolean;
  gradientColor2: string;
  gradientDirection: QRGradientDirection;
  errorCorrectionLevel: QRErrorCorrection;
  logoUrl?: string;
  logoPreset?: string;
  logoSize: number; // 0.15 to 0.3
  logoBackground: boolean;
  captionText?: string;
  captionSubtext?: string;
  margin: number;
}

export interface QRScanEvent {
  id: string;
  timestamp: string;
  userAgent?: string;
  deviceType: 'iOS' | 'Android' | 'macOS' | 'Windows' | 'Linux' | 'Other';
  browser?: string;
  ip?: string;
  city?: string;
  country?: string;
}

export interface QRAnalytics {
  totalScans: number;
  scansByDate: Record<string, number>;
  scansByDevice: Record<string, number>;
  recentEvents: QRScanEvent[];
}

export interface QRCodeRecord {
  id: string;
  shareId: string; // unique unguessable slug (e.g. "sh-89f2a1")
  name: string;
  type: QRInputType;
  content: string; // raw content or target URL
  encodedValue: string; // exact string inside QR (for file QRs, the public share URL)
  isDynamic: boolean;
  files?: QRStoredFile[];
  styling: QRStylingOptions;
  createdAt: string;
  updatedAt: string;
  scanCount: number;
  lastScannedAt?: string;
  isActive: boolean;
  analytics: QRAnalytics;
  passwordProtected?: boolean;
  password?: string;
}

// Form Data Interfaces
export interface VCardFormData {
  firstName: string;
  lastName: string;
  organization?: string;
  title?: string;
  phone?: string;
  cellPhone?: string;
  email?: string;
  website?: string;
  street?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  note?: string;
}

export interface WifiFormData {
  ssid: string;
  password?: string;
  encryption: 'WPA' | 'WEP' | 'nopass';
  hidden: boolean;
}

export interface LocationFormData {
  address?: string;
  latitude: number | string;
  longitude: number | string;
  query?: string;
}

export interface EmailFormData {
  email: string;
  subject?: string;
  body?: string;
}

export interface PhoneFormData {
  phoneNumber: string;
}

export interface TextFormData {
  text: string;
}

export interface UrlFormData {
  url: string;
}
