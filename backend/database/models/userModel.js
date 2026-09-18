import { usersStore } from '../index.js';

export class UserModel {
  static getAll() {
    const users = usersStore.read();
    return Array.isArray(users) ? users : [];
  }

  static findById(id) {
    const users = this.getAll();
    return users.find(u => u.id === id) || null;
  }

  static findByEmail(email) {
    if (!email) return null;
    const normalized = String(email).trim().toLowerCase();
    const users = this.getAll();
    return users.find(u => u.email && u.email.toLowerCase() === normalized) || null;
  }

  static save(user) {
    const users = this.getAll();
    const index = users.findIndex(u => u.id === user.id || (user.email && u.email && u.email.toLowerCase() === user.email.toLowerCase()));
    if (index >= 0) {
      users[index] = { ...users[index], ...user };
    } else {
      users.push(user);
    }
    usersStore.write(users);
    return user;
  }

  static toPublicProfile(user) {
    if (!user) return null;
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      category: user.category || 'Developer',
      age: user.age || 22,
      plan: user.plan || '100% Free Lifetime Pass',
      avatar: user.avatar || '',
      emailVerified: user.emailVerified ?? true,
      phoneVerified: Boolean(user.phoneVerified),
      storageQuotaGb: user.storageQuotaGb || 100,
      createdAt: user.createdAt
    };
  }
}
