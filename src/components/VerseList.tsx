import React, { useState } from 'react';
import { SurahDetail, Verse, UserSettings, HafalanVerseRecord, AudioPlaybackState } from '../types';
import { ColoredArabicVerse } from './ColoredArabicVerse';
import {
  Play,
  Pause,
  Bookmark as BookmarkIcon,
  RotateCcw,
  Volume2,
  Brain,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Mic,
  Share2,
  Copy,
  Check,
  Scroll
} from 'lucide-react';

interface VerseListProps {
  surahDetail: SurahDetail;
  settings: UserSettings;
  playbackState: AudioPlaybackState;
  onPlayVerse: (verseNumber: number) => void;
  onPauseAudio: () => void;
  onToggleBookmark: (verse: Verse, note?: string) => void;
  isBookmarked: (verseNumber: number) => boolean;
  hafalanRecords: Record<string, HafalanVerseRecord>;
  onUpdateHafalanStatus: (verseNumber: number, status: HafalanVerseRecord['status']) => void;
  onOpenHafalanModeForVerse: (verseNumber: number) => void;
  onOpenVoiceRecorder: (verseNumber: number) => void;
  onNavigateSurah: (surahNumber: number) => void;
  activePlayingVerse: number | null;
}

export const VerseList: React.FC<VerseListProps> = ({
  surahDetail,
  settings,
  playbackState,
  onPlayVerse,
  onPauseAudio,
  onToggleBookmark,
  isBookmarked,
  hafalanRecords,
  onUpdateHafalanStatus,
  onOpenHafalanModeForVerse,
  onOpenVoiceRecorder,
  onNavigateSurah,
  activePlayingVerse
}) => {
  const [bookmarkNoteModalVerse, setBookmarkNoteModalVerse] = useState<Verse | null>(null);
  const [noteInput, setNoteInput] = useState('');
  const [copiedVerseNum, setCopiedVerseNum] = useState<number | null>(null);
  const [maskedVerses, setMaskedVerses] = useState<Record<number, boolean>>({});

  const handleBookmarkClick = (verse: Verse) => {
    if (isBookmarked(verse.nomorAyat)) {
      onToggleBookmark(verse);
    } else {
      setBookmarkNoteModalVerse(verse);
      setNoteInput('');
    }
  };

  const saveBookmarkWithNote = () => {
    if (bookmarkNoteModalVerse) {
      onToggleBookmark(bookmarkNoteModalVerse, noteInput.trim() || undefined);
      setBookmarkNoteModalVerse(null);
    }
  };

  const copyVerseToClipboard = (verse: Verse) => {
    const textToCopy = `${verse.teksArab}\n\n"${verse.teksIndonesia}"\n(QS. ${surahDetail.namaLatin}: ${verse.nomorAyat})`;
    navigator.clipboard.writeText(textToCopy);
    setCopiedVerseNum(verse.nomorAyat);
    setTimeout(() => setCopiedVerseNum(null), 2000);
  };

  const toggleVerseMasking = (verseNum: number) => {
    setMaskedVerses((prev) => ({
      ...prev,
      [verseNum]: !prev[verseNum]
    }));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-28">
      {/* Top Surah Banner */}
      <div className="bg-[#0F1115] text-[#E2E2E2] rounded-3xl p-6 sm:p-8 shadow-2xl border border-[#1F2128] relative overflow-hidden">
        {/* Decorative Gold Glow Background Pattern */}
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-10 -top-10 w-48 h-48 bg-[#D4AF37]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1A1C23] text-[#D4AF37] text-xs font-medium border border-[#2A2D35]">
            Surah Ke-{surahDetail.nomor} • {surahDetail.tempatTurun} • {surahDetail.jumlahAyat} Ayat
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#D4AF37] font-serif-title">
            {surahDetail.namaLatin}
          </h1>

          <p className="text-[#8A8D9A] text-sm max-w-lg mx-auto italic">
            "{surahDetail.arti}"
          </p>

          <div className="pt-2 font-arabic text-3xl text-[#D4AF37]">
            {surahDetail.nama}
          </div>

          {/* Bismillah Frame */}
          {surahDetail.nomor !== 9 && (
            <div className="pt-4 pb-1">
              <div className="inline-block py-2 px-6 rounded-2xl bg-[#15171E] border border-[#2A2D35]">
                <span className="font-arabic text-2xl sm:text-3xl text-[#D4AF37] tracking-wide">
                  بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
                </span>
              </div>
            </div>
          )}

          {/* Quick Actions Header */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-3">
            <button
              onClick={() => onPlayVerse(1)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#D4AF37] text-[#0A0A0B] hover:bg-[#B8962D] font-bold text-xs sm:text-sm shadow-lg shadow-[#D4AF37]/20 transition-transform active:scale-95 cursor-pointer"
            >
              <Volume2 className="w-4 h-4" />
              <span>Putar Surah Dari Ayat 1</span>
            </button>

            <button
              onClick={() => onOpenHafalanModeForVerse(1)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#15171E] hover:bg-[#1A1C23] text-[#E2E2E2] border border-[#2A2D35] font-semibold text-xs sm:text-sm transition cursor-pointer"
            >
              <Brain className="w-4 h-4 text-[#D4AF37]" />
              <span>Buka Mode Hafalan</span>
            </button>
          </div>
        </div>
      </div>

      {/* Verses List */}
      <div className="space-y-4">
        {surahDetail.ayat.map((verse) => {
          const isCurrentPlaying = activePlayingVerse === verse.nomorAyat && playbackState.isPlaying;
          const bookmarked = isBookmarked(verse.nomorAyat);
          const hafalanRecord = hafalanRecords[`${surahDetail.nomor}_${verse.nomorAyat}`];
          const isMasked = maskedVerses[verse.nomorAyat] || false;

          return (
            <div
              key={verse.nomorAyat}
              id={`verse-${surahDetail.nomor}-${verse.nomorAyat}`}
              className={`group bg-[#15171E] rounded-3xl p-5 sm:p-7 border transition-all duration-300 ${
                isCurrentPlaying
                  ? 'border-[#D4AF37] ring-1 ring-[#D4AF37]/40 bg-[#1A1C23] shadow-2xl shadow-[#D4AF37]/10'
                  : 'border-[#1F2128] hover:border-[#2A2D35]'
              }`}
            >
              {/* Verse Header Bar: Number Medallion + Quick Status & Actions */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-4 border-b border-[#1F2128]">
                <div className="flex items-center gap-3">
                  {/* Verse Number Medallion */}
                  <div className={`w-9 h-9 rounded-xl font-bold text-sm flex items-center justify-center border shadow-inner ${
                    isCurrentPlaying
                      ? 'bg-[#D4AF37] text-[#0A0A0B] border-[#D4AF37]'
                      : 'bg-[#0F1115] text-[#D4AF37] border-[#2A2D35]'
                  }`}>
                    {verse.nomorAyat}
                  </div>

                  <span className="text-xs font-semibold text-[#8A8D9A]">
                    QS. {surahDetail.namaLatin}:{verse.nomorAyat}
                  </span>

                  {/* Hafalan Status Selector Pill */}
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
                </div>

                {/* Right Action Icons */}
                <div className="flex items-center gap-1">
                  {/* Play / Pause Audio */}
                  <button
                    onClick={() =>
                      isCurrentPlaying ? onPauseAudio() : onPlayVerse(verse.nomorAyat)
                    }
                    className={`p-2 rounded-xl transition-all cursor-pointer ${
                      isCurrentPlaying
                        ? 'bg-[#D4AF37] text-[#0A0A0B] shadow-md animate-pulse'
                        : 'bg-[#0F1115] text-[#D4AF37] border border-[#2A2D35] hover:bg-[#D4AF37] hover:text-[#0A0A0B]'
                    }`}
                    title={isCurrentPlaying ? 'Jeda Audio' : 'Putar Audio Ayat'}
                  >
                    {isCurrentPlaying ? (
                      <Pause className="w-4 h-4 fill-current" />
                    ) : (
                      <Play className="w-4 h-4 fill-current" />
                    )}
                  </button>

                  {/* Bookmark Button */}
                  <button
                    onClick={() => handleBookmarkClick(verse)}
                    className={`p-2 rounded-xl border transition-all cursor-pointer ${
                      bookmarked
                        ? 'bg-[#D4AF37] text-[#0A0A0B] border-[#D4AF37] font-bold'
                        : 'bg-[#0F1115] text-[#8A8D9A] border-[#2A2D35] hover:text-[#E2E2E2] hover:bg-[#1A1C23]'
                    }`}
                    title={bookmarked ? 'Hapus Bookmark' : 'Tambah Bookmark'}
                  >
                    <BookmarkIcon className={`w-4 h-4 ${bookmarked ? 'fill-current' : ''}`} />
                  </button>

                  {/* Toggle Masking / Test Memory */}
                  <button
                    onClick={() => toggleVerseMasking(verse.nomorAyat)}
                    className={`p-2 rounded-xl border transition-all cursor-pointer ${
                      isMasked
                        ? 'bg-[#D4AF37] text-[#0A0A0B] border-[#D4AF37]'
                        : 'bg-[#0F1115] text-[#8A8D9A] border-[#2A2D35] hover:text-[#E2E2E2] hover:bg-[#1A1C23]'
                    }`}
                    title={isMasked ? 'Tampilkan Teks Arab' : 'Tutup/Sembunyikan Teks untuk Tes Hafalan'}
                  >
                    {isMasked ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>

                  {/* Record Voice */}
                  <button
                    onClick={() => onOpenVoiceRecorder(verse.nomorAyat)}
                    className="p-2 rounded-xl bg-[#0F1115] text-[#D4AF37] border border-[#2A2D35] hover:bg-[#1A1C23] transition-all cursor-pointer"
                    title="Rekam Suara Hafalan Sendiri"
                  >
                    <Mic className="w-4 h-4" />
                  </button>

                  {/* Copy Verse */}
                  <button
                    onClick={() => copyVerseToClipboard(verse)}
                    className="p-2 rounded-xl bg-[#0F1115] text-[#8A8D9A] border border-[#2A2D35] hover:text-[#E2E2E2] hover:bg-[#1A1C23] transition cursor-pointer"
                    title="Salin Ayat & Terjemahan"
                  >
                    {copiedVerseNum === verse.nomorAyat ? (
                      <Check className="w-4 h-4 text-[#D4AF37]" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

                {/* Arabic Uthmani Text */}
                <div className="py-2 text-right relative">
                  {isMasked ? (
                    <div
                      onClick={() => toggleVerseMasking(verse.nomorAyat)}
                      className="p-6 rounded-2xl bg-[#0F1115] border-2 border-dashed border-[#D4AF37]/50 text-center cursor-pointer hover:bg-[#1A1C23] transition select-none"
                    >
                      <span className="text-sm font-semibold text-[#D4AF37] block mb-1">
                        🔒 Teks Arab Ditutup (Mode Latihan Hafalan)
                      </span>
                      <span className="text-xs text-[#8A8D9A]">
                        Klik di sini atau tombol mata untuk membuka teks
                      </span>
                    </div>
                  ) : (
                    <ColoredArabicVerse
                      arabicText={verse.teksArab}
                      fontSize={settings.arabicFontSize}
                      enableTajwid={settings.enableColoredTajwid ?? true}
                    />
                  )}
                </div>

              {/* Transliteration (Latin) */}
              {settings.showLatin && verse.teksLatin && (
                <div className="pt-3">
                  <p
                    className="text-[#D4AF37] italic font-medium"
                    style={{ fontSize: `${settings.latinFontSize}px` }}
                  >
                    {verse.teksLatin}
                  </p>
                </div>
              )}

              {/* Indonesian Translation */}
              {settings.showTranslation && verse.teksIndonesia && (
                <div className="pt-2">
                  <p className="text-[#8A8D9A] leading-relaxed text-sm">
                    {verse.teksIndonesia}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Navigation Footer for Next / Previous Surah */}
      <div className="flex items-center justify-between gap-4 pt-8 border-t border-[#1F2128]">
        {surahDetail.nomor > 1 ? (
          <button
            onClick={() => onNavigateSurah(surahDetail.nomor - 1)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#15171E] border border-[#2A2D35] hover:bg-[#1A1C23] font-medium text-sm text-[#E2E2E2] transition cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4 text-[#D4AF37]" />
            <span>Surah Sebelumya ({surahDetail.nomor - 1})</span>
          </button>
        ) : (
          <div />
        )}

        {surahDetail.nomor < 114 ? (
          <button
            onClick={() => onNavigateSurah(surahDetail.nomor + 1)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#D4AF37] text-[#0A0A0B] hover:bg-[#B8962D] font-bold text-sm shadow-lg shadow-[#D4AF37]/20 transition cursor-pointer"
          >
            <span>Surah Selanjutnya ({surahDetail.nomor + 1})</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <div />
        )}
      </div>

      {/* Bookmark Note Modal */}
      {bookmarkNoteModalVerse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
          <div className="bg-[#0F1115] rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-[#1F2128]">
            <h3 className="text-lg font-bold text-[#E2E2E2] flex items-center gap-2">
              <BookmarkIcon className="w-5 h-5 text-[#D4AF37] fill-current" />
              <span>Tambah Bookmark</span>
            </h3>

            <p className="text-xs text-[#8A8D9A]">
              Surah {surahDetail.namaLatin} Ayat {bookmarkNoteModalVerse.nomorAyat}
            </p>

            <div className="p-3 bg-[#15171E] rounded-xl text-xs text-[#D4AF37] font-arabic text-right dir-rtl border border-[#2A2D35]">
              {bookmarkNoteModalVerse.teksArab}
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#8A8D9A] mb-1">
                Catatan Pengingat (Opsional):
              </label>
              <textarea
                value={noteInput}
                onChange={(e) => setNoteInput(e.target.value)}
                placeholder="Contoh: Setoran hafalan Ba'da Subuh, Muroja'ah ulang..."
                rows={3}
                className="w-full p-3 text-sm rounded-xl border border-[#2A2D35] bg-[#15171E] text-[#E2E2E2] placeholder-[#6A6D7A] focus:outline-none focus:border-[#D4AF37]"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setBookmarkNoteModalVerse(null)}
                className="px-4 py-2 text-xs font-semibold rounded-xl text-[#8A8D9A] hover:bg-[#1A1C23] hover:text-[#E2E2E2] transition cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={saveBookmarkWithNote}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-[#D4AF37] text-[#0A0A0B] hover:bg-[#B8962D] shadow-md transition cursor-pointer"
              >
                Simpan Bookmark
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
