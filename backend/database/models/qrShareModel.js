import { qrRecordsStore } from '../index.js';

export class QrShareModel {
  static getAll() {
    const records = qrRecordsStore.read();
    return typeof records === 'object' && records !== null ? records : {};
  }

  static get(shareId) {
    if (!shareId) return null;
    const records = this.getAll();
    return records[shareId] || null;
  }

  static save(shareId, data) {
    if (!shareId || !data) return null;
    const records = this.getAll();
    records[shareId] = {
      ...data,
      updatedAt: new Date().toISOString()
    };
    qrRecordsStore.write(records);
    return records[shareId];
  }

  static delete(shareId) {
    if (!shareId) return false;
    const records = this.getAll();
    if (records[shareId]) {
      delete records[shareId];
      qrRecordsStore.write(records);
      return true;
    }
    return false;
  }
}
