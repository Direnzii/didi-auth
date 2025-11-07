import AsyncStorage from '@react-native-async-storage/async-storage';
import type { PasswordEntry, LockData } from '../types';
import { STORAGE_KEYS } from '../constants/storage';

export const PasswordStorage = {
  async getAll(): Promise<PasswordEntry[]> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.PASSWORDS);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      throw error;
    }
  },

  async save(passwords: PasswordEntry[]): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.PASSWORDS, JSON.stringify(passwords));
    } catch (error) {
      throw error;
    }
  },

  async add(password: PasswordEntry): Promise<PasswordEntry[]> {
    const passwords = await this.getAll();
    const updated = [...passwords, password];
    await this.save(updated);
    return updated;
  },

  async update(id: string, updates: Partial<PasswordEntry>): Promise<PasswordEntry[]> {
    const passwords = await this.getAll();
    const updated = passwords.map((p) => (p.id === id ? { ...p, ...updates } : p));
    await this.save(updated);
    return updated;
  },

  async delete(id: string): Promise<PasswordEntry[]> {
    const passwords = await this.getAll();
    const updated = passwords.filter((p) => p.id !== id);
    await this.save(updated);
    return updated;
  },
};

export const LockStorage = {
  async get(): Promise<LockData> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.LOCK_DATA);
      return stored
        ? JSON.parse(stored)
        : { attempts: 0, lockUntil: null, lockCount: 0 };
    } catch (error) {
      return { attempts: 0, lockUntil: null, lockCount: 0 };
    }
  },

  async save(data: LockData): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.LOCK_DATA, JSON.stringify(data));
    } catch (error) {
    }
  },

  async reset(): Promise<void> {
    await this.save({ attempts: 0, lockUntil: null, lockCount: 0 });
  },
};

export const MasterPasswordStorage = {
  async get(): Promise<{ hash: string; salt: string } | null> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.MASTER_PASSWORD);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      return null;
    }
  },

  async set(hash: string, salt: string): Promise<void> {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.MASTER_PASSWORD,
        JSON.stringify({ hash, salt })
      );
    } catch (error) {
      throw error;
    }
  },

  async exists(): Promise<boolean> {
    const data = await this.get();
    return data !== null;
  },
};

/**
 * Clears all app data (passwords, master password, lock data)
 */
export const clearAllData = async (): Promise<void> => {
  try {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.PASSWORDS,
      STORAGE_KEYS.MASTER_PASSWORD,
      STORAGE_KEYS.LOCK_DATA,
    ]);
  } catch (error) {
    throw new Error('Não foi possível limpar os dados.');
  }
};

