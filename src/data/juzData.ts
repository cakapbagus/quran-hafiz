export interface JuzInfo {
  juzNumber: number;
  nameArabic: string;
  nameLatin: string;
  startSurahNumber: number;
  startSurahName: string;
  startVerseNumber: number;
  endSurahNumber: number;
  endSurahName: string;
  endVerseNumber: number;
  surahNumbers: number[];
  description: string;
}

export const ALL_JUZ_DATA: JuzInfo[] = [
  {
    juzNumber: 1,
    nameArabic: 'الجزء الأول',
    nameLatin: 'Juz 1',
    startSurahNumber: 1,
    startSurahName: 'Al-Fatihah',
    startVerseNumber: 1,
    endSurahNumber: 2,
    endSurahName: 'Al-Baqarah',
    endVerseNumber: 141,
    surahNumbers: [1, 2],
    description: 'Al-Fatihah ayat 1 s/d Al-Baqarah ayat 141'
  },
  {
    juzNumber: 2,
    nameArabic: 'الجزء الثاني',
    nameLatin: 'Juz 2 (Sayaqul)',
    startSurahNumber: 2,
    startSurahName: 'Al-Baqarah',
    startVerseNumber: 142,
    endSurahNumber: 2,
    endSurahName: 'Al-Baqarah',
    endVerseNumber: 252,
    surahNumbers: [2],
    description: 'Al-Baqarah ayat 142 s/d 252'
  },
  {
    juzNumber: 3,
    nameArabic: 'الجزء الثالث',
    nameLatin: 'Juz 3 (Tilka Ar-Rusul)',
    startSurahNumber: 2,
    startSurahName: 'Al-Baqarah',
    startVerseNumber: 253,
    endSurahNumber: 3,
    endSurahName: 'Ali \'Imran',
    endVerseNumber: 92,
    surahNumbers: [2, 3],
    description: 'Al-Baqarah ayat 253 s/d Ali \'Imran ayat 92'
  },
  {
    juzNumber: 4,
    nameArabic: 'الجزء الرابع',
    nameLatin: 'Juz 4 (Lan Tanalu)',
    startSurahNumber: 3,
    startSurahName: 'Ali \'Imran',
    startVerseNumber: 93,
    endSurahNumber: 4,
    endSurahName: 'An-Nisa\'',
    endVerseNumber: 23,
    surahNumbers: [3, 4],
    description: 'Ali \'Imran ayat 93 s/d An-Nisa\' ayat 23'
  },
  {
    juzNumber: 5,
    nameArabic: 'الجزء الخامس',
    nameLatin: 'Juz 5 (Wal Muhshanat)',
    startSurahNumber: 4,
    startSurahName: 'An-Nisa\'',
    startVerseNumber: 24,
    endSurahNumber: 4,
    endSurahName: 'An-Nisa\'',
    endVerseNumber: 147,
    surahNumbers: [4],
    description: 'An-Nisa\' ayat 24 s/d 147'
  },
  {
    juzNumber: 6,
    nameArabic: 'الجزء السادس',
    nameLatin: 'Juz 6 (La Yuhibbullah)',
    startSurahNumber: 4,
    startSurahName: 'An-Nisa\'',
    startVerseNumber: 148,
    endSurahNumber: 5,
    endSurahName: 'Al-Ma\'idah',
    endVerseNumber: 81,
    surahNumbers: [4, 5],
    description: 'An-Nisa\' ayat 148 s/d Al-Ma\'idah ayat 81'
  },
  {
    juzNumber: 7,
    nameArabic: 'الجزء السابع',
    nameLatin: 'Juz 7 (Wa Iza Sami\'u)',
    startSurahNumber: 5,
    startSurahName: 'Al-Ma\'idah',
    startVerseNumber: 82,
    endSurahNumber: 6,
    endSurahName: 'Al-An\'am',
    endVerseNumber: 110,
    surahNumbers: [5, 6],
    description: 'Al-Ma\'idah ayat 82 s/d Al-An\'am ayat 110'
  },
  {
    juzNumber: 8,
    nameArabic: 'الجزء الثامن',
    nameLatin: 'Juz 8 (Wa Lau Annana)',
    startSurahNumber: 6,
    startSurahName: 'Al-An\'am',
    startVerseNumber: 111,
    endSurahNumber: 7,
    endSurahName: 'Al-A\'raf',
    endVerseNumber: 87,
    surahNumbers: [6, 7],
    description: 'Al-An\'am ayat 111 s/d Al-A\'raf ayat 87'
  },
  {
    juzNumber: 9,
    nameArabic: 'الجزء التاسع',
    nameLatin: 'Juz 9 (Qalal Mala\'u)',
    startSurahNumber: 7,
    startSurahName: 'Al-A\'raf',
    startVerseNumber: 88,
    endSurahNumber: 8,
    endSurahName: 'Al-Anfal',
    endVerseNumber: 40,
    surahNumbers: [7, 8],
    description: 'Al-A\'raf ayat 88 s/d Al-Anfal ayat 40'
  },
  {
    juzNumber: 10,
    nameArabic: 'الجزء العاشر',
    nameLatin: 'Juz 10 (Wa\'lamu)',
    startSurahNumber: 8,
    startSurahName: 'Al-Anfal',
    startVerseNumber: 41,
    endSurahNumber: 9,
    endSurahName: 'At-Taubah',
    endVerseNumber: 92,
    surahNumbers: [8, 9],
    description: 'Al-Anfal ayat 41 s/d At-Taubah ayat 92'
  },
  {
    juzNumber: 11,
    nameArabic: 'الجزء الحادي عشر',
    nameLatin: 'Juz 11 (Ya\'tazirun)',
    startSurahNumber: 9,
    startSurahName: 'At-Taubah',
    startVerseNumber: 93,
    endSurahNumber: 11,
    endSurahName: 'Hud',
    endVerseNumber: 5,
    surahNumbers: [9, 10, 11],
    description: 'At-Taubah 93 s/d Hud 5'
  },
  {
    juzNumber: 12,
    nameArabic: 'الجزء الثاني عشر',
    nameLatin: 'Juz 12 (Wa Ma Min Dabbah)',
    startSurahNumber: 11,
    startSurahName: 'Hud',
    startVerseNumber: 6,
    endSurahNumber: 12,
    endSurahName: 'Yusuf',
    endVerseNumber: 52,
    surahNumbers: [11, 12],
    description: 'Hud 6 s/d Yusuf 52'
  },
  {
    juzNumber: 13,
    nameArabic: 'الجزء الثالث عشر',
    nameLatin: 'Juz 13 (Wa Ma Ubarri\'u)',
    startSurahNumber: 12,
    startSurahName: 'Yusuf',
    startVerseNumber: 53,
    endSurahNumber: 14,
    endSurahName: 'Ibrahim',
    endVerseNumber: 52,
    surahNumbers: [12, 13, 14],
    description: 'Yusuf 53 s/d Ibrahim 52'
  },
  {
    juzNumber: 14,
    nameArabic: 'الجزء الرابع عشر',
    nameLatin: 'Juz 14 (Rubama)',
    startSurahNumber: 15,
    startSurahName: 'Al-Hijr',
    startVerseNumber: 1,
    endSurahNumber: 16,
    endSurahName: 'An-Nahl',
    endVerseNumber: 128,
    surahNumbers: [15, 16],
    description: 'Al-Hijr 1 s/d An-Nahl 128'
  },
  {
    juzNumber: 15,
    nameArabic: 'الجزء الخامس عشر',
    nameLatin: 'Juz 15 (Subhanallazi)',
    startSurahNumber: 17,
    startSurahName: 'Al-Isra\'',
    startVerseNumber: 1,
    endSurahNumber: 18,
    endSurahName: 'Al-Kahf',
    endVerseNumber: 74,
    surahNumbers: [17, 18],
    description: 'Al-Isra\' 1 s/d Al-Kahf 74'
  },
  {
    juzNumber: 16,
    nameArabic: 'الجزء السادس عشر',
    nameLatin: 'Juz 16 (Qala Alam)',
    startSurahNumber: 18,
    startSurahName: 'Al-Kahf',
    startVerseNumber: 75,
    endSurahNumber: 20,
    endSurahName: 'Ta-Ha',
    endVerseNumber: 135,
    surahNumbers: [18, 19, 20],
    description: 'Al-Kahf 75 s/d Ta-Ha 135'
  },
  {
    juzNumber: 17,
    nameArabic: 'الجزء السابع عشر',
    nameLatin: 'Juz 17 (Iqtaraba)',
    startSurahNumber: 21,
    startSurahName: 'Al-Anbiya\'',
    startVerseNumber: 1,
    endSurahNumber: 22,
    endSurahName: 'Al-Hajj',
    endVerseNumber: 78,
    surahNumbers: [21, 22],
    description: 'Al-Anbiya\' 1 s/d Al-Hajj 78'
  },
  {
    juzNumber: 18,
    nameArabic: 'الجزء الثامن عشر',
    nameLatin: 'Juz 18 (Qad Aflaha)',
    startSurahNumber: 23,
    startSurahName: 'Al-Mu\'minun',
    startVerseNumber: 1,
    endSurahNumber: 25,
    endSurahName: 'Al-Furqan',
    endVerseNumber: 20,
    surahNumbers: [23, 24, 25],
    description: 'Al-Mu\'minun 1 s/d Al-Furqan 20'
  },
  {
    juzNumber: 19,
    nameArabic: 'الجزء التاسع عشر',
    nameLatin: 'Juz 19 (Wa Qalallazina)',
    startSurahNumber: 25,
    startSurahName: 'Al-Furqan',
    startVerseNumber: 21,
    endSurahNumber: 27,
    endSurahName: 'An-Naml',
    endVerseNumber: 55,
    surahNumbers: [25, 26, 27],
    description: 'Al-Furqan 21 s/d An-Naml 55'
  },
  {
    juzNumber: 20,
    nameArabic: 'الجزء العشرون',
    nameLatin: 'Juz 20 (Amman Khalaqa)',
    startSurahNumber: 27,
    startSurahName: 'An-Naml',
    startVerseNumber: 56,
    endSurahNumber: 29,
    endSurahName: 'Al-\'Ankabut',
    endVerseNumber: 45,
    surahNumbers: [27, 28, 29],
    description: 'An-Naml 56 s/d Al-\'Ankabut 45'
  },
  {
    juzNumber: 21,
    nameArabic: 'الجزء الحادي والعشرون',
    nameLatin: 'Juz 21 (Utlu Ma Uhiya)',
    startSurahNumber: 29,
    startSurahName: 'Al-\'Ankabut',
    startVerseNumber: 46,
    endSurahNumber: 33,
    endSurahName: 'Al-Ahzab',
    endVerseNumber: 30,
    surahNumbers: [29, 30, 31, 32, 33],
    description: 'Al-\'Ankabut 46 s/d Al-Ahzab 30'
  },
  {
    juzNumber: 22,
    nameArabic: 'الجزء الثاني والعشرون',
    nameLatin: 'Juz 22 (Wa Man Yaqnut)',
    startSurahNumber: 33,
    startSurahName: 'Al-Ahzab',
    startVerseNumber: 31,
    endSurahNumber: 36,
    endSurahName: 'Ya-Sin',
    endVerseNumber: 27,
    surahNumbers: [33, 34, 35, 36],
    description: 'Al-Ahzab 31 s/d Ya-Sin 27'
  },
  {
    juzNumber: 23,
    nameArabic: 'الجزء الثالث والعشرون',
    nameLatin: 'Juz 23 (Wa Maliya)',
    startSurahNumber: 36,
    startSurahName: 'Ya-Sin',
    startVerseNumber: 28,
    endSurahNumber: 39,
    endSurahName: 'Az-Zumar',
    endVerseNumber: 31,
    surahNumbers: [36, 37, 38, 39],
    description: 'Ya-Sin 28 s/d Az-Zumar 31'
  },
  {
    juzNumber: 24,
    nameArabic: 'الجزء الرابع والعشرون',
    nameLatin: 'Juz 24 (Faman Azhlamu)',
    startSurahNumber: 39,
    startSurahName: 'Az-Zumar',
    startVerseNumber: 32,
    endSurahNumber: 41,
    endSurahName: 'Fussilat',
    endVerseNumber: 46,
    surahNumbers: [39, 40, 41],
    description: 'Az-Zumar 32 s/d Fussilat 46'
  },
  {
    juzNumber: 25,
    nameArabic: 'الجزء الخامس والعشرون',
    nameLatin: 'Juz 25 (Ilayhi Yuraddu)',
    startSurahNumber: 41,
    startSurahName: 'Fussilat',
    startVerseNumber: 47,
    endSurahNumber: 45,
    endSurahName: 'Al-Jasiyah',
    endVerseNumber: 37,
    surahNumbers: [41, 42, 43, 44, 45],
    description: 'Fussilat 47 s/d Al-Jasiyah 37'
  },
  {
    juzNumber: 26,
    nameArabic: 'الجزء السادس والعشرون',
    nameLatin: 'Juz 26 (Ha Mim)',
    startSurahNumber: 46,
    startSurahName: 'Al-Ahqaf',
    startVerseNumber: 1,
    endSurahNumber: 51,
    endSurahName: 'Az-Zariyat',
    endVerseNumber: 30,
    surahNumbers: [46, 47, 48, 49, 50, 51],
    description: 'Al-Ahqaf 1 s/d Az-Zariyat 30'
  },
  {
    juzNumber: 27,
    nameArabic: 'الجزء السابع والعشرون',
    nameLatin: 'Juz 27 (Qala Fama Khatbukum)',
    startSurahNumber: 51,
    startSurahName: 'Az-Zariyat',
    startVerseNumber: 31,
    endSurahNumber: 57,
    endSurahName: 'Al-Hadid',
    endVerseNumber: 29,
    surahNumbers: [51, 52, 53, 54, 55, 56, 57],
    description: 'Az-Zariyat 31 s/d Al-Hadid 29'
  },
  {
    juzNumber: 28,
    nameArabic: 'الجزء الثامن والعشرون',
    nameLatin: 'Juz 28 (Qad Sami\'allah)',
    startSurahNumber: 58,
    startSurahName: 'Al-Mujadilah',
    startVerseNumber: 1,
    endSurahNumber: 66,
    endSurahName: 'At-Tahrim',
    endVerseNumber: 12,
    surahNumbers: [58, 59, 60, 61, 62, 63, 64, 65, 66],
    description: 'Al-Mujadilah 1 s/d At-Tahrim 12 (9 Surah)'
  },
  {
    juzNumber: 29,
    nameArabic: 'الجزء التاسع والعشرون',
    nameLatin: 'Juz 29 (Tabarakallazi)',
    startSurahNumber: 67,
    startSurahName: 'Al-Mulk',
    startVerseNumber: 1,
    endSurahNumber: 77,
    endSurahName: 'Al-Mursalat',
    endVerseNumber: 50,
    surahNumbers: [67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77],
    description: 'Al-Mulk 1 s/d Al-Mursalat 50 (11 Surah)'
  },
  {
    juzNumber: 30,
    nameArabic: 'الجزء الثلاثون',
    nameLatin: 'Juz 30 (\'Amma Yatasa\'alun)',
    startSurahNumber: 78,
    startSurahName: 'An-Naba\'',
    startVerseNumber: 1,
    endSurahNumber: 114,
    endSurahName: 'An-Nas',
    endVerseNumber: 6,
    surahNumbers: Array.from({ length: 37 }, (_, i) => i + 78),
    description: 'An-Naba\' 1 s/d An-Nas 6 (37 Surah / Juz \'Amma)'
  }
];

export function getSurahsForJuzRange(startJuz: number, endJuz: number): number[] {
  const minJ = Math.max(1, Math.min(startJuz, endJuz));
  const maxJ = Math.min(30, Math.max(startJuz, endJuz));

  const surahSet = new Set<number>();
  for (let j = minJ; j <= maxJ; j++) {
    const juz = ALL_JUZ_DATA.find((item) => item.juzNumber === j);
    if (juz) {
      juz.surahNumbers.forEach((s) => surahSet.add(s));
    }
  }

  return Array.from(surahSet).sort((a, b) => a - b);
}

export function getJuzInfo(juzNumber: number): JuzInfo | undefined {
  return ALL_JUZ_DATA.find((j) => j.juzNumber === juzNumber);
}

export function isVerseInJuzRange(
  surahNumber: number,
  verseNumber: number,
  startJuz: number,
  endJuz: number
): boolean {
  const minJuz = Math.max(1, Math.min(startJuz, endJuz));
  const maxJuz = Math.min(30, Math.max(startJuz, endJuz));
  const start = getJuzInfo(minJuz);
  const end = getJuzInfo(maxJuz);

  if (!start || !end) return false;

  const afterStart =
    surahNumber > start.startSurahNumber ||
    (surahNumber === start.startSurahNumber && verseNumber >= start.startVerseNumber);
  const beforeEnd =
    surahNumber < end.endSurahNumber ||
    (surahNumber === end.endSurahNumber && verseNumber <= end.endVerseNumber);

  return afterStart && beforeEnd;
}
