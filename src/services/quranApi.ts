import { SurahDetail, Verse } from '../types';
import { ALL_SURAHS } from '../data/surahList';

const CACHE_PREFIX = 'murottal_quran_surah_v4_';
const LEGACY_CACHE_PREFIXES = ['murottal_quran_surah_v3_'];
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

const CACHE_DB = 'quran_hafiz_cache_v1';
const CACHE_STORE = 'surahs';
type CacheEntry = { key: string; cachedAt: number; data: SurahDetail };

type CloudAyah = { numberInSurah: number; text: string };
type CloudEdition = { edition?: { identifier?: string }; ayahs?: CloudAyah[] };
type EquranVerse = Partial<Verse> & { nomorAyat?: number };

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
    const validKeys = new Set(entries.filter((entry) => entry?.data?.ayat?.length).map((entry) => entry.key));
    return ALL_SURAHS.every((surah) => validKeys.has(`${CACHE_PREFIX}${surah.nomor}`));
  } finally { db.close(); }
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
  const prefixes = [CACHE_PREFIX, ...LEGACY_CACHE_PREFIXES];
  Object.keys(localStorage)
    .filter((key) => prefixes.some((prefix) => key.startsWith(prefix)))
    .forEach((key) => localStorage.removeItem(key));
}

export async function downloadAllSurahsToCache(onProgress?: (completed: number, total: number) => void): Promise<void> {
  if (!navigator.onLine) throw new Error('Hubungkan perangkat ke internet untuk mengunduh seluruh data surah.');

  const surahNumbers = ALL_SURAHS.map((surah) => surah.nomor);
  let nextIndex = 0;
  let completed = 0;
  const worker = async () => {
    while (nextIndex < surahNumbers.length) {
      const surahNumber = surahNumbers[nextIndex++];
      const data = await fetchSurahDetail(surahNumber);
      await writeCache({ key: `${CACHE_PREFIX}${surahNumber}`, cachedAt: Date.now(), data });
      onProgress?.(++completed, surahNumbers.length);
    }
  };
  await Promise.all(Array.from({ length: 4 }, () => worker()));
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
    const localEntry = localStorage.getItem(cacheKey);
    if (localEntry) {
      const parsed = JSON.parse(localEntry) as CacheEntry;
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
    const data = await fetchAlQuranCloudSurah(surahNumber, signal);
    try {
      await writeCache({ key: cacheKey, cachedAt: Date.now(), data });
    } catch (cacheError) {
      console.warn('Failed to write Quran cache:', cacheError);
    }
    return data;
  } catch (error) {
    if (signal?.aborted) throw error;
    console.warn(`AlQuran Cloud fetch failed for Surah ${surahNumber}, trying fallback...`, error);
    try {
      const data = await fetchFallbackSurahDetail(surahNumber, signal);
      try {
        await writeCache({ key: cacheKey, cachedAt: Date.now(), data });
      } catch (cacheError) {
        console.warn('Failed to write Quran cache:', cacheError);
      }
      return data;
    } catch (fallbackError) {
      if (signal?.aborted) throw fallbackError;
      if (staleData) return staleData;
      throw fallbackError;
    }
  }
}

async function fetchAlQuranCloudSurah(surahNumber: number, signal?: AbortSignal): Promise<SurahDetail> {
  const response = await fetch(
    `https://api.alquran.cloud/v1/surah/${surahNumber}/editions/quran-uthmani,quran-tajweed,id.indonesian`,
    { signal }
  );
  if (!response.ok) throw new Error(`AlQuran Cloud HTTP ${response.status}`);

  const json = await response.json() as { data?: CloudEdition[] };
  const editions = Array.isArray(json.data) ? json.data : [];
  const getEdition = (identifier: string) => editions.find((item) => item.edition?.identifier === identifier)?.ayahs;
  const uthmani = getEdition('quran-uthmani');
  const tajweed = getEdition('quran-tajweed');
  const translation = getEdition('id.indonesian');
  if (!uthmani?.length || !tajweed?.length || !translation?.length) throw new Error('Respons AlQuran Cloud tidak lengkap');

  const tajweedByVerse = new Map(tajweed.map((ayah) => [ayah.numberInSurah, ayah.text]));
  const translationByVerse = new Map(translation.map((ayah) => [ayah.numberInSurah, ayah.text]));
  const enrichment = await fetchEquranEnrichment(surahNumber, signal);
  const enrichmentByVerse = new Map((enrichment?.ayat ?? []).map((ayah) => [ayah.nomorAyat, ayah]));
  const meta = ALL_SURAHS.find((surah) => surah.nomor === surahNumber);
  if (!meta) throw new Error(`Metadata Surah ${surahNumber} tidak ditemukan`);

  const ayat: Verse[] = uthmani.map((ayah) => {
    const extra = enrichmentByVerse.get(ayah.numberInSurah);
    return {
      nomorAyat: ayah.numberInSurah,
      // Text used when tajwid coloring is disabled follows equran.id's mushaf text.
      // AlQuran Cloud remains the source for the annotated colored rendering.
      teksArab: extra?.teksArab ?? ayah.text,
      teksArabTajwid: tajweedByVerse.get(ayah.numberInSurah),
      teksLatin: extra?.teksLatin ?? '',
      teksIndonesia: translationByVerse.get(ayah.numberInSurah) ?? '',
      audio: extra?.audio?.['05']
        ? extra.audio
        : { '05': everyAyahUrl(surahNumber, ayah.numberInSurah) }
    };
  });

  return {
    ...meta,
    deskripsi: enrichment?.deskripsi ?? meta.deskripsi,
    audioFull: enrichment?.audioFull ?? meta.audioFull,
    ayat,
    suratSelanjutnya: enrichment?.suratSelanjutnya,
    suratSebelumnya: enrichment?.suratSebelumnya
  };
}

async function fetchEquranEnrichment(surahNumber: number, signal?: AbortSignal): Promise<SurahDetail | undefined> {
  try {
    const response = await fetch(`https://equran.id/api/v2/surat/${surahNumber}`, { signal });
    if (!response.ok) return undefined;
    const json = await response.json() as { data?: SurahDetail };
    return json.data?.ayat?.length ? json.data : undefined;
  } catch (error) {
    if (signal?.aborted) throw error;
    console.warn(`equran.id enrichment failed for Surah ${surahNumber}:`, error);
    return undefined;
  }
}

function everyAyahUrl(surahNumber: number, verseNumber: number): string {
  return `https://everyayah.com/data/Alafasy_128kbps/${String(surahNumber).padStart(3, '0')}${String(verseNumber).padStart(3, '0')}.mp3`;
}

async function fetchFallbackSurahDetail(surahNumber: number, signal?: AbortSignal): Promise<SurahDetail> {
  const meta = ALL_SURAHS.find((surah) => surah.nomor === surahNumber);
  if (!meta) throw new Error(`Metadata Surah ${surahNumber} tidak ditemukan`);

  const response = await fetch(`https://api.quran.com/api/v4/verses/by_chapter/${surahNumber}?language=id&words=false&translations=33&fields=text_uthmani,chapter_id&per_page=300`, { signal });
  if (!response.ok) throw new Error(`Quran.com HTTP ${response.status}`);
  const json = await response.json() as {
    verses?: Array<{ verse_number?: number; text_uthmani?: string; translations?: Array<{ text?: string }> }>;
  };
  if (!json.verses?.length) throw new Error('Data surah tidak tersedia. Periksa koneksi internet lalu coba lagi.');

  const ayat: Verse[] = json.verses.map((verse, index) => {
    const verseNumber = verse.verse_number ?? index + 1;
    return {
      nomorAyat: verseNumber,
      teksArab: verse.text_uthmani ?? '',
      teksLatin: '',
      teksIndonesia: (verse.translations?.[0]?.text ?? '').replace(/<[^>]*>?/gm, ''),
      audio: { '05': everyAyahUrl(surahNumber, verseNumber) }
    };
  });
  return { ...meta, ayat };
}
