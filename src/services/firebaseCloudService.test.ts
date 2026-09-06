import { describe, expect, it, vi, afterEach } from 'vitest';
import {
  buildBackupPayload,
  isValidBackupPayload,
  signInGoogle,
  getCurrentUserId,
  subscribeCloudAuth,
  deleteCloudBackup,
  deleteAllUserCloudData
} from './firebaseCloudService';
import { DEFAULT_SETTINGS } from './storageService';

describe('Firebase cloud save', () => {
  afterEach(() => vi.unstubAllEnvs());

  it('validates backups and strips API keys', () => {
    const payload = buildBackupPayload({ ...DEFAULT_SETTINGS, customApiKey: 'secret' }, [], {}, null);
    expect(isValidBackupPayload(payload)).toBe(true);
    expect(JSON.stringify(payload)).not.toContain('secret');
    payload.data.settings.theme = 'invalid' as never;
    expect(isValidBackupPayload(payload)).toBe(false);
  });

  it('rejects invalid verse positions and record keys', () => {
    const payload = buildBackupPayload(DEFAULT_SETTINGS, [], {}, null);
    payload.data.lastRead = { surahNumber: 115, surahName: 'Invalid', verseNumber: 1, timestamp: new Date().toISOString() };
    expect(isValidBackupPayload(payload)).toBe(false);
    payload.data.lastRead = null;
    payload.data.hafalanRecords.wrong = { surahNumber: 1, verseNumber: 1, status: 'memorized', repeatCount: 1 };
    expect(isValidBackupPayload(payload)).toBe(false);
  });

  it('keeps local mode available without Firebase configuration', async () => {
    vi.stubEnv('VITE_FIREBASE_API_KEY', '');
    await expect(signInGoogle()).rejects.toThrow('Firebase belum dikonfigurasikan');
    expect(getCurrentUserId()).toBeNull();
    const callback = vi.fn();
    subscribeCloudAuth(callback)();
    expect(callback).toHaveBeenCalledWith(null);
  });

  it('rejects deletion when user session does not match', async () => {
    await expect(deleteCloudBackup('unauthenticated-user')).rejects.toThrow('Sesi Firebase berubah');
    await expect(deleteAllUserCloudData('unauthenticated-user')).rejects.toThrow('Sesi Firebase berubah');
  });
});
