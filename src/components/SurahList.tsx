import React, { useState, useMemo } from 'react';
import { ALL_SURAHS } from '../data/surahList';
import { SurahSummary, LastRead, HafalanVerseRecord } from '../types';
import { Play, BookOpen, Search, CheckCircle2, Award } from 'lucide-react';

interface SurahListProps {
  onSelectSurah: (surahNumber: number) => void;
  onPlaySurahAudio: (surahNumber: number) => void;
  lastRead: LastRead | null;
  hafalanRecords: Record<string, HafalanVerseRecord>;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
}

export const SurahList: React.FC<SurahListProps> = ({
  onSelectSurah,
  onPlaySurahAudio,
  lastRead,
  hafalanRecords,
  searchQuery,
  setSearchQuery
}) => {
  const [selectedJuz, setSelectedJuz] = useState<number | null>(null);
  const [selectedType, setSelectedType] = useState<'all' | 'Mekkah' | 'Madinah'>('all');

  // Filter surahs
  const filteredSurahs = useMemo(() => {
    return ALL_SURAHS.filter((surah) => {
      // Search match
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        surah.namaLatin.toLowerCase().includes(q) ||
        surah.arti.toLowerCase().includes(q) ||
        surah.nomor.toString() === q ||
        surah.nama.includes(q);

      // Juz match
      const matchesJuz = selectedJuz === null || surah.juzStart === selectedJuz;

      // Type match
      const matchesType = selectedType === 'all' || surah.tempatTurun === selectedType;

      return matchesSearch && matchesJuz && matchesType;
    });
  }, [searchQuery, selectedJuz, selectedType]);

  // Calculate memorized stats per surah
  const getSurahHafalanStats = (surahNumber: number, totalAyat: number) => {
    let memorizedCount = 0;
    for (let v = 1; v <= totalAyat; v++) {
      const rec = hafalanRecords[`${surahNumber}_${v}`];
      if (rec && rec.status === 'memorized') {
        memorizedCount++;
      }
    }
    return {
      memorizedCount,
      percentage: totalAyat > 0 ? Math.round((memorizedCount / totalAyat) * 100) : 0
    };
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Mobile Search input */}
      <div className="md:hidden">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8A8D9A]" />
          <input
            type="text"
            placeholder="Cari surah, nomor, atau arti..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl bg-[#0F1115] border border-[#2A2D35] text-[#E2E2E2] placeholder-[#8A8D9A] shadow-sm focus:outline-none focus:border-[#D4AF37]"
          />
        </div>
      </div>

      {/* Filter Chips Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#0F1115] p-3 rounded-2xl border border-[#1F2128] shadow-sm">
        {/* Tempat Turun Filter */}
        <div className="flex flex-wrap items-center gap-1.5 bg-[#15171E] p-1.5 rounded-xl border border-[#2A2D35]">
          <button
            onClick={() => setSelectedType('all')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap cursor-pointer ${
              selectedType === 'all'
                ? 'bg-[#D4AF37] text-[#0A0A0B] shadow-sm font-bold'
                : 'text-[#8A8D9A] hover:text-[#E2E2E2] hover:bg-[#1A1C23]'
            }`}
          >
            Semua (114)
          </button>
          <button
            onClick={() => setSelectedType('Mekkah')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap cursor-pointer ${
              selectedType === 'Mekkah'
                ? 'bg-[#D4AF37] text-[#0A0A0B] shadow-sm font-bold'
                : 'text-[#8A8D9A] hover:text-[#E2E2E2] hover:bg-[#1A1C23]'
            }`}
          >
            Makkiyah
          </button>
          <button
            onClick={() => setSelectedType('Madinah')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap cursor-pointer ${
              selectedType === 'Madinah'
                ? 'bg-[#D4AF37] text-[#0A0A0B] shadow-sm font-bold'
                : 'text-[#8A8D9A] hover:text-[#E2E2E2] hover:bg-[#1A1C23]'
            }`}
          >
            Madaniyah
          </button>
        </div>

        {/* Juz Quick Selector Dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-[#8A8D9A]">Filter Juz:</span>
          <select
            value={selectedJuz ?? ''}
            onChange={(e) => setSelectedJuz(e.target.value ? Number(e.target.value) : null)}
            className="px-3 py-1.5 text-xs rounded-xl bg-[#15171E] border border-[#2A2D35] font-medium text-[#E2E2E2] focus:outline-none focus:border-[#D4AF37]"
          >
            <option value="">Semua Juz (1-30)</option>
            {Array.from({ length: 30 }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                Juz {i + 1}
              </option>
            ))}
          </select>
          {selectedJuz !== null && (
            <button
              onClick={() => setSelectedJuz(null)}
              className="text-xs text-[#D4AF37] hover:underline cursor-pointer"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Surah Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {filteredSurahs.map((surah) => {
          const isLastReadSurah = lastRead?.surahNumber === surah.nomor;
          const hafalanStats = getSurahHafalanStats(surah.nomor, surah.jumlahAyat);

          return (
            <div
              key={surah.nomor}
              onClick={() => onSelectSurah(surah.nomor)}
              className={`group relative bg-[#15171E] rounded-2xl p-4 border transition-all duration-200 hover:bg-[#1A1C23] hover:shadow-xl cursor-pointer flex flex-col justify-between ${
                isLastReadSurah
                  ? 'border-[#D4AF37] ring-1 ring-[#D4AF37]/30 bg-[#1A1C23]'
                  : 'border-[#1F2128] hover:border-[#D4AF37]/50'
              }`}
            >
              {/* Card Header: Number medallion + Names */}
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-3">
                    {/* Number Medallion */}
                    <div className="w-10 h-10 rounded-xl bg-[#0F1115] text-[#D4AF37] font-semibold text-sm flex items-center justify-center border border-[#2A2D35] shadow-inner group-hover:scale-105 group-hover:border-[#D4AF37]/40 transition-transform">
                      {surah.nomor}
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-[#E2E2E2] group-hover:text-[#D4AF37] transition-colors flex items-center gap-1.5">
                        {surah.namaLatin}
                        {isLastReadSurah && (
                          <span className="px-2 py-0.5 text-[9px] uppercase tracking-wider font-bold rounded-full bg-[#D4AF37] text-[#0A0A0B]">
                            Terakhir Dibaca
                          </span>
                        )}
                      </h2>
                      <p className="text-xs text-[#8A8D9A]">
                        {surah.arti} • <span className="font-medium text-[#D4AF37]">{surah.jumlahAyat} Ayat</span>
                      </p>
                    </div>
                  </div>

                  {/* Arabic Calligraphy Name */}
                  <div className="text-right">
                    <span className="font-arabic text-xl font-bold text-[#D4AF37]">
                      {surah.nama}
                    </span>
                  </div>
                </div>

                {/* Badges row: Mekkah/Madinah & Juz */}
                <div className="flex items-center justify-between text-[11px] text-[#6A6D7A] pt-2 border-t border-[#1F2128] mt-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-[#0F1115] text-[#8A8D9A] border border-[#2A2D35] font-medium">
                      {surah.tempatTurun}
                    </span>
                    <span className="text-[#6A6D7A]">
                      Juz {surah.juzStart}
                    </span>
                  </div>

                  {/* Quick Play Audio Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onPlaySurahAudio(surah.nomor);
                    }}
                    className="p-1.5 rounded-lg bg-[#0F1115] text-[#D4AF37] hover:bg-[#D4AF37] hover:text-[#0A0A0B] border border-[#2A2D35] transition-colors cursor-pointer"
                    title={`Putar Murottal Surah ${surah.namaLatin}`}
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                  </button>
                </div>
              </div>

              {/* Hafalan Progress Bar inside Surah card */}
              {hafalanStats.memorizedCount > 0 && (
                <div className="mt-3 pt-2 border-t border-dashed border-[#1F2128]">
                  <div className="flex items-center justify-between text-[11px] text-[#8A8D9A] mb-1">
                    <span className="flex items-center gap-1 font-medium">
                      <CheckCircle2 className="w-3 h-3 text-[#D4AF37]" />
                      Progres Hafalan
                    </span>
                    <span className="font-bold text-[#D4AF37]">{hafalanStats.memorizedCount}/{surah.jumlahAyat} ({hafalanStats.percentage}%)</span>
                  </div>
                  <div className="w-full bg-[#0F1115] h-1.5 rounded-full overflow-hidden border border-[#2A2D35]">
                    <div
                      className="bg-[#D4AF37] h-full rounded-full transition-all duration-300"
                      style={{ width: `${hafalanStats.percentage}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filteredSurahs.length === 0 && (
        <div className="text-center py-16 bg-white dark:bg-zinc-900 rounded-3xl border border-gray-100 dark:border-zinc-800">
          <BookOpen className="w-12 h-12 mx-auto text-emerald-300 dark:text-zinc-600 mb-3" />
          <h3 className="text-base font-bold text-gray-700 dark:text-zinc-300">Surah tidak ditemukan</h3>
          <p className="text-xs text-gray-500 dark:text-zinc-500 mt-1">
            Coba kata kunci lain atau hapus filter pendaftaran.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedJuz(null);
              setSelectedType('all');
            }}
            className="mt-4 px-4 py-2 text-xs font-semibold rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 transition"
          >
            Reset Semua Filter
          </button>
        </div>
      )}
    </div>
  );
};
