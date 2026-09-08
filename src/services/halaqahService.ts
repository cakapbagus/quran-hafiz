import { collection, deleteDoc, doc, getDocFromServer, onSnapshot, query, where, runTransaction, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { services } from './firebaseCloudService';
import { ALL_SURAHS } from '../data/surahList';
import type { HafalanStatusType, HafalanVerseRecord } from '../types';

export interface Profile { name: string; teacherCode: string; linkedTeacherUid: string; linkedTeacherCode: string; linkedTeacherName: string }
export interface Student { id: string; name: string; originalName?: string; alias?: string; manual: boolean }
export interface ConnectionRequest { studentUid: string; studentName: string; teacherUid: string; teacherCode: string; teacherName: string; status: 'pending' | 'blocked' }
export interface SharedVerse extends HafalanVerseRecord { revision: number; updatedBy: string }
export type Records = Record<string, SharedVerse>;
export type Target = { uid: string; manualId?: string };
export function normalizeCode(value: string) { return value.trim().toUpperCase(); }
export function validCode(value: string) { return /^[A-Z0-9]{6}$/.test(value) && /[A-Z]/.test(value) && /[0-9]/.test(value); }
export function generateCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  while (code.length < 6) { const n = crypto.getRandomValues(new Uint8Array(1))[0]; if (n < 252) code += chars[n % 36]; }
  return validCode(code) ? code : generateCode();
}
function identity() { const { db, auth } = services(); if (!auth.currentUser) throw new Error('Silakan login Google.'); return { db, uid: auth.currentUser.uid, name: (auth.currentUser.displayName || 'Pengguna').slice(0, 100) }; }
function profileRef(uid: string) { return doc(services().db, 'halaqah_profiles', uid); }
export async function ensureProfile() {
  const { uid, name, db } = identity();
  await runTransaction(db, async tx => { const ref = profileRef(uid); if (!(await tx.get(ref)).exists()) tx.set(ref, { name, teacherCode: '', linkedTeacherUid: '', linkedTeacherCode: '', linkedTeacherName: '' }); });
}
export function watchProfile(uid: string, next: (p: Profile | null) => void, error: (e: Error) => void) { return onSnapshot(profileRef(uid), s => next(s.exists() ? s.data() as Profile : null), error); }
export async function activateTeacher() {
  const { uid, name, db } = identity();
  for (let i = 0; i < 12; i++) {
    const code = generateCode();
    const result = await runTransaction(db, async tx => {
      const p = await tx.get(profileRef(uid));
      if (p.data()?.teacherCode) return p.data()!.teacherCode as string;
      const ref = doc(db, 'teacher_codes', code);
      if ((await tx.get(ref)).exists()) return null;
      tx.set(ref, { teacherUid: uid, teacherName: name });
      tx.update(profileRef(uid), { teacherCode: code });
      return code;
    });
    if (result) return result;
  }
  throw new Error('Gagal membuat kode unik. Coba lagi.');
}
export async function lookupTeacher(input: string) {
  const { db, uid } = identity(); const code = normalizeCode(input);
  if (!validCode(code)) throw new Error('Kode harus 6 karakter, mengandung huruf dan angka.');
  const s = await getDocFromServer(doc(db, 'teacher_codes', code));
  if (!s.exists()) throw new Error('Kode guru tidak ditemukan.');
  const teacher = s.data() as { teacherUid: string; teacherName: string };
  if (teacher.teacherUid === uid) throw new Error('Tidak dapat memilih diri sendiri sebagai guru.');
  return { ...teacher, code };
}
function requestRef(studentUid: string) { return doc(services().db, 'connection_requests', studentUid); }
export function watchConnectionRequest(uid: string, next: (r: ConnectionRequest | null) => void, error: (e: Error) => void) {
  return onSnapshot(requestRef(uid), s => next(s.exists() ? s.data() as ConnectionRequest : null), error);
}
export function watchConnectionRequests(teacherUid: string, next: (r: ConnectionRequest[]) => void, error: (e: Error) => void) {
  const db = services().db;
  let pending: ConnectionRequest[] = [];
  let blocked: ConnectionRequest[] = [];
  const emit = () => next([...pending, ...blocked]);
  const a = onSnapshot(query(collection(db, 'connection_requests'), where('teacherUid', '==', teacherUid)), s => { pending = s.docs.map(d => d.data() as ConnectionRequest); emit(); }, error);
  const b = onSnapshot(collection(db, 'teachers', teacherUid, 'blocked_students'), s => { blocked = s.docs.map(d => d.data() as ConnectionRequest); emit(); }, error);
  return () => { a(); b(); };
}
export async function requestTeacher(code: string) {
  const { db, uid } = identity();
  const teacher = await lookupTeacher(code);
  const profile = await getDocFromServer(profileRef(uid));
  if (!profile.exists()) throw new Error('Profil belum siap.');
  const data = profile.data() as Profile;
  if (data.linkedTeacherUid === teacher.teacherUid) throw new Error('Anda sudah terhubung dengan guru ini.');
  const existing = await getDocFromServer(requestRef(uid));
  const old = existing.data() as ConnectionRequest | undefined;
  if (old?.status === 'blocked' && old.teacherUid === teacher.teacherUid) throw new Error('Anda diblokir oleh guru ini dan tidak dapat mengirim permintaan baru.');
  const blockedDoc = await getDocFromServer(doc(db, 'teachers', teacher.teacherUid, 'blocked_students', uid));
  if (blockedDoc.exists()) throw new Error('Anda diblokir oleh guru ini dan tidak dapat mengirim permintaan baru.');
  await setDoc(requestRef(uid), { studentUid: uid, studentName: data.name, teacherUid: teacher.teacherUid, teacherCode: teacher.code, teacherName: teacher.teacherName, status: 'pending', requestedAt: serverTimestamp() });
}
export async function cancelTeacherRequest() { const { uid } = identity(); await deleteDoc(requestRef(uid)); }
export async function respondTeacherRequest(request: ConnectionRequest, action: 'accept' | 'reject' | 'block' | 'unblock') {
  const { db, uid } = identity();
  if (request.teacherUid !== uid) throw new Error('Permintaan ini bukan untuk Anda.');
  const ref = requestRef(request.studentUid);
  if (action === 'reject') { await deleteDoc(ref); return; }
  const blockedRef = doc(db, 'teachers', uid, 'blocked_students', request.studentUid);
  if (action === 'unblock') { await deleteDoc(blockedRef); return; }
  if (action === 'block') {
    await runTransaction(db, async tx => {
      const requestSnap = await tx.get(ref);
      if (!requestSnap.exists() || requestSnap.data().teacherUid !== uid) throw new Error('Permintaan sudah tidak tersedia.');
      tx.set(blockedRef, { ...request, status: 'blocked' });
      tx.delete(ref);
    });
    return;
  }
  await runTransaction(db, async tx => {
    const requestSnap = await tx.get(ref);
    if (!requestSnap.exists()) throw new Error('Permintaan sudah tidak tersedia.');
    const current = requestSnap.data() as ConnectionRequest;
    if (current.teacherUid !== uid || current.status !== 'pending') throw new Error('Permintaan tidak dapat diterima.');
    const teacherCode = await tx.get(doc(db, 'teacher_codes', current.teacherCode));
    if (!teacherCode.exists() || teacherCode.data().teacherUid !== uid) throw new Error('Kode guru tidak lagi valid.');
    tx.update(profileRef(current.studentUid), { linkedTeacherUid: uid, linkedTeacherCode: current.teacherCode, linkedTeacherName: teacherCode.data().teacherName });
    tx.delete(ref);
  });
}
export async function changeTeacher(code: null) {
  const { db, uid } = identity();
  if (code !== null) throw new Error('Gunakan permintaan untuk menghubungkan guru.');
  await updateDoc(profileRef(uid), { linkedTeacherUid: '', linkedTeacherCode: '', linkedTeacherName: '' });
}
export async function unlinkStudent(studentUid: string) {
  const { db, uid } = identity();
  await updateDoc(profileRef(studentUid), { linkedTeacherUid: '', linkedTeacherCode: '', linkedTeacherName: '' });
  await deleteDoc(doc(db, 'teachers', uid, 'student_aliases', studentUid)).catch(() => {});
}
export function watchStudents(uid: string, manual: boolean, next: (s: Student[]) => void, error: (e: Error) => void) {
  const { db } = services();
  if (manual) {
    const q = query(collection(db, 'teachers', uid, 'manual_students'), where('archived', '==', false));
    return onSnapshot(q, s => next(s.docs.map(d => ({ id: d.id, name: d.data().name, manual: true }))), error);
  }

  let profiles: { id: string; name: string }[] = [];
  let aliases: Record<string, string> = {};
  let profilesLoaded = false;

  const emit = () => {
    next(profiles.map(p => {
      const alias = aliases[p.id]?.trim();
      return {
        id: p.id,
        name: alias || p.name,
        originalName: p.name,
        alias: alias || undefined,
        manual: false,
      };
    }));
  };

  const unsubProfiles = onSnapshot(
    query(collection(db, 'halaqah_profiles'), where('linkedTeacherUid', '==', uid)),
    s => {
      profiles = s.docs.map(d => ({ id: d.id, name: d.data().name || '' }));
      profilesLoaded = true;
      emit();
    },
    error
  );

  const unsubAliases = onSnapshot(
    collection(db, 'teachers', uid, 'student_aliases'),
    s => {
      aliases = {};
      s.docs.forEach(d => {
        const data = d.data();
        if (data && typeof data.alias === 'string') {
          aliases[d.id] = data.alias;
        }
      });
      if (profilesLoaded) emit();
    },
    error
  );

  return () => {
    unsubProfiles();
    unsubAliases();
  };
}
function validName(name: string) { if (!name.trim() || name.trim().length > 100) throw new Error('Nama wajib diisi, maksimal 100 karakter.'); return name.trim(); }
export async function updateProfileName(name: string) {
  const { db, uid } = identity();
  const trimmed = validName(name);
  await runTransaction(db, async tx => {
    const pRef = profileRef(uid);
    const pSnap = await tx.get(pRef);
    if (!pSnap.exists()) throw new Error('Profil belum siap.');
    const currentData = pSnap.data() as Profile;

    let codeRef = null;
    let codeExists = false;
    if (currentData.teacherCode) {
      codeRef = doc(db, 'teacher_codes', currentData.teacherCode);
      const codeSnap = await tx.get(codeRef);
      codeExists = codeSnap.exists();
    }

    tx.update(pRef, { name: trimmed });
    if (codeRef && codeExists) {
      tx.update(codeRef, { teacherName: trimmed });
    }
  });
}
export async function addManual(name: string) { const { db, uid } = identity(); await setDoc(doc(collection(db, 'teachers', uid, 'manual_students')), { name: validName(name), archived: false }); }
export async function renameStudent(s: Student, name: string) {
  const { db, uid } = identity();
  if (s.manual) {
    await updateDoc(doc(db, 'teachers', uid, 'manual_students', s.id), { name: validName(name) });
  } else {
    const trimmed = name.trim();
    const aliasRef = doc(db, 'teachers', uid, 'student_aliases', s.id);
    if (!trimmed || (s.originalName && trimmed === s.originalName.trim())) {
      await deleteDoc(aliasRef);
    } else {
      if (trimmed.length > 100) throw new Error('Nama alias maksimal 100 karakter.');
      await setDoc(aliasRef, { alias: trimmed });
    }
  }
}
export async function archiveManual(id: string) { const { db, uid } = identity(); await updateDoc(doc(db, 'teachers', uid, 'manual_students', id), { archived: true }); }
function verses(target: Target) { const { db } = services(); return target.manualId ? collection(db, 'teachers', target.uid, 'manual_students', target.manualId, 'verses') : collection(db, 'learner_records', target.uid, 'verses'); }
export function watchRecords(target: Target, next: (r: Records) => void, error: (e: Error) => void) { return onSnapshot(verses(target), s => next(Object.fromEntries(s.docs.map(d => [d.id, d.data() as SharedVerse]))), error); }
export async function importLegacyHafalan(records: Record<string, HafalanVerseRecord>, expectedUid: string) {
  for (const [key, storedRecord] of Object.entries(records)) {
    const record = normalizeLegacyHafalanRecord(storedRecord, key);
    validateVerse(record);
    const { uid, db } = identity();
    if (uid !== expectedUid) throw new Error('Akun berubah; impor dihentikan.');
    const ref = doc(verses({ uid }), `${record.surahNumber}_${record.verseNumber}`);
    await runTransaction(db, async tx => {
      if ((await tx.get(ref)).exists()) return;
      tx.set(ref, { surahNumber: record.surahNumber, verseNumber: record.verseNumber, status: record.status, repeatCount: record.repeatCount, notes: record.notes || '', lastReviewedAt: record.lastReviewedAt || new Date().toISOString(), revision: 1, updatedBy: uid, updatedAt: serverTimestamp() });
    });
  }
}

export function normalizeLegacyHafalanRecord(value: unknown, key = ''): HafalanVerseRecord {
  const source = value && typeof value === 'object' ? value as Record<string, unknown> : {};
  const keyParts = key.match(/^(\d+)_(\d+)$/);
  const surahNumber = Number(source.surahNumber ?? keyParts?.[1]);
  const verseNumber = Number(source.verseNumber ?? keyParts?.[2]);
  const allowedStatuses: HafalanStatusType[] = ['not_started', 'in_progress', 'review_needed', 'memorized'];
  const status = allowedStatuses.includes(source.status as HafalanStatusType)
    ? source.status as HafalanStatusType
    : 'not_started';
  const parsedRepeatCount = Number(source.repeatCount ?? 0);
  const repeatCount = Number.isInteger(parsedRepeatCount) && parsedRepeatCount >= 0 ? parsedRepeatCount : 0;

  return {
    surahNumber,
    verseNumber,
    status,
    repeatCount,
    notes: typeof source.notes === 'string' ? source.notes : '',
    lastReviewedAt: typeof source.lastReviewedAt === 'string' ? source.lastReviewedAt : undefined,
  };
}

export function validateVerse(record: HafalanVerseRecord) {
  const surah = ALL_SURAHS.find(s => s.nomor === record.surahNumber);
  if (!surah || !Number.isInteger(record.verseNumber) || record.verseNumber < 1 || record.verseNumber > surah.jumlahAyat || !['not_started', 'in_progress', 'review_needed', 'memorized'].includes(record.status) || !Number.isInteger(record.repeatCount) || record.repeatCount < 0 || record.repeatCount > 100000 || (record.notes?.length || 0) > 2000) throw new Error('Data hafalan tidak valid.');
}
export async function saveVerse(target: Target, record: HafalanVerseRecord, revision: number) {
  validateVerse(record);
  if (!navigator.onLine) {
    const { uid } = identity();
    const key = 'halaqah_pending_' + uid;
    const pending: PendingVerse[] = JSON.parse(localStorage.getItem(key) || '[]');
    const existing = pending.find(p => p.target.uid === target.uid && p.target.manualId === target.manualId && p.record.surahNumber === record.surahNumber && p.record.verseNumber === record.verseNumber);
    if (existing) existing.record = record;
    else pending.push({ target, record, revision });
    localStorage.setItem(key, JSON.stringify(pending));
    window.dispatchEvent(new Event('halaqah-pending'));
    return;
  }
  await commitVerse(target, record, revision);
}
interface PendingVerse { target: Target; record: HafalanVerseRecord; revision: number }
export function pendingCount() { const { uid } = identity(); return (JSON.parse(localStorage.getItem('halaqah_pending_' + uid) || '[]') as PendingVerse[]).length; }
export async function flushPending() {
  const { uid } = identity(); const key = 'halaqah_pending_' + uid;
  const pending: PendingVerse[] = JSON.parse(localStorage.getItem(key) || '[]');
  while (pending.length) {
    if (identity().uid !== uid) throw new Error('Akun berubah; sinkronisasi dihentikan.');
    const p = pending[0]; await commitVerse(p.target, p.record, p.revision);
    pending.shift(); localStorage.setItem(key, JSON.stringify(pending));
  }
  window.dispatchEvent(new Event('halaqah-pending'));
}
export function discardPending() { const { uid } = identity(); localStorage.removeItem('halaqah_pending_' + uid); window.dispatchEvent(new Event('halaqah-pending')); }
async function commitVerse(target: Target, record: HafalanVerseRecord, revision: number) {
  validateVerse(record); const { uid, db } = identity();
  const ref = doc(verses(target), `${record.surahNumber}_${record.verseNumber}`);
  await runTransaction(db, async tx => {
    const previous = await tx.get(ref);
    if ((previous.data()?.revision || 0) !== revision) throw new Error('Konflik: hafalan telah diubah. Muat versi terbaru sebelum menyimpan kembali.');
    tx.set(ref, { surahNumber: record.surahNumber, verseNumber: record.verseNumber, status: record.status, repeatCount: record.repeatCount, notes: record.notes || '', lastReviewedAt: new Date().toISOString(), revision: revision + 1, updatedBy: uid, updatedAt: serverTimestamp() });
  });
}
