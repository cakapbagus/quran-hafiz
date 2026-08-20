import { TafsirSurahDetail, TafsirVerseItem } from '../types';

const IBNU_KATSIR_CACHE_PREFIX = 'ibnu_katsir_id_';
const BIL_MATSUR_CACHE_PREFIX = 'bil_matsur_';

export async function fetchTafsirIbnuKatsir(
  surahNumber: number,
  surahName: string,
  verseNumber: number,
  arabicText?: string,
  indonesianText?: string,
  forceRefresh?: boolean,
  customApiKey?: string
): Promise<string> {
  const cacheKey = `${IBNU_KATSIR_CACHE_PREFIX}${surahNumber}_${verseNumber}`;
  if (!forceRefresh) {
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached && cached.trim().length > 0) return cached;
    } catch {}
  } else {
    try {
      localStorage.removeItem(cacheKey);
    } catch {}
  }

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (customApiKey) {
    headers['x-gemini-api-key'] = customApiKey;
  }

  const response = await fetch('/api/ai/tafsir-ibnu-katsir', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      surahNumber,
      surahName,
      verseNumber,
      arabicText,
      indonesianText,
      customApiKey
    })
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `Gagal memuat Tafsir Ibnu Katsir (HTTP ${response.status})`);
  }

  const data = await response.json();
  const result = data.result || '';

  if (result) {
    try {
      localStorage.setItem(cacheKey, result);
    } catch {}
  }

  return result;
}

export async function fetchDeepTafsirBilMatsur(
  surahNumber: number,
  surahName: string,
  verseNumber: number,
  arabicText?: string,
  indonesianText?: string,
  forceRefresh?: boolean,
  customApiKey?: string
): Promise<string> {
  const cacheKey = `${BIL_MATSUR_CACHE_PREFIX}${surahNumber}_${verseNumber}`;
  if (!forceRefresh) {
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached && cached.trim().length > 0) return cached;
    } catch {}
  } else {
    try {
      localStorage.removeItem(cacheKey);
    } catch {}
  }

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (customApiKey) {
    headers['x-gemini-api-key'] = customApiKey;
  }

  const response = await fetch('/api/ai/tafsir-bil-matsur', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      surahNumber,
      surahName,
      verseNumber,
      arabicText,
      indonesianText,
      customApiKey
    })
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `Gagal memuat Tafsir Bil Ma'tsur (HTTP ${response.status})`);
  }

  const data = await response.json();
  const result = data.result || '';

  if (result) {
    try {
      localStorage.setItem(cacheKey, result);
    } catch {}
  }

  return result;
}

