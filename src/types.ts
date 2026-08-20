export interface SurahSummary {
  nomor: number;
  nama: string; // Arabic name e.g. الفاتحة
  namaLatin: string; // e.g. Al-Fatihah
  jumlahAyat: number;
  tempatTurun: 'meccan' | 'medinan' | 'Mekkah' | 'Madinah';
  arti: string; // e.g. Pembukaan
  deskripsi?: string;
  audioFull?: Record<string, string>;
  juzStart?: number;
}

export interface VerseAudio {
  '01'?: string; // Abdullah Al-Juhany / Mishary
  '02'?: string; // Abdul Muhsin Al-Qasim
  '03'?: string; // Abdurrahman as-Sudais
  '04'?: string; // Ibrahim Al-Dossari
  '05'?: string; // Mishary Rashid Al-Afasy
  [key: string]: string | undefined;
}

export interface Verse {
  nomorAyat: number;
  teksArab: string;
  teksLatin: string;
  teksIndonesia: string;
  audio: VerseAudio;
}

export interface SurahDetail extends SurahSummary {
  ayat: Verse[];
  suratSelanjutnya?: { nomor: number; namaLatin: string; jumlahAyat: number } | false;
  suratSebelumnya?: { nomor: number; namaLatin: string; jumlahAyat: number } | false;
}

export interface Qari {
  id: string;
  name: string;
  arabicName: string;
  style: string;
  apiKeyKey: string; // key in audio object e.g., '05'
  cdnUrlPattern?: string; // e.g., https://everyayah.com/data/Alafasy_128kbps/
}

export type HafalanStatusType = 'not_started' | 'in_progress' | 'review_needed' | 'memorized';

export interface HafalanVerseRecord {
  surahNumber: number;
  verseNumber: number;
  status: HafalanStatusType;
  lastReviewedAt?: string;
  repeatCount: number;
  notes?: string;
}

export interface Bookmark {
  id: string;
  surahNumber: number;
  surahName: string;
  verseNumber: number;
  verseArab: string;
  verseTranslation: string;
  createdAt: string;
  note?: string;
  colorTag?: 'emerald' | 'amber' | 'blue' | 'purple' | 'rose';
}

export interface LastRead {
  surahNumber: number;
  surahName: string;
  verseNumber: number;
  timestamp: string;
}

export interface AudioPlaybackState {
  isPlaying: boolean;
  surahNumber: number | null;
  verseNumber: number | null;
  qariId: string;
  playbackSpeed: number; // 0.75, 1, 1.25, 1.5, 2
  loopMode: 'single_verse' | 'surah' | 'range' | 'none';
  repeatCountCurrent: number;
  repeatCountTarget: number; // e.g. 5 times
  rangeStartVerse: number | null;
  rangeEndVerse: number | null;
  autoScrollEnabled: boolean;
}

export interface UserSettings {
  arabicFontSize: number; // in px e.g. 28
  latinFontSize: number;
  showTranslation: boolean;
  showLatin: boolean;
  enableColoredTajwid: boolean; // Tajwid berwarna pada teks arab
  selectedQariId: string;
  theme: 'light' | 'dark' | 'emerald_dark';
  autoPlayNextVerse: boolean;
  defaultRepeatCount: number;
  maskModeDefault: 'none' | 'blur_all' | 'first_letters' | 'random_words';
  customApiKey?: string; // Stored user Gemini API key credential for personal quota
  autoCloudSync?: boolean; // Automatically sync with Google Drive
}

// Google Drive & Cloud Save Types
export interface GoogleUserProfile {
  id?: string;
  name?: string;
  email?: string;
  picture?: string;
}

export interface CloudBackupPayload {
  app: string;
  version: string;
  exportedAt: string;
  userEmail?: string;
  data: {
    settings: UserSettings;
    bookmarks: Bookmark[];
    hafalanRecords: Record<string, HafalanVerseRecord>;
    lastRead: LastRead | null;
  };
}

export interface CloudSyncStatus {
  isConnected: boolean;
  user: GoogleUserProfile | null;
  lastSyncedAt: string | null;
  isSyncing: boolean;
  error: string | null;
  cloudFileId: string | null;
  cloudFileSize?: number;
  cloudModifiedTime?: string;
}

export interface AudioRecording {
  id: string;
  surahNumber: number;
  verseNumber: number;
  audioUrl: string;
  recordedAt: string;
  durationSeconds: number;
}

// Tahfidz Exam / Ikhtibar Types
export type ExamQuestionType =
  | 'continue_verse' // Sambung potongan ayat yang sama
  | 'next_verse' // Sambung ke ayat berikutnya (Ayat N+1)
  | 'guess_surah' // Tebak nama surah dari potongan ayat / audio
  | 'word_scramble' // Susun urutan potongan kata ayat
  | 'fawasil_ending'; // Tebak kata penutup akhir ayat (Mutasyabihat)

export interface WordScrambleItem {
  id: string;
  word: string;
  originalIndex: number;
}

export interface ExamQuestion {
  id: string;
  type: ExamQuestionType;
  surahNumber: number;
  surahName: string;
  verseNumber: number;
  questionText: string;
  questionArabPrompt?: string;
  audioPromptUrl?: string;
  options?: Array<{
    id: string;
    textArab: string;
    textLatin?: string;
    textIndonesia?: string;
  }>;
  correctOptionId?: string;
  scrambleWords?: WordScrambleItem[];
  correctWordOrder?: string[];
  explanation: {
    surahName: string;
    verseNumber: number;
    fullArab: string;
    translation: string;
  };
}

export interface ExamConfig {
  scopeType: 'juz_range' | 'juz' | 'juz_amma' | 'popular_surahs' | 'single_surah' | 'custom_range';
  selectedSurahNumber: number;
  selectedJuzNumber: number;
  startJuzNumber?: number; // e.g. 1
  endJuzNumber?: number; // e.g. 5 or 30
  customStartVerse?: number;
  customEndVerse?: number;
  questionCount: number; // 5, 10, 15, 20, 25, 30
  allowedTypes: ExamQuestionType[];
  timerSecondsPerQuestion: number; // 0 for unlimited, 20, 30, 45
  includeAudioPrompts: boolean;
}

export interface ExamUserAnswer {
  questionId: string;
  isCorrect: boolean;
  selectedOptionId?: string;
  arrangedWords?: string[];
  timeSpentSeconds: number;
}

export interface ExamResultSummary {
  id: string;
  date: string;
  config: ExamConfig;
  totalQuestions: number;
  correctCount: number;
  wrongCount: number;
  score: number; // 0 - 100
  grade: 'Mumtaz Murtafi' | 'Mumtaz' | 'Jayyid Jiddan' | 'Jayyid' | 'Perlu Muroja\'ah';
  gradeColor: string;
  totalTimeSeconds: number;
  questions: ExamQuestion[];
  userAnswers: Record<string, ExamUserAnswer>;
}
