import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut, type Auth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer, runTransaction, Timestamp } from 'firebase/firestore';
import { CloudBackupPayload, GoogleUserProfile, Bookmark, HafalanVerseRecord, UserSettings, LastRead } from '../types';

const MAX_BACKUP_BYTES = 900000;
let auth: Auth | undefined;

export function services() {
  const config = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
  };
  if (Object.values(config).some((value) => !value?.trim())) {
    throw new Error('Firebase belum dikonfigurasikan. Isi VITE_FIREBASE_API_KEY, AUTH_DOMAIN, PROJECT_ID, dan APP_ID sesuai .env.example.');
  }
  const app = getApps()[0] || initializeApp(config);
  auth = getAuth(app);
  return { auth, db: getFirestore(app) };
}

export function getCurrentUserId(): string | null {
  return auth?.currentUser?.uid || null;
}

export function getCurrentGoogleUser(): GoogleUserProfile | null {
  const user = auth?.currentUser;
  return user ? { id: user.uid, name: user.displayName || 'Pengguna Google', email: user.email || '', picture: user.photoURL || '' } : null;
}

export function subscribeCloudAuth(callback: (uid: string | null) => void): () => void {
  try {
    return onAuthStateChanged(services().auth, (user) => callback(user?.uid || null));
  } catch {
    callback(null);
    return () => {};
  }
}

export async function signInGoogle(): Promise<string> {
  const result = await signInWithPopup(services().auth, new GoogleAuthProvider());
  return result.user.uid;
}

export async function disconnectCloud(): Promise<void> {
  await signOut(services().auth);
}

export function getStoredLastSyncedAt(): string | null {
  try { return localStorage.getItem('quran_firebase_sync_' + getCurrentUserId()); } catch { return null; }
}

export function saveStoredLastSyncedAt(timestamp: string): void {
  try { localStorage.setItem('quran_firebase_sync_' + getCurrentUserId(), timestamp); } catch { /* Sync can work without local storage. */ }
}

function backupRef(uid: string) {
  const { auth, db } = services();
  if (!uid || auth.currentUser?.uid !== uid) throw new Error('Sesi Firebase berubah. Silakan login kembali.');
  return doc(db, 'users', uid, 'backups', 'current');
}

export async function findCloudBackupFile(uid: string) {
  const snapshot = await getDocFromServer(backupRef(uid));
  if (!snapshot.exists()) return null;
  const data = snapshot.data();
  return { id: snapshot.id, modifiedTime: data.updatedAt.toDate().toISOString() as string, size: data.size as number };
}

export async function uploadCloudBackup(uid: string, payload: CloudBackupPayload, expectedModifiedTime: string | null = null) {
  if (!isValidBackupPayload(payload)) throw new Error('Format cadangan tidak valid.');
  const safePayload = { ...payload, data: { ...payload.data, settings: { ...payload.data.settings, customApiKey: undefined } } };
  const content = JSON.stringify(safePayload);
  const size = new Blob([content]).size;
  if (size > MAX_BACKUP_BYTES) throw new Error('Cadangan melebihi batas 900 KB Firestore.');
  const ref = backupRef(uid);
  const modifiedTime = await runTransaction(services().db, async (transaction) => {
    const current = await transaction.get(ref);
    const previous = current.exists() ? current.data().updatedAt.toDate().toISOString() : null;
    if (previous !== expectedModifiedTime) throw new Error('Data Firebase berubah. Buka ulang Cloud Save untuk memeriksa konflik.');
    const updatedAt = Timestamp.fromMillis(Math.max(Date.now(), previous ? Date.parse(previous) + 1 : 0));
    transaction.set(ref, { content, size, updatedAt });
    return updatedAt.toDate().toISOString();
  });
  if (getCurrentUserId() === uid) saveStoredLastSyncedAt(modifiedTime);
  return { fileId: ref.id, modifiedTime, size };
}

export async function downloadCloudBackup(uid: string, _fileId?: string): Promise<CloudBackupPayload> {
  const snapshot = await getDocFromServer(backupRef(uid));
  if (!snapshot.exists()) throw new Error('Cadangan Firebase tidak ditemukan.');
  const content = snapshot.data().content;
  if (typeof content !== 'string' || new Blob([content]).size > MAX_BACKUP_BYTES) throw new Error('Ukuran atau format cadangan tidak valid.');
  let payload: unknown;
  try { payload = JSON.parse(content); } catch { throw new Error('Cadangan bukan JSON yang valid.'); }
  if (!isValidBackupPayload(payload)) throw new Error('Format cadangan Firebase tidak valid.');
  return payload;
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
  // Ensure sensitive API keys are stripped before saving to Firebase
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
