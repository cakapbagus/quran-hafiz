import { beforeEach, describe, expect, it, vi } from 'vitest';
import { generateCode, normalizeCode, validCode, validateVerse, normalizeLegacyHafalanRecord, renameStudent, requestTeacher, unlinkStudent, archiveManual, type Student } from './halaqahService';
import { getDocFromServer, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';

vi.mock('firebase/firestore', () => ({
  doc: vi.fn((_db, ...parts) => ({ path: parts.join('/') })),
  collection: vi.fn((_db, ...parts) => ({ path: parts.join('/') })),
  setDoc: vi.fn().mockResolvedValue(undefined),
  updateDoc: vi.fn().mockResolvedValue(undefined),
  deleteDoc: vi.fn().mockResolvedValue(undefined),
  getDocFromServer: vi.fn(),
  onSnapshot: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  runTransaction: vi.fn(),
  serverTimestamp: vi.fn(() => 'server-time'),
}));

vi.mock('./firebaseCloudService', () => ({
  services: vi.fn(() => ({
    db: {},
    auth: { currentUser: { uid: 'teacher-123', displayName: 'Ustadz Fulan' } },
  })),
}));

describe('Kode Guru', () => {
  it('normalizes lowercase and outer whitespace', () => expect(normalizeCode(' a7k9x2 ')).toBe('A7K9X2'));
  it('requires six characters with letters and numbers', () => {
    for (const code of ['ABCDEF', '123456', 'A1', 'A1BCDEF', 'A1-BCD', 'a7k9x2']) expect(validCode(code)).toBe(false);
    expect(validCode('A7K9X2')).toBe(true);
  });
  it('generates valid random codes', () => { const codes = Array.from({ length: 200 }, generateCode); expect(codes.every(validCode)).toBe(true); expect(new Set(codes).size).toBe(200); });
});
describe('Hafalan validation', () => {
  const base = { surahNumber: 1, verseNumber: 7, status: 'memorized' as const, repeatCount: 0 };
  it('accepts a valid verse', () => expect(() => validateVerse(base)).not.toThrow());
  it('rejects invalid ranges and notes', () => {
    for (const change of [{ verseNumber: 8 }, { verseNumber: 1.5 }, { surahNumber: 115 }, { repeatCount: -1 }, { notes: 'x'.repeat(2001) }]) expect(() => validateVerse({ ...base, ...change })).toThrow();
  });
  it('normalizes records written by older mobile versions', () => {
    expect(normalizeLegacyHafalanRecord({ surahNumber: '2', verseNumber: '5', repeatCount: '3' }, '2_5')).toEqual({
      surahNumber: 2,
      verseNumber: 5,
      status: 'not_started',
      repeatCount: 3,
      notes: '',
      lastReviewedAt: undefined,
    });
    expect(normalizeLegacyHafalanRecord({ status: 'memorized' }, '1_7')).toMatchObject({
      surahNumber: 1,
      verseNumber: 7,
      status: 'memorized',
      repeatCount: 0,
    });
  });
});

describe('renameStudent (alias guru vs manual)', () => {
  beforeEach(() => vi.clearAllMocks());

  it('saves alias under teacher collection for linked student and does not edit student profile', async () => {
    const student: Student = { id: 'student-99', name: 'Zaid', originalName: 'Zaid', manual: false };
    await renameStudent(student, 'Zaid Tahfidz');

    expect(setDoc).toHaveBeenCalledWith(
      expect.objectContaining({ path: 'teachers/teacher-123/student_aliases/student-99' }),
      { alias: 'Zaid Tahfidz' }
    );
    expect(updateDoc).not.toHaveBeenCalled();
  });

  it('deletes alias when cleared or matching originalName for linked student', async () => {
    const student: Student = { id: 'student-99', name: 'Zaid Tahfidz', originalName: 'Zaid', alias: 'Zaid Tahfidz', manual: false };
    await renameStudent(student, '');

    expect(deleteDoc).toHaveBeenCalledWith(
      expect.objectContaining({ path: 'teachers/teacher-123/student_aliases/student-99' })
    );

    await renameStudent(student, 'Zaid');
    expect(deleteDoc).toHaveBeenCalledTimes(2);
  });

  it('updates manual student document directly for manual students', async () => {
    const student: Student = { id: 'manual-1', name: 'Umar Lama', manual: true };
    await renameStudent(student, 'Umar Baru');

    expect(updateDoc).toHaveBeenCalledWith(
      expect.objectContaining({ path: 'teachers/teacher-123/manual_students/manual-1' }),
      { name: 'Umar Baru' }
    );
  });
});

describe('Teacher connection requests', () => {
  beforeEach(() => vi.clearAllMocks());

  it('creates a pending request without immediately changing the student profile', async () => {
    vi.mocked(getDocFromServer)
      .mockResolvedValueOnce({ exists: () => true, data: () => ({ teacherUid: 'teacher-9', teacherName: 'Ustadz Ali' }) } as never)
      .mockResolvedValueOnce({ exists: () => true, data: () => ({ name: 'Murid Satu', linkedTeacherUid: '', linkedTeacherCode: '', linkedTeacherName: '', teacherCode: '' }) } as never)
      .mockResolvedValueOnce({ exists: () => false, data: () => undefined } as never)
      .mockResolvedValueOnce({ exists: () => false, data: () => undefined } as never);

    await requestTeacher('A1B2C3');

    expect(setDoc).toHaveBeenCalledWith(
      expect.objectContaining({ path: 'connection_requests/teacher-123' }),
      expect.objectContaining({ studentUid: 'teacher-123', studentName: 'Murid Satu', teacherUid: 'teacher-9', status: 'pending' })
    );
    expect(updateDoc).not.toHaveBeenCalled();
  });

  it('rejects connection request if student is blocked by teacher', async () => {
    vi.mocked(getDocFromServer)
      .mockResolvedValueOnce({ exists: () => true, data: () => ({ teacherUid: 'teacher-9', teacherName: 'Ustadz Ali' }) } as never)
      .mockResolvedValueOnce({ exists: () => true, data: () => ({ name: 'Murid Satu', linkedTeacherUid: '', linkedTeacherCode: '', linkedTeacherName: '', teacherCode: '' }) } as never)
      .mockResolvedValueOnce({ exists: () => false, data: () => undefined } as never)
      .mockResolvedValueOnce({ exists: () => true, data: () => ({ status: 'blocked' }) } as never);

    await expect(requestTeacher('A1B2C3')).rejects.toThrow('Anda diblokir oleh guru ini dan tidak dapat mengirim permintaan baru.');
    expect(setDoc).not.toHaveBeenCalled();
  });
});

describe('Delete / Unlink Student safely', () => {
  beforeEach(() => vi.clearAllMocks());

  it('unlinks synced student without deleting their verses or records', async () => {
    await unlinkStudent('student-456');

    expect(updateDoc).toHaveBeenCalledWith(
      expect.objectContaining({ path: 'halaqah_profiles/student-456' }),
      { linkedTeacherUid: '', linkedTeacherCode: '', linkedTeacherName: '' }
    );
    expect(deleteDoc).toHaveBeenCalledWith(
      expect.objectContaining({ path: 'teachers/teacher-123/student_aliases/student-456' })
    );
  });

  it('archives manual student to keep their verses intact in subcollections', async () => {
    await archiveManual('manual-789');

    expect(updateDoc).toHaveBeenCalledWith(
      expect.objectContaining({ path: 'teachers/teacher-123/manual_students/manual-789' }),
      { archived: true }
    );
    expect(deleteDoc).not.toHaveBeenCalled();
  });
});
