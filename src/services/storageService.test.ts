import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_SETTINGS, getStoredSettings, restoreStoredDataAtomically } from './storageService';

const keys = {
  settings: 'murottal_quran_settings_v1',
  bookmarks: 'murottal_quran_bookmarks_v1',
  records: 'murottal_quran_hafalan_records_v1',
  lastRead: 'murottal_quran_last_read_v1'
};

describe('settings storage', () => {
  beforeEach(() => localStorage.clear());

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
