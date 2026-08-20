import {
  ExamConfig,
  ExamQuestion,
  ExamQuestionType,
  ExamResultSummary,
  SurahDetail,
  Verse,
  WordScrambleItem
} from '../types';
import { ALL_SURAHS } from '../data/surahList';
import { getSurahsForJuzRange, ALL_JUZ_DATA } from '../data/juzData';
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

export async function generateExamQuestions(config: ExamConfig): Promise<ExamQuestion[]> {
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

  // Pick up to 8 surahs to fetch detail for variety and fast response
  const sampleCount = Math.min(surahsToLoad.length, Math.max(4, Math.ceil(config.questionCount / 2)));
  const selectedSurahIds = shuffleArray(surahsToLoad).slice(0, sampleCount);
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

  // Collect all candidate verses
  interface CandidateVerse {
    surah: SurahDetail;
    verse: Verse;
    indexInSurah: number;
  }

  const allCandidateVerses: CandidateVerse[] = [];
  for (const s of loadedSurahs) {
    s.ayat.forEach((v, idx) => {
      // Filter if custom range in single surah
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
    loadedSurahs[0].ayat.forEach((v, idx) => {
      allCandidateVerses.push({ surah: loadedSurahs[0], verse: v, indexInSurah: idx });
    });
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

  return questions.slice(0, config.questionCount);
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
    const otherCandidates = shuffleArray(allCandidates.filter((c) => c.verse.nomorAyat !== verse.nomorAyat));

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
    if (!nextVerse) {
      return buildQuestionForType('guess_surah', item, allLoadedSurahs, allCandidates, config);
    }

    const distractors: Verse[] = [];
    const otherVerses = shuffleArray(
      allCandidates
        .map((c) => c.verse)
        .filter((v) => v.nomorAyat !== nextVerse.nomorAyat && v.nomorAyat !== verse.nomorAyat)
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
    // Guess which Surah and Verse this is
    const distractors: Array<{ surahName: string; verseNum: number }> = [];
    const otherSurahs = shuffleArray(ALL_SURAHS.filter((s) => s.nomor !== surah.nomor));

    for (let i = 0; i < 3; i++) {
      const otherS = otherSurahs[i % otherSurahs.length];
      const randomVerseNum = Math.min(otherS.jumlahAyat, Math.floor(Math.random() * otherS.jumlahAyat) + 1);
      distractors.push({ surahName: otherS.namaLatin, verseNum: randomVerseNum });
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

    const distractors = COMMON_FAWASIL.filter((f) => f !== endingWords).slice(0, 3);
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
