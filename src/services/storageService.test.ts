import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  DEFAULT_SETTINGS,
  getStoredSettings,
  restoreStoredDataAtomically,
  getSurahHafalanStatus,
  updateSurahHafalanRecords,
  getStoredHafalanRecords
} from './storageService';

const keys = {
  settings: 'murottal_quran_settings_v1',
  bookmarks: 'murottal_quran_bookmarks_v1',
  records: 'murottal_quran_hafalan_records_v1',
  lastRead: 'murottal_quran_last_read_v1'
};

describe('settings storage', () => {
  beforeEach(() => localStorage.clear());

  it('defaults to system and migrates legacy themes', () => {
    expect(getStoredSettings().theme).toBe('system');
    localStorage.setItem(keys.settings, JSON.stringify({ theme: 'emerald_dark' }));
    expect(getStoredSettings().theme).toBe('dark');
    localStorage.setItem(keys.settings, JSON.stringify({ theme: 'invalid' }));
    expect(getStoredSettings().theme).toBe('system');
  });

  it('uses separate display defaults for reading and memorization', () => {
    expect(getStoredSettings()).toMatchObject({
      readDisplayMode: 'verse',
      hafalanDisplayMode: 'mushaf'
    });
  });

  it('adds display defaults to settings saved by an older version', () => {
    localStorage.setItem(keys.settings, JSON.stringify({ theme: 'light' }));

    expect(getStoredSettings()).toMatchObject({
      theme: 'light',
      readDisplayMode: 'verse',
      hafalanDisplayMode: 'mushaf'
    });
  });
});

describe('atomic local restore', () => {
  beforeEach(() => localStorage.clear());

  it('rolls every key back when one write fails', () => {
    localStorage.setItem(keys.settings, 'old-settings');
    localStorage.setItem(keys.bookmarks, 'old-bookmarks');
    localStorage.setItem(keys.records, 'old-records');
    localStorage.setItem(keys.lastRead, 'old-last-read');
    const original = Storage.prototype.setItem;
    let failed = false;
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (key, value) {
      if (key === keys.records && !failed) { failed = true; throw new DOMException('Quota exceeded', 'QuotaExceededError'); }
      return original.call(this, key, value);
    });

    expect(() => restoreStoredDataAtomically(DEFAULT_SETTINGS, [], {}, null)).toThrow('Quota exceeded');
    expect(localStorage.getItem(keys.settings)).toBe('old-settings');
    expect(localStorage.getItem(keys.bookmarks)).toBe('old-bookmarks');
    expect(localStorage.getItem(keys.records)).toBe('old-records');
    expect(localStorage.getItem(keys.lastRead)).toBe('old-last-read');
    spy.mockRestore();
  });
});

describe('surah hafalan status', () => {
  beforeEach(() => localStorage.clear());

  it('returns not_started when no verses have records', () => {
    expect(getSurahHafalanStatus(1, 7, {})).toBe('not_started');
  });

  it('returns uniform status when all verses match', () => {
    const records = {
      '1_1': { surahNumber: 1, verseNumber: 1, status: 'memorized' as const, repeatCount: 1 },
      '1_2': { surahNumber: 1, verseNumber: 2, status: 'memorized' as const, repeatCount: 1 },
      '1_3': { surahNumber: 1, verseNumber: 3, status: 'memorized' as const, repeatCount: 1 },
    };
    expect(getSurahHafalanStatus(1, 3, records)).toBe('memorized');
  });

  it('returns "-" when verses have mixed statuses', () => {
    const records = {
      '1_1': { surahNumber: 1, verseNumber: 1, status: 'memorized' as const, repeatCount: 1 },
      '1_2': { surahNumber: 1, verseNumber: 2, status: 'in_progress' as const, repeatCount: 1 },
      '1_3': { surahNumber: 1, verseNumber: 3, status: 'memorized' as const, repeatCount: 1 },
    };
    expect(getSurahHafalanStatus(1, 3, records)).toBe('-');
  });

  it('updates all verses of a surah to the chosen status and persists to storage', () => {
    const updated = updateSurahHafalanRecords(1, 3, 'memorized');
    expect(updated['1_1']?.status).toBe('memorized');
    expect(updated['1_2']?.status).toBe('memorized');
    expect(updated['1_3']?.status).toBe('memorized');
    expect(getSurahHafalanStatus(1, 3, getStoredHafalanRecords())).toBe('memorized');
  });
});
