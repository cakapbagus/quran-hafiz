import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getCacheKey, getCached, setCached, getFallbackTafsir } from '../_lib/tafsir-fallback';

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { surahNumber, surahName, verseNumber, arabicText, indonesianText } = req.body || {};
  const cacheKey = getCacheKey('ibnu_katsir', surahNumber, verseNumber);

  const cached = getCached(cacheKey);
  if (cached) {
    return res.status(200).json({ result: cached });
  }

  const result = getFallbackTafsir('ibnu_katsir', surahName, surahNumber, verseNumber, arabicText, indonesianText);
  setCached(cacheKey, result);
  return res.status(200).json({ result });
}
