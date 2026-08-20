import { SurahDetail, Verse } from '../types';
import { ALL_SURAHS } from '../data/surahList';

const CACHE_PREFIX = 'murottal_quran_surah_v2_';

export async function fetchSurahDetail(surahNumber: number): Promise<SurahDetail> {
  const cacheKey = `${CACHE_PREFIX}${surahNumber}`;
  
  // Try reading from localStorage cache
  try {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed && parsed.ayat && parsed.ayat.length > 0) {
        return parsed as SurahDetail;
      }
    }
  } catch (e) {
    console.warn('Failed to read from localStorage cache:', e);
  }

  try {
    const res = await fetch(`https://equran.id/api/v2/surat/${surahNumber}`);
    if (!res.ok) {
      throw new Error(`API error HTTP ${res.status}`);
    }
    const json = await res.json();
    if (json && json.data) {
      const data = json.data as SurahDetail;
      // Save to cache
      try {
        localStorage.setItem(cacheKey, JSON.stringify(data));
      } catch (e) {
        console.warn('LocalStorage quota or write error:', e);
      }
      return data;
    }
    throw new Error('Invalid response structure');
  } catch (err) {
    console.warn(`Primary equran.id fetch failed for Surah ${surahNumber}, trying secondary fallback...`, err);
    return await fetchFallbackSurahDetail(surahNumber);
  }
}

async function fetchFallbackSurahDetail(surahNumber: number): Promise<SurahDetail> {
  const meta = ALL_SURAHS.find((s) => s.nomor === surahNumber) || ALL_SURAHS[0];
  
  try {
    // Quran.com API v4 or Quran API fallback
    const res = await fetch(`https://api.quran.com/api/v4/verses/by_chapter/${surahNumber}?language=id&words=false&translations=33&fields=text_uthmani,chapter_id&per_page=300`);
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

        return {
          ...meta,
          ayat: ayatList
        };
      }
    }
  } catch (e) {
    console.error('Secondary fallback fetch failed:', e);
  }

  // Emergency offline structure
  const emergencyAyat: Verse[] = Array.from({ length: meta.jumlahAyat }, (_, i) => ({
    nomorAyat: i + 1,
    teksArab: i === 0 && surahNumber !== 1 && surahNumber !== 9 ? 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ' : `آية ${i + 1}`,
    teksLatin: `Surah ${meta.namaLatin} Ayat ${i + 1}`,
    teksIndonesia: `Terjemahan ayat ${i + 1} Surah ${meta.namaLatin}`,
    audio: {
      '05': `https://everyayah.com/data/Alafasy_128kbps/${String(surahNumber).padStart(3, '0')}${String(i + 1).padStart(3, '0')}.mp3`
    }
  }));

  return {
    ...meta,
    ayat: emergencyAyat
  };
}
