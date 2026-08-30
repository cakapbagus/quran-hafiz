import {
  ExamConfig,
  ExamQuestion,
  ExamQuestionType,
  ExamResultSummary,
  SurahDetail,
  Verse,
  WordScrambleItem
} from '../types';
import { getSurahsForJuzRange, isVerseInJuzRange } from '../data/juzData';
import { fetchSurahDetail } from './quranApi';
import { getVerseAudioUrl } from '../data/qaris';

const EXAM_HISTORY_KEY = 'murottal_tahfidz_exam_history_v1';

// Fawasil end-of-verse mutasyabihat banks
const COMMON_FAWASIL = [
  'عَلِيمٌ حَكِيمٌ',
  'غَفُورٌ رَحِيمٌ',
  'عَزِيزٌ حَكِيمٌ',
  'سَمِيعٌ عَلِيمٌ',
  'بِمَا تَعْمَلُونَ بَصِيرٌ',
  'بِمَا تَعْمَلُونَ خَبِيرٌ',
  'عَلَىٰ كُلِّ شَيْءٍ قَدِيرٌ',
  'شَدِيدُ الْعِقَابِ',
  'رَبُّ الْعَالَمِينَ',
  'تُوَفَّىٰ كُلُّ نَفْسٍ'
];

function normalizeArabic(text: string): string {
  return text
    .replace(/[\u064B-\u065F\u0670]/g, '')
    .replace(/[^\u0621-\u063A\u0641-\u064A\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function calculateArabicSimilarity(first: string, second: string): number {
  const normalizedFirst = normalizeArabic(first);
  const normalizedSecond = normalizeArabic(second);
  if (!normalizedFirst || !normalizedSecond) return 0;
  if (normalizedFirst === normalizedSecond) return 1;

  const firstBigrams = Array.from({ length: Math.max(0, normalizedFirst.length - 1) }, (_, index) =>
    normalizedFirst.slice(index, index + 2)
  );
  const remainingSecondBigrams = Array.from({ length: Math.max(0, normalizedSecond.length - 1) }, (_, index) =>
    normalizedSecond.slice(index, index + 2)
  );
  let matchingBigrams = 0;

  for (const bigram of firstBigrams) {
    const matchIndex = remainingSecondBigrams.indexOf(bigram);
    if (matchIndex >= 0) {
      matchingBigrams++;
      remainingSecondBigrams.splice(matchIndex, 1);
    }
  }

  const bigramScore = firstBigrams.length + remainingSecondBigrams.length + matchingBigrams === 0
    ? 0
    : (2 * matchingBigrams) / (firstBigrams.length + remainingSecondBigrams.length + matchingBigrams);
  const firstWords = new Set(normalizedFirst.split(' '));
  const secondWords = new Set(normalizedSecond.split(' '));
  const matchingWords = [...firstWords].filter((word) => secondWords.has(word)).length;
  const wordScore = matchingWords / Math.max(firstWords.size, secondWords.size);

  return (bigramScore * 0.7) + (wordScore * 0.3);
}

function validateExamConfig(config: ExamConfig): void {
  if (!Number.isInteger(config.questionCount) || config.questionCount < 1 || config.questionCount > 50) throw new Error('Jumlah soal harus antara 1 dan 50.');
  if (config.allowedTypes.length === 0) throw new Error('Pilih minimal satu jenis soal.');
  if (config.scopeType === 'juz_range' && ((config.startJuzNumber || 1) > (config.endJuzNumber || 30))) throw new Error('Juz awal tidak boleh melewati juz akhir.');
  if (config.scopeType === 'custom_range' && ((config.customStartVerse || 1) > (config.customEndVerse || 1))) throw new Error('Ayat awal tidak boleh melewati ayat akhir.');
}

export async function generateExamQuestions(config: ExamConfig): Promise<ExamQuestion[]> {
  validateExamConfig(config);
  const surahsToLoad: number[] = [];

  if (config.scopeType === 'juz_range') {
    const startJ = config.startJuzNumber || 1;
    const endJ = config.endJuzNumber || 5;
    const juzSurahs = getSurahsForJuzRange(startJ, endJ);
    surahsToLoad.push(...juzSurahs);
  } else if (config.scopeType === 'juz') {
    const jNum = config.selectedJuzNumber || 30;
    const juzSurahs = getSurahsForJuzRange(jNum, jNum);
    surahsToLoad.push(...juzSurahs);
  } else if (config.scopeType === 'juz_amma') {
    // Juz 30 surahs: 78 to 114
    const juz30Surahs = getSurahsForJuzRange(30, 30);
    surahsToLoad.push(...juz30Surahs);
  } else if (config.scopeType === 'popular_surahs') {
    // 36 (Yasin), 55 (Ar-Rahman), 56 (Al-Waqiah), 67 (Al-Mulk), 18 (Al-Kahf), 32 (As-Sajdah)
    surahsToLoad.push(67, 56, 55, 36, 18, 32);
  } else if (config.scopeType === 'single_surah' || config.scopeType === 'custom_range') {
    surahsToLoad.push(config.selectedSurahNumber || 67);
  } else {
    surahsToLoad.push(config.selectedSurahNumber || 67);
  }

  const selectedSurahIds = [...new Set(surahsToLoad)];
  const loadedSurahs: SurahDetail[] = [];

  for (const sNum of selectedSurahIds) {
    try {
      const detail = await fetchSurahDetail(sNum);
      if (detail && detail.ayat && detail.ayat.length > 0) {
        loadedSurahs.push(detail);
      }
    } catch (e) {
      console.warn(`Failed to fetch surah ${sNum} for exam generation:`, e);
    }
  }

  if (loadedSurahs.length === 0) {
    // Fallback default surah (Al-Fatihah or Al-Mulk)
    const fallbackSurah = await fetchSurahDetail(config.selectedSurahNumber || 1);
    if (fallbackSurah) {
      loadedSurahs.push(fallbackSurah);
    }
  }

  const selectedJuzRange: [number, number] | null =
    config.scopeType === 'juz_range'
      ? [config.startJuzNumber || 1, config.endJuzNumber || 5]
      : config.scopeType === 'juz'
        ? [config.selectedJuzNumber || 30, config.selectedJuzNumber || 30]
        : config.scopeType === 'juz_amma'
          ? [30, 30]
          : null;

  // Collect all candidate verses
  interface CandidateVerse {
    surah: SurahDetail;
    verse: Verse;
    indexInSurah: number;
  }

  const allCandidateVerses: CandidateVerse[] = [];
  for (const s of loadedSurahs) {
    s.ayat.forEach((v, idx) => {
      if (selectedJuzRange && !isVerseInJuzRange(s.nomor, v.nomorAyat, ...selectedJuzRange)) {
        return;
      }

      if (config.scopeType === 'custom_range' && config.customStartVerse && config.customEndVerse) {
        if (v.nomorAyat >= config.customStartVerse && v.nomorAyat <= config.customEndVerse) {
          allCandidateVerses.push({ surah: s, verse: v, indexInSurah: idx });
        }
      } else {
        allCandidateVerses.push({ surah: s, verse: v, indexInSurah: idx });
      }
    });
  }

  if (allCandidateVerses.length === 0) {
    throw new Error('Tidak ada ayat yang tersedia dalam cakupan ujian yang dipilih.');
  }

  const questions: ExamQuestion[] = [];
  const shuffledCandidates = shuffleArray(allCandidateVerses);
  const allowedTypes = config.allowedTypes.length > 0
    ? config.allowedTypes
    : (['continue_verse', 'next_verse', 'guess_surah', 'word_scramble', 'fawasil_ending'] as ExamQuestionType[]);

  let candidateIdx = 0;
  while (questions.length < config.questionCount && candidateIdx < shuffledCandidates.length * 3) {
    const item = shuffledCandidates[candidateIdx % shuffledCandidates.length];
    const qType = allowedTypes[questions.length % allowedTypes.length];
    candidateIdx++;

    const generated = buildQuestionForType(qType, item, loadedSurahs, allCandidateVerses, config);
    if (generated) {
      questions.push(generated);
    }
  }

  if (questions.length < config.questionCount) {
    throw new Error('Kandidat ayat tidak cukup untuk jumlah soal yang dipilih.');
  }
  return questions;
}

function buildQuestionForType(
  type: ExamQuestionType,
  item: { surah: SurahDetail; verse: Verse; indexInSurah: number },
  allLoadedSurahs: SurahDetail[],
  allCandidates: Array<{ surah: SurahDetail; verse: Verse; indexInSurah: number }>,
  config: ExamConfig
): ExamQuestion | null {
  const { surah, verse, indexInSurah } = item;
  const audioUrl = getVerseAudioUrl(surah.nomor, verse.nomorAyat, 'mishary', verse.audio);
  const qId = `q_${type}_${surah.nomor}_${verse.nomorAyat}_${Math.random().toString(36).substring(2, 7)}`;

  if (type === 'continue_verse') {
    // Split Arabic words in half
    const words = verse.teksArab.trim().split(/\s+/);
    if (words.length < 4) {
      // If verse is too short, switch to next_verse
      return buildQuestionForType('next_verse', item, allLoadedSurahs, allCandidates, config);
    }

    const splitPoint = Math.max(2, Math.floor(words.length / 2));
    const firstHalf = words.slice(0, splitPoint).join(' ');
    const secondHalf = words.slice(splitPoint).join(' ');

    // Generate 3 distractors
    const distractors: string[] = [];
    const otherCandidates = shuffleArray(allCandidates.filter((c) => c.surah.nomor !== surah.nomor || c.verse.nomorAyat !== verse.nomorAyat));

    for (const other of otherCandidates) {
      if (distractors.length >= 3) break;
      const otherWords = other.verse.teksArab.trim().split(/\s+/);
      if (otherWords.length >= 3) {
        const otherHalf = otherWords.slice(Math.floor(otherWords.length / 2)).join(' ');
        if (otherHalf !== secondHalf && !distractors.includes(otherHalf)) {
          distractors.push(otherHalf);
        }
      }
    }

    while (distractors.length < 3) {
      distractors.push(COMMON_FAWASIL[distractors.length % COMMON_FAWASIL.length]);
    }

    const optionsList = shuffleArray([
      { id: 'correct', textArab: secondHalf, textLatin: 'Lanjutan yang tepat' },
      { id: 'dist_1', textArab: distractors[0] },
      { id: 'dist_2', textArab: distractors[1] },
      { id: 'dist_3', textArab: distractors[2] }
    ]);

    return {
      id: qId,
      type: 'continue_verse',
      surahNumber: surah.nomor,
      surahName: surah.namaLatin,
      verseNumber: verse.nomorAyat,
      questionText: `Lanjutkan potongan ayat dari QS. ${surah.namaLatin} ayat ${verse.nomorAyat} berikut:`,
      questionArabPrompt: firstHalf + ' ...',
      audioPromptUrl: config.includeAudioPrompts ? audioUrl : undefined,
      options: optionsList,
      correctOptionId: 'correct',
      explanation: {
        surahName: surah.namaLatin,
        verseNumber: verse.nomorAyat,
        fullArab: verse.teksArab,
        translation: verse.teksIndonesia
      }
    };
  }

  if (type === 'next_verse') {
    // Needs next verse in the same surah
    const nextVerse = surah.ayat[indexInSurah + 1];
    const nextVerseIsInScope = nextVerse && allCandidates.some(
      (candidate) => candidate.surah.nomor === surah.nomor && candidate.verse.nomorAyat === nextVerse.nomorAyat
    );
    if (!nextVerse || !nextVerseIsInScope) {
      return buildQuestionForType('guess_surah', item, allLoadedSurahs, allCandidates, config);
    }

    const distractors: Verse[] = [];
    const otherVerses = shuffleArray(
      allCandidates
        .filter((c) => c.surah.nomor !== surah.nomor || (c.verse.nomorAyat !== nextVerse.nomorAyat && c.verse.nomorAyat !== verse.nomorAyat))
        .map((c) => c.verse)
    );

    for (const ov of otherVerses) {
      if (distractors.length >= 3) break;
      if (!distractors.some((d) => d.teksArab === ov.teksArab)) {
        distractors.push(ov);
      }
    }

    const optionsList = shuffleArray([
      { id: 'correct', textArab: nextVerse.teksArab, textIndonesia: nextVerse.teksIndonesia },
      ...distractors.map((d, i) => ({
        id: `dist_${i}`,
        textArab: d.teksArab,
        textIndonesia: d.teksIndonesia
      }))
    ]);

    return {
      id: qId,
      type: 'next_verse',
      surahNumber: surah.nomor,
      surahName: surah.namaLatin,
      verseNumber: verse.nomorAyat,
      questionText: `Setelah membaca QS. ${surah.namaLatin} ayat ${verse.nomorAyat}, manakah bunyi ayat selanjutnya (Ayat ${nextVerse.nomorAyat})?`,
      questionArabPrompt: verse.teksArab,
      audioPromptUrl: config.includeAudioPrompts ? audioUrl : undefined,
      options: optionsList,
      correctOptionId: 'correct',
      explanation: {
        surahName: surah.namaLatin,
        verseNumber: nextVerse.nomorAyat,
        fullArab: nextVerse.teksArab,
        translation: nextVerse.teksIndonesia
      }
    };
  }

  if (type === 'guess_surah') {
    // Similar locations make the answer less obvious while keeping real verse positions.
    const sameSurahCandidates = allCandidates
      .filter((candidate) => candidate.surah.nomor === surah.nomor && candidate.verse.nomorAyat !== verse.nomorAyat)
      .map((candidate) => ({ surahName: candidate.surah.namaLatin, verseNum: candidate.verse.nomorAyat }));
    const otherSurahCandidates = allCandidates
      .filter((candidate) => candidate.surah.nomor !== surah.nomor)
      .map((candidate) => ({ surahName: candidate.surah.namaLatin, verseNum: candidate.verse.nomorAyat }));

    const difficulty = config.difficulty || 'medium';
    const orderedCandidates = difficulty === 'hard'
      ? [
          ...sameSurahCandidates.sort(
            (a, b) => Math.abs(a.verseNum - verse.nomorAyat) - Math.abs(b.verseNum - verse.nomorAyat)
          ),
          ...shuffleArray(otherSurahCandidates)
        ]
      : difficulty === 'easy'
        ? [...shuffleArray(otherSurahCandidates), ...shuffleArray(sameSurahCandidates)]
        : [...shuffleArray(sameSurahCandidates), ...shuffleArray(otherSurahCandidates)];

    const distractors: Array<{ surahName: string; verseNum: number }> = [];
    for (const candidate of orderedCandidates) {
      if (distractors.length >= 3) break;
      if (!distractors.some((item) => item.surahName === candidate.surahName && item.verseNum === candidate.verseNum)) {
        distractors.push(candidate);
      }
    }

    // A very narrow custom range may not contain three distractors.
    for (let offset = 1; distractors.length < 3 && offset <= surah.jumlahAyat; offset++) {
      for (const verseNum of [verse.nomorAyat - offset, verse.nomorAyat + offset]) {
        if (verseNum < 1 || verseNum > surah.jumlahAyat || distractors.length >= 3) continue;
        if (!distractors.some((item) => item.surahName === surah.namaLatin && item.verseNum === verseNum)) {
          distractors.push({ surahName: surah.namaLatin, verseNum });
        }
      }
    }

    const optionsList = shuffleArray([
      {
        id: 'correct',
        textArab: `QS. ${surah.namaLatin} : ${verse.nomorAyat}`,
        textIndonesia: `Surah ${surah.namaLatin} Ayat Ke-${verse.nomorAyat}`
      },
      ...distractors.map((d, idx) => ({
        id: `dist_${idx}`,
        textArab: `QS. ${d.surahName} : ${d.verseNum}`,
        textIndonesia: `Surah ${d.surahName} Ayat Ke-${d.verseNum}`
      }))
    ]);

    return {
      id: qId,
      type: 'guess_surah',
      surahNumber: surah.nomor,
      surahName: surah.namaLatin,
      verseNumber: verse.nomorAyat,
      questionText: 'Dengarkan atau baca ayat berikut, dari Surah dan Ayat berapakah potongan ini?',
      questionArabPrompt: verse.teksArab,
      audioPromptUrl: audioUrl,
      options: optionsList,
      correctOptionId: 'correct',
      explanation: {
        surahName: surah.namaLatin,
        verseNumber: verse.nomorAyat,
        fullArab: verse.teksArab,
        translation: verse.teksIndonesia
      }
    };
  }

  if (type === 'word_scramble') {
    // Susun urutan kata ayat
    const rawWords = verse.teksArab.trim().split(/\s+/).filter(Boolean);
    // Limit words between 3 and 10 for friendly UI
    const targetWords = rawWords.slice(0, Math.min(rawWords.length, 9));
    if (targetWords.length < 3) {
      return buildQuestionForType('continue_verse', item, allLoadedSurahs, allCandidates, config);
    }

    const scrambleItems: WordScrambleItem[] = targetWords.map((w, idx) => ({
      id: `word_${idx}_${Math.random().toString(36).substring(2, 5)}`,
      word: w,
      originalIndex: idx
    }));

    const shuffled = shuffleArray(scrambleItems);

    return {
      id: qId,
      type: 'word_scramble',
      surahNumber: surah.nomor,
      surahName: surah.namaLatin,
      verseNumber: verse.nomorAyat,
      questionText: `Susunlah urutan kata-kata berikut agar membentuk ayat yang benar (QS. ${surah.namaLatin}:${verse.nomorAyat}):`,
      scrambleWords: shuffled,
      correctWordOrder: targetWords,
      audioPromptUrl: config.includeAudioPrompts ? audioUrl : undefined,
      explanation: {
        surahName: surah.namaLatin,
        verseNumber: verse.nomorAyat,
        fullArab: verse.teksArab,
        translation: verse.teksIndonesia
      }
    };
  }

  if (type === 'fawasil_ending') {
    // Mutasyabihat & Ending Quiz
    const words = verse.teksArab.trim().split(/\s+/);
    if (words.length < 3) {
      return buildQuestionForType('continue_verse', item, allLoadedSurahs, allCandidates, config);
    }

    const lastWordsCount = Math.min(2, Math.floor(words.length / 3) || 1);
    const bodyWords = words.slice(0, words.length - lastWordsCount).join(' ');
    const endingWords = words.slice(words.length - lastWordsCount).join(' ');

    const similarEndings = allCandidates
      .filter((candidate) => candidate.surah.nomor !== surah.nomor || candidate.verse.nomorAyat !== verse.nomorAyat)
      .map((candidate) => {
        const candidateWords = candidate.verse.teksArab.trim().split(/\s+/);
        const ending = candidateWords.slice(-Math.min(lastWordsCount, candidateWords.length)).join(' ');
        return {
          ending,
          similarity: calculateArabicSimilarity(endingWords, ending)
        };
      })
      .filter((candidate) => candidate.ending && candidate.ending !== endingWords)
      .sort((a, b) => b.similarity - a.similarity);

    const distractors: string[] = [];
    for (const candidate of similarEndings) {
      if (distractors.length >= 3) break;
      if (!distractors.includes(candidate.ending)) distractors.push(candidate.ending);
    }

    for (const fallback of COMMON_FAWASIL) {
      if (distractors.length >= 3) break;
      if (fallback !== endingWords && !distractors.includes(fallback)) distractors.push(fallback);
    }

    const optionsList = shuffleArray([
      { id: 'correct', textArab: endingWords },
      ...distractors.map((d, i) => ({
        id: `dist_${i}`,
        textArab: d
      }))
    ]);

    return {
      id: qId,
      type: 'fawasil_ending',
      surahNumber: surah.nomor,
      surahName: surah.namaLatin,
      verseNumber: verse.nomorAyat,
      questionText: `Lengkapi kata penutup (fawasil/akhir ayat) untuk QS. ${surah.namaLatin} ayat ${verse.nomorAyat}:`,
      questionArabPrompt: `${bodyWords} [ ... ]`,
      audioPromptUrl: config.includeAudioPrompts ? audioUrl : undefined,
      options: optionsList,
      correctOptionId: 'correct',
      explanation: {
        surahName: surah.namaLatin,
        verseNumber: verse.nomorAyat,
        fullArab: verse.teksArab,
        translation: verse.teksIndonesia
      }
    };
  }

  return null;
}

export function calculateExamResult(
  config: ExamConfig,
  questions: ExamQuestion[],
  userAnswers: Record<string, { isCorrect: boolean; selectedOptionId?: string; arrangedWords?: string[]; timeSpentSeconds: number }>
): ExamResultSummary {
  let correctCount = 0;
  let totalTime = 0;
  const mappedAnswers: Record<string, import('../types').ExamUserAnswer> = {};

  for (const q of questions) {
    const ans = userAnswers[q.id];
    if (ans) {
      if (ans.isCorrect) correctCount++;
      totalTime += ans.timeSpentSeconds || 0;
      mappedAnswers[q.id] = {
        questionId: q.id,
        isCorrect: ans.isCorrect,
        selectedOptionId: ans.selectedOptionId,
        arrangedWords: ans.arrangedWords,
        timeSpentSeconds: ans.timeSpentSeconds || 0
      };
    } else {
      mappedAnswers[q.id] = {
        questionId: q.id,
        isCorrect: false,
        timeSpentSeconds: 0
      };
    }
  }

  const wrongCount = questions.length - correctCount;
  const score = questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0;

  let grade: ExamResultSummary['grade'] = 'Perlu Muroja\'ah';
  let gradeColor = 'text-red-400';

  if (score >= 95) {
    grade = 'Mumtaz Murtafi';
    gradeColor = 'text-[#D4AF37]';
  } else if (score >= 85) {
    grade = 'Mumtaz';
    gradeColor = 'text-emerald-400';
  } else if (score >= 70) {
    grade = 'Jayyid Jiddan';
    gradeColor = 'text-blue-400';
  } else if (score >= 60) {
    grade = 'Jayyid';
    gradeColor = 'text-amber-400';
  } else {
    grade = 'Perlu Muroja\'ah';
    gradeColor = 'text-rose-400';
  }

  const result: ExamResultSummary = {
    id: `exam_${Date.now()}`,
    date: new Date().toISOString(),
    config,
    totalQuestions: questions.length,
    correctCount,
    wrongCount,
    score,
    grade,
    gradeColor,
    totalTimeSeconds: totalTime,
    questions,
    userAnswers: mappedAnswers
  };

  saveExamResult(result);
  return result;
}

export function getStoredExamHistory(): ExamResultSummary[] {
  try {
    const raw = localStorage.getItem(EXAM_HISTORY_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as ExamResultSummary[];
  } catch {
    return [];
  }
}

export function saveExamResult(result: ExamResultSummary): void {
  try {
    const history = getStoredExamHistory();
    const updated = [result, ...history].slice(0, 25); // store last 25 exams
    localStorage.setItem(EXAM_HISTORY_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn('Failed to save exam result history:', e);
  }
}

function shuffleArray<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
