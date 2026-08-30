import { CloudBackupPayload, GoogleUserProfile, Bookmark, HafalanVerseRecord, UserSettings, LastRead } from '../types';

declare global {
  interface Window {
    google?: any;
  }
}

const DRIVE_FILE_NAME = 'murottal_quran_cloud_backup.json';
const DRIVE_FILE_SCOPE = 'https://www.googleapis.com/auth/drive.file';
const TOKEN_STORAGE_KEY = 'murottal_gdrive_access_token_v1';
const USER_PROFILE_KEY = 'murottal_gdrive_user_profile_v1';
const LAST_SYNC_KEY = 'murottal_gdrive_last_sync_v1';
const MAX_BACKUP_BYTES = 5 * 1024 * 1024;

// Default Client ID configured for this project.
// Set VITE_GOOGLE_CLIENT_ID in your environment (.env.local for dev, or the
// Vercel Project Settings > Environment Variables for production/preview).
const DEFAULT_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

export function getStoredAccessToken(): string | null {
  try {
    return sessionStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function saveStoredAccessToken(token: string | null): void {
  try {
    if (token) {
      sessionStorage.setItem(TOKEN_STORAGE_KEY, token);
    } else {
      sessionStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  } catch (e) {
    console.warn('Failed to save access token:', e);
  }
}

export function getStoredGoogleUser(): GoogleUserProfile | null {
  try {
    const raw = localStorage.getItem(USER_PROFILE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveStoredGoogleUser(user: GoogleUserProfile | null): void {
  try {
    if (user) {
      localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(USER_PROFILE_KEY);
    }
  } catch (e) {
    console.warn('Failed to save google user:', e);
  }
}

export function getStoredLastSyncedAt(): string | null {
  try {
    return localStorage.getItem(LAST_SYNC_KEY);
  } catch {
    return null;
  }
}

export function saveStoredLastSyncedAt(timestamp: string | null): void {
  try {
    if (timestamp) {
      localStorage.setItem(LAST_SYNC_KEY, timestamp);
    } else {
      localStorage.removeItem(LAST_SYNC_KEY);
    }
  } catch (e) {
    console.warn('Failed to save last sync timestamp:', e);
  }
}

/**
 * Request Access Token using Google Identity Services (GIS)
 */
export async function requestGoogleAccessToken(customClientId?: string): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!window.google || !window.google.accounts || !window.google.accounts.oauth2) {
      reject(new Error('Google Identity Services (GIS) belum dimuat. Mohon periksa koneksi internet Anda.'));
      return;
    }

    const clientId = customClientId || DEFAULT_CLIENT_ID;
    if (!clientId.trim()) {
      reject(new Error('Google Client ID belum dikonfigurasikan. Isi VITE_GOOGLE_CLIENT_ID.'));
      return;
    }

    try {
      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: `${DRIVE_FILE_SCOPE} https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email`,
        prompt: 'consent',
        callback: (tokenResponse: any) => {
          if (tokenResponse.error) {
            console.error('Google OAuth Error:', tokenResponse);
            reject(new Error(tokenResponse.error_description || tokenResponse.error || 'Autentikasi Google gagal'));
            return;
          }

          if (tokenResponse.access_token) {
            saveStoredAccessToken(tokenResponse.access_token);
            resolve(tokenResponse.access_token);
          } else {
            reject(new Error('Tidak menerima Access Token dari Google.'));
          }
        }
      });

      client.requestAccessToken();
    } catch (err: any) {
      console.error('Failed to init token client:', err);
      reject(new Error(err?.message || 'Gagal memulai inisialisasi login Google'));
    }
  });
}

/**
 * Fetch Google User Profile (Name, Email, Picture)
 */
export async function fetchGoogleUserProfile(token: string): Promise<GoogleUserProfile | null> {
  try {
    const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!res.ok) {
      if (res.status === 401) {
        saveStoredAccessToken(null);
      }
      return null;
    }

    const data = await res.json();
    const profile: GoogleUserProfile = {
      id: data.sub,
      name: data.name || data.given_name || 'Pengguna Google',
      email: data.email,
      picture: data.picture
    };

    saveStoredGoogleUser(profile);
    return profile;
  } catch (err) {
    console.warn('Failed to fetch user profile:', err);
    return null;
  }
}

/**
 * Find existing backup file in Google Drive
 */
export async function findCloudBackupFile(
  token: string
): Promise<{ id: string; modifiedTime: string; size?: number; name: string } | null> {
  const query = encodeURIComponent(`name = '${DRIVE_FILE_NAME}' and trashed = false`);
  const url = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,modifiedTime,size)&spaces=drive&orderBy=modifiedTime%20desc&pageSize=1`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!res.ok) {
    if (res.status === 401) {
      saveStoredAccessToken(null);
      throw new Error('Sesi autentikasi Google telah berakhir. Silakan login kembali.');
    }
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData?.error?.message || `Gagal memeriksa Google Drive (${res.status})`);
  }

  const data = await res.json();
  if (data.files && data.files.length > 0) {
    return data.files[0];
  }

  return null;
}

/**
 * Upload or Update Cloud Backup to Google Drive using Multipart format
 */
export async function uploadCloudBackup(
  token: string,
  payload: CloudBackupPayload,
  existingFileId?: string | null
): Promise<{ fileId: string; modifiedTime: string; size?: number }> {
  const metadata = {
    name: DRIVE_FILE_NAME,
    mimeType: 'application/json',
    description: 'Quran Hafiz Data Backup (Settings, Bookmarks, Hafalan Records)'
  };

  const fileContent = JSON.stringify(payload, null, 2);
  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const multipartRequestBody =
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) +
    delimiter +
    'Content-Type: application/json\r\n\r\n' +
    fileContent +
    closeDelimiter;

  let url = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,modifiedTime,size';
  let method = 'POST';

  if (existingFileId) {
    url = `https://www.googleapis.com/upload/drive/v3/files/${existingFileId}?uploadType=multipart&fields=id,name,modifiedTime,size`;
    method = 'PATCH';
  }

  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': `multipart/related; boundary=${boundary}`
    },
    body: multipartRequestBody
  });

  if (!res.ok) {
    if (res.status === 401) {
      saveStoredAccessToken(null);
      throw new Error('Sesi autentikasi Google telah berakhir. Silakan login kembali.');
    }
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData?.error?.message || `Gagal mengunggah cadangan ke Google Drive (${res.status})`);
  }

  const result = await res.json();
  const nowStr = new Date().toISOString();
  saveStoredLastSyncedAt(nowStr);

  return {
    fileId: result.id,
    modifiedTime: result.modifiedTime || nowStr,
    size: result.size ? Number(result.size) : fileContent.length
  };
}

/**
 * Download Backup JSON from Google Drive
 */
export async function downloadCloudBackup(token: string, fileId: string): Promise<CloudBackupPayload> {
  const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!res.ok) {
    if (res.status === 401) {
      saveStoredAccessToken(null);
      throw new Error('Sesi autentikasi Google telah berakhir. Silakan login kembali.');
    }
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData?.error?.message || `Gagal mengunduh cadangan dari Google Drive (${res.status})`);
  }

  const declaredSize = Number(res.headers.get('content-length') || 0);
  if (declaredSize > MAX_BACKUP_BYTES) throw new Error('Berkas cadangan melebihi batas 5 MB.');
  const text = await res.text();
  if (new Blob([text]).size > MAX_BACKUP_BYTES) throw new Error('Berkas cadangan melebihi batas 5 MB.');
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error('Berkas cadangan bukan JSON yang valid.');
  }

  if (!isValidBackupPayload(data)) {
    throw new Error('Format berkas cadangan di Google Drive tidak valid.');
  }

  return data;
}

export function isValidBackupPayload(value: unknown): value is CloudBackupPayload {
  if (!value || typeof value !== 'object') return false;
  const backup = value as Partial<CloudBackupPayload>;
  const data = backup.data;
  if (backup.app !== 'Quran Hafiz' || !backup.version || !isIsoDate(backup.exportedAt) || !data || typeof data !== 'object') return false;
  const settings = data.settings;
  if (!settings || typeof settings !== 'object' || !Number.isFinite(settings.arabicFontSize) || settings.arabicFontSize < 20 || settings.arabicFontSize > 48 || !Number.isFinite(settings.latinFontSize) || settings.latinFontSize < 10 || settings.latinFontSize > 30 || !['light', 'dark', 'emerald_dark'].includes(settings.theme) || !['none', 'blur_all', 'first_letters', 'random_words'].includes(settings.maskModeDefault) || (settings.readDisplayMode !== undefined && !['verse', 'mushaf'].includes(settings.readDisplayMode)) || (settings.hafalanDisplayMode !== undefined && !['verse', 'mushaf'].includes(settings.hafalanDisplayMode)) || !Number.isInteger(settings.defaultRepeatCount) || settings.defaultRepeatCount < 1 || settings.defaultRepeatCount > 100) return false;
  const validPosition = (item: { surahNumber?: unknown; verseNumber?: unknown }) => Number.isInteger(item.surahNumber) && Number(item.surahNumber) >= 1 && Number(item.surahNumber) <= 114 && Number.isInteger(item.verseNumber) && Number(item.verseNumber) >= 1 && Number(item.verseNumber) <= 286;
  if (!Array.isArray(data.bookmarks) || data.bookmarks.length > 10000 || !data.bookmarks.every((item) => item && typeof item === 'object' && validPosition(item) && typeof item.id === 'string' && typeof item.surahName === 'string' && typeof item.verseArab === 'string' && typeof item.verseTranslation === 'string' && isIsoDate(item.createdAt))) return false;
  if (!data.hafalanRecords || typeof data.hafalanRecords !== 'object' || Array.isArray(data.hafalanRecords) || Object.keys(data.hafalanRecords).length > 10000) return false;
  if (!Object.entries(data.hafalanRecords).every(([key, item]) => item && key === item.surahNumber + '_' + item.verseNumber && validPosition(item) && ['not_started', 'in_progress', 'review_needed', 'memorized'].includes(item.status) && Number.isInteger(item.repeatCount) && item.repeatCount >= 0)) return false;
  return data.lastRead === null || (!!data.lastRead && validPosition(data.lastRead) && typeof data.lastRead.surahName === 'string' && isIsoDate(data.lastRead.timestamp));
}

function isIsoDate(value: unknown): value is string {
  return typeof value === 'string' && !Number.isNaN(Date.parse(value));
}

/**
 * Helper to construct the complete backup payload from current state
 */
export function buildBackupPayload(
  settings: UserSettings,
  bookmarks: Bookmark[],
  hafalanRecords: Record<string, HafalanVerseRecord>,
  lastRead: LastRead | null,
  userEmail?: string
): CloudBackupPayload {
  // Ensure sensitive API keys are stripped before saving to Cloud Drive
  const safeSettings: UserSettings = {
    ...settings,
    customApiKey: undefined
  };

  return {
    app: 'Quran Hafiz',
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    userEmail: userEmail || undefined,
    data: {
      settings: safeSettings,
      bookmarks,
      hafalanRecords,
      lastRead
    }
  };
}
