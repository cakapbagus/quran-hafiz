import { collection, doc, getDocFromServer, onSnapshot, query, where, runTransaction, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { services } from './firebaseCloudService';
import { ALL_SURAHS } from '../data/surahList';
import type { HafalanVerseRecord } from '../types';

export interface Profile { name: string; teacherCode: string; linkedTeacherUid: string; linkedTeacherCode: string; linkedTeacherName: string }
export interface Student { id: string; name: string; manual: boolean }
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
export async function changeTeacher(code: string | null) {
  const { db, uid } = identity();
  const teacher = code ? await lookupTeacher(code) : null;
  await runTransaction(db, async tx => {
    const p = await tx.get(profileRef(uid));
    if (!p.exists()) throw new Error('Profil belum siap.');
    if (teacher && p.data().linkedTeacherUid === teacher.teacherUid) throw new Error('Anda sudah terhubung dengan guru ini.');
    tx.update(profileRef(uid), { linkedTeacherUid: teacher?.teacherUid || '', linkedTeacherCode: teacher?.code || '', linkedTeacherName: teacher?.teacherName || '' });
  });
}
export function watchStudents(uid: string, manual: boolean, next: (s: Student[]) => void, error: (e: Error) => void) {
  const { db } = services();
  const q = manual ? query(collection(db, 'teachers', uid, 'manual_students'), where('archived', '==', false)) : query(collection(db, 'halaqah_profiles'), where('linkedTeacherUid', '==', uid));
  return onSnapshot(q, s => next(s.docs.map(d => ({ id: d.id, name: d.data().name, manual }))), error);
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
export async function renameStudent(s: Student, name: string) { const { db, uid } = identity(); await updateDoc(s.manual ? doc(db, 'teachers', uid, 'manual_students', s.id) : profileRef(s.id), { name: validName(name) }); }
export async function archiveManual(id: string) { const { db, uid } = identity(); await updateDoc(doc(db, 'teachers', uid, 'manual_students', id), { archived: true }); }
function verses(target: Target) { const { db } = services(); return target.manualId ? collection(db, 'teachers', target.uid, 'manual_students', target.manualId, 'verses') : collection(db, 'learner_records', target.uid, 'verses'); }
export function watchRecords(target: Target, next: (r: Records) => void, error: (e: Error) => void) { return onSnapshot(verses(target), s => next(Object.fromEntries(s.docs.map(d => [d.id, d.data() as SharedVerse]))), error); }
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
