import React, { useState, useEffect } from 'react';
import { SurahDetail, Verse, HafalanVerseRecord, UserSettings, AudioPlaybackState } from '../types';
import { ALL_SURAHS } from '../data/surahList';
import { MushafArabicText, toArabicNumerals } from './MushafArabicText';
import {
  Brain,
  Play,
  Pause,
  Eye,
  EyeOff,
  Mic,
  Sliders,
  FileText,
  X
} from 'lucide-react';


export const formatInitialHint = (text: string) => {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length > 1) return `${words[0]}...`;

  const firstLetterWithMarks = words[0]?.match(/^.[\u064B-\u065F\u0670\u06D6-\u06ED]*/u)?.[0];
  return firstLetterWithMarks ? `${firstLetterWithMarks}...` : '';
};


interface HafalanModeViewProps {
  currentSurah: SurahDetail | null;
  onSelectSurah: (surahNumber: number) => void;
  settings: UserSettings;
  hafalanRecords: Record<string, HafalanVerseRecord>;
  onUpdateHafalanStatus: (verseNumber: number, status: HafalanVerseRecord['status']) => void;
  playbackState: AudioPlaybackState;
  onPlayRangeAudio: (startVerse: number, endVerse: number, repeatCount: number) => void;
  onPauseAudio: () => void;
  activePlayingVerse: number | null;
  onOpenVoiceRecorder: (verseNumber: number) => void;
}

export const HafalanModeView: React.FC<HafalanModeViewProps> = ({
  currentSurah,
  onSelectSurah,
  settings,
  hafalanRecords,
  onUpdateHafalanStatus,
  playbackState,
  onPlayRangeAudio,
  onPauseAudio,
  activePlayingVerse,
  onOpenVoiceRecorder
}) => {
  const [selectedSurahNumber, setSelectedSurahNumber] = useState<number>(currentSurah?.nomor || 67); // Default Al-Mulk
  const [startVerse, setStartVerse] = useState<number>(1);
  const [endVerse, setEndVerse] = useState<number>(5);
  const [repeatPerVerse, setRepeatPerVerse] = useState<number>(3);
  const [maskType, setMaskType] = useState<'none' | 'blur_all' | 'first_letters'>('none');
  const [revealedVerses, setRevealedVerses] = useState<Record<number, boolean>>({});
  const [selectedVerseNumber, setSelectedVerseNumber] = useState<number | null>(null);

  useEffect(() => {
    if (currentSurah) {
      setSelectedSurahNumber(currentSurah.nomor);
      setStartVerse(1);
      setEndVerse(Math.min(5, currentSurah.jumlahAyat));
      setSelectedVerseNumber(null);
      setRevealedVerses({});
    }
  }, [currentSurah?.nomor]);

  const handleSurahChange = (num: number) => {
    setSelectedSurahNumber(num);
    onSelectSurah(num);
  };

  const handleStartVerseChange = (v: number) => {
    const val = Math.max(1, Math.min(v, currentSurah?.jumlahAyat || 286));
    setStartVerse(val);
    if (val > endVerse) setEndVerse(val);
  };

  const handleEndVerseChange = (v: number) => {
    const val = Math.max(startVerse, Math.min(v, currentSurah?.jumlahAyat || 286));
    setEndVerse(val);
  };

  const toggleVerseReveal = (verseNum: number) => {
    setRevealedVerses((prev) => {
      const current = prev[verseNum] ?? maskType === 'none';
      return { ...prev, [verseNum]: !current };
    });
  };


  const filteredVerses = currentSurah
    ? currentSurah.ayat.filter((v) => v.nomorAyat >= startVerse && v.nomorAyat <= endVerse)
    : [];
  const selectedVerse = filteredVerses.find((verse) => verse.nomorAyat === selectedVerseNumber) ?? null;
  const selectedHafalanRecord = selectedVerse
    ? hafalanRecords[`${selectedSurahNumber}_${selectedVerse.nomorAyat}`]
    : null;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-28">
      {/* Top Header Card */}
      <div className="bg-[#0F1115] text-[#E2E2E2] rounded-3xl p-6 sm:p-8 shadow-2xl border border-[#1F2128] relative overflow-hidden">
        {/* Decorative Gold Glow */}
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1A1C23] text-[#D4AF37] text-xs font-semibold border border-[#2A2D35]">
              <Brain className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>Workspace Tahfidz & Muroja'ah</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#D4AF37] font-serif-title">
              Mode Hafalan Khusus
            </h1>
            <p className="text-xs sm:text-sm text-[#8A8D9A] max-w-xl">
              Gunakan fitur perulangan audio (looping), penutup teks (masking), dan perekam suara hafalan untuk menguji kekuatan memori Al-Quran Anda.
            </p>
          </div>

          {/* Quick Preset Buttons */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => {
                setMaskType('none');
                setRevealedVerses({});
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer border ${
                maskType === 'none'
                  ? 'bg-[#D4AF37] text-[#0A0A0B] border-[#D4AF37] font-bold shadow-md'
                  : 'bg-[#15171E] text-[#8A8D9A] border-[#2A2D35] hover:text-[#E2E2E2]'
              }`}
            >
              👁️ Buka Teks
            </button>
            <button
              onClick={() => {
                setMaskType('blur_all');
                setRevealedVerses({});
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer border ${
                maskType === 'blur_all'
                  ? 'bg-[#D4AF37] text-[#0A0A0B] border-[#D4AF37] font-bold shadow-md'
                  : 'bg-[#15171E] text-[#8A8D9A] border-[#2A2D35] hover:text-[#E2E2E2]'
              }`}
            >
              🙈 Tutup Teks
            </button>
            <button
              onClick={() => {
                setMaskType('first_letters');
                setRevealedVerses({});
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer border ${
                maskType === 'first_letters'
                  ? 'bg-[#D4AF37] text-[#0A0A0B] border-[#D4AF37] font-bold shadow-md'
                  : 'bg-[#15171E] text-[#8A8D9A] border-[#2A2D35] hover:text-[#E2E2E2]'
              }`}
            >
              🔤 Inisial Kata
            </button>
          </div>
        </div>
      </div>

      {/* Control Panel Settings Box */}
      <div className="bg-[#15171E] rounded-3xl p-5 sm:p-6 border border-[#1F2128] shadow-md space-y-4">
        <h2 className="text-sm font-bold text-[#E2E2E2] flex items-center gap-2">
          <Sliders className="w-4 h-4 text-[#D4AF37]" />
          <span>Pengaturan Target Hafalan</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Select Surah */}
          <div>
            <label className="block text-xs font-semibold text-[#8A8D9A] mb-1">
              Pilih Surah:
            </label>
            <select
              value={selectedSurahNumber}
              onChange={(e) => handleSurahChange(Number(e.target.value))}
              className="w-full px-3 py-2 text-xs rounded-xl bg-[#0F1115] border border-[#2A2D35] font-medium text-[#E2E2E2] focus:outline-none focus:border-[#D4AF37]"
            >
              {ALL_SURAHS.map((s) => (
                <option key={s.nomor} value={s.nomor}>
                  {s.nomor}. {s.namaLatin} ({s.jumlahAyat} ayat)
                </option>
              ))}
            </select>
          </div>

          {/* Start Verse */}
          <div>
            <label className="block text-xs font-semibold text-[#8A8D9A] mb-1">
              Dari Ayat:
            </label>
            <input
              type="number"
              min={1}
              max={currentSurah?.jumlahAyat || 286}
              value={startVerse}
              onChange={(e) => handleStartVerseChange(Number(e.target.value))}
              className="w-full px-3 py-2 text-xs rounded-xl bg-[#0F1115] border border-[#2A2D35] font-medium text-[#E2E2E2] focus:outline-none focus:border-[#D4AF37]"
            />
          </div>

          {/* End Verse */}
          <div>
            <label className="block text-xs font-semibold text-[#8A8D9A] mb-1">
              Sampai Ayat:
            </label>
            <input
              type="number"
              min={startVerse}
              max={currentSurah?.jumlahAyat || 286}
              value={endVerse}
              onChange={(e) => handleEndVerseChange(Number(e.target.value))}
              className="w-full px-3 py-2 text-xs rounded-xl bg-[#0F1115] border border-[#2A2D35] font-medium text-[#E2E2E2] focus:outline-none focus:border-[#D4AF37]"
            />
          </div>

          {/* Repeat Loop Count */}
          <div>
            <label className="block text-xs font-semibold text-[#8A8D9A] mb-1">
              Perulangan Audio (Looping):
            </label>
            <select
              value={repeatPerVerse}
              onChange={(e) => setRepeatPerVerse(Number(e.target.value))}
              className="w-full px-3 py-2 text-xs rounded-xl bg-[#0F1115] border border-[#2A2D35] font-medium text-[#E2E2E2] focus:outline-none focus:border-[#D4AF37]"
            >
              <option value={1}>1x Putar</option>
              <option value={3}>3x Ulang per Ayat</option>
              <option value={5}>5x Ulang per Ayat</option>
              <option value={10}>10x Ulang per Ayat</option>
              <option value={20}>20x Ulang (Intensif Tahfidz)</option>
            </select>
          </div>
        </div>

        {/* Master Play Button for Range Looping */}
        <div className="pt-2 flex items-center justify-between border-t border-[#1F2128]">
          <p className="text-xs text-[#8A8D9A]">
            Target: <strong className="text-[#D4AF37]">{currentSurah?.namaLatin} Ayat {startVerse} - {endVerse}</strong> ({filteredVerses.length} ayat)
          </p>

          <button
            onClick={() => {
              if (playbackState.isPlaying) {
                onPauseAudio();
              } else {
                onPlayRangeAudio(startVerse, endVerse, repeatPerVerse);
              }
            }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#D4AF37] text-[#0A0A0B] font-bold text-xs sm:text-sm hover:bg-[#B8962D] shadow-lg shadow-[#D4AF37]/20 transition cursor-pointer"
          >
            {playbackState.isPlaying ? (
              <>
                <Pause className="w-4 h-4 fill-current" />
                <span>Hentikan Audio</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>Mulai Looping Hafalan ({repeatPerVerse}x)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Quran reading area */}
      {settings.hafalanDisplayMode === 'mushaf' ? (
      <section className="mushaf-page overflow-hidden rounded-4xl border shadow-2xl shadow-black/10 transition-colors duration-300">
        <div className="mushaf-header border-b px-5 py-5 text-center transition-colors duration-300 sm:px-10">
          <div className="mushaf-ornament mx-auto flex max-w-2xl items-center gap-4">
            <span className="mushaf-ornament-line h-px flex-1" />
            <span className="text-lg">۞</span>
            <span className="mushaf-ornament-line h-px flex-1" />
          </div>
          <h2 className="mushaf-title font-arabic text-4xl font-bold leading-relaxed sm:text-5xl" dir="rtl">
            {currentSurah?.nama}
          </h2>
          <p className="mushaf-meta text-xs font-semibold uppercase tracking-[0.22em]">
            {currentSurah?.namaLatin} · {currentSurah?.arti}
          </p>
          <p className="mushaf-hint mt-1 text-[11px]">
            Ayat {startVerse}–{endVerse} · Klik ayat untuk melihat latin dan arti
          </p>
        </div>

        <div className="relative px-5 py-8 sm:px-10 sm:py-12">
          <div className="mushaf-frame pointer-events-none absolute inset-3 rounded-[1.35rem] border" />

          {currentSurah && startVerse === 1 && currentSurah.nomor !== 1 && currentSurah.nomor !== 9 && (
            <p className="mushaf-bismillah relative mb-5 text-center font-arabic text-3xl font-semibold leading-loose sm:text-4xl" dir="rtl">
              بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
            </p>
          )}

          <div
            className="mushaf-text relative text-justify font-arabic font-semibold leading-[2.35] sm:leading-[2.5]"
            style={{ fontSize: `${settings.arabicFontSize}px` }}
            dir="rtl"
            lang="ar"
          >
            {filteredVerses.map((verse) => {
              const isCurrentPlaying = activePlayingVerse === verse.nomorAyat && playbackState.isPlaying;
              const isSelected = selectedVerseNumber === verse.nomorAyat;
              const isRevealed = revealedVerses[verse.nomorAyat] ?? maskType === 'none';
              const displayedText = !isRevealed && maskType === 'first_letters'
                ? formatInitialHint(verse.teksArab)
                : verse.teksArab;

              return (
                <span
                  key={verse.nomorAyat}
                  role="button"
                  tabIndex={0}
                  aria-label={`Ayat ${verse.nomorAyat}. Klik untuk melihat latin dan arti`}
                  aria-pressed={isSelected}
                  onClick={() => setSelectedVerseNumber(verse.nomorAyat)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      setSelectedVerseNumber(verse.nomorAyat);
                    }
                  }}
                  className={`box-decoration-clone cursor-pointer rounded-lg px-1 transition-all outline-none focus-visible:ring-2 focus-visible:ring-[#B8860B] ${
                    isCurrentPlaying
                      ? 'bg-[#D4AF37]/30 shadow-[0_0_0_2px_rgba(184,134,11,0.2)]'
                      : isSelected
                        ? 'bg-[#D4AF37]/18'
                        : 'hover:bg-[#D4AF37]/10'
                  } ${!isRevealed && maskType === 'blur_all' ? 'select-none blur-[6px]' : ''}`}
                >
                  <MushafArabicText
                    text={displayedText}
                    enableTajwid={isRevealed && (settings.enableColoredTajwid ?? true)}
                  />{' '}
                  <span className="mushaf-verse-number whitespace-nowrap font-arabic font-bold" aria-hidden="true">
                    ﴿{toArabicNumerals(verse.nomorAyat)}﴾
                  </span>{' '}
                </span>
              );
            })}
          </div>
        </div>
      </section>
      ) : (
        <section className="space-y-4" aria-label="Daftar ayat hafalan">
          {filteredVerses.map((verse) => {
            const record = hafalanRecords[`${selectedSurahNumber}_${verse.nomorAyat}`];
            const isCurrentPlaying = activePlayingVerse === verse.nomorAyat && playbackState.isPlaying;
            const isRevealed = revealedVerses[verse.nomorAyat] ?? maskType === 'none';
            const displayedText = !isRevealed && maskType === 'first_letters'
              ? formatInitialHint(verse.teksArab)
              : verse.teksArab;

            return (
              <article
                key={verse.nomorAyat}
                className={`rounded-3xl border bg-[#15171E] p-5 transition sm:p-7 ${
                  isCurrentPlaying ? 'border-[#D4AF37] ring-1 ring-[#D4AF37]/40' : 'border-[#1F2128]'
                }`}
              >
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-[#2A2D35] pb-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#D4AF37]/40 bg-[#0F1115] text-sm font-bold text-[#D4AF37]">
                      {verse.nomorAyat}
                    </span>
                    <select
                      value={record?.status || 'not_started'}
                      onChange={(event) => onUpdateHafalanStatus(verse.nomorAyat, event.target.value as HafalanVerseRecord['status'])}
                      className="rounded-full border border-[#2A2D35] bg-[#0F1115] px-2.5 py-1 text-xs font-semibold text-[#8A8D9A] outline-none focus:border-[#D4AF37]"
                      aria-label={`Status hafalan ayat ${verse.nomorAyat}`}
                    >
                      <option value="not_started">⚪ Belum Dihafal</option>
                      <option value="in_progress">🔵 Sedang Dihafal</option>
                      <option value="review_needed">🟠 Perlu Muroja'ah</option>
                      <option value="memorized">🟢 Mutqin (Lancar)</option>
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => isCurrentPlaying ? onPauseAudio() : onPlayRangeAudio(verse.nomorAyat, verse.nomorAyat, repeatPerVerse)}
                      className={`rounded-xl border p-2 transition ${isCurrentPlaying ? 'border-[#D4AF37] bg-[#D4AF37] text-[#0A0A0B]' : 'border-[#2A2D35] bg-[#0F1115] text-[#D4AF37]'}`}
                      aria-label={isCurrentPlaying ? `Jeda ayat ${verse.nomorAyat}` : `Putar ayat ${verse.nomorAyat}`}
                    >
                      {isCurrentPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </button>
                    <button
                      onClick={() => toggleVerseReveal(verse.nomorAyat)}
                      className="rounded-xl border border-[#2A2D35] bg-[#0F1115] p-2 text-[#D4AF37]"
                      aria-label={isRevealed ? `Tutup teks ayat ${verse.nomorAyat}` : `Buka teks ayat ${verse.nomorAyat}`}
                    >
                      {isRevealed ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                    <button
                      onClick={() => onOpenVoiceRecorder(verse.nomorAyat)}
                      className="rounded-xl border border-[#2A2D35] bg-[#0F1115] p-2 text-[#D4AF37]"
                      aria-label={`Rekam hafalan ayat ${verse.nomorAyat}`}
                    >
                      <Mic className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div
                  className={`text-right font-arabic font-bold leading-loose text-[#E2E2E2] ${!isRevealed && maskType === 'blur_all' ? 'select-none blur-[6px]' : ''}`}
                  style={{ fontSize: `${settings.arabicFontSize}px` }}
                  dir="rtl"
                >
                  <MushafArabicText text={displayedText} enableTajwid={isRevealed && (settings.enableColoredTajwid ?? true)} />
                </div>
                {settings.showLatin && verse.teksLatin && (
                  <p className="mt-4 italic leading-relaxed text-[#D4AF37]" style={{ fontSize: `${settings.latinFontSize}px` }}>
                    {verse.teksLatin}
                  </p>
                )}
                {settings.showTranslation && verse.teksIndonesia && (
                  <p className="mt-2 text-sm leading-relaxed text-[#8A8D9A]">{verse.teksIndonesia}</p>
                )}
              </article>
            );
          })}
        </section>
      )}

      {settings.hafalanDisplayMode === 'mushaf' && selectedVerse && (
        <section
          className="rounded-3xl border border-[#D4AF37]/35 bg-[#15171E] p-5 shadow-xl sm:p-6"
          aria-label={`Detail ayat ${selectedVerse.nomorAyat}`}
        >
          <div className="mb-4 flex items-start justify-between gap-4 border-b border-[#2A2D35] pb-4">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#D4AF37]/40 bg-[#D4AF37]/10 font-bold text-[#D4AF37]">
                {selectedVerse.nomorAyat}
              </span>
              <div>
                <h3 className="flex items-center gap-2 font-bold text-[#E2E2E2]">
                  <FileText className="h-4 w-4 text-[#D4AF37]" />
                  Detail Ayat
                </h3>
                <p className="text-xs text-[#8A8D9A]">Latin, arti, dan kontrol hafalan</p>
              </div>
            </div>
            <button
              onClick={() => setSelectedVerseNumber(null)}
              className="rounded-xl border border-[#2A2D35] p-2 text-[#8A8D9A] transition hover:bg-[#1A1C23] hover:text-[#E2E2E2]"
              aria-label="Tutup detail ayat"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-3">
            <p className="italic leading-relaxed text-[#D4AF37]" style={{ fontSize: `${settings.latinFontSize}px` }}>
              {selectedVerse.teksLatin}
            </p>
            <p className="text-sm leading-relaxed text-[#B5B8C2]">{selectedVerse.teksIndonesia}</p>
          </div>

          <div className="mt-5 flex flex-col gap-3 border-t border-[#2A2D35] pt-4 sm:flex-row sm:items-center sm:justify-between">
            <select
              value={selectedHafalanRecord?.status || 'not_started'}
              onChange={(event) =>
                onUpdateHafalanStatus(
                  selectedVerse.nomorAyat,
                  event.target.value as HafalanVerseRecord['status']
                )
              }
              className="rounded-xl border border-[#2A2D35] bg-[#0F1115] px-3 py-2 text-xs font-semibold text-[#E2E2E2] outline-none focus:border-[#D4AF37]"
              aria-label={`Status hafalan ayat ${selectedVerse.nomorAyat}`}
            >
              <option value="not_started">⚪ Belum Dihafal</option>
              <option value="in_progress">🔵 Sedang Dihafal</option>
              <option value="review_needed">🟠 Perlu Muroja'ah</option>
              <option value="memorized">🟢 Mutqin (Lancar)</option>
            </select>

            <div className="flex gap-2">
              <button
                onClick={() => toggleVerseReveal(selectedVerse.nomorAyat)}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-[#2A2D35] bg-[#0F1115] px-3 py-2 text-xs font-semibold text-[#E2E2E2] transition hover:border-[#D4AF37]/60 sm:flex-none"
              >
                {(revealedVerses[selectedVerse.nomorAyat] ?? maskType === 'none') ? (
                  <EyeOff className="h-4 w-4 text-[#D4AF37]" />
                ) : (
                  <Eye className="h-4 w-4 text-[#D4AF37]" />
                )}
                {(revealedVerses[selectedVerse.nomorAyat] ?? maskType === 'none') ? 'Tutup Teks' : 'Buka Teks'}
              </button>
              <button
                onClick={() => onOpenVoiceRecorder(selectedVerse.nomorAyat)}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#D4AF37] px-3 py-2 text-xs font-bold text-[#0A0A0B] transition hover:bg-[#B8962D] sm:flex-none"
              >
                <Mic className="h-4 w-4" />
                Rekam Hafalan
              </button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};
