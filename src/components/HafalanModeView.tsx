import React, { useState, useEffect } from 'react';
import { SurahDetail, Verse, HafalanVerseRecord, UserSettings, AudioPlaybackState } from '../types';
import { ALL_SURAHS } from '../data/surahList';
import { ColoredArabicVerse } from './ColoredArabicVerse';
import {
  Brain,
  Play,
  Pause,
  RotateCcw,
  Eye,
  EyeOff,
  Mic,
  Square,
  Volume2,
  CheckCircle2,
  Sliders,
  Sparkles,
  HelpCircle,
  FileText
} from 'lucide-react';

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

  useEffect(() => {
    if (currentSurah) {
      setSelectedSurahNumber(currentSurah.nomor);
      setStartVerse(1);
      setEndVerse(Math.min(5, currentSurah.jumlahAyat));
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
    setRevealedVerses((prev) => ({ ...prev, [verseNum]: !prev[verseNum] }));
  };

  // Helper to convert verse text to first letters for memory prompting
  const formatFirstLetters = (text: string) => {
    return text
      .split(' ')
      .map((word) => (word.length > 0 ? word[0] + '...' : ''))
      .join(' ');
  };

  const filteredVerses = currentSurah
    ? currentSurah.ayat.filter((v) => v.nomorAyat >= startVerse && v.nomorAyat <= endVerse)
    : [];

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

      {/* Verses Cards in Hafalan Workspace */}
      <div className="space-y-4">
        {filteredVerses.map((verse) => {
          const isCurrentPlaying = activePlayingVerse === verse.nomorAyat && playbackState.isPlaying;
          const isRevealed = revealedVerses[verse.nomorAyat] || false;
          const hafalanRecord = hafalanRecords[`${selectedSurahNumber}_${verse.nomorAyat}`];

          return (
            <div
              key={verse.nomorAyat}
              className={`bg-[#15171E] rounded-3xl p-5 sm:p-6 border transition-all ${
                isCurrentPlaying
                  ? 'border-[#D4AF37] ring-1 ring-[#D4AF37]/30 bg-[#1A1C23] shadow-xl'
                  : 'border-[#1F2128]'
              }`}
            >
              {/* Header inside Card */}
              <div className="flex items-center justify-between gap-3 pb-3 mb-3 border-b border-[#1F2128]">
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-lg bg-[#0F1115] text-[#D4AF37] border border-[#2A2D35] font-bold text-xs flex items-center justify-center">
                    {verse.nomorAyat}
                  </span>
                  <span className="text-xs font-medium text-[#8A8D9A]">
                    Ayat {verse.nomorAyat}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {/* Status Toggle Selector */}
                  <select
                    value={hafalanRecord?.status || 'not_started'}
                    onChange={(e) =>
                      onUpdateHafalanStatus(
                        verse.nomorAyat,
                        e.target.value as HafalanVerseRecord['status']
                      )
                    }
                    className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#0F1115] text-[#8A8D9A] border border-[#2A2D35] focus:outline-none focus:border-[#D4AF37] cursor-pointer transition-colors"
                  >
                    <option value="not_started">⚪ Belum Dihafal</option>
                    <option value="in_progress">🔵 Sedang Dihafal</option>
                    <option value="review_needed">🟠 Perlu Muroja'ah</option>
                    <option value="memorized">🟢 Mutqin (Lancar)</option>
                  </select>

                  {/* Record voice button */}
                  <button
                    onClick={() => onOpenVoiceRecorder(verse.nomorAyat)}
                    className="p-2 rounded-xl bg-[#0F1115] text-[#D4AF37] border border-[#2A2D35] hover:bg-[#1A1C23] transition cursor-pointer"
                    title="Rekam Suara Hafalan"
                  >
                    <Mic className="w-4 h-4" />
                  </button>

                  {/* Toggle Reveal Text button */}
                  <button
                    onClick={() => toggleVerseReveal(verse.nomorAyat)}
                    className="p-2 rounded-xl bg-[#0F1115] text-[#8A8D9A] border border-[#2A2D35] hover:text-[#E2E2E2] hover:bg-[#1A1C23] transition cursor-pointer"
                    title="Tampilkan / Sembunyikan Teks"
                  >
                    {isRevealed || maskType === 'none' ? (
                      <Eye className="w-4 h-4 text-[#D4AF37]" />
                    ) : (
                      <EyeOff className="w-4 h-4 text-[#8A8D9A]" />
                    )}
                  </button>
                </div>
              </div>

              {/* Text Render according to Masking Mode */}
              <div className="py-2 text-right">
                {maskType === 'blur_all' && !isRevealed ? (
                  <div
                    onClick={() => toggleVerseReveal(verse.nomorAyat)}
                    className="p-5 rounded-2xl bg-[#0F1115] border-2 border-dashed border-[#D4AF37]/50 text-center cursor-pointer hover:bg-[#1A1C23] transition"
                  >
                    <p className="text-xs font-bold text-[#D4AF37]">
                      🙈 Teks Arab Tersembunyi (Klik untuk melihat)
                    </p>
                  </div>
                ) : maskType === 'first_letters' && !isRevealed ? (
                  <p
                    className="font-arabic font-bold text-[#D4AF37] leading-loose tracking-widest text-2xl"
                    dir="rtl"
                  >
                    {formatFirstLetters(verse.teksArab)}
                  </p>
                ) : (
                  <ColoredArabicVerse
                    arabicText={verse.teksArab}
                    fontSize={settings.arabicFontSize}
                    enableTajwid={settings.enableColoredTajwid ?? true}
                  />
                )}
              </div>

              {/* Translation */}
              {(isRevealed || maskType === 'none') && verse.teksIndonesia && (
                <p className="text-xs text-[#8A8D9A] pt-2 border-t border-[#1F2128] mt-2">
                  {verse.teksIndonesia}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
