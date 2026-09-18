import { QRCodeRecord, QRStoredFile, QRScanEvent, QRInputType } from '../../types/qr';
import { DEFAULT_QR_STYLING } from './qrEngine';

const STORAGE_KEY = 'convertpro_universal_qr_records';
const IDB_NAME = 'ConvertPro_QR_DB';
const IDB_STORE = 'qr_files';

/**
 * Open IndexedDB store for large files
 */
function openIndexedDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/**
 * Store file Blob / Data in IndexedDB
 */
export async function saveFileToIndexedDb(fileId: string, dataUrl: string): Promise<void> {
  try {
    const db = await openIndexedDB();
    const tx = db.transaction(IDB_STORE, 'readwrite');
    const store = tx.objectStore(IDB_STORE);
    store.put({ id: fileId, dataUrl, savedAt: Date.now() });
  } catch (err) {
    console.warn('[QR Storage] IndexedDB save failed, falling back to localStorage memory', err);
  }
}

/**
 * Get file Data from IndexedDB
 */
export async function getFileFromIndexedDb(fileId: string): Promise<string | null> {
  try {
    const db = await openIndexedDB();
    return new Promise((resolve) => {
      const tx = db.transaction(IDB_STORE, 'readonly');
      const store = tx.objectStore(IDB_STORE);
      const req = store.get(fileId);
      req.onsuccess = () => resolve(req.result?.dataUrl || null);
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

/**
 * Calculate standard SHA-256 content fingerprint for File, Blob, Buffer, or base64 DataURL
 */
export async function calculateSha256(input: File | Blob | ArrayBuffer | Uint8Array | string): Promise<string> {
  try {
    let arrayBuffer: ArrayBuffer;
    if (typeof window !== 'undefined' && input instanceof Blob) {
      arrayBuffer = await input.arrayBuffer();
    } else if (input instanceof ArrayBuffer) {
      arrayBuffer = input;
    } else if (input instanceof Uint8Array) {
      arrayBuffer = input.buffer;
    } else if (typeof input === 'string') {
      if (input.startsWith('data:')) {
        const base64 = input.split(',')[1];
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          bytes[i] = binary.charCodeAt(i);
        }
        arrayBuffer = bytes.buffer;
      } else {
        arrayBuffer = new TextEncoder().encode(input).buffer;
      }
    } else {
      return 'N/A';
    }

    if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', arrayBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }
  } catch (err) {
    console.warn('[Crypto] SHA-256 calculation failed:', err);
  }
  return 'N/A';
}

/**
 * Generates a guaranteed unique, unguessable share ID (e.g. "sh-lm8x3q-7k9p2")
 */
export function generateShareId(): string {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).substring(2, 7);
  return `sh-${ts}-${rand}`;
}

/**
 * Detect client device OS from user agent
 */
export function detectDeviceType(): 'iOS' | 'Android' | 'macOS' | 'Windows' | 'Linux' | 'Other' {
  if (typeof navigator === 'undefined') return 'Other';
  const ua = navigator.userAgent || '';
  if (/iPad|iPhone|iPod/.test(ua)) return 'iOS';
  if (/Android/.test(ua)) return 'Android';
  if (/Macintosh|Mac OS X/.test(ua)) return 'macOS';
  if (/Windows/.test(ua)) return 'Windows';
  if (/Linux/.test(ua)) return 'Linux';
  return 'Other';
}



/**
 * Load all saved QR records
 */
export function listQrRecords(): QRCodeRecord[] {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

/**
 * Save or Update a QR code record
 */
export async function saveQrRecord(record: QRCodeRecord): Promise<QRCodeRecord> {
  const records = listQrRecords();
  const existingIdx = records.findIndex(r => r.id === record.id || r.shareId === record.shareId);

  // 1. If files have dataUrls, store full payload in IndexedDB for fast local retrieval
  if (record.files && record.files.length > 0) {
    for (const file of record.files) {
      if (file.dataUrl && file.dataUrl.length > 2000) {
        await saveFileToIndexedDb(file.id, file.dataUrl);
      }
    }
  }

  // 2. Prepare lightweight version for localStorage (strip heavy base64 to avoid 5MB QuotaExceededError)
  const lightweightRecord: QRCodeRecord = {
    ...record,
    files: record.files?.map(f => ({
      ...f,
      dataUrl: f.dataUrl && f.dataUrl.length > 5000 ? undefined : f.dataUrl
    }))
  };

  let updated: QRCodeRecord[];
  if (existingIdx >= 0) {
    updated = [...records];
    updated[existingIdx] = {
      ...lightweightRecord,
      updatedAt: 'Just now'
    };
  } else {
    updated = [lightweightRecord, ...records];
  }

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('[QR Storage] localStorage quota exceeded, relying on IndexedDB & backend sync', e);
    }
  }

  // 3. Always sync FULL record with file payload to backend API for multi-device/phone scanning
  try {
    const res = await fetch('/api/qr/record', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(record)
    });
    if (!res.ok) {
      console.warn('[QR Storage] Backend sync returned status:', res.status);
    }
  } catch (err) {
    console.warn('[QR Storage] Backend sync failed:', err);
  }

  return record;
}

/**
 * Fetch a single QR record by its unique share ID
 */
export async function getQrRecordByShareId(shareId: string): Promise<QRCodeRecord | null> {
  console.log(`=== QR SHARE DEBUG: RESOLVING ===\nScanned Share ID: ${shareId}`);
  let found: QRCodeRecord | null = null;

  // 1. Prioritize authoritative backend API (fetch with no-store to prevent stale cache)
  try {
    const res = await fetch(`/api/qr/share/${encodeURIComponent(shareId)}`, {
      cache: 'no-store',
      headers: { 'Pragma': 'no-cache', 'Cache-Control': 'no-cache' }
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.record) {
        found = data.record;
      }
    }
  } catch (err) {
    console.warn('[QR Storage] Backend lookup failed, trying local fallback:', err);
  }

  // 2. Fall back to local store if backend was unreachable or offline
  if (!found) {
    const records = listQrRecords();
    found = records.find(r => r.shareId === shareId || r.id === shareId) || null;
  }

  // 3. Hydrate file data from IndexedDB if dataUrl is stripped
  if (found && found.files && found.files.length > 0) {
    const hydratedFiles = await Promise.all(
      found.files.map(async (f) => {
        if (!f.dataUrl && f.id) {
          const idbData = await getFileFromIndexedDb(f.id);
          if (idbData) return { ...f, dataUrl: idbData };
        }
        return f;
      })
    );
    found = { ...found, files: hydratedFiles };
  }

  if (found) {
    const primaryFile = found.files?.[0];
    console.log(
      '=== QR SHARE DEBUG: RESOLVED ===\n' +
      `Scanned Share ID: ${shareId}\n` +
      `Record ID: ${found.id}\n` +
      `Record Name: ${found.name}\n` +
      `Record Type: ${found.type}\n` +
      `Resolved File ID: ${primaryFile?.id || 'N/A'}\n` +
      `Resolved File Name: ${primaryFile?.name || 'N/A'}\n` +
      `Resolved File Server Path: ${primaryFile?.serverPath || 'N/A'}\n` +
      `Resolved File Data URL: ${primaryFile?.dataUrl ? (primaryFile.dataUrl.substring(0, 40) + '...') : 'N/A'}\n` +
      '================================='
    );
  } else {
    console.warn(`=== QR SHARE DEBUG: NOT FOUND ===\nShare ID ${shareId} could not be resolved.`);
  }

  return found || null;
}

/**
 * Record a scan event for analytics
 */
export async function recordScanEvent(shareId: string): Promise<QRCodeRecord | null> {
  const records = listQrRecords();
  const idx = records.findIndex(r => r.shareId === shareId);
  if (idx < 0) return null;

  const rec = records[idx];
  const device = detectDeviceType();
  const todayKey = new Date().toISOString().split('T')[0];

  const newEvent: QRScanEvent = {
    id: `scan-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
    timestamp: 'Just now',
    deviceType: device,
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined
  };

  const updatedRec: QRCodeRecord = {
    ...rec,
    scanCount: rec.scanCount + 1,
    lastScannedAt: 'Just now',
    analytics: {
      totalScans: rec.analytics.totalScans + 1,
      scansByDate: {
        ...rec.analytics.scansByDate,
        [todayKey]: (rec.analytics.scansByDate[todayKey] || 0) + 1
      },
      scansByDevice: {
        ...rec.analytics.scansByDevice,
        [device]: (rec.analytics.scansByDevice[device] || 0) + 1
      },
      recentEvents: [newEvent, ...rec.analytics.recentEvents.slice(0, 19)]
    }
  };

  records[idx] = updatedRec;
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  }

  return updatedRec;
}

/**
 * Update dynamic destination or replace underlying files without altering QR code
 */
export async function updateDynamicQr(
  shareId: string,
  params: {
    name?: string;
    newContent?: string;
    newFiles?: QRStoredFile[];
    isActive?: boolean;
  }
): Promise<QRCodeRecord | null> {
  const records = listQrRecords();
  const idx = records.findIndex(r => r.shareId === shareId);
  if (idx < 0) return null;

  const existing = records[idx];
  const updated: QRCodeRecord = {
    ...existing,
    name: params.name ?? existing.name,
    content: params.newContent ?? existing.content,
    files: params.newFiles ?? existing.files,
    isActive: params.isActive ?? existing.isActive,
    updatedAt: 'Just now'
  };

  // If new files were supplied, save to IndexedDB
  if (params.newFiles) {
    for (const f of params.newFiles) {
      if (f.dataUrl && f.dataUrl.length > 2000) {
        await saveFileToIndexedDb(f.id, f.dataUrl);
      }
    }
  }

  records[idx] = updated;
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  }

  return updated;
}

/**
 * Delete a QR record and its cached files
 */
export async function deleteQrRecord(idOrShareId: string): Promise<void> {
  const records = listQrRecords();
  const filtered = records.filter(r => r.id !== idOrShareId && r.shareId !== idOrShareId);
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  }
  try {
    fetch(`/api/qr/${idOrShareId}`, { method: 'DELETE' }).catch(() => {});
  } catch {}
}
