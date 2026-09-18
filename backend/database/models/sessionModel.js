import { sessionsStore } from '../index.js';

export class SessionModel {
  static getAll() {
    const sessions = sessionsStore.read();
    return typeof sessions === 'object' && sessions !== null ? sessions : {};
  }

  static find(token) {
    if (!token) return null;
    const sessions = this.getAll();
    const session = sessions[token];
    if (!session) return null;
    if (session.expiresAt && Date.now() > session.expiresAt) {
      this.delete(token);
      return null;
    }
    return session;
  }

  static create(token, { userId, email, expiresInMs = 30 * 24 * 60 * 60 * 1000 }) {
    const sessions = this.getAll();
    const expiresAt = Date.now() + expiresInMs;
    sessions[token] = {
      userId,
      email,
      createdAt: Date.now(),
      expiresAt
    };
    sessionsStore.write(sessions);
    return sessions[token];
  }

  static delete(token) {
    if (!token) return;
    const sessions = this.getAll();
    if (sessions[token]) {
      delete sessions[token];
      sessionsStore.write(sessions);
    }
  }
}
