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
  ayat: [{ nomorAyat: 1, teksArab: 'بسم الله', teksArabTajwid: '[g[نّ]', teksLatin: 'Bismillah', teksIndonesia: 'Dengan nama Allah', audio: {} }]
} as SurahDetail;

const cloudResponse = {
  data: [
    { edition: { identifier: 'quran-tajweed' }, ayahs: [{ numberInSurah: 1, text: '[h[ٱ]لْحَمْدُ' }] },
    { edition: { identifier: 'id.indonesian' }, ayahs: [{ numberInSurah: 1, text: 'Segala puji' }] },
    { edition: { identifier: 'quran-uthmani' }, ayahs: [{ numberInSurah: 1, text: 'ٱلْحَمْدُ' }] }
  ]
};

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
    localStorage.setItem('murottal_quran_surah_v4_1', JSON.stringify({ cachedAt: 1, data: detail }));
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    expect(await fetchSurahDetail(1)).toEqual(detail);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('uses expired data when both APIs fail despite reporting online', async () => {
    localStorage.setItem('murottal_quran_surah_v4_1', JSON.stringify({ cachedAt: 1, data: detail }));
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Network failed')));
    expect(await fetchSurahDetail(1)).toEqual(detail);
  });

  it('does not reuse v3 data that has no AlQuran Cloud tajwid markup', async () => {
    localStorage.setItem('murottal_quran_surah_v3_1', JSON.stringify({ cachedAt: Date.now(), data: detail }));
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
    await expect(fetchSurahDetail(1)).rejects.toThrow('Surah ini belum tersimpan');
  });

  it('explains how to make an uncached surah available offline', async () => {
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    await expect(fetchSurahDetail(1)).rejects.toThrow('Surah ini belum tersimpan');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('combines AlQuran Cloud editions by verse number and uses equran.id for plain Arabic text', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => cloudResponse })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ data: detail }) });
    vi.stubGlobal('fetch', fetchMock);

    const result = await fetchSurahDetail(1);
    expect(result.ayat[0]).toMatchObject({
      nomorAyat: 1,
      teksArab: 'بسم الله',
      teksArabTajwid: '[h[ٱ]لْحَمْدُ',
      teksLatin: 'Bismillah',
      teksIndonesia: 'Segala puji'
    });
    expect(result.ayat[0].audio['05']).toContain('001001.mp3');
  });

  it('stores API responses in IndexedDB and serves later reads from cache', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => cloudResponse })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ data: detail }) });
    vi.stubGlobal('fetch', fetchMock);
    const first = await fetchSurahDetail(1);
    await new Promise((resolve) => setTimeout(resolve, 20));
    fetchMock.mockClear();
    expect(await fetchSurahDetail(1)).toEqual(first);
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

  it('clears current and legacy cache entries', async () => {
    localStorage.setItem('murottal_quran_surah_v4_1', '{}');
    localStorage.setItem('murottal_quran_surah_v3_1', '{}');
    await clearQuranCache();
    expect(localStorage.getItem('murottal_quran_surah_v4_1')).toBeNull();
    expect(localStorage.getItem('murottal_quran_surah_v3_1')).toBeNull();
  });
});
