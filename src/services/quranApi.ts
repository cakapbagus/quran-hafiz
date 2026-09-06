import { SurahDetail, Verse } from '../types';
import { ALL_SURAHS } from '../data/surahList';

const CACHE_PREFIX = 'murottal_quran_surah_v3_';
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

const CACHE_DB = 'quran_hafiz_cache_v1';
const CACHE_STORE = 'surahs';
type CacheEntry = { key: string; cachedAt: number; data: SurahDetail };

function openCacheDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(CACHE_DB, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(CACHE_STORE, { keyPath: 'key' });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function readCache(key: string): Promise<CacheEntry | undefined> {
  const db = await openCacheDb();
  try {
    return await new Promise((resolve, reject) => {
      const request = db.transaction(CACHE_STORE).objectStore(CACHE_STORE).get(key);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } finally { db.close(); }
}

async function writeCache(entry: CacheEntry): Promise<void> {
  const db = await openCacheDb();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(CACHE_STORE, 'readwrite');
      tx.objectStore(CACHE_STORE).put(entry);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } finally { db.close(); }
}

export async function isAllSurahsCached(): Promise<boolean> {
  const db = await openCacheDb();
  try {
    const entries = await new Promise<CacheEntry[]>((resolve, reject) => {
      const request = db.transaction(CACHE_STORE).objectStore(CACHE_STORE).getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    const validKeys = new Set(
      entries
        .filter((entry) => entry?.data?.ayat?.length)
        .map((entry) => entry.key)
    );
    return ALL_SURAHS.every((surah) => validKeys.has(`${CACHE_PREFIX}${surah.nomor}`));
  } finally {
    db.close();
  }
}

export async function clearQuranCache(): Promise<void> {
  const db = await openCacheDb();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(CACHE_STORE, 'readwrite');
      tx.objectStore(CACHE_STORE).clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } finally { db.close(); }
  Object.keys(localStorage).filter((key) => key.startsWith(CACHE_PREFIX)).forEach((key) => localStorage.removeItem(key));
}

export async function downloadAllSurahsToCache(onProgress?: (completed: number, total: number) => void): Promise<void> {
  if (!navigator.onLine) {
    throw new Error('Hubungkan perangkat ke internet untuk mengunduh seluruh data surah.');
  }

  const surahNumbers = ALL_SURAHS.map((surah) => surah.nomor);
  let nextIndex = 0;
  let completed = 0;
  const workerCount = 4;

  const worker = async () => {
    while (nextIndex < surahNumbers.length) {
      const surahNumber = surahNumbers[nextIndex++];
      const data = await fetchSurahDetail(surahNumber);
      await writeCache({ key: `${CACHE_PREFIX}${surahNumber}`, cachedAt: Date.now(), data });
      completed++;
      onProgress?.(completed, surahNumbers.length);
    }
  };

  await Promise.all(Array.from({ length: workerCount }, () => worker()));
}

export async function fetchSurahDetail(surahNumber: number, signal?: AbortSignal): Promise<SurahDetail> {
  const cacheKey = `${CACHE_PREFIX}${surahNumber}`;
  let staleData: SurahDetail | undefined;
  
  try {
    const cached = await readCache(cacheKey);
    if (cached?.data?.ayat?.length) {
      staleData = cached.data;
      if (!navigator.onLine || Date.now() - cached.cachedAt < CACHE_TTL_MS) return cached.data;
    }
    const legacy = localStorage.getItem(cacheKey);
    if (legacy) {
      const parsed = JSON.parse(legacy) as CacheEntry;
      if (parsed?.data?.ayat?.length) {
        staleData ??= parsed.data;
        await writeCache({ key: cacheKey, cachedAt: parsed.cachedAt, data: parsed.data });
        localStorage.removeItem(cacheKey);
        if (!navigator.onLine || Date.now() - parsed.cachedAt < CACHE_TTL_MS) return parsed.data;
      }
    }
  } catch (error) {
    console.warn('Failed to read Quran cache:', error);
  }

  if (!navigator.onLine) {
    if (staleData) return staleData;
    throw new Error('Surah ini belum tersimpan. Hubungkan internet dan buka surah ini terlebih dahulu agar tersedia offline.');
  }

  try {
    const res = await fetch(`https://equran.id/api/v2/surat/${surahNumber}`, { signal });
    if (!res.ok) {
      throw new Error(`API error HTTP ${res.status}`);
    }
    const json = await res.json();
    if (json && json.data) {
      const data = json.data as SurahDetail;
      writeCache({ key: cacheKey, cachedAt: Date.now(), data }).catch((error) => console.warn('Failed to write Quran cache:', error));
      return data;
    }
    throw new Error('Invalid response structure');
  } catch (err) {
    if (signal?.aborted) throw err;
    console.warn(`Primary equran.id fetch failed for Surah ${surahNumber}, trying secondary fallback...`, err);
    try {
      return await fetchFallbackSurahDetail(surahNumber, signal);
    } catch (fallbackError) {
      if (signal?.aborted) throw fallbackError;
      if (staleData) return staleData;
      throw fallbackError;
    }
  }
}

async function fetchFallbackSurahDetail(surahNumber: number, signal?: AbortSignal): Promise<SurahDetail> {
  const cacheKey = CACHE_PREFIX + surahNumber;
  const meta = ALL_SURAHS.find((s) => s.nomor === surahNumber) || ALL_SURAHS[0];
  
  try {
    // Quran.com API v4 or Quran API fallback
    const res = await fetch(`https://api.quran.com/api/v4/verses/by_chapter/${surahNumber}?language=id&words=false&translations=33&fields=text_uthmani,chapter_id&per_page=300`, { signal });
    if (res.ok) {
      const data = await res.json();
      if (data && data.verses) {
        const ayatList: Verse[] = data.verses.map((v: any, idx: number) => {
          const translationObj = v.translations?.[0]?.text || '';
          // Remove HTML tags in translation if present
          const cleanTranslation = translationObj.replace(/<[^>]*>?/gm, '');
          return {
            nomorAyat: v.verse_number || idx + 1,
            teksArab: v.text_uthmani || '',
            teksLatin: `Ayat ${v.verse_number}`,
            teksIndonesia: cleanTranslation || `Ayat ${v.verse_number}`,
            audio: {
              '05': `https://everyayah.com/data/Alafasy_128kbps/${String(surahNumber).padStart(3, '0')}${String(v.verse_number).padStart(3, '0')}.mp3`
            }
          };
        });

        const detail: SurahDetail = { ...meta, ayat: ayatList };
        writeCache({ key: cacheKey, cachedAt: Date.now(), data: detail }).catch((error) => console.warn('Failed to write Quran cache:', error));
        return detail;
      }
    }
  } catch (e) {
    console.error('Secondary fallback fetch failed:', e);
  }

  throw new Error('Data surah tidak tersedia. Periksa koneksi internet lalu coba lagi.');
}
