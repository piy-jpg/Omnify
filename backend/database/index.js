import fs from 'fs';
import path from 'path';
import { AUTH_DATA_DIR, QR_STORAGE_DIR } from '../config/env.js';

export class JsonStore {
  constructor(filePath, defaultData = []) {
    this.filePath = filePath;
    this.defaultData = defaultData;
    this._ensureDir();
  }

  _ensureDir() {
    try {
      const dir = path.dirname(this.filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    } catch (err) {
      console.warn(`[JsonStore] Failed to ensure directory for ${this.filePath}:`, err.message);
    }
  }

  read() {
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf8');
        return JSON.parse(raw);
      }
    } catch (err) {
      console.error(`[JsonStore] Error reading ${this.filePath}:`, err.message);
    }
    return structuredClone(this.defaultData);
  }

  write(data) {
    try {
      this._ensureDir();
      fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2), 'utf8');
      return true;
    } catch (err) {
      console.error(`[JsonStore] Error writing ${this.filePath}:`, err.message);
      return false;
    }
  }
}

export const usersStore = new JsonStore(path.join(AUTH_DATA_DIR, 'users.json'), []);
export const sessionsStore = new JsonStore(path.join(AUTH_DATA_DIR, 'sessions.json'), {});
export const qrRecordsStore = new JsonStore(path.join(QR_STORAGE_DIR, 'qr-records.json'), {});
