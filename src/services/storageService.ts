import { Bookmark, HafalanVerseRecord, LastRead, UserSettings, AudioRecording } from '../types';

const BOOKMARKS_KEY = 'murottal_quran_bookmarks_v1';
const HAFALAN_RECORDS_KEY = 'murottal_quran_hafalan_records_v1';
const LAST_READ_KEY = 'murottal_quran_last_read_v1';
const SETTINGS_KEY = 'murottal_quran_settings_v1';

export const DEFAULT_SETTINGS: UserSettings = {
  arabicFontSize: 28,
  latinFontSize: 15,
  showTranslation: true,
  showLatin: true,
  enableColoredTajwid: true,
  selectedQariId: 'mishary',
  theme: 'dark',
  autoPlayNextVerse: true,
  defaultRepeatCount: 3,
  maskModeDefault: 'none',
  readDisplayMode: 'verse',
  hafalanDisplayMode: 'mushaf'
};

// --- Settings ---
export function getStoredSettings(): UserSettings {
  try {
    const data = localStorage.getItem(SETTINGS_KEY);
    return data ? { ...DEFAULT_SETTINGS, ...JSON.parse(data) } : DEFAULT_SETTINGS;
  } catch (e) {
    return DEFAULT_SETTINGS;
  }
}

export function saveStoredSettings(settings: UserSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.warn('Failed to save settings:', e);
  }
}

// --- Bookmarks ---
export function getStoredBookmarks(): Bookmark[] {
  try {
    const data = localStorage.getItem(BOOKMARKS_KEY);
    if (!data) return [];
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
}

export function saveBookmark(bookmark: Omit<Bookmark, 'id' | 'createdAt'>): Bookmark {
  const bookmarks = getStoredBookmarks();
  const existingIdx = bookmarks.findIndex(
    (b) => b.surahNumber === bookmark.surahNumber && b.verseNumber === bookmark.verseNumber
  );

  const newBookmark: Bookmark = {
    ...bookmark,
    id: `bm_${bookmark.surahNumber}_${bookmark.verseNumber}_${Date.now()}`,
    createdAt: new Date().toISOString()
  };

  if (existingIdx >= 0) {
    bookmarks[existingIdx] = newBookmark;
  } else {
    bookmarks.unshift(newBookmark);
  }

  try {
    localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(bookmarks));
  } catch (e) {
    console.warn('Failed to save bookmark:', e);
  }

  return newBookmark;
}

export function removeBookmark(surahNumber: number, verseNumber: number): void {
  const bookmarks = getStoredBookmarks().filter(
    (b) => !(b.surahNumber === surahNumber && b.verseNumber === verseNumber)
  );
  try {
    localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(bookmarks));
  } catch (e) {
    console.warn('Failed to remove bookmark:', e);
  }
}

export function isVerseBookmarked(surahNumber: number, verseNumber: number): boolean {
  const bookmarks = getStoredBookmarks();
  return bookmarks.some((b) => b.surahNumber === surahNumber && b.verseNumber === verseNumber);
}

// --- Hafalan Records ---
export function getStoredHafalanRecords(): Record<string, HafalanVerseRecord> {
  try {
    const data = localStorage.getItem(HAFALAN_RECORDS_KEY);
    if (!data) return {};
    const parsed = JSON.parse(data);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch (e) {
    return {};
  }
}

export function updateHafalanRecord(
  surahNumber: number,
  verseNumber: number,
  updates: Partial<HafalanVerseRecord>
): HafalanVerseRecord {
  const records = getStoredHafalanRecords();
  const key = `${surahNumber}_${verseNumber}`;
  const existing = records[key] || {
    surahNumber,
    verseNumber,
    status: 'not_started',
    repeatCount: 0
  };

  const updated: HafalanVerseRecord = {
    ...existing,
    ...updates,
    lastReviewedAt: new Date().toISOString()
  };

  records[key] = updated;

  try {
    localStorage.setItem(HAFALAN_RECORDS_KEY, JSON.stringify(records));
  } catch (e) {
    console.warn('Failed to save hafalan record:', e);
  }

  return updated;
}

// --- Last Read ---
export function getStoredLastRead(): LastRead | null {
  try {
    const data = localStorage.getItem(LAST_READ_KEY);
    return data ? JSON.parse(data) : null;
  } catch (e) {
    return null;
  }
}

export function saveLastRead(lastRead: LastRead): void {
  try {
    localStorage.setItem(LAST_READ_KEY, JSON.stringify(lastRead));
  } catch (e) {
    console.warn('Failed to save last read:', e);
  }
}
export function saveStoredBookmarks(bookmarks: Bookmark[]): void {
  localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(bookmarks));
}

export function saveStoredHafalanRecords(records: Record<string, HafalanVerseRecord>): void {
  localStorage.setItem(HAFALAN_RECORDS_KEY, JSON.stringify(records));
}

const RECORDINGS_DB = 'quran_hafiz_recordings_v1';

function openRecordingsDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(RECORDINGS_DB, 1);
    request.onupgradeneeded = () => request.result.createObjectStore('recordings', { keyPath: 'id' });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveAudioRecording(rec: { surahNumber: number; verseNumber: number; blob: Blob; durationSeconds: number }): Promise<AudioRecording> {
  const recording: AudioRecording = {
    id: 'rec_' + Date.now(),
    surahNumber: rec.surahNumber,
    verseNumber: rec.verseNumber,
    recordedAt: new Date().toISOString(),
    durationSeconds: rec.durationSeconds
  };
  const db = await openRecordingsDb();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction('recordings', 'readwrite');
      tx.objectStore('recordings').put({ ...recording, blob: rec.blob });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
  return recording;
}

export async function getStoredRecordings(): Promise<Array<AudioRecording & { blob: Blob }>> {
  const db = await openRecordingsDb();
  try {
    return await new Promise((resolve, reject) => {
      const request = db.transaction('recordings').objectStore('recordings').getAll();
      request.onsuccess = () => resolve(request.result.sort((a, b) => b.recordedAt.localeCompare(a.recordedAt)));
      request.onerror = () => reject(request.error);
    });
  } finally {
    db.close();
  }
}

export async function deleteAudioRecording(id: string): Promise<void> {
  const db = await openRecordingsDb();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction('recordings', 'readwrite');
      tx.objectStore('recordings').delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
}

export function restoreStoredDataAtomically(
  settings: UserSettings,
  bookmarks: Bookmark[],
  records: Record<string, HafalanVerseRecord>,
  lastRead: LastRead | null
): void {
  const entries: Array<[string, string | null]> = [
    [SETTINGS_KEY, JSON.stringify(settings)],
    [BOOKMARKS_KEY, JSON.stringify(bookmarks)],
    [HAFALAN_RECORDS_KEY, JSON.stringify(records)],
    [LAST_READ_KEY, lastRead ? JSON.stringify(lastRead) : null]
  ];
  const previous = entries.map(([key]) => [key, localStorage.getItem(key)] as const);
  try {
    entries.forEach(([key, value]) => value === null ? localStorage.removeItem(key) : localStorage.setItem(key, value));
  } catch (error) {
    previous.forEach(([key, value]) => value === null ? localStorage.removeItem(key) : localStorage.setItem(key, value));
    throw error;
  }
}
