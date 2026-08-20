import React, { useState, useEffect } from 'react';
import {
  X,
  BookOpen,
  Sparkles,
  Scroll,
  Volume2,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Info,
  RefreshCw
} from 'lucide-react';
import { fetchTafsirIbnuKatsir, fetchDeepTafsirBilMatsur } from '../services/tafsirService';
import { ColoredArabicVerse } from './ColoredArabicVerse';

interface TafsirModalProps {
  surahNumber: number;
  surahName: string;
  verseNumber: number;
  verseArab: string;
  verseTranslation: string;
  totalVerses: number;
  onClose: () => void;
  onNavigateVerse: (verseNumber: number) => void;
  onPlayAudio?: () => void;
  customApiKey?: string;
}

export const TafsirModal: React.FC<TafsirModalProps> = ({
  surahNumber,
  surahName,
  verseNumber,
  verseArab,
  verseTranslation,
  totalVerses,
  onClose,
  onNavigateVerse,
  onPlayAudio,
  customApiKey
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'ibnu_katsir' | 'bil_matsur'>('ibnu_katsir');
  const [ibnuKatsirText, setIbnuKatsirText] = useState<string>('');
  const [isLoadingIbnuKatsir, setIsLoadingIbnuKatsir] = useState<boolean>(true);
  const [ibnuKatsirError, setIbnuKatsirError] = useState<string | null>(null);

  const [deepMatsurText, setDeepMatsurText] = useState<string>('');
  const [isLoadingDeep, setIsLoadingDeep] = useState<boolean>(false);
  const [deepError, setDeepError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  // Load Tafsir Ibnu Katsir
  const loadIbnuKatsir = (forceRefresh = false) => {
    setIsLoadingIbnuKatsir(true);
    setIbnuKatsirError(null);

    fetchTafsirIbnuKatsir(
      surahNumber,
      surahName,
      verseNumber,
      verseArab,
      verseTranslation,
      forceRefresh,
      customApiKey
    )
      .then((data) => {
        setIbnuKatsirText(data);
        setIsLoadingIbnuKatsir(false);
      })
      .catch((err) => {
        console.warn('Error loading Tafsir Ibnu Katsir:', err);
        setIbnuKatsirError(err.message || 'Gagal memuat Tafsir Ibnu Katsir.');
        setIsLoadingIbnuKatsir(false);
      });
  };

  // Load Deep Bil Ma'tsur Riwayat
  const loadDeepMatsur = (forceRefresh = false) => {
    setIsLoadingDeep(true);
    setDeepError(null);

    fetchDeepTafsirBilMatsur(
      surahNumber,
      surahName,
      verseNumber,
      verseArab,
      verseTranslation,
      forceRefresh,
      customApiKey
    )
      .then((text) => {
        setDeepMatsurText(text);
        setIsLoadingDeep(false);
      })
      .catch((err) => {
        setDeepError(err.message || 'Gagal memuat kajian Tafsir Bil Ma\'tsur.');
        setIsLoadingDeep(false);
      });
  };

  // Load active tab data on verse or tab change
  useEffect(() => {
    if (activeSubTab === 'ibnu_katsir') {
      loadIbnuKatsir();
    } else {
      loadDeepMatsur();
    }
  }, [surahNumber, verseNumber, activeSubTab]);

  const handleCopy = () => {
    const activeText = activeSubTab === 'ibnu_katsir' ? ibnuKatsirText : deepMatsurText;
    const title = activeSubTab === 'ibnu_katsir' ? 'Tafsir Ibnu Katsir (Indonesia)' : 'Kajian Riwayat Bil Ma\'tsur';
    const text = `${title}: QS. ${surahName} Ayat ${verseNumber}\n\n${verseArab}\n"${verseTranslation}"\n\n${activeText || ''}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-[#15171E] rounded-3xl max-w-3xl w-full flex flex-col max-h-[90vh] shadow-2xl border border-[#1F2128] overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#1F2128] bg-[#0F1115]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37]">
              <Scroll className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-[#E2E2E2] font-serif-title">
                  Tafsir Bil Ma'tsur & Ibnu Katsir
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/30 font-semibold">
                  Bahasa Indonesia
                </span>
              </div>
              <p className="text-xs text-[#8A8D9A]">
                QS. {surahName} • Ayat Ke-{verseNumber} dari {totalVerses} Ayat
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Previous Verse */}
            {verseNumber > 1 && (
              <button
                onClick={() => onNavigateVerse(verseNumber - 1)}
                className="p-2 rounded-xl bg-[#1A1C23] text-[#8A8D9A] hover:text-[#E2E2E2] hover:bg-[#2A2D35] border border-[#2A2D35] transition cursor-pointer"
                title="Ayat Sebelumnya"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}

            {/* Next Verse */}
            {verseNumber < totalVerses && (
              <button
                onClick={() => onNavigateVerse(verseNumber + 1)}
                className="p-2 rounded-xl bg-[#1A1C23] text-[#8A8D9A] hover:text-[#E2E2E2] hover:bg-[#2A2D35] border border-[#2A2D35] transition cursor-pointer"
                title="Ayat Selanjutnya"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={handleCopy}
              className="p-2 rounded-xl bg-[#1A1C23] text-[#8A8D9A] hover:text-[#D4AF37] hover:bg-[#2A2D35] border border-[#2A2D35] transition cursor-pointer"
              title="Salin Tafsir"
            >
              {copied ? <Check className="w-4 h-4 text-[#D4AF37]" /> : <Copy className="w-4 h-4" />}
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-[#8A8D9A] hover:text-[#E2E2E2] hover:bg-[#1A1C23] transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Verse Banner Card */}
        <div className="p-5 bg-[#0F1115] border-b border-[#1F2128] space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#D4AF37]">
              Teks Ayat & Terjemahan
            </span>
            {onPlayAudio && (
              <button
                onClick={onPlayAudio}
                className="flex items-center gap-1.5 px-3 py-1 text-xs rounded-lg bg-[#15171E] text-[#D4AF37] border border-[#2A2D35] hover:bg-[#1A1C23] transition cursor-pointer"
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>Putar Murottal</span>
              </button>
            )}
          </div>

          <div className="text-right">
            <ColoredArabicVerse
              arabicText={verseArab}
              fontSize={24}
              enableTajwid={true}
            />
          </div>

          <p className="text-xs sm:text-sm text-[#8A8D9A] leading-relaxed italic border-l-2 border-[#D4AF37] pl-3">
            "{verseTranslation}"
          </p>
        </div>

        {/* Sub Navigation Tabs */}
        <div className="flex items-center gap-2 px-5 pt-3 bg-[#15171E] border-b border-[#1F2128]">
          <button
            onClick={() => setActiveSubTab('ibnu_katsir')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeSubTab === 'ibnu_katsir'
                ? 'border-[#D4AF37] text-[#D4AF37]'
                : 'border-transparent text-[#8A8D9A] hover:text-[#E2E2E2]'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Tafsir Ibnu Katsir (Bahasa Indonesia)</span>
          </button>

          <button
            onClick={() => setActiveSubTab('bil_matsur')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeSubTab === 'bil_matsur'
                ? 'border-[#D4AF37] text-[#D4AF37]'
                : 'border-transparent text-[#8A8D9A] hover:text-[#E2E2E2]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Kajian Riwayat Hadits & Atsar Sahabat</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 p-5 sm:p-6 overflow-y-auto space-y-4 text-sm">
          {activeSubTab === 'ibnu_katsir' ? (
            <div className="space-y-4">
              {isLoadingIbnuKatsir ? (
                <div className="text-center py-12 space-y-3">
                  <Loader2 className="w-8 h-8 text-[#D4AF37] animate-spin mx-auto" />
                  <p className="text-xs font-medium text-[#8A8D9A]">
                    Memuat rujukan kitab Tafsir Al-Qur'an Al-'Azhim (Ibnu Katsir)...
                  </p>
                </div>
              ) : ibnuKatsirError ? (
                <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-800/40 text-amber-200 text-xs space-y-3">
                  <p className="font-semibold">{ibnuKatsirError}</p>
                  <button
                    onClick={() => loadIbnuKatsir(true)}
                    className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#D4AF37] text-[#0A0A0B] font-bold text-xs hover:bg-[#B8962D] transition cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Coba Muat Ulang</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-3.5 rounded-2xl bg-[#0F1115] border border-[#2A2D35] text-xs text-[#8A8D9A] flex items-start gap-2.5">
                    <BookOpen className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
                    <span>
                      <strong>Tafsir Ibnu Katsir</strong> (<em>Tafsir Al-Qur'an Al-'Azhim</em>): Rujukan tafsir bil ma'tsur paling terpercaya yang mengaitkan ayat dengan hadits Nabi ﷺ, perkataan sahabat & tabi'in.
                    </span>
                  </div>

                  <div className="whitespace-pre-line text-sm text-[#CCCCCC] leading-relaxed font-sans bg-[#0F1115] p-5 rounded-2xl border border-[#1F2128]">
                    {ibnuKatsirText}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {isLoadingDeep ? (
                <div className="text-center py-12 space-y-3">
                  <Loader2 className="w-8 h-8 text-[#D4AF37] animate-spin mx-auto" />
                  <p className="text-xs font-medium text-[#8A8D9A]">
                    Menghimpun riwayat shahih, hadits sanad, atsar mufassirin salaf & asbabun nuzul...
                  </p>
                </div>
              ) : deepError ? (
                <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-800/40 text-amber-200 text-xs space-y-3">
                  <p className="font-semibold">{deepError}</p>
                  <button
                    onClick={() => loadDeepMatsur(true)}
                    className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#D4AF37] text-[#0A0A0B] font-bold text-xs hover:bg-[#B8962D] transition cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Coba Muat Ulang</span>
                  </button>
                </div>
              ) : (
                <div className="prose prose-invert max-w-none text-[#E2E2E2] leading-relaxed space-y-4">
                  <div className="p-3.5 rounded-2xl bg-[#0F1115] border border-[#2A2D35] text-xs text-[#8A8D9A] flex items-start gap-2.5">
                    <Info className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
                    <span>
                      <strong>Metode Bil Ma'tsur</strong>: Mengedepankan penafsiran Al-Qur'an dengan Al-Qur'an, Hadits Nabi ﷺ, riwayat Atsar Shahabat (Ibnu Abbas, Ibnu Mas'ud), serta Tabi'in terkemuka (Mujahid, Qatadah, Ath-Thabari).
                    </span>
                  </div>

                  <div className="whitespace-pre-line text-sm text-[#CCCCCC] leading-relaxed font-sans bg-[#0F1115] p-5 rounded-2xl border border-[#1F2128]">
                    {deepMatsurText}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-[#1F2128] bg-[#0F1115] flex items-center justify-between">
          <span className="text-[11px] text-[#6A6D7A]">
            Tafsir Al-Qur'an Al-'Azhim (Ibnu Katsir) & Riwayat Mu'tamad
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold rounded-xl bg-[#D4AF37] text-[#0A0A0B] hover:bg-[#B8962D] shadow-md transition cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
