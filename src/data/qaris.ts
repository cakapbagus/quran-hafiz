import { Qari } from '../types';

export const QARIS: Qari[] = [
  {
    id: 'mishary',
    name: 'Mishary Rashid Al-Afasy',
    arabicName: 'مشاري بن راشد العفاسي',
    style: 'Murattal',
    apiKeyKey: '05',
    cdnUrlPattern: 'https://everyayah.com/data/Alafasy_128kbps/'
  },
  {
    id: 'abdulbaset',
    name: 'AbdulBaset AbdulSamad',
    arabicName: 'عبد الباسط عبد الصمد',
    style: 'Murattal',
    cdnUrlPattern: 'https://everyayah.com/data/Abdul_Basit_Murattal_192kbps/'
  },
  {
    id: 'maher',
    name: 'Maher Al-Muaiqly',
    arabicName: 'ماهر المعيقلي',
    style: 'Murattal',
    cdnUrlPattern: 'https://everyayah.com/data/MaherAlMuaiqly128kbps/'
  },
  {
    id: 'minshawi',
    name: 'Mohamed Siddiq Al-Minshawi',
    arabicName: 'محمد صديق المنشاوي',
    style: 'Murattal',
    cdnUrlPattern: 'https://everyayah.com/data/Minshawy_Murattal_128kbps/'
  },
  {
    id: 'husary',
    name: 'Mahmoud Khalil Al-Husary',
    arabicName: 'محمود خليل الحصري',
    style: 'Murattal (Pendidik Hafalan)',
    cdnUrlPattern: 'https://everyayah.com/data/Husary_128kbps/'
  },
  {
    id: 'ghamadi',
    name: 'Saad Al-Ghamdi',
    arabicName: 'سعد الغامدي',
    style: 'Murattal',
    cdnUrlPattern: 'https://everyayah.com/data/Ghamadi_40kbps/'
  }
];

export function getVerseAudioUrl(
  surahNumber: number,
  verseNumber: number,
  qariId: string,
  apiVerseAudio?: Record<string, string | undefined>
): string {
  const selectedQari = QARIS.find((q) => q.id === qariId) || QARIS[0];
  
  // First try api verse audio if available
  if (apiVerseAudio && selectedQari.apiKeyKey && apiVerseAudio[selectedQari.apiKeyKey]) {
    const url = apiVerseAudio[selectedQari.apiKeyKey];
    if (url && url.startsWith('http')) return url;
  }

  // Fallback to EveryAyah CDN format: SSSAAA.mp3
  const surahPadded = String(surahNumber).padStart(3, '0');
  const versePadded = String(verseNumber).padStart(3, '0');
  const cdnBase = selectedQari.cdnUrlPattern || 'https://everyayah.com/data/Alafasy_128kbps/';

  return `${cdnBase}${surahPadded}${versePadded}.mp3`;
}
