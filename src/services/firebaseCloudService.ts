import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  deleteUser,
  reauthenticateWithPopup,
  type Auth
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  collection,
  getDocFromServer,
  getDocs,
  query,
  where,
  writeBatch,
  deleteDoc,
  runTransaction,
  Timestamp,
  type DocumentReference
} from 'firebase/firestore';
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

export async function deleteUserAccount(): Promise<void> {
  const user = services().auth.currentUser;
  if (!user) return;
  try {
    await deleteUser(user);
  } catch (err: any) {
    if (err?.code === 'auth/requires-recent-login') {
      const provider = new GoogleAuthProvider();
      await reauthenticateWithPopup(user, provider);
      await deleteUser(user);
    } else {
      throw err;
    }
  }
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

export async function deleteAllUserCloudData(uid: string): Promise<void> {
  const { auth, db } = services();
  if (!uid || auth.currentUser?.uid !== uid) throw new Error('Sesi Firebase berubah. Silakan login kembali.');

  const refsToDelete: DocumentReference[] = [];

  // 1. users/{uid}/backups/current
  refsToDelete.push(backupRef(uid));

  // 2. learner_records/{uid}/verses/*
  try {
    const learnerVersesSnap = await getDocs(collection(db, 'learner_records', uid, 'verses'));
    learnerVersesSnap.forEach((d) => refsToDelete.push(d.ref));
  } catch (err) {
    console.warn('Gagal membaca learner_records untuk dihapus:', err);
  }

  // 3. halaqah_profiles/{uid} and teacher_codes/{code}
  try {
    const profileRef = doc(db, 'halaqah_profiles', uid);
    const profileSnap = await getDocFromServer(profileRef);
    if (profileSnap.exists()) {
      const data = profileSnap.data();
      if (data?.teacherCode) {
        refsToDelete.push(doc(db, 'teacher_codes', data.teacherCode));
      }
      refsToDelete.push(profileRef);
    }
  } catch (err) {
    console.warn('Gagal membaca halaqah_profile untuk dihapus:', err);
  }

  // 4. teachers/{uid}/manual_students/* and their verses
  try {
    const studentsSnap = await getDocs(collection(db, 'teachers', uid, 'manual_students'));
    for (const studentDoc of studentsSnap.docs) {
      try {
        const studentVersesSnap = await getDocs(
          collection(db, 'teachers', uid, 'manual_students', studentDoc.id, 'verses')
        );
        studentVersesSnap.forEach((v) => refsToDelete.push(v.ref));
      } catch (err) {
        console.warn('Gagal membaca ayat manual_student untuk dihapus:', err);
      }
      refsToDelete.push(studentDoc.ref);
    }
  } catch (err) {
    console.warn('Gagal membaca manual_students untuk dihapus:', err);
  }

  // 5. teachers/{uid}/student_aliases/*
  try {
    const aliasesSnap = await getDocs(collection(db, 'teachers', uid, 'student_aliases'));
    aliasesSnap.forEach((d) => refsToDelete.push(d.ref));
  } catch (err) {
    console.warn('Gagal membaca student_aliases untuk dihapus:', err);
  }

  // 6. teachers/{uid}/blocked_students/*
  try {
    const blockedSnap = await getDocs(collection(db, 'teachers', uid, 'blocked_students'));
    blockedSnap.forEach((d) => refsToDelete.push(d.ref));
  } catch (err) {
    console.warn('Gagal membaca blocked_students untuk dihapus:', err);
  }

  // 7. connection_requests owned by this student or addressed to this teacher
  try {
    refsToDelete.push(doc(db, 'connection_requests', uid));
    const requestsSnap = await getDocs(query(collection(db, 'connection_requests'), where('teacherUid', '==', uid)));
    requestsSnap.forEach((d) => refsToDelete.push(d.ref));
  } catch (err) {
    console.warn('Gagal membaca connection_requests untuk dihapus:', err);
  }

  // Commit deletion in batches of 400
  const BATCH_SIZE = 400;
  for (let i = 0; i < refsToDelete.length; i += BATCH_SIZE) {
    const batch = writeBatch(db);
    const chunk = refsToDelete.slice(i, i + BATCH_SIZE);
    chunk.forEach((ref) => batch.delete(ref));
    await batch.commit();
  }

  // 5. Clean local storage cache
  try {
    localStorage.removeItem('quran_firebase_sync_' + uid);
    localStorage.removeItem('halaqah_pending_' + uid);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('halaqah-pending'));
    }
  } catch {
    /* Safe ignore */
  }
}

export async function deleteCloudBackup(uid: string): Promise<void> {
  await deleteAllUserCloudData(uid);
}

export async function clearUserCloudHafalan(uid: string): Promise<void> {
  const { auth, db } = services();
  if (!uid || auth.currentUser?.uid !== uid) throw new Error('Sesi Firebase berubah. Silakan login kembali.');

  const refsToDelete: DocumentReference[] = [];

  // 1. learner_records/{uid}/verses/*
  try {
    const learnerVersesSnap = await getDocs(collection(db, 'learner_records', uid, 'verses'));
    learnerVersesSnap.forEach((d) => refsToDelete.push(d.ref));
  } catch (err) {
    console.warn('Gagal membaca learner_records untuk dihapus:', err);
  }

  // Delete in batches
  const BATCH_SIZE = 400;
  for (let i = 0; i < refsToDelete.length; i += BATCH_SIZE) {
    const batch = writeBatch(db);
    const chunk = refsToDelete.slice(i, i + BATCH_SIZE);
    chunk.forEach((ref) => batch.delete(ref));
    await batch.commit();
  }

  // 2. Also update backup file if current backup exists, removing hafalanRecords
  try {
    const ref = backupRef(uid);
    const snap = await getDocFromServer(ref);
    if (snap.exists()) {
      const data = snap.data();
      if (typeof data?.content === 'string') {
        const payload = JSON.parse(data.content);
        if (payload?.data) {
          payload.data.hafalanRecords = {};
          const newContent = JSON.stringify(payload);
          const newSize = new Blob([newContent]).size;
          await runTransaction(db, async (tx) => {
            const current = await tx.get(ref);
            if (current.exists()) {
              const updatedAt = Timestamp.fromMillis(Date.now());
              tx.set(ref, { content: newContent, size: newSize, updatedAt });
            }
          });
        }
      }
    }
  } catch (err) {
    console.warn('Gagal memperbarui backup saat clearUserCloudHafalan:', err);
  }

  // 3. Clear offline pending queue for this user
  try {
    localStorage.removeItem('halaqah_pending_' + uid);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('halaqah-pending'));
    }
  } catch {
    /* Safe ignore */
  }
}

export function isValidBackupPayload(value: unknown): value is CloudBackupPayload {
  if (!value || typeof value !== 'object') return false;
  const backup = value as Partial<CloudBackupPayload>;
  const data = backup.data;
  if (backup.app !== 'Quran Hafiz' || !backup.version || !isIsoDate(backup.exportedAt) || !data || typeof data !== 'object') return false;
  const settings = data.settings;
  if (!settings || typeof settings !== 'object' || !Number.isFinite(settings.arabicFontSize) || settings.arabicFontSize < 20 || settings.arabicFontSize > 48 || (settings.arabicFont !== undefined && !['scheherazade_new', 'lpmq_isep_misbah', 'amiri', 'noto_naskh_arabic'].includes(settings.arabicFont as string)) || !Number.isFinite(settings.latinFontSize) || settings.latinFontSize < 10 || settings.latinFontSize > 30 || !['system', 'light', 'dark', 'emerald_dark'].includes(settings.theme) || !['none', 'blur_all', 'first_letters', 'random_words'].includes(settings.maskModeDefault) || (settings.readDisplayMode !== undefined && !['verse', 'mushaf'].includes(settings.readDisplayMode)) || (settings.hafalanDisplayMode !== undefined && !['verse', 'mushaf'].includes(settings.hafalanDisplayMode)) || !Number.isInteger(settings.defaultRepeatCount) || settings.defaultRepeatCount < 1 || settings.defaultRepeatCount > 100) return false;
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
