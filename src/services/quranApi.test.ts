import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { clearQuranCache, fetchSurahDetail } from './quranApi';
import type { SurahDetail } from '../types';

const detail = {
  nomor: 1,
  nama: 'الفاتحة',
  namaLatin: 'Al-Fatihah',
  jumlahAyat: 1,
  tempatTurun: 'Mekkah',
  arti: 'Pembukaan',
  deskripsi: '',
  audioFull: {},
  ayat: [{ nomorAyat: 1, teksArab: 'بسم الله', teksLatin: 'Bismillah', teksIndonesia: 'Dengan nama Allah', audio: {} }]
} as SurahDetail;

function deleteDatabase(): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.deleteDatabase('quran_hafiz_cache_v1');
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error('Database deletion blocked'));
  });
}

describe('Quran IndexedDB cache', () => {
  beforeEach(async () => {
    localStorage.clear();
    await deleteDatabase();
  });

  afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

  it('serves expired cached surahs offline without fetching', async () => {
    localStorage.setItem('murottal_quran_surah_v3_1', JSON.stringify({ cachedAt: 1, data: detail }));
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    expect(await fetchSurahDetail(1)).toEqual(detail);
    expect(await fetchSurahDetail(1)).toEqual(detail);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('uses expired data when both APIs fail despite reporting online', async () => {
    localStorage.setItem('murottal_quran_surah_v3_1', JSON.stringify({ cachedAt: 1, data: detail }));
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Network failed')));
    expect(await fetchSurahDetail(1)).toEqual(detail);
  });

  it('explains how to make an uncached surah available offline', async () => {
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    await expect(fetchSurahDetail(1)).rejects.toThrow('Surah ini belum tersimpan');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('migrates a valid legacy cache and subsequently avoids the network', async () => {
    localStorage.setItem('murottal_quran_surah_v3_1', JSON.stringify({ cachedAt: Date.now(), data: detail }));
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    expect(await fetchSurahDetail(1)).toEqual(detail);
    expect(localStorage.getItem('murottal_quran_surah_v3_1')).toBeNull();
    expect(await fetchSurahDetail(1)).toEqual(detail);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('stores API responses in IndexedDB and serves later reads from cache', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ data: detail }) });
    vi.stubGlobal('fetch', fetchMock);
    expect(await fetchSurahDetail(1)).toEqual(detail);
    await new Promise((resolve) => setTimeout(resolve, 20));
    fetchMock.mockClear();
    expect(await fetchSurahDetail(1)).toEqual(detail);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('does not call the fallback API after an aborted primary request', async () => {
    const controller = new AbortController();
    controller.abort();
    const fetchMock = vi.fn().mockRejectedValue(new DOMException('Aborted', 'AbortError'));
    vi.stubGlobal('fetch', fetchMock);
    await expect(fetchSurahDetail(1, controller.signal)).rejects.toMatchObject({ name: 'AbortError' });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('clears IndexedDB and legacy cache entries', async () => {
    localStorage.setItem('murottal_quran_surah_v3_1', '{}');
    await clearQuranCache();
    expect(localStorage.getItem('murottal_quran_surah_v3_1')).toBeNull();
  });
});
