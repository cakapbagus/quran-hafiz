import React, { useState, useEffect } from 'react';
import {
  Scroll,
  Search,
  BookOpen,
  Sparkles,
  Volume2,
  Copy,
  Check,
  ChevronRight,
  ChevronLeft,
  Loader2,
  Info,
  Layers,
  Filter,
  RefreshCw
} from 'lucide-react';
import { ALL_SURAHS } from '../data/surahList';
import { SurahDetail, Verse } from '../types';
import { fetchSurahDetail } from '../services/quranApi';
import { fetchTafsirIbnuKatsir, fetchDeepTafsirBilMatsur } from '../services/tafsirService';
import { ColoredArabicVerse } from './ColoredArabicVerse';

interface TafsirBilMatsurViewProps {
  initialSurahNumber?: number;
  onPlayVerseAudio?: (surahNumber: number, verseNumber: number) => void;
  onOpenHafalanForVerse?: (surahNumber: number, verseNumber: number) => void;
  customApiKey?: string;
}

export const TafsirBilMatsurView: React.FC<TafsirBilMatsurViewProps> = ({
  initialSurahNumber = 1,
  onPlayVerseAudio,
  onOpenHafalanForVerse,
  customApiKey
}) => {
  const [selectedSurahNumber, setSelectedSurahNumber] = useState<number>(initialSurahNumber);
  const [selectedVerseNumber, setSelectedVerseNumber] = useState<number>(1);
  const [surahDetail, setSurahDetail] = useState<SurahDetail | null>(null);
  const [isLoadingSurah, setIsLoadingSurah] = useState<boolean>(false);

  // Tabs: Ibnu Katsir vs Deep Bil Matsur
  const [activeTab, setActiveTab] = useState<'ibnu_katsir' | 'kajian_mendalam'>('ibnu_katsir');

  // Ibnu Katsir state
  const [ibnuKatsirContent, setIbnuKatsirContent] = useState<string>('');
  const [isLoadingIbnuKatsir, setIsLoadingIbnuKatsir] = useState<boolean>(false);
  const [ibnuKatsirError, setIbnuKatsirError] = useState<string | null>(null);

  // Deep Bil Ma'tsur study state
  const [deepMatsurContent, setDeepMatsurContent] = useState<string>('');
  const [isLoadingDeep, setIsLoadingDeep] = useState<boolean>(false);
  const [deepError, setDeepError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [searchAyatQuery, setSearchAyatQuery] = useState<string>('');

  // Load surah
  useEffect(() => {
    let isMounted = true;
    setIsLoadingSurah(true);

    fetchSurahDetail(selectedSurahNumber)
      .then((detail) => {
        if (isMounted) {
          setSurahDetail(detail);
          setIsLoadingSurah(false);
          setSelectedVerseNumber(1);
        }
      })
      .catch((err) => {
        console.error('Failed to load surah:', err);
        if (isMounted) {
          setIsLoadingSurah(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [selectedSurahNumber]);

  // Load Tafsir Ibnu Katsir
  const loadIbnuKatsir = (forceRefresh = false) => {
    if (!surahDetail) return;
    const currentVerse = surahDetail.ayat.find((v) => v.nomorAyat === selectedVerseNumber);
    if (!currentVerse) return;

    setIsLoadingIbnuKatsir(true);
    setIbnuKatsirError(null);

    fetchTafsirIbnuKatsir(
      selectedSurahNumber,
      surahDetail.namaLatin,
      selectedVerseNumber,
      currentVerse.teksArab,
      currentVerse.teksIndonesia,
      forceRefresh,
      customApiKey
    )
      .then((content) => {
        setIbnuKatsirContent(content);
        setIsLoadingIbnuKatsir(false);
      })
      .catch((err) => {
        setIbnuKatsirError(err.message || 'Gagal memuat Tafsir Ibnu Katsir');
        setIsLoadingIbnuKatsir(false);
      });
  };

  // Function to load deep Bil Ma'tsur study
  const loadDeepStudy = (forceRefresh = false) => {
    if (!surahDetail) return;
    const currentVerse = surahDetail.ayat.find((v) => v.nomorAyat === selectedVerseNumber);
    if (!currentVerse) return;

    setIsLoadingDeep(true);
    setDeepError(null);

    fetchDeepTafsirBilMatsur(
      selectedSurahNumber,
      surahDetail.namaLatin,
      selectedVerseNumber,
      currentVerse.teksArab,
      currentVerse.teksIndonesia,
      forceRefresh,
      customApiKey
    )
      .then((content) => {
        setDeepMatsurContent(content);
        setIsLoadingDeep(false);
      })
      .catch((err) => {
        setDeepError(err.message || 'Gagal memuat kajian Bil Ma\'tsur');
        setIsLoadingDeep(false);
      });
  };

  // Load when surah, verse, or active tab changes
  useEffect(() => {
    if (activeTab === 'ibnu_katsir') {
      loadIbnuKatsir();
    } else {
      loadDeepStudy();
    }
  }, [selectedSurahNumber, selectedVerseNumber, surahDetail, activeTab]);

  const currentVerse = surahDetail?.ayat.find((v) => v.nomorAyat === selectedVerseNumber);

  const handleCopy = () => {
    if (!surahDetail || !currentVerse) return;
    const activeText = activeTab === 'ibnu_katsir' ? ibnuKatsirContent : deepMatsurContent;
    const title = activeTab === 'ibnu_katsir' ? 'Tafsir Ibnu Katsir (Bahasa Indonesia)' : 'Kajian Riwayat Bil Ma\'tsur';
    const text = `${title}: QS. ${surahDetail.namaLatin} Ayat ${selectedVerseNumber}\n\n${currentVerse.teksArab}\n"${currentVerse.teksIndonesia}"\n\n${activeText || ''}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredVerses = surahDetail?.ayat.filter((v) => {
    if (!searchAyatQuery) return true;
    const q = searchAyatQuery.toLowerCase();
    return (
      v.nomorAyat.toString().includes(q) ||
      v.teksIndonesia.toLowerCase().includes(q) ||
      v.teksLatin.toLowerCase().includes(q)
    );
  }) || [];

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-28">
      {/* Top Header Banner */}
      <div className="bg-[#0F1115] text-[#E2E2E2] rounded-3xl p-6 sm:p-8 shadow-2xl border border-[#1F2128] relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1A1C23] text-[#D4AF37] text-xs font-semibold border border-[#2A2D35]">
              <Scroll className="w-3.5 h-3.5" />
              <span>Khazanah Tafsir Riwayat Mu'tamad</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold tracking-wide text-[#D4AF37] font-serif-title">
              Tafsir Bil Ma'tsur (التفسير بالمأثور)
            </h1>

            <p className="text-xs sm:text-sm text-[#8A8D9A] max-w-2xl leading-relaxed">
              Kajian penafsiran Al-Quran berdasarkan riwayat yang shahih: <strong>Al-Qur'an bil Qur'an</strong>, <strong>Sunnah/Hadits Nabi ﷺ</strong>, <strong>Atsar Sahabat (Ibnu Abbas, Ibnu Mas'ud)</strong>, serta Tabi'in (Tafsir Ibnu Katsir & At-Tabari).
            </p>
          </div>

          {/* Surah Selector Dropdown */}
          <div className="bg-[#15171E] p-4 rounded-2xl border border-[#2A2D35] flex flex-col gap-2 min-w-[260px]">
            <label className="text-xs font-semibold text-[#8A8D9A] flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>Pilih Surah (1 - 114):</span>
            </label>
            <select
              value={selectedSurahNumber}
              onChange={(e) => setSelectedSurahNumber(Number(e.target.value))}
              className="w-full p-2.5 rounded-xl bg-[#0F1115] border border-[#2A2D35] text-[#E2E2E2] font-semibold text-xs focus:outline-none focus:border-[#D4AF37] cursor-pointer"
            >
              {ALL_SURAHS.map((s) => (
                <option key={s.nomor} value={s.nomor}>
                  {s.nomor}. {s.namaLatin} ({s.nama}) - {s.jumlahAyat} Ayat
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Grid: Left Verses Navigation Drawer / List + Right Tafsir Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Ayat Selector & Quick Overview (4 cols on lg) */}
        <div className="lg:col-span-4 bg-[#15171E] rounded-3xl p-5 border border-[#1F2128] space-y-4 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-[#1F2128]">
            <h3 className="text-sm font-bold text-[#E2E2E2] flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#D4AF37]" />
              <span>Daftar Ayat ({surahDetail?.jumlahAyat || 0})</span>
            </h3>
            <span className="text-xs text-[#D4AF37] font-semibold font-serif-title">
              {surahDetail?.namaLatin}
            </span>
          </div>

          {/* Search Ayat */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#6A6D7A]" />
            <input
              type="text"
              placeholder="Cari nomor atau terjemahan ayat..."
              value={searchAyatQuery}
              onChange={(e) => setSearchAyatQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-[#0F1115] border border-[#2A2D35] text-[#E2E2E2] placeholder-[#6A6D7A] focus:outline-none focus:border-[#D4AF37]"
            />
          </div>

          {/* Verse Number Chips Scrollable */}
          <div className="max-h-[520px] overflow-y-auto space-y-2 pr-1">
            {isLoadingSurah ? (
              <div className="text-center py-12">
                <Loader2 className="w-6 h-6 text-[#D4AF37] animate-spin mx-auto" />
              </div>
            ) : filteredVerses.length === 0 ? (
              <p className="text-xs text-center py-8 text-[#8A8D9A]">
                Tidak ada ayat yang cocok.
              </p>
            ) : (
              filteredVerses.map((v) => {
                const isSelected = selectedVerseNumber === v.nomorAyat;
                return (
                  <button
                    key={v.nomorAyat}
                    onClick={() => setSelectedVerseNumber(v.nomorAyat)}
                    className={`w-full text-left p-3 rounded-2xl border transition-all flex items-start gap-3 cursor-pointer ${
                      isSelected
                        ? 'bg-[#1A1C23] border-[#D4AF37] text-[#E2E2E2] shadow-md shadow-[#D4AF37]/10'
                        : 'bg-[#0F1115] border-[#1F2128] text-[#8A8D9A] hover:border-[#2A2D35] hover:text-[#E2E2E2]'
                    }`}
                  >
                    <div
                      className={`w-7 h-7 rounded-lg font-bold text-xs flex items-center justify-center shrink-0 border ${
                        isSelected
                          ? 'bg-[#D4AF37] text-[#0A0A0B] border-[#D4AF37]'
                          : 'bg-[#15171E] text-[#D4AF37] border-[#2A2D35]'
                      }`}
                    >
                      {v.nomorAyat}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-arabic text-sm text-right text-[#D4AF37] truncate dir-rtl mb-1">
                        {v.teksArab}
                      </p>
                      <p className="text-[11px] text-[#8A8D9A] line-clamp-2 leading-relaxed">
                        {v.teksIndonesia}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Deep Tafsir Content (8 cols on lg) */}
        <div className="lg:col-span-8 bg-[#15171E] rounded-3xl p-6 sm:p-7 border border-[#1F2128] space-y-6 shadow-2xl">
          {/* Verse Banner & Controller */}
          {currentVerse && surahDetail && (
            <div className="bg-[#0F1115] rounded-2xl p-5 sm:p-6 border border-[#2A2D35] space-y-4">
              <div className="flex items-center justify-between gap-3 pb-3 border-b border-[#1F2128]">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#D4AF37] text-[#0A0A0B] font-bold text-xs flex items-center justify-center">
                    {selectedVerseNumber}
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-[#E2E2E2]">
                      QS. {surahDetail.namaLatin} : Ayat {selectedVerseNumber}
                    </h2>
                    <span className="text-[10px] text-[#8A8D9A]">
                      {surahDetail.tempatTurun} • {surahDetail.arti}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Previous / Next Verse Button */}
                  {selectedVerseNumber > 1 && (
                    <button
                      onClick={() => setSelectedVerseNumber(selectedVerseNumber - 1)}
                      className="p-2 rounded-xl bg-[#15171E] text-[#8A8D9A] hover:text-[#E2E2E2] border border-[#2A2D35] transition cursor-pointer"
                      title="Ayat Sebelumnya"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                  )}

                  {selectedVerseNumber < surahDetail.jumlahAyat && (
                    <button
                      onClick={() => setSelectedVerseNumber(selectedVerseNumber + 1)}
                      className="p-2 rounded-xl bg-[#15171E] text-[#8A8D9A] hover:text-[#E2E2E2] border border-[#2A2D35] transition cursor-pointer"
                      title="Ayat Selanjutnya"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  )}

                  {/* Play Audio */}
                  {onPlayVerseAudio && (
                    <button
                      onClick={() => onPlayVerseAudio(selectedSurahNumber, selectedVerseNumber)}
                      className="p-2 rounded-xl bg-[#15171E] text-[#D4AF37] border border-[#2A2D35] hover:bg-[#1A1C23] transition cursor-pointer"
                      title="Putar Audio Ayat"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                  )}

                  {/* Copy */}
                  <button
                    onClick={handleCopy}
                    className="p-2 rounded-xl bg-[#15171E] text-[#8A8D9A] hover:text-[#D4AF37] border border-[#2A2D35] transition cursor-pointer"
                    title="Salin Kajian Tafsir"
                  >
                    {copied ? <Check className="w-4 h-4 text-[#D4AF37]" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Arabic Text */}
              <div className="text-right py-2">
                <ColoredArabicVerse
                  arabicText={currentVerse.teksArab}
                  fontSize={28}
                  enableTajwid={true}
                />
              </div>

              {/* Translation */}
              <div className="border-l-2 border-[#D4AF37] pl-3 py-1">
                <p className="text-xs sm:text-sm text-[#CCCCCC] leading-relaxed italic">
                  "{currentVerse.teksIndonesia}"
                </p>
              </div>
            </div>
          )}

          {/* Sub Navigation Tabs */}
          <div className="flex items-center gap-2 border-b border-[#1F2128] pb-1">
            <button
              onClick={() => setActiveTab('ibnu_katsir')}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                activeTab === 'ibnu_katsir'
                  ? 'bg-[#D4AF37] text-[#0A0A0B] shadow-md'
                  : 'bg-[#0F1115] text-[#8A8D9A] hover:text-[#E2E2E2] border border-[#2A2D35]'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Tafsir Ibnu Katsir (Bahasa Indonesia)</span>
            </button>

            <button
              onClick={() => setActiveTab('kajian_mendalam')}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                activeTab === 'kajian_mendalam'
                  ? 'bg-[#D4AF37] text-[#0A0A0B] shadow-md'
                  : 'bg-[#0F1115] text-[#8A8D9A] hover:text-[#E2E2E2] border border-[#2A2D35]'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Telaah Riwayat Bil Ma'tsur & Hadits</span>
            </button>
          </div>

          {/* Content Area */}
          <div className="space-y-4">
            {activeTab === 'ibnu_katsir' ? (
              <div>
                {isLoadingIbnuKatsir ? (
                  <div className="text-center py-16 space-y-3 bg-[#0F1115] rounded-2xl border border-[#1F2128]">
                    <Loader2 className="w-8 h-8 text-[#D4AF37] animate-spin mx-auto" />
                    <p className="text-xs font-semibold text-[#8A8D9A]">
                      Memuat rujukan kitab Tafsir Al-Qur'an Al-'Azhim (Ibnu Katsir)...
                    </p>
                  </div>
                ) : ibnuKatsirError ? (
                  <div className="p-5 rounded-2xl bg-amber-950/20 border border-amber-800/40 text-amber-200 text-xs space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <p className="font-semibold text-amber-300">{ibnuKatsirError}</p>
                      <button
                        onClick={() => loadIbnuKatsir(true)}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-[#D4AF37] text-[#0A0A0B] font-bold text-xs hover:bg-[#E5C358] transition cursor-pointer shadow shrink-0"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Coba Muat Ulang</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="p-4 rounded-2xl bg-[#0F1115] border border-[#2A2D35] text-xs text-[#8A8D9A] flex items-start gap-2.5">
                      <BookOpen className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
                      <span>
                        <strong>Tafsir Al-Qur'an Al-'Azhim karya Al-Hafizh Ibnu Katsir</strong>: Kitab rujukan utama penafsiran bil ma'tsur yang menguraikan ayat dengan hadits marfu', perkataan sahabat (Ibnu Abbas, Ibnu Mas'ud) dan tabi'in (Mujahid, Qatadah).
                      </span>
                    </div>

                    <div className="bg-[#0F1115] p-6 rounded-2xl border border-[#1F2128] text-sm text-[#CCCCCC] leading-relaxed whitespace-pre-line space-y-4 font-sans">
                      {ibnuKatsirContent}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div>
                {isLoadingDeep ? (
                  <div className="text-center py-16 space-y-3 bg-[#0F1115] rounded-2xl border border-[#1F2128]">
                    <Loader2 className="w-8 h-8 text-[#D4AF37] animate-spin mx-auto" />
                    <p className="text-xs font-semibold text-[#8A8D9A]">
                      Menghimpun riwayat Hadits Shahih, Atsar Sahabat & Riwayat Mu'tamad...
                    </p>
                  </div>
                ) : deepError ? (
                  <div className="p-5 rounded-2xl bg-amber-950/20 border border-amber-800/40 text-amber-200 text-xs space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <p className="font-semibold text-amber-300">{deepError}</p>
                      <button
                        onClick={() => loadDeepStudy(true)}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-[#D4AF37] text-[#0A0A0B] font-bold text-xs hover:bg-[#E5C358] transition cursor-pointer shadow shrink-0"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Coba Muat Ulang</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="p-4 rounded-2xl bg-[#0F1115] border border-[#2A2D35] text-xs text-[#8A8D9A] flex items-start gap-2.5">
                      <Info className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
                      <span>
                        Telaah ini memadukan metodologi <strong>Tafsir Bil Ma'tsur</strong> mu'tamad: penafsiran Al-Qur'an bil Qur'an, keterkaitan hadits shahih (Bukhari & Muslim), perkataan Ibnu Abbas / Mujahid, serta hikmah tadabbur.
                      </span>
                    </div>

                    <div className="bg-[#0F1115] p-6 rounded-2xl border border-[#1F2128] text-sm text-[#CCCCCC] leading-relaxed whitespace-pre-line space-y-4 font-sans">
                      {deepMatsurContent}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
