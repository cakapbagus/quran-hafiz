import React from 'react';
import { HafalanVerseRecord } from '../types';
import { ALL_SURAHS } from '../data/surahList';
import { Award, CheckCircle2, AlertCircle, Clock, BookOpen, Brain, Sparkles } from 'lucide-react';

interface HafalanProgressViewProps {
  hafalanRecords: Record<string, HafalanVerseRecord>;
  onSelectSurah: (surahNumber: number) => void;
}

export const HafalanProgressView: React.FC<HafalanProgressViewProps> = ({
  hafalanRecords,
  onSelectSurah
}) => {
  const TOTAL_QURAN_VERSES = 6236;

  // Compute stats
  const recordsList = Object.values(hafalanRecords) as HafalanVerseRecord[];
  const memorizedVerses = recordsList.filter((r) => r.status === 'memorized');
  const reviewNeededVerses = recordsList.filter((r) => r.status === 'review_needed');
  const inProgressVerses = recordsList.filter((r) => r.status === 'in_progress');

  const memorizedCount = memorizedVerses.length;
  const overallPercentage = ((memorizedCount / TOTAL_QURAN_VERSES) * 100).toFixed(1);

  // Group by Surah
  const surahProgressList = ALL_SURAHS.map((s) => {
    let mutqinCount = 0;
    let inProgressCount = 0;
    let reviewCount = 0;

    for (let v = 1; v <= s.jumlahAyat; v++) {
      const rec = hafalanRecords[`${s.nomor}_${v}`];
      if (rec) {
        if (rec.status === 'memorized') mutqinCount++;
        else if (rec.status === 'in_progress') inProgressCount++;
        else if (rec.status === 'review_needed') reviewCount++;
      }
    }

    return {
      ...s,
      mutqinCount,
      inProgressCount,
      reviewCount,
      percentage: Math.round((mutqinCount / s.jumlahAyat) * 100)
    };
  }).filter((s) => s.mutqinCount > 0 || s.inProgressCount > 0 || s.reviewCount > 0);

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-28">
      {/* Top Banner */}
      <div className="bg-[#0F1115] text-[#E2E2E2] rounded-3xl p-6 sm:p-8 shadow-2xl border border-[#1F2128] relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1A1C23] text-[#D4AF37] text-xs font-semibold border border-[#2A2D35]">
              <Award className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>Laporan Pencapaian Tahfidz</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#D4AF37] font-serif-title">
              Statistik & Muroja'ah Hafalan
            </h1>
            <p className="text-xs sm:text-sm text-[#8A8D9A] max-w-lg">
              "Sebaik-baik kalian adalah orang yang mempelajari Al-Quran dan mengajarkannya." (HR. Bukhari)
            </p>
          </div>

          {/* Overall Percentage Badge */}
          <div className="bg-[#15171E] p-4 rounded-2xl border border-[#2A2D35] text-center shrink-0">
            <div className="text-3xl font-extrabold text-[#D4AF37]">{overallPercentage}%</div>
            <div className="text-[11px] text-[#8A8D9A] uppercase tracking-wide font-semibold mt-0.5">
              Tercapai ({memorizedCount}/{TOTAL_QURAN_VERSES} Ayat)
            </div>
          </div>
        </div>
      </div>

      {/* Summary KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#15171E] p-5 rounded-3xl border border-[#1F2128] shadow-md flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-[#0F1115] border border-[#2A2D35] text-[#D4AF37]">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-[#E2E2E2]">{memorizedCount}</div>
            <div className="text-xs text-[#8A8D9A] font-medium">Ayat Mutqin (Lancar)</div>
          </div>
        </div>

        <div className="bg-[#15171E] p-5 rounded-3xl border border-[#1F2128] shadow-md flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-[#0F1115] border border-[#2A2D35] text-blue-400">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-[#E2E2E2]">{inProgressVerses.length}</div>
            <div className="text-xs text-[#8A8D9A] font-medium">Sedang Dihafal</div>
          </div>
        </div>

        <div className="bg-[#15171E] p-5 rounded-3xl border border-[#1F2128] shadow-md flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-[#0F1115] border border-[#2A2D35] text-amber-400">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-[#E2E2E2]">{reviewNeededVerses.length}</div>
            <div className="text-xs text-[#8A8D9A] font-medium">Perlu Muroja'ah Ulang</div>
          </div>
        </div>
      </div>

      {/* Breakdown per Surah */}
      <div className="bg-[#15171E] p-6 rounded-3xl border border-[#1F2128] shadow-md space-y-4">
        <h2 className="text-base font-bold text-[#E2E2E2] flex items-center gap-2">
          <Brain className="w-5 h-5 text-[#D4AF37]" />
          <span>Rincian Hafalan Per Surah</span>
        </h2>

        {surahProgressList.length === 0 ? (
          <div className="text-center py-12 text-[#8A8D9A]">
            <BookOpen className="w-10 h-10 mx-auto text-[#D4AF37] mb-2" />
            <p className="text-xs font-semibold">Belum ada catatan status hafalan.</p>
            <p className="text-[11px] mt-0.5">
              Buka pembaca Al-Quran dan pilih status "Mutqin" atau "Sedang Dihafal" pada ayat yang Anda pelajari.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {surahProgressList.map((surah) => (
              <div
                key={surah.nomor}
                onClick={() => onSelectSurah(surah.nomor)}
                className="p-4 rounded-2xl border border-[#1F2128] hover:border-[#D4AF37]/50 hover:bg-[#1A1C23] transition cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#0F1115]"
              >
                <div>
                  <h3 className="text-sm font-bold text-[#E2E2E2] flex items-center gap-2">
                    <span>{surah.nomor}. {surah.namaLatin}</span>
                    <span className="text-xs font-arabic text-[#D4AF37]">{surah.nama}</span>
                  </h3>
                  <div className="text-xs text-[#8A8D9A] mt-1 flex flex-wrap gap-2">
                    <span className="text-[#D4AF37] font-medium">
                      🟢 {surah.mutqinCount} Mutqin
                    </span>
                    {surah.inProgressCount > 0 && (
                      <span className="text-blue-400 font-medium">
                        🔵 {surah.inProgressCount} Proses
                      </span>
                    )}
                    {surah.reviewCount > 0 && (
                      <span className="text-amber-400 font-medium">
                        🟠 {surah.reviewCount} Muroja'ah
                      </span>
                    )}
                    <span>/ Total {surah.jumlahAyat} Ayat</span>
                  </div>
                </div>

                <div className="w-full sm:w-44 space-y-1">
                  <div className="flex justify-between text-xs font-bold text-[#D4AF37]">
                    <span>Progres:</span>
                    <span>{surah.percentage}%</span>
                  </div>
                  <div className="w-full bg-[#15171E] h-2 rounded-full overflow-hidden border border-[#2A2D35]">
                    <div
                      className="bg-[#D4AF37] h-full rounded-full transition-all"
                      style={{ width: `${surah.percentage}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
