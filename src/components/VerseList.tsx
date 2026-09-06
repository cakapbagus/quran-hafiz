import React, { useEffect, useMemo, useState } from 'react';
import { useDialogAccessibility } from '../hooks/useDialogAccessibility';
import { getMushafPage } from '../data/mushafPages';
import { SurahDetail, Verse, UserSettings, HafalanVerseRecord, HafalanStatusType, AudioPlaybackState } from '../types';
import { getSurahHafalanStatus } from '../services/storageService';
import { ColoredArabicVerse } from './ColoredArabicVerse';
import { MushafArabicText, toArabicNumerals } from './MushafArabicText';
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
  Scroll,
  StickyNote
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
  onUpdateSurahHafalanStatus?: (surahNumber: number, totalVerses: number, status: HafalanStatusType) => void;
  onOpenHafalanModeForVerse: (verseNumber: number) => void;
  onOpenVoiceRecorder: (verseNumber: number) => void;
  onNavigateSurah: (surahNumber: number) => void;
  activePlayingVerse: number | null;
  targetVerseNumber?: number | null;
  onEditVerseNote: (verseNumber: number) => void;
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
  onUpdateSurahHafalanStatus,
  onOpenHafalanModeForVerse,
  onOpenVoiceRecorder,
  onNavigateSurah,
  activePlayingVerse,
  targetVerseNumber,
  onEditVerseNote
}) => {
  const [bookmarkNoteModalVerse, setBookmarkNoteModalVerse] = useState<Verse | null>(null);
  const [noteInput, setNoteInput] = useState('');
  const [copiedVerseNum, setCopiedVerseNum] = useState<number | null>(null);
  const [maskedVerses, setMaskedVerses] = useState<Record<number, boolean>>({});
  const [selectedMushafVerseNumber, setSelectedMushafVerseNumber] = useState<number | null>(null);
  const firstMushafPage = getMushafPage(surahDetail.nomor, surahDetail.ayat[0]?.nomorAyat ?? 1);
  const [currentMushafPage, setCurrentMushafPage] = useState(firstMushafPage);
  const bookmarkDialogRef = useDialogAccessibility(() => setBookmarkNoteModalVerse(null), Boolean(bookmarkNoteModalVerse));

  const mushafPages = useMemo(
    () => Array.from(new Set(surahDetail.ayat.map((verse) => getMushafPage(surahDetail.nomor, verse.nomorAyat)))),
    [surahDetail]
  );
  const visibleVerses = useMemo(
    () => surahDetail.ayat.filter((verse) => getMushafPage(surahDetail.nomor, verse.nomorAyat) === currentMushafPage),
    [currentMushafPage, surahDetail]
  );
  const currentPageIndex = Math.max(0, mushafPages.indexOf(currentMushafPage));

  useEffect(() => {
    const firstPage = getMushafPage(surahDetail.nomor, surahDetail.ayat[0]?.nomorAyat ?? 1);
    setCurrentMushafPage(firstPage);
    setSelectedMushafVerseNumber(null);
  }, [surahDetail.nomor]);

  useEffect(() => {
    const targetVerse = activePlayingVerse ?? targetVerseNumber;
    if (targetVerse == null) return;
    setCurrentMushafPage(getMushafPage(surahDetail.nomor, targetVerse));
  }, [activePlayingVerse, surahDetail.nomor, targetVerseNumber]);

  useEffect(() => {
    const targetVerse = activePlayingVerse ?? targetVerseNumber;
    if (targetVerse == null || getMushafPage(surahDetail.nomor, targetVerse) !== currentMushafPage) return;
    window.requestAnimationFrame(() => {
      document.getElementById(`verse-${surahDetail.nomor}-${targetVerse}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }, [activePlayingVerse, currentMushafPage, surahDetail.nomor, targetVerseNumber]);

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
    navigator.clipboard.writeText(textToCopy)
      .then(() => {
        setCopiedVerseNum(verse.nomorAyat);
        setTimeout(() => setCopiedVerseNum(null), 2000);
      })
      .catch((error) => console.warn('Gagal menyalin ayat:', error));
  };

  const toggleVerseMasking = (verseNum: number) => {
    setMaskedVerses((prev) => ({
      ...prev,
      [verseNum]: !prev[verseNum]
    }));
  };

  const currentSurahHafalanStatus = getSurahHafalanStatus(
    surahDetail.nomor,
    surahDetail.jumlahAyat,
    hafalanRecords
  );

  const selectedMushafVerse = visibleVerses.find(
    (verse) => verse.nomorAyat === selectedMushafVerseNumber
  ) ?? null;

  const changeMushafPage = (page: number) => {
    setCurrentMushafPage(page);
    setSelectedMushafVerseNumber(null);
    window.setTimeout(() => {
      document.getElementById('quran-page-content')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 0);
  };

  const renderPageNavigation = (label: string) => (
    <nav className="grid grid-cols-2 items-center gap-2 rounded-2xl border border-[#2A2D35] bg-[#15171E] p-3 sm:grid-cols-[1fr_auto_1fr] sm:gap-3 sm:px-4" aria-label={label}>
      <button
        type="button"
        onClick={() => changeMushafPage(mushafPages[currentPageIndex - 1])}
        disabled={currentPageIndex === 0}
        className="inline-flex min-h-10 w-full items-center justify-center gap-1 rounded-xl border border-[#2A2D35] bg-[#0F1115] px-2 py-2 text-xs font-bold text-[#E2E2E2] transition hover:border-[#D4AF37] hover:text-[#D4AF37] disabled:cursor-not-allowed disabled:opacity-35 sm:w-auto sm:justify-self-start sm:px-3"
        aria-label="Halaman mushaf sebelumnya"
      >
        <ChevronLeft className="h-4 w-4" />
        Sebelumnya
      </button>

      <label className="order-first col-span-2 flex min-h-9 items-center justify-center gap-2 text-xs font-semibold text-[#8A8D9A] sm:order-0 sm:col-span-1">
        <span>Halaman Mushaf</span>
        <select
          value={currentMushafPage}
          onChange={(event) => changeMushafPage(Number(event.target.value))}
          className="rounded-lg border border-[#D4AF37]/45 bg-[#0F1115] px-2.5 py-1.5 font-bold text-[#D4AF37] outline-none focus:border-[#D4AF37]"
          aria-label="Pilih halaman mushaf"
        >
          {mushafPages.map((page) => <option key={page} value={page}>{page}</option>)}
        </select>
        <span>/ 604</span>
      </label>

      <button
        type="button"
        onClick={() => changeMushafPage(mushafPages[currentPageIndex + 1])}
        disabled={currentPageIndex === mushafPages.length - 1}
        className="inline-flex min-h-10 w-full items-center justify-center gap-1 rounded-xl border border-[#2A2D35] bg-[#0F1115] px-2 py-2 text-xs font-bold text-[#E2E2E2] transition hover:border-[#D4AF37] hover:text-[#D4AF37] disabled:cursor-not-allowed disabled:opacity-35 sm:w-auto sm:justify-self-end sm:px-3"
        aria-label="Halaman mushaf berikutnya"
      >
        Berikutnya
        <ChevronRight className="h-4 w-4" />
      </button>
    </nav>
  );

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
              <div className="inline-flex min-h-16 max-w-full items-center justify-center py-3 px-6 sm:px-8 rounded-2xl bg-[#15171E] border border-[#2A2D35]">
                <span dir="rtl" className="block font-arabic text-2xl sm:text-3xl leading-[1.8] text-[#D4AF37] tracking-wide">
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

            {onUpdateSurahHafalanStatus && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#15171E] border border-[#2A2D35] text-xs">
                <span className="text-[#8A8D9A] font-medium hidden sm:inline">Status Surah:</span>
                <select
                  value={currentSurahHafalanStatus}
                  onChange={(e) => {
                    const nextStatus = e.target.value;
                    if (nextStatus !== '-') {
                      onUpdateSurahHafalanStatus(surahDetail.nomor, surahDetail.jumlahAyat, nextStatus as HafalanStatusType);
                    }
                  }}
                  className="bg-[#0F1115] border border-[#2A2D35] text-[#E2E2E2] font-semibold text-xs rounded-lg px-2.5 py-1 outline-none focus:border-[#D4AF37] cursor-pointer"
                  aria-label={`Status hafalan surah ${surahDetail.namaLatin}`}
                >
                  {currentSurahHafalanStatus === '-' && (
                    <option value="-" disabled>
                      -
                    </option>
                  )}
                  <option value="not_started">Belum Dihafal</option>
                  <option value="in_progress">Sedang Dihafal</option>
                  <option value="review_needed">Perlu Murojaah</option>
                  <option value="memorized">Mutqin</option>
                </select>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Verses List */}
      {renderPageNavigation('Navigasi halaman mushaf bagian atas')}
      <div id="quran-page-content" className="scroll-mt-24">
      {settings.readDisplayMode === 'verse' ? (
      <div className="space-y-4">
        {visibleVerses.map((verse) => {
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
                    aria-label={isCurrentPlaying ? 'Jeda audio' : 'Putar audio ayat'}
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

                  {/* Verse Note Button */}
                  <button
                    onClick={() => onEditVerseNote(verse.nomorAyat)}
                    className="p-2 rounded-xl border border-[#2A2D35] bg-[#0F1115] text-[#8A8D9A] transition-all cursor-pointer hover:text-[#E2E2E2]"
                    title="Catatan per Ayat"
                    aria-label={`Edit catatan ayat ${verse.nomorAyat}`}
                  >
                    <StickyNote className={`h-4 w-4 ${hafalanRecord?.notes ? 'text-[#D4AF37]' : ''}`} />
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
      ) : (
        <div className="space-y-4">
          <section className="mushaf-page overflow-hidden rounded-4xl border shadow-2xl shadow-black/10 transition-colors duration-300">
            <div className="mushaf-header border-b px-5 py-5 text-center transition-colors duration-300 sm:px-10">
              <div className="mushaf-ornament mx-auto flex max-w-2xl items-center gap-4">
                <span className="mushaf-ornament-line h-px flex-1" />
                <Scroll className="h-5 w-5" />
                <span className="mushaf-ornament-line h-px flex-1" />
              </div>
              <h2 className="mushaf-title font-arabic text-4xl font-bold leading-relaxed sm:text-5xl" dir="rtl">
                {surahDetail.nama}
              </h2>
              <p className="mushaf-meta text-xs font-semibold uppercase tracking-[0.22em]">
                {surahDetail.namaLatin} · {surahDetail.arti}
              </p>
              <p className="mushaf-hint mt-1 text-[11px]">Klik ayat untuk membuka kontrol dan terjemahan</p>
            </div>

            <div className="relative px-5 py-8 sm:px-10 sm:py-12">
              <div className="mushaf-frame pointer-events-none absolute inset-3 rounded-[1.35rem] border" />
              {currentMushafPage === firstMushafPage && surahDetail.nomor !== 1 && surahDetail.nomor !== 9 && (
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
                {visibleVerses.map((verse) => {
                  const isCurrentPlaying = activePlayingVerse === verse.nomorAyat && playbackState.isPlaying;
                  const isSelected = selectedMushafVerseNumber === verse.nomorAyat;
                  return (
                    <span
                      key={verse.nomorAyat}
                      id={`verse-${surahDetail.nomor}-${verse.nomorAyat}`}
                      role="button"
                      tabIndex={0}
                      aria-label={`Ayat ${verse.nomorAyat}. Klik untuk membuka kontrol dan terjemahan`}
                      aria-pressed={isSelected}
                      onClick={() => setSelectedMushafVerseNumber(verse.nomorAyat)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          setSelectedMushafVerseNumber(verse.nomorAyat);
                        }
                      }}
                      className={`box-decoration-clone cursor-pointer rounded-lg px-1 outline-none transition-all focus-visible:ring-2 focus-visible:ring-[#B8860B] ${
                        isCurrentPlaying
                          ? 'bg-[#D4AF37]/30 shadow-[0_0_0_2px_rgba(184,134,11,0.2)]'
                          : isSelected ? 'bg-[#D4AF37]/18' : 'hover:bg-[#D4AF37]/10'
                      }`}
                    >
                      <MushafArabicText text={verse.teksArab} enableTajwid={settings.enableColoredTajwid ?? true} />{' '}
                      <span className="mushaf-verse-number whitespace-nowrap font-arabic font-bold" aria-hidden="true">
                        ﴿{toArabicNumerals(verse.nomorAyat)}﴾
                      </span>{' '}
                    </span>
                  );
                })}
              </div>
            </div>
          </section>

          {selectedMushafVerse && (() => {
            const verse = selectedMushafVerse;
            const isCurrentPlaying = activePlayingVerse === verse.nomorAyat && playbackState.isPlaying;
            const bookmarked = isBookmarked(verse.nomorAyat);
            const hafalanRecord = hafalanRecords[`${surahDetail.nomor}_${verse.nomorAyat}`];
            return (
              <section className="rounded-3xl border border-[#D4AF37]/35 bg-[#15171E] p-5 shadow-xl sm:p-6" aria-label={`Detail ayat ${verse.nomorAyat}`}>
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-[#2A2D35] pb-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full border border-[#D4AF37]/40 bg-[#D4AF37]/10 font-bold text-[#D4AF37]">{verse.nomorAyat}</span>
                    <div>
                      <h3 className="font-bold text-[#E2E2E2]">QS. {surahDetail.namaLatin}:{verse.nomorAyat}</h3>
                      <p className="text-xs text-[#8A8D9A]">Kontrol, latin, dan terjemahan ayat</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => isCurrentPlaying ? onPauseAudio() : onPlayVerse(verse.nomorAyat)} className={`rounded-xl border p-2 ${isCurrentPlaying ? 'border-[#D4AF37] bg-[#D4AF37] text-[#0A0A0B]' : 'border-[#2A2D35] bg-[#0F1115] text-[#D4AF37]'}`} aria-label={isCurrentPlaying ? 'Jeda audio' : 'Putar audio ayat'}>
                      {isCurrentPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </button>
                    <button onClick={() => handleBookmarkClick(verse)} className={`rounded-xl border p-2 ${bookmarked ? 'border-[#D4AF37] bg-[#D4AF37] text-[#0A0A0B]' : 'border-[#2A2D35] bg-[#0F1115] text-[#8A8D9A]'}`} aria-label={bookmarked ? 'Hapus bookmark' : 'Tambah bookmark'}>
                      <BookmarkIcon className={`h-4 w-4 ${bookmarked ? 'fill-current' : ''}`} />
                    </button>
                    <button onClick={() => onEditVerseNote(verse.nomorAyat)} className="rounded-xl border border-[#2A2D35] bg-[#0F1115] p-2 text-[#8A8D9A]" aria-label={`Edit catatan ayat ${verse.nomorAyat}`} title="Catatan per Ayat">
                      <StickyNote className={`h-4 w-4 ${hafalanRecord?.notes ? 'text-[#D4AF37]' : ''}`} />
                    </button>
                    <button onClick={() => onOpenVoiceRecorder(verse.nomorAyat)} className="rounded-xl border border-[#2A2D35] bg-[#0F1115] p-2 text-[#D4AF37]" aria-label="Rekam suara hafalan">
                      <Mic className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                {settings.showLatin && verse.teksLatin && <p className="italic leading-relaxed text-[#D4AF37]" style={{ fontSize: `${settings.latinFontSize}px` }}>{verse.teksLatin}</p>}
                {settings.showTranslation && verse.teksIndonesia && <p className="mt-2 text-sm leading-relaxed text-[#B5B8C2]">{verse.teksIndonesia}</p>}
                <div className="mt-4 border-t border-[#2A2D35] pt-4">
                  <select
                    value={hafalanRecord?.status || 'not_started'}
                    onChange={(event) => onUpdateHafalanStatus(verse.nomorAyat, event.target.value as HafalanVerseRecord['status'])}
                    className="rounded-xl border border-[#2A2D35] bg-[#0F1115] px-3 py-2 text-xs font-semibold text-[#E2E2E2] outline-none focus:border-[#D4AF37]"
                    aria-label={`Status hafalan ayat ${verse.nomorAyat}`}
                  >
                    <option value="not_started">⚪ Belum Dihafal</option>
                    <option value="in_progress">🔵 Sedang Dihafal</option>
                    <option value="review_needed">🟠 Perlu Muroja'ah</option>
                    <option value="memorized">🟢 Mutqin (Lancar)</option>
                  </select>
                </div>
              </section>
            );
          })()}
        </div>
      )}
      </div>

      {renderPageNavigation('Navigasi halaman mushaf bagian bawah')}

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
          <div ref={bookmarkDialogRef} role="dialog" aria-modal="true" aria-labelledby="bookmark-dialog-title" className="bg-[#0F1115] rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-[#1F2128]">
            <h3 id="bookmark-dialog-title" className="text-lg font-bold text-[#E2E2E2] flex items-center gap-2">
              <BookmarkIcon className="w-5 h-5 text-[#D4AF37] fill-current" />
              <span>Tambah Bookmark</span>
            </h3>

            <p className="text-xs text-[#8A8D9A]">
              Surah {surahDetail.namaLatin} Ayat {bookmarkNoteModalVerse.nomorAyat}
            </p>


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
