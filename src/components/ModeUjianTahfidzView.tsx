import { confirmAction } from './AppDialog';
import React, { useState, useEffect, useRef } from 'react';
import {
  GraduationCap,
  Play,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Clock,
  Award,
  Volume2,
  Sparkles,
  HelpCircle,
  Layers,
  Check,
  ChevronRight,
  Flame,
  ArrowRight,
  Brain,
  History,
  BookOpen,
  ArrowLeft,
  Scroll,
  Sliders
} from 'lucide-react';
import {
  ExamConfig,
  ExamQuestion,
  ExamQuestionType,
  ExamResultSummary,
  WordScrambleItem,
  HafalanVerseRecord
} from '../types';
import { ALL_SURAHS } from '../data/surahList';
import { ALL_JUZ_DATA, getSurahsForJuzRange, getJuzInfo } from '../data/juzData';
import {
  generateExamQuestions,
  calculateExamResult,
  getStoredExamHistory
} from '../services/examGenerator';

interface ModeUjianTahfidzViewProps {
  onMarkVerseReviewNeeded: (surahNumber: number, verseNumber: number) => void;
  onOpenVerseReader?: (surahNumber: number, verseNumber: number) => void;
}

export const ModeUjianTahfidzView: React.FC<ModeUjianTahfidzViewProps> = ({
  onMarkVerseReviewNeeded,
  onOpenVerseReader
}) => {
  // State: 'setup' | 'loading' | 'active' | 'result' | 'history'
  const [viewState, setViewState] = useState<'setup' | 'loading' | 'active' | 'result' | 'history'>('setup');

  // Exam Config
  const [config, setConfig] = useState<ExamConfig>({
    scopeType: 'juz_range',
    selectedSurahNumber: 67,
    selectedJuzNumber: 30,
    startJuzNumber: 1,
    endJuzNumber: 5,
    customStartVerse: 1,
    customEndVerse: 30,
    questionCount: 10,
    difficulty: 'medium',
    allowedTypes: ['continue_verse', 'next_verse', 'guess_surah', 'word_scramble', 'fawasil_ending'],
    timerSecondsPerQuestion: 0,
    includeAudioPrompts: true
  });

  // Active Exam Session
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, {
    isCorrect: boolean;
    selectedOptionId?: string;
    arrangedWords?: string[];
    timeSpentSeconds: number;
  }>>({});
  
  // Word Scramble state for active question
  const [selectedWordBank, setSelectedWordBank] = useState<WordScrambleItem[]>([]);
  const [arrangedSlots, setArrangedSlots] = useState<WordScrambleItem[]>([]);

  // Selected Option for multiple choice
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [hasSubmittedCurrent, setHasSubmittedCurrent] = useState<boolean>(false);

  // Timer state
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now());

  // Result state
  const [latestResult, setLatestResult] = useState<ExamResultSummary | null>(null);
  const [examHistory, setExamHistory] = useState<ExamResultSummary[]>(getStoredExamHistory());
  const [markedCount, setMarkedCount] = useState<number>(0);
  const [examError, setExamError] = useState<string | null>(null);
  const submitAnswerRef = useRef<(isTimeout?: boolean) => void>(() => undefined);

  // Audio helper
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);

  // Initialize audio
  useEffect(() => {
    const audio = new Audio();
    audioRef.current = audio;
    audio.onended = () => setIsPlayingAudio(false);
    audio.onpause = () => setIsPlayingAudio(false);

    return () => {
      audio.pause();
    };
  }, []);

  // Timer countdown hook for active question
  useEffect(() => {
    if (viewState !== 'active' || config.timerSecondsPerQuestion === 0) return;

    setTimeLeft(config.timerSecondsPerQuestion);
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          // Auto submit timeout
          submitAnswerRef.current(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [currentIndex, viewState]);

  // Setup word scramble when entering a word scramble question
  useEffect(() => {
    if (viewState !== 'active' || !questions[currentIndex]) return;
    const q = questions[currentIndex];
    setSelectedOptionId(null);
    setHasSubmittedCurrent(false);
    setQuestionStartTime(Date.now());

    if (q.type === 'word_scramble' && q.scrambleWords) {
      setSelectedWordBank([...q.scrambleWords]);
      setArrangedSlots([]);
    }

    // Stop previous audio
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlayingAudio(false);
    }
  }, [currentIndex, viewState, questions]);

  const handleStartExam = async () => {
    setExamError(null);
    setViewState('loading');
    try {
      const generated = await generateExamQuestions(config);
      if (generated.length === 0) {
        setExamError('Gagal menghasilkan soal ujian. Pilih cakupan lain.');
        setViewState('setup');
        return;
      }
      setQuestions(generated);
      setCurrentIndex(0);
      setUserAnswers({});
      setMarkedCount(0);
      setViewState('active');
    } catch (e) {
      console.error('Failed to start exam:', e);
      setExamError(e instanceof Error ? e.message : 'Terjadi kesalahan saat menyiapkan soal ujian.');
      setViewState('setup');
    }
  };

  const handlePlayPromptAudio = (url?: string) => {
    if (!url || !audioRef.current) return;
    if (isPlayingAudio) {
      audioRef.current.pause();
      setIsPlayingAudio(false);
    } else {
      audioRef.current.src = url;
      audioRef.current.play().then(() => setIsPlayingAudio(true)).catch(console.warn);
    }
  };

  // Word Scramble interactions
  const handlePickWord = (wordItem: WordScrambleItem) => {
    if (hasSubmittedCurrent) return;
    setSelectedWordBank((prev) => prev.filter((w) => w.id !== wordItem.id));
    setArrangedSlots((prev) => [...prev, wordItem]);
  };

  const handleRemoveWord = (wordItem: WordScrambleItem) => {
    if (hasSubmittedCurrent) return;
    setArrangedSlots((prev) => prev.filter((w) => w.id !== wordItem.id));
    setSelectedWordBank((prev) => [...prev, wordItem]);
  };

  const handleResetWords = () => {
    if (hasSubmittedCurrent || !questions[currentIndex]?.scrambleWords) return;
    setSelectedWordBank([...questions[currentIndex].scrambleWords!]);
    setArrangedSlots([]);
  };

  const handleSubmitAnswer = (isTimeout = false) => {
    const q = questions[currentIndex];
    if (!q) return;

    const timeSpent = Math.round((Date.now() - questionStartTime) / 1000);
    let isCorrect = false;

    if (q.type === 'word_scramble') {
      const userWordOrder = arrangedSlots.map((w) => w.word);
      const targetOrder = q.correctWordOrder || [];
      isCorrect =
        userWordOrder.length === targetOrder.length &&
        userWordOrder.every((w, idx) => w === targetOrder[idx]);

      setUserAnswers((prev) => ({
        ...prev,
        [q.id]: {
          isCorrect,
          arrangedWords: userWordOrder,
          timeSpentSeconds: timeSpent
        }
      }));
    } else {
      if (isTimeout) {
        isCorrect = false;
      } else {
        isCorrect = selectedOptionId === q.correctOptionId;
      }

      setUserAnswers((prev) => ({
        ...prev,
        [q.id]: {
          isCorrect,
          selectedOptionId: selectedOptionId || undefined,
          timeSpentSeconds: timeSpent
        }
      }));
    }

    setHasSubmittedCurrent(true);
  };

  submitAnswerRef.current = handleSubmitAnswer;

  const handleNextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      // Calculate final results
      const res = calculateExamResult(config, questions, userAnswers);
      setLatestResult(res);
      setExamHistory(getStoredExamHistory());
      setViewState('result');
    }
  };

  const handleMarkAllWrongToHafalanTracker = () => {
    if (!latestResult) return;
    let count = 0;
    latestResult.questions.forEach((q) => {
      const ans = latestResult.userAnswers[q.id];
      if (ans && !ans.isCorrect) {
        onMarkVerseReviewNeeded(q.surahNumber, q.verseNumber);
        count++;
      }
    });
    setMarkedCount(count);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-28">
      {/* 1. LOBI SETUP UJIAN */}
      {viewState === 'setup' && (
        <div className="space-y-6">
          {examError && <p role="alert" className="p-3 rounded-xl bg-red-500/10 text-red-400 text-sm">{examError}</p>}
          {/* Banner */}
          <div className="bg-[#0F1115] text-[#E2E2E2] rounded-3xl p-6 sm:p-8 shadow-2xl border border-[#1F2128] relative overflow-hidden">
            <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1A1C23] text-[#D4AF37] text-xs font-semibold border border-[#2A2D35]">
                  <GraduationCap className="w-4 h-4" />
                  <span>Ikhtibar Tahfidz Digital</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#D4AF37] font-serif-title">
                  Mode Ujian Hafalan Quran
                </h1>
                <p className="text-xs sm:text-sm text-[#8A8D9A] max-w-xl leading-relaxed">
                  Uji kemutqinan hafalan Anda dengan berbagai tantangan: <strong>Sambung Ayat</strong>, <strong>Tebak Surah</strong>, <strong>Susun Kata (Scramble)</strong>, dan <strong>Ujian Fawasil (Mutasyabihat)</strong>.
                </p>
              </div>

              <button
                onClick={() => setViewState('history')}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#15171E] hover:bg-[#1A1C23] text-[#D4AF37] border border-[#2A2D35] text-xs font-bold transition cursor-pointer self-start sm:self-auto"
              >
                <History className="w-4 h-4" />
                <span>Riwayat Ujian</span>
              </button>
            </div>
          </div>

          {/* Setup Form Card */}
          <div className="bg-[#15171E] rounded-3xl p-6 sm:p-8 border border-[#1F2128] shadow-2xl space-y-6">
            <h2 className="text-base font-bold text-[#E2E2E2] flex items-center gap-2 pb-3 border-b border-[#1F2128]">
              <Layers className="w-5 h-5 text-[#D4AF37]" />
              <span>Konfigurasi Ujian Tahfidz</span>
            </h2>

            {/* 1. Cakupan Materi Ujian */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-[#8A8D9A] uppercase tracking-wider block">
                1. Pilih Cakupan Materi Ujian
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {[
                  { id: 'juz_range', label: 'Rentang Juz (1-30)', desc: 'Uji hafalan blok Juz (misal: Juz 1-5, 28-30, atau 30 Juz)' },
                  { id: 'juz', label: 'Juz Tunggal', desc: 'Pilih 1 Juz spesifik dari Juz 1 s/d Juz 30' },
                  { id: 'popular_surahs', label: 'Surah Populer', desc: 'Al-Mulk, Yasin, Al-Kahf, Ar-Rahman, Al-Waqi\'ah' },
                  { id: 'single_surah', label: 'Surah Tertentu', desc: 'Pilih salah satu dari 114 surah' },
                  { id: 'custom_range', label: 'Rentang Ayat', desc: 'Uji hafalan blok ayat spesifik dalam satu surah' }
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={async () => {
                      if (item.id === 'juz_range') {
                        setConfig((prev) => ({
                          ...prev,
                          scopeType: 'juz_range',
                          startJuzNumber: prev.startJuzNumber || 1,
                          endJuzNumber: prev.endJuzNumber || 5
                        }));
                      } else {
                        setConfig((prev) => ({ ...prev, scopeType: item.id as any }));
                      }
                    }}
                    className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                      config.scopeType === item.id
                        ? 'bg-[#1A1C23] border-[#D4AF37] text-[#E2E2E2] shadow-lg shadow-[#D4AF37]/10 ring-1 ring-[#D4AF37]/40'
                        : 'bg-[#0F1115] border-[#2A2D35] text-[#8A8D9A] hover:border-[#3A3D48] hover:text-[#E2E2E2]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs text-[#D4AF37]">{item.label}</span>
                      {config.scopeType === item.id && <Check className="w-3.5 h-3.5 text-[#D4AF37]" />}
                    </div>
                    <p className="text-[11px] text-[#8A8D9A] leading-normal">{item.desc}</p>
                  </button>
                ))}
              </div>

              {/* Conditional: Rentang Juz (Juz Range) Configuration */}
              {config.scopeType === 'juz_range' && (
                <div className="p-5 rounded-2xl bg-[#0F1115] border border-[#2A2D35] space-y-4 mt-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <label className="text-xs font-bold text-[#E2E2E2] flex items-center gap-2">
                      <Scroll className="w-4 h-4 text-[#D4AF37]" />
                      <span>Atur Rentang Juz Ujian:</span>
                    </label>
                    <span className="text-[11px] text-[#8A8D9A]">
                      Pilih tombol cepat atau sesuaikan Juz awal & akhir
                    </span>
                  </div>

                  {/* Preset Shortcuts */}
                  <div className="space-y-1.5">
                    <span className="text-[11px] text-[#8A8D9A] font-semibold block">Pilihan Cepat (Presets):</span>
                    <div className="flex flex-wrap items-center gap-2">
                      {[
                        { label: 'Juz 1 – 5', start: 1, end: 5 },
                        { label: 'Juz 1 – 10', start: 1, end: 10 },
                        { label: 'Juz 1 – 30 (30 Juz Lengkap)', start: 1, end: 30 },
                        { label: 'Juz 28 – 30 (3 Juz Terakhir)', start: 28, end: 30 },
                        { label: 'Juz 29 – 30', start: 29, end: 30 },
                        { label: 'Juz 30 (Juz \'Amma)', start: 30, end: 30 }
                      ].map((preset) => {
                        const isSelected =
                          config.startJuzNumber === preset.start && config.endJuzNumber === preset.end;
                        return (
                          <button
                            key={preset.label}
                            type="button"
                            onClick={() =>
                              setConfig((prev) => ({
                                ...prev,
                                startJuzNumber: preset.start,
                                endJuzNumber: preset.end
                              }))
                            }
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border ${
                              isSelected
                                ? 'bg-[#D4AF37] text-[#0A0A0B] border-[#D4AF37] shadow-sm'
                                : 'bg-[#15171E] border-[#2A2D35] text-[#8A8D9A] hover:text-[#E2E2E2] hover:bg-[#1A1C23]'
                            }`}
                          >
                            {preset.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Custom Range Selectors */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-[#1F2128]">
                    <div>
                      <label className="text-xs text-[#8A8D9A] font-semibold block mb-1.5">
                        Dari Juz (Mulai):
                      </label>
                      <select
                        value={config.startJuzNumber || 1}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setConfig((prev) => ({
                            ...prev,
                            startJuzNumber: val,
                            endJuzNumber: Math.max(val, prev.endJuzNumber || val)
                          }));
                        }}
                        className="w-full p-2.5 rounded-xl bg-[#15171E] border border-[#2A2D35] text-[#E2E2E2] text-xs font-semibold focus:outline-none focus:border-[#D4AF37] cursor-pointer"
                      >
                        {ALL_JUZ_DATA.map((j) => (
                          <option key={`start-${j.juzNumber}`} value={j.juzNumber}>
                            Juz {j.juzNumber} - {j.nameLatin} ({j.nameArabic})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-xs text-[#8A8D9A] font-semibold block mb-1.5">
                        Sampai Juz (Selesai):
                      </label>
                      <select
                        value={config.endJuzNumber || 5}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setConfig((prev) => ({
                            ...prev,
                            endJuzNumber: val,
                            startJuzNumber: Math.min(val, prev.startJuzNumber || val)
                          }));
                        }}
                        className="w-full p-2.5 rounded-xl bg-[#15171E] border border-[#2A2D35] text-[#E2E2E2] text-xs font-semibold focus:outline-none focus:border-[#D4AF37] cursor-pointer"
                      >
                        {ALL_JUZ_DATA.map((j) => (
                          <option key={`end-${j.juzNumber}`} value={j.juzNumber}>
                            Juz {j.juzNumber} - {j.nameLatin} ({j.nameArabic})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Range Detail Preview Card */}
                  {(() => {
                    const startJ = config.startJuzNumber || 1;
                    const endJ = config.endJuzNumber || 5;
                    const startInfo = getJuzInfo(startJ);
                    const endInfo = getJuzInfo(endJ);
                    const surahsInRange = getSurahsForJuzRange(startJ, endJ);
                    const surahNames = surahsInRange
                      .slice(0, 8)
                      .map((sNum) => ALL_SURAHS.find((s) => s.nomor === sNum)?.namaLatin)
                      .filter(Boolean)
                      .join(', ');
                    const remainingSurahs = surahsInRange.length > 8 ? ` +${surahsInRange.length - 8} surah lainnya` : '';

                    return (
                      <div className="p-3.5 rounded-xl bg-[#15171E] border border-[#2A2D35] text-xs space-y-1">
                        <div className="flex items-center justify-between text-[#D4AF37] font-bold">
                          <span>
                            Rentang: Juz {startJ} s/d Juz {endJ} ({endJ - startJ + 1} Juz)
                          </span>
                          <span className="text-[11px] text-[#8A8D9A]">
                            {surahsInRange.length} Surah Tercakup
                          </span>
                        </div>
                        <p className="text-[#8A8D9A] text-[11px]">
                          <strong>Batas:</strong> Mulai {startInfo?.startSurahName} ayat {startInfo?.startVerseNumber} s/d {endInfo?.endSurahName} ayat {endInfo?.endVerseNumber}.
                        </p>
                        <p className="text-[#8A8D9A] text-[11px] truncate">
                          <strong>Daftar Surah:</strong> {surahNames}{remainingSurahs}
                        </p>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Conditional: Single Juz Selection */}
              {config.scopeType === 'juz' && (
                <div className="p-4 rounded-2xl bg-[#0F1115] border border-[#2A2D35] space-y-3 mt-3">
                  <label className="text-xs font-semibold text-[#8A8D9A]">
                    Pilih 1 Juz Spesifik:
                  </label>
                  <select
                    value={config.selectedJuzNumber}
                    onChange={(e) => setConfig((prev) => ({ ...prev, selectedJuzNumber: Number(e.target.value) }))}
                    className="w-full p-2.5 rounded-xl bg-[#15171E] border border-[#2A2D35] text-[#E2E2E2] text-xs font-semibold focus:outline-none focus:border-[#D4AF37] cursor-pointer"
                  >
                    {ALL_JUZ_DATA.map((j) => (
                      <option key={j.juzNumber} value={j.juzNumber}>
                        Juz {j.juzNumber} - {j.nameLatin} ({j.nameArabic}) • {j.description}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Conditional: Select Single Surah */}
              {(config.scopeType === 'single_surah' || config.scopeType === 'custom_range') && (
                <div className="p-4 rounded-2xl bg-[#0F1115] border border-[#2A2D35] space-y-3 mt-3">
                  <label className="text-xs font-semibold text-[#8A8D9A]">
                    Pilih Surah Spesifik:
                  </label>
                  <select
                    value={config.selectedSurahNumber}
                    onChange={(e) => setConfig((prev) => ({ ...prev, selectedSurahNumber: Number(e.target.value) }))}
                    className="w-full p-2.5 rounded-xl bg-[#15171E] border border-[#2A2D35] text-[#E2E2E2] text-xs font-semibold focus:outline-none focus:border-[#D4AF37] cursor-pointer"
                  >
                    {ALL_SURAHS.map((s) => (
                      <option key={s.nomor} value={s.nomor}>
                        {s.nomor}. {s.namaLatin} ({s.nama}) - {s.jumlahAyat} Ayat
                      </option>
                    ))}
                  </select>

                  {config.scopeType === 'custom_range' && (
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <div>
                        <label className="text-[11px] text-[#8A8D9A] block mb-1">Dari Ayat:</label>
                        <input
                          type="number"
                          min={1}
                          max={286}
                          value={config.customStartVerse ?? ''}
                          inputMode="numeric"
                          onFocus={(e) => e.currentTarget.select()}
                          onChange={(e) => setConfig((prev) => ({ ...prev, customStartVerse: e.target.value === '' ? undefined : Number(e.target.value) }))}
                          onBlur={() => setConfig((prev) => ({ ...prev, customStartVerse: Math.max(1, Math.min(286, prev.customStartVerse || 1)) }))}
                          className="w-full p-2 text-xs rounded-xl bg-[#15171E] border border-[#2A2D35] text-[#E2E2E2]"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-[#8A8D9A] block mb-1">Sampai Ayat:</label>
                        <input
                          type="number"
                          min={1}
                          max={286}
                          value={config.customEndVerse ?? ''}
                          inputMode="numeric"
                          onFocus={(e) => e.currentTarget.select()}
                          onChange={(e) => setConfig((prev) => ({ ...prev, customEndVerse: e.target.value === '' ? undefined : Number(e.target.value) }))}
                          onBlur={() => setConfig((prev) => ({ ...prev, customEndVerse: Math.max(prev.customStartVerse || 1, Math.min(286, prev.customEndVerse || 30)) }))}
                          className="w-full p-2 text-xs rounded-xl bg-[#15171E] border border-[#2A2D35] text-[#E2E2E2]"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 2. Jumlah Soal */}
            <div className="space-y-3 pt-4 border-t border-[#1F2128]">
              <label className="text-xs font-bold text-[#8A8D9A] uppercase tracking-wider block">
                2. Jumlah Soal Ujian
              </label>

              <div className="flex flex-wrap items-center gap-3">
                {[5, 10, 15, 20, 25, 30].map((num) => (
                  <button
                    key={num}
                    onClick={() => setConfig((prev) => ({ ...prev, questionCount: num }))}
                    className={`px-5 py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      config.questionCount === num
                        ? 'bg-[#D4AF37] text-[#0A0A0B] border-[#D4AF37] shadow-md shadow-[#D4AF37]/20'
                        : 'bg-[#0F1115] text-[#8A8D9A] border-[#2A2D35] hover:text-[#E2E2E2]'
                    }`}
                  >
                    {num} Soal
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Tingkat Kesulitan */}
            <div className="space-y-3 pt-4 border-t border-[#1F2128]">
              <label className="text-xs font-bold text-[#8A8D9A] uppercase tracking-wider flex items-center gap-2">
                <Sliders className="w-4 h-4 text-[#D4AF37]" />
                3. Tingkat Kesulitan
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { id: 'easy', label: 'Mudah', desc: 'Opsi berasal dari surah berbeda bila tersedia' },
                  { id: 'medium', label: 'Sedang', desc: 'Opsi diprioritaskan dari surah yang sama' },
                  { id: 'hard', label: 'Sulit', desc: 'Opsi dari surah sama dengan nomor ayat berdekatan' }
                ].map((difficulty) => {
                  const isSelected = config.difficulty === difficulty.id;
                  return (
                    <button
                      key={difficulty.id}
                      type="button"
                      onClick={() => setConfig((prev) => ({
                        ...prev,
                        difficulty: difficulty.id as ExamConfig['difficulty']
                      }))}
                      className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#1A1C23] border-[#D4AF37]/60 text-[#E2E2E2]'
                          : 'bg-[#0F1115] border-[#2A2D35] text-[#8A8D9A] hover:border-[#3A3D48]'
                      }`}
                    >
                      <span className="text-xs font-bold block">{difficulty.label}</span>
                      <span className="text-[10px] text-[#8A8D9A]">{difficulty.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 4. Tipe Variasi Soal */}
            <div className="space-y-3 pt-4 border-t border-[#1F2128]">
              <label className="text-xs font-bold text-[#8A8D9A] uppercase tracking-wider block">
                4. Tipe Tantangan / Variasi Soal
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { id: 'continue_verse', label: 'Sambung Potongan Ayat', desc: 'Melanjutkan penggalan ayat yang terpotong' },
                  { id: 'next_verse', label: 'Tebak Ayat Berikutnya', desc: 'Menyambung ayat N ke ayat N+1' },
                  { id: 'word_scramble', label: 'Susun Urutan Kata (Puzzle)', desc: 'Menyusun kembali kata-kata ayat yang teracak' },
                  { id: 'guess_surah', label: 'Tebak Nama Surah & Posisi', desc: 'Mengenali surah dari lantunan audio/teks' },
                  { id: 'fawasil_ending', label: 'Uji Fawasil / Akhir Ayat', desc: 'Menguji ketelitian akhir ayat (Mutasyabihat)' }
                ].map((typeItem) => {
                  const isChecked = config.allowedTypes.includes(typeItem.id as ExamQuestionType);
                  return (
                    <label
                      key={typeItem.id}
                      className={`p-3.5 rounded-2xl border flex items-start gap-3 cursor-pointer transition-all ${
                        isChecked
                          ? 'bg-[#1A1C23] border-[#D4AF37]/60 text-[#E2E2E2]'
                          : 'bg-[#0F1115] border-[#2A2D35] text-[#8A8D9A] opacity-60'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setConfig((prev) => ({ ...prev, allowedTypes: [...prev.allowedTypes, typeItem.id as any] }));
                          } else {
                            if (config.allowedTypes.length > 1) {
                              setConfig((prev) => ({
                                ...prev,
                                allowedTypes: prev.allowedTypes.filter((t) => t !== typeItem.id)
                              }));
                            }
                          }
                        }}
                        className="mt-0.5 accent-[#D4AF37] w-4 h-4 rounded cursor-pointer"
                      />
                      <div>
                        <span className="text-xs font-bold text-[#E2E2E2] block">{typeItem.label}</span>
                        <span className="text-[11px] text-[#8A8D9A]">{typeItem.desc}</span>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* 5. Timer & Audio Options */}
            <div className="space-y-3 pt-4 border-t border-[#1F2128]">
              <label className="text-xs font-bold text-[#8A8D9A] uppercase tracking-wider block">
                5. Batas Waktu & Bantuan Audio
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-[#8A8D9A] block mb-1.5">Timer Per Soal:</label>
                  <select
                    value={config.timerSecondsPerQuestion}
                    onChange={(e) => setConfig((prev) => ({ ...prev, timerSecondsPerQuestion: Number(e.target.value) }))}
                    className="w-full p-2.5 rounded-xl bg-[#0F1115] border border-[#2A2D35] text-[#E2E2E2] text-xs font-semibold focus:outline-none focus:border-[#D4AF37] cursor-pointer"
                  >
                    <option value={0}>♾️ Santai (Tanpa Batas Waktu)</option>
                    <option value={30}>⏱️ 30 Detik Per Soal (Standar)</option>
                    <option value={20}>⚡ 20 Detik Per Soal (Cepat)</option>
                    <option value={15}>🔥 15 Detik Per Soal (Tantangan Ekstrem)</option>
                  </select>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-[#0F1115] border border-[#2A2D35] self-end">
                  <div>
                    <span className="text-xs font-bold text-[#E2E2E2] block">Bantuan Audio Qari</span>
                    <span className="text-[10px] text-[#8A8D9A]">Putar suara murottal untuk soal tertentu</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.includeAudioPrompts}
                    onChange={(e) => setConfig((prev) => ({ ...prev, includeAudioPrompts: e.target.checked }))}
                    className="accent-[#D4AF37] w-4 h-4 cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Start Button */}
            <div className="pt-4 flex justify-end">
              <button
                onClick={handleStartExam}
                className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-[#D4AF37] text-[#0A0A0B] hover:bg-[#B8962D] font-bold text-sm shadow-xl shadow-[#D4AF37]/25 flex items-center justify-center gap-2 transition-transform active:scale-95 cursor-pointer"
              >
                <Play className="w-5 h-5 fill-current" />
                <span>Mulai Ujian Tahfidz Sekarang</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. LOADING STATE */}
      {viewState === 'loading' && (
        <div className="bg-[#15171E] rounded-3xl p-12 text-center border border-[#1F2128] space-y-4">
          <div className="w-12 h-12 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin mx-auto" />
          <h3 className="text-base font-bold text-[#E2E2E2]">
            Menyiapkan Lembar Soal Ujian...
          </h3>
          <p className="text-xs text-[#8A8D9A] max-w-sm mx-auto">
            Memilih ayat acak, menyusun opsi distractor tajwid, dan menguji database audio...
          </p>
        </div>
      )}

      {/* 3. ACTIVE EXAM ARENA */}
      {viewState === 'active' && questions[currentIndex] && (
        <div className="space-y-6">
          {/* Exam Header Bar */}
          <div className="bg-[#0F1115] rounded-3xl p-5 border border-[#1F2128] shadow-xl flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 rounded-xl bg-[#D4AF37] text-[#0A0A0B] font-extrabold text-xs">
                Soal {currentIndex + 1} / {questions.length}
              </span>
              <span className="text-xs font-semibold text-[#8A8D9A]">
                {questions[currentIndex].type === 'continue_verse' && 'Sambung Potongan Ayat'}
                {questions[currentIndex].type === 'next_verse' && 'Sambung Ayat Selanjutnya'}
                {questions[currentIndex].type === 'word_scramble' && 'Susun Urutan Kata'}
                {questions[currentIndex].type === 'guess_surah' && 'Tebak Surah & Posisi'}
                {questions[currentIndex].type === 'fawasil_ending' && 'Uji Akhiran Ayat (Fawasil)'}
              </span>
            </div>

            {/* Timer if enabled */}
            {config.timerSecondsPerQuestion > 0 && (
              <div className={`flex items-center gap-2 px-3 py-1 rounded-xl border text-xs font-bold font-mono ${
                timeLeft <= 5
                  ? 'bg-red-950/60 text-red-400 border-red-800 animate-pulse'
                  : 'bg-[#15171E] text-[#D4AF37] border-[#2A2D35]'
              }`}>
                <Clock className="w-3.5 h-3.5" />
                <span>00:{String(timeLeft).padStart(2, '0')}</span>
              </div>
            )}

            <button
              onClick={async () => {
                if (await confirmAction('Batalkan ujian dan kembali ke menu setup?')) {
                  setViewState('setup');
                }
              }}
              className="text-xs text-[#8A8D9A] hover:text-red-400 transition cursor-pointer"
            >
              Batalkan
            </button>
          </div>

          {/* Progress Line */}
          <div className="w-full bg-[#1F2128] h-2 rounded-full overflow-hidden">
            <div
              className="bg-[#D4AF37] h-full transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
            />
          </div>

          {/* Question Card */}
          <div className="bg-[#15171E] rounded-3xl p-6 sm:p-8 border border-[#1F2128] shadow-2xl space-y-6">
            {/* Question Text */}
            <div className="space-y-3">
              <h2 className="text-sm sm:text-base font-bold text-[#E2E2E2] leading-relaxed">
                {questions[currentIndex].questionText}
              </h2>

              {/* Arabic Prompt Box */}
              {questions[currentIndex].questionArabPrompt && (
                <div className="p-6 rounded-2xl bg-[#0F1115] border border-[#2A2D35] text-right space-y-3">
                  <p className="font-arabic font-bold text-2xl sm:text-3xl text-[#D4AF37] leading-loose" dir="rtl">
                    {questions[currentIndex].questionArabPrompt}
                  </p>

                  {/* Audio Prompt Player */}
                  {questions[currentIndex].audioPromptUrl && (
                    <div className="flex items-center justify-end pt-2">
                      <button
                        onClick={() => handlePlayPromptAudio(questions[currentIndex].audioPromptUrl)}
                        className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#15171E] text-[#D4AF37] border border-[#2A2D35] hover:bg-[#1A1C23] text-xs font-semibold transition cursor-pointer"
                      >
                        <Volume2 className={`w-4 h-4 ${isPlayingAudio ? 'animate-pulse' : ''}`} />
                        <span>{isPlayingAudio ? 'Jeda Audio' : 'Dengarkan Lantunan Ayat'}</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* INTERACTION A: Multiple Choice Options */}
            {questions[currentIndex].type !== 'word_scramble' && questions[currentIndex].options && (
              <div className="space-y-3 pt-2">
                {questions[currentIndex].options!.map((opt) => {
                  const isSelected = selectedOptionId === opt.id;
                  const isCorrect = opt.id === questions[currentIndex].correctOptionId;

                  let borderClass = 'border-[#2A2D35] bg-[#0F1115] text-[#E2E2E2] hover:border-[#3A3D48]';

                  if (hasSubmittedCurrent) {
                    if (isCorrect) {
                      borderClass = 'border-emerald-500 bg-emerald-950/30 text-emerald-300 ring-1 ring-emerald-500';
                    } else if (isSelected && !isCorrect) {
                      borderClass = 'border-red-500 bg-red-950/30 text-red-300 ring-1 ring-red-500';
                    }
                  } else if (isSelected) {
                    borderClass = 'border-[#D4AF37] bg-[#1A1C23] text-[#E2E2E2] ring-1 ring-[#D4AF37]/50 shadow-md';
                  }

                  return (
                    <button
                      key={opt.id}
                      disabled={hasSubmittedCurrent}
                      onClick={() => setSelectedOptionId(opt.id)}
                      className={`w-full p-3.5 sm:p-5 rounded-2xl border text-right transition-all flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2.5 cursor-pointer ${borderClass}`}
                    >
                      <div className="flex items-center gap-2 w-full sm:w-auto text-left">
                        <div
                          className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full border flex items-center justify-center text-xs font-bold shrink-0 ${
                            isSelected ? 'bg-[#D4AF37] text-[#0A0A0B] border-[#D4AF37]' : 'border-[#3A3D48] text-[#8A8D9A]'
                          }`}
                        >
                          {hasSubmittedCurrent && isCorrect ? '✓' : ''}
                        </div>
                        {opt.textIndonesia && (
                          <span className="text-xs text-[#8A8D9A] italic wrap-break-word">
                            {opt.textIndonesia}
                          </span>
                        )}
                      </div>

                      <p className="font-arabic font-bold text-lg sm:text-xl text-[#E2E2E2] dir-rtl leading-relaxed text-right w-full sm:w-auto">
                        {opt.textArab}
                      </p>
                    </button>
                  );
                })}
              </div>
            )}

            {/* INTERACTION B: Word Scramble / Puzzle */}
            {questions[currentIndex].type === 'word_scramble' && (
              <div className="space-y-5 pt-2">
                {/* Destination Drop Area / Arranged Words */}
                <div className="p-5 rounded-2xl bg-[#0F1115] border-2 border-dashed border-[#D4AF37]/40 min-h-22.5 flex flex-wrap flex-row-reverse items-center justify-start gap-2.5">
                  {arrangedSlots.length === 0 ? (
                    <p className="text-xs text-[#6A6D7A] text-center w-full py-3 italic">
                      Ketuk kata-kata di bawah untuk menyusun urutan ayat dari kanan ke kiri...
                    </p>
                  ) : (
                    arrangedSlots.map((w, idx) => (
                      <button
                        key={w.id}
                        disabled={hasSubmittedCurrent}
                        onClick={() => handleRemoveWord(w)}
                        className="px-3.5 py-2 rounded-xl bg-[#D4AF37] text-[#0A0A0B] font-arabic font-bold text-lg shadow-md hover:bg-red-400 hover:text-white transition cursor-pointer"
                        title="Klik untuk menghapus kata"
                      >
                        {w.word}
                      </button>
                    ))
                  )}
                </div>

                {/* Source Word Bank */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-[#8A8D9A]">
                      Pilihan Kata Tersedia:
                    </span>
                    {!hasSubmittedCurrent && arrangedSlots.length > 0 && (
                      <button
                        onClick={handleResetWords}
                        className="text-xs text-[#D4AF37] hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Reset Susunan</span>
                      </button>
                    )}
                  </div>

                  <div className="p-4 rounded-2xl bg-[#0F1115] border border-[#2A2D35] flex flex-wrap flex-row-reverse items-center justify-center gap-2.5">
                    {selectedWordBank.map((w) => (
                      <button
                        key={w.id}
                        disabled={hasSubmittedCurrent}
                        onClick={() => handlePickWord(w)}
                        className="px-4 py-2 rounded-xl bg-[#15171E] border border-[#2A2D35] text-[#E2E2E2] font-arabic font-bold text-lg hover:border-[#D4AF37] hover:text-[#D4AF37] hover:scale-105 transition active:scale-95 cursor-pointer shadow-sm"
                      >
                        {w.word}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Feedback & Explanation Box if Submitted */}
            {hasSubmittedCurrent && (
              <div
                className={`p-5 rounded-2xl border space-y-3 animate-fade-in ${
                  userAnswers[questions[currentIndex].id]?.isCorrect
                    ? 'bg-emerald-950/25 border-emerald-800 text-emerald-200'
                    : 'bg-red-950/25 border-red-800 text-red-200'
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-sm">
                  {userAnswers[questions[currentIndex].id]?.isCorrect ? (
                    <>
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      <span className="text-emerald-300">Mumtaz! Jawaban Anda Benar</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-5 h-5 text-red-400" />
                      <span className="text-red-300">Kurang Tepat, Perlu Dimuroja'ah</span>
                    </>
                  )}
                </div>

                <div className="p-4 rounded-xl bg-[#0F1115] border border-[#2A2D35] space-y-2">
                  <span className="text-xs font-bold text-[#D4AF37] block">
                    Kunci Ayat: QS. {questions[currentIndex].explanation.surahName} : {questions[currentIndex].explanation.verseNumber}
                  </span>
                  <p className="font-arabic text-xl font-bold text-[#E2E2E2] text-right dir-rtl leading-loose">
                    {questions[currentIndex].explanation.fullArab}
                  </p>
                  <p className="text-xs text-[#8A8D9A] italic">
                    "{questions[currentIndex].explanation.translation}"
                  </p>
                </div>
              </div>
            )}

            {/* Bottom Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-[#1F2128]">
              <span className="text-xs text-[#6A6D7A]">
                Ketuk tombol untuk konfirmasi
              </span>

              {!hasSubmittedCurrent ? (
                <button
                  disabled={
                    questions[currentIndex].type === 'word_scramble'
                      ? arrangedSlots.length === 0
                      : !selectedOptionId
                  }
                  onClick={() => handleSubmitAnswer(false)}
                  className="px-6 py-2.5 rounded-xl bg-[#D4AF37] text-[#0A0A0B] hover:bg-[#B8962D] disabled:opacity-40 disabled:cursor-not-allowed font-bold text-xs shadow-md transition cursor-pointer"
                >
                  Kirim Jawaban
                </button>
              ) : (
                <button
                  onClick={handleNextQuestion}
                  className="px-6 py-2.5 rounded-xl bg-[#D4AF37] text-[#0A0A0B] hover:bg-[#B8962D] font-bold text-xs shadow-md flex items-center gap-2 transition cursor-pointer"
                >
                  <span>{currentIndex < questions.length - 1 ? 'Soal Berikutnya' : 'Lihat Hasil Nilai'}</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 4. RESULT EVALUATION DASHBOARD */}
      {viewState === 'result' && latestResult && (
        <div className="space-y-6 animate-fade-in">
          {/* Score Header Card */}
          <div className="bg-[#0F1115] rounded-3xl p-8 border border-[#1F2128] text-center space-y-4 shadow-2xl relative overflow-hidden">
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-64 h-64 bg-[#D4AF37]/15 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1A1C23] text-[#D4AF37] text-xs font-semibold border border-[#2A2D35]">
                <Award className="w-4 h-4" />
                <span>Hasil Ikhtibar Tahfidz</span>
              </div>

              {/* Big Score Medal */}
              <div className="py-2">
                <span className="text-6xl sm:text-7xl font-extrabold text-[#D4AF37] font-serif-title tracking-tight">
                  {latestResult.score}
                </span>
                <span className="text-2xl text-[#8A8D9A] font-bold"> / 100</span>
              </div>

              {/* Grade Badge */}
              <div className="inline-block px-5 py-2 rounded-2xl bg-[#15171E] border border-[#2A2D35]">
                <span className={`text-base sm:text-lg font-bold ${latestResult.gradeColor}`}>
                  Predikat: {latestResult.grade}
                </span>
              </div>

              <p className="text-xs text-[#8A8D9A] max-w-md mx-auto">
                {latestResult.score >= 85
                  ? 'Alhamdulillah! Hafalan Anda sangat kuat dan lancar (Mutqin). Pertahankan dengan istiqomah muroja\'ah.'
                  : 'Bagus! Tetap semangat muroja\'ah dan perkuat ayat-ayat yang masih sering tertukar.'}
              </p>

              {/* Stats Overview */}
              <div className="grid grid-cols-3 gap-3 max-w-sm mx-auto pt-2">
                <div className="p-3 rounded-xl bg-[#15171E] border border-[#2A2D35]">
                  <span className="text-xs text-[#8A8D9A] block">Benar</span>
                  <strong className="text-sm font-bold text-emerald-400">{latestResult.correctCount} Soal</strong>
                </div>
                <div className="p-3 rounded-xl bg-[#15171E] border border-[#2A2D35]">
                  <span className="text-xs text-[#8A8D9A] block">Salah</span>
                  <strong className="text-sm font-bold text-red-400">{latestResult.wrongCount} Soal</strong>
                </div>
                <div className="p-3 rounded-xl bg-[#15171E] border border-[#2A2D35]">
                  <span className="text-xs text-[#8A8D9A] block">Waktu</span>
                  <strong className="text-sm font-bold text-[#E2E2E2]">{latestResult.totalTimeSeconds}s</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            {latestResult.wrongCount > 0 && (
              <button
                onClick={handleMarkAllWrongToHafalanTracker}
                className="px-4 py-2.5 rounded-xl bg-[#15171E] border border-amber-800 text-amber-300 hover:bg-amber-950/30 text-xs font-bold flex items-center gap-2 transition cursor-pointer"
              >
                <Brain className="w-4 h-4 text-amber-400" />
                <span>
                  {markedCount > 0
                    ? `✓ ${markedCount} Ayat Ditandai "Perlu Muroja'ah"`
                    : 'Tandai Ayat Salah ke Tracker Hafalan'}
                </span>
              </button>
            )}

            <div className="flex items-center gap-2 ml-auto">
              <button
                onClick={() => setViewState('setup')}
                className="px-5 py-2.5 rounded-xl bg-[#15171E] border border-[#2A2D35] hover:bg-[#1A1C23] text-xs font-bold text-[#E2E2E2] transition cursor-pointer"
              >
                Ganti Pengaturan
              </button>
              <button
                onClick={handleStartExam}
                className="px-6 py-2.5 rounded-xl bg-[#D4AF37] text-[#0A0A0B] hover:bg-[#B8962D] font-bold text-xs shadow-md transition cursor-pointer"
              >
                Ulangi Ujian Ini
              </button>
            </div>
          </div>

          {/* Detailed Question Review List */}
          <div className="bg-[#15171E] rounded-3xl p-6 sm:p-8 border border-[#1F2128] space-y-4 shadow-xl">
            <h3 className="text-sm font-bold text-[#E2E2E2] flex items-center gap-2 pb-3 border-b border-[#1F2128]">
              <CheckCircle2 className="w-4 h-4 text-[#D4AF37]" />
              <span>Rincian Evaluasi Jawaban ({latestResult.questions.length} Soal)</span>
            </h3>

            <div className="space-y-4">
              {latestResult.questions.map((q, idx) => {
                const ans = latestResult.userAnswers[q.id];
                const isCorrect = ans?.isCorrect || false;

                return (
                  <div
                    key={q.id}
                    className={`p-5 rounded-2xl border transition-all ${
                      isCorrect
                        ? 'bg-[#0F1115] border-emerald-900/40'
                        : 'bg-[#0F1115] border-red-900/40'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center ${
                            isCorrect ? 'bg-emerald-500 text-black' : 'bg-red-500 text-white'
                          }`}
                        >
                          {idx + 1}
                        </span>
                        <span className="text-xs font-bold text-[#E2E2E2]">
                          QS. {q.explanation.surahName} : {q.explanation.verseNumber}
                        </span>
                      </div>

                      <span
                        className={`text-xs font-bold ${
                          isCorrect ? 'text-emerald-400' : 'text-red-400'
                        }`}
                      >
                        {isCorrect ? 'Benar ✓' : 'Salah ✕'}
                      </span>
                    </div>

                    <p className="text-xs text-[#8A8D9A] mb-2">{q.questionText}</p>

                    {/* Arabic Verse Key */}
                    <div className="p-3.5 bg-[#15171E] rounded-xl border border-[#2A2D35] space-y-1 text-right">
                      <p className="font-arabic text-lg font-bold text-[#E2E2E2] dir-rtl">
                        {q.explanation.fullArab}
                      </p>
                      <p className="text-xs text-[#8A8D9A] text-left italic">
                        "{q.explanation.translation}"
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 5. EXAM HISTORY VIEW */}
      {viewState === 'history' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setViewState('setup')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#15171E] border border-[#2A2D35] text-xs font-bold text-[#E2E2E2] hover:bg-[#1A1C23] transition cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 text-[#D4AF37]" />
              <span>Kembali ke Pengaturan Ujian</span>
            </button>

            <span className="text-xs text-[#8A8D9A]">
              Tersimpan {examHistory.length} Sesi Ujian
            </span>
          </div>

          <div className="bg-[#15171E] rounded-3xl p-6 sm:p-8 border border-[#1F2128] space-y-4 shadow-2xl">
            <h2 className="text-base font-bold text-[#E2E2E2] flex items-center gap-2 pb-3 border-b border-[#1F2128] font-serif-title">
              <History className="w-5 h-5 text-[#D4AF37]" />
              <span>Riwayat Hasil Ujian Tahfidz</span>
            </h2>

            {examHistory.length === 0 ? (
              <div className="text-center py-12 text-[#8A8D9A] space-y-2">
                <GraduationCap className="w-8 h-8 text-[#D4AF37] mx-auto opacity-50" />
                <p className="text-xs">Belum ada riwayat ujian yang tersimpan.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {examHistory.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 rounded-2xl bg-[#0F1115] border border-[#2A2D35] flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-sm text-[#E2E2E2]">
                          {item.config.scopeType === 'juz_range' && `Rentang Juz ${item.config.startJuzNumber || 1} - ${item.config.endJuzNumber || 5}`}
                          {item.config.scopeType === 'juz' && `Juz ${item.config.selectedJuzNumber}`}
                          {item.config.scopeType === 'juz_amma' && 'Juz 30 (Juz \'Amma)'}
                          {item.config.scopeType === 'popular_surahs' && 'Surah Populer'}
                          {item.config.scopeType === 'single_surah' && `Surah Ke-${item.config.selectedSurahNumber}`}
                          {item.config.scopeType === 'custom_range' && `Surah Ke-${item.config.selectedSurahNumber} (${item.config.customStartVerse}-${item.config.customEndVerse})`}
                        </span>
                        <span className="text-[10px] text-[#8A8D9A]">
                          • {new Date(item.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <div className="text-xs text-[#8A8D9A] flex items-center gap-3">
                        <span>{item.totalQuestions} Soal</span>
                        <span className="text-emerald-400">{item.correctCount} Benar</span>
                        <span className="text-red-400">{item.wrongCount} Salah</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <span className="text-xl font-bold text-[#D4AF37] block font-serif-title">
                          {item.score} / 100
                        </span>
                        <span className={`text-[11px] font-bold ${item.gradeColor}`}>
                          {item.grade}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
