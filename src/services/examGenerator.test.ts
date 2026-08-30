import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ALL_SURAHS } from '../data/surahList';
import { isVerseInJuzRange } from '../data/juzData';
import type { ExamConfig, SurahDetail, Verse } from '../types';
import { fetchSurahDetail } from './quranApi';
import { generateExamQuestions } from './examGenerator';

vi.mock('./quranApi', () => ({
  fetchSurahDetail: vi.fn()
}));

function makeSurah(surahNumber: number): SurahDetail {
  const metadata = ALL_SURAHS.find((surah) => surah.nomor === surahNumber);
  if (!metadata) throw new Error(`Missing metadata for surah ${surahNumber}`);

  const ayat: Verse[] = Array.from({ length: metadata.jumlahAyat }, (_, index) => ({
    nomorAyat: index + 1,
    teksArab: `هذه كلمة من آية رقم ${index + 1}`,
    teksLatin: `Ayat ${index + 1}`,
    teksIndonesia: `Terjemahan ayat ${index + 1}`,
    audio: {}
  }));

  return { ...metadata, ayat };
}

const baseConfig: ExamConfig = {
  scopeType: 'juz_range',
  selectedSurahNumber: 1,
  selectedJuzNumber: 1,
  startJuzNumber: 1,
  endJuzNumber: 4,
  questionCount: 20,
  difficulty: 'hard',
  allowedTypes: ['guess_surah'],
  timerSecondsPerQuestion: 0,
  includeAudioPrompts: false
};

describe('exam question generation', () => {
  beforeEach(() => {
    vi.mocked(fetchSurahDetail).mockImplementation(async (surahNumber) => makeSurah(surahNumber));
  });

  it('recognizes exact verse boundaries for a selected juz range', () => {
    expect(isVerseInJuzRange(3, 93, 1, 4)).toBe(true);
    expect(isVerseInJuzRange(4, 23, 1, 4)).toBe(true);
    expect(isVerseInJuzRange(4, 24, 1, 4)).toBe(false);
  });

  it('does not generate questions from verses beyond the selected juz', async () => {
    const questions = await generateExamQuestions(baseConfig);

    expect(questions).toHaveLength(baseConfig.questionCount);
    expect(questions.every((question) =>
      isVerseInJuzRange(question.surahNumber, question.verseNumber, 1, 4)
    )).toBe(true);
  });

  it('uses nearby positions from the same surah for hard guess questions', async () => {
    const questions = await generateExamQuestions(baseConfig);

    for (const question of questions) {
      expect(question.options).toHaveLength(4);
      expect(question.options?.every((option) =>
        option.textArab.startsWith(`QS. ${question.surahName} :`)
      )).toBe(true);

      const optionVerses = question.options?.map((option) => Number(option.textArab.split(':')[1].trim())) || [];
      const distractorDistances = optionVerses
        .filter((verseNumber) => verseNumber !== question.verseNumber)
        .map((verseNumber) => Math.abs(verseNumber - question.verseNumber));
      expect(Math.max(...distractorDistances)).toBeLessThanOrEqual(3);
    }
  });

  it('uses similar endings from real scoped verses for mutasyabihat options', async () => {
    const questions = await generateExamQuestions({
      ...baseConfig,
      allowedTypes: ['fawasil_ending']
    });

    for (const question of questions) {
      expect(question.type).toBe('fawasil_ending');
      expect(question.options).toHaveLength(4);
      expect(question.options?.every((option) => /^رقم \d+$/.test(option.textArab))).toBe(true);
    }
  });
});
