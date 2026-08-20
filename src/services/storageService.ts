import { Bookmark, HafalanVerseRecord, LastRead, UserSettings, AudioRecording } from '../types';

const BOOKMARKS_KEY = 'murottal_quran_bookmarks_v1';
const HAFALAN_RECORDS_KEY = 'murottal_quran_hafalan_records_v1';
const LAST_READ_KEY = 'murottal_quran_last_read_v1';
const SETTINGS_KEY = 'murottal_quran_settings_v1';
const RECORDINGS_KEY = 'murottal_quran_recordings_v1';

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
  maskModeDefault: 'none'
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
    return data ? JSON.parse(data) : [];
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
    return data ? JSON.parse(data) : {};
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

// --- Audio Recordings ---
export function getStoredRecordings(): AudioRecording[] {
  try {
    const data = localStorage.getItem(RECORDINGS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
}

export function saveAudioRecording(rec: Omit<AudioRecording, 'id' | 'recordedAt'>): AudioRecording {
  const list = getStoredRecordings();
  const newRec: AudioRecording = {
    ...rec,
    id: `rec_${Date.now()}`,
    recordedAt: new Date().toISOString()
  };
  list.unshift(newRec);
  try {
    localStorage.setItem(RECORDINGS_KEY, JSON.stringify(list));
  } catch (e) {
    console.warn('Failed to save recording metadata:', e);
  }
  return newRec;
}

export function saveStoredBookmarks(bookmarks: Bookmark[]): void {
  try {
    localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(bookmarks));
  } catch (e) {
    console.warn('Failed to save bookmarks list:', e);
  }
}

export function saveStoredHafalanRecords(records: Record<string, HafalanVerseRecord>): void {
  try {
    localStorage.setItem(HAFALAN_RECORDS_KEY, JSON.stringify(records));
  } catch (e) {
    console.warn('Failed to save hafalan records:', e);
  }
}

export function deleteAudioRecording(id: string): void {
  const list = getStoredRecordings().filter((r) => r.id !== id);
  try {
    localStorage.setItem(RECORDINGS_KEY, JSON.stringify(list));
  } catch (e) {
    console.warn('Failed to delete recording:', e);
  }
}
