import React, { useState } from 'react';
import { TAJWID_RULES, TajwidRuleInfo, TajwidRuleKey } from '../data/tajwidRules';
import {
  BookOpen,
  Search,
  Sparkles,
  Volume2,
  CheckCircle2,
  HelpCircle,
  Layers,
  ChevronRight,
  Info
} from 'lucide-react';

interface TajwidGuideViewProps {
  onOpenQuranForExample?: (surahNumber: number, verseNumber: number) => void;
}

interface ExampleSegment {
  text: string;
  highlighted: boolean;
}

const splitExampleByHighlights = (text: string, highlights: string[]): ExampleSegment[] => {
  const patterns = [...highlights].filter(Boolean).sort((a, b) => b.length - a.length);
  const segments: ExampleSegment[] = [];
  let cursor = 0;

  while (cursor < text.length) {
    const matchingPattern = patterns.find((pattern) => text.startsWith(pattern, cursor));

    if (matchingPattern) {
      segments.push({ text: matchingPattern, highlighted: true });
      cursor += matchingPattern.length;
      continue;
    }

    const nextHighlightIndex = patterns.reduce((nearest, pattern) => {
      const index = text.indexOf(pattern, cursor + 1);
      return index !== -1 && (nearest === -1 || index < nearest) ? index : nearest;
    }, -1);
    const plainTextEnd = nextHighlightIndex === -1 ? text.length : nextHighlightIndex;

    segments.push({ text: text.slice(cursor, plainTextEnd), highlighted: false });
    cursor = plainTextEnd;
  }

  return segments;
};

export const TajwidGuideView: React.FC<TajwidGuideViewProps> = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedRuleKey, setSelectedRuleKey] = useState<TajwidRuleKey>('ghunnah');

  const categories = [
    'Semua',
    'Tanda Waqaf',
    'Kaidah Ibtida\'',
    'Nun Sukun & Tanwin',
    'Mim Sukun',
    'Qalqalah',
    'Hukum Mad',
    'Ghunnah'
  ];

  const filteredRules = TAJWID_RULES.filter((rule) => {
    const matchesCat = selectedCategory === 'Semua' || rule.category === selectedCategory;
    const matchesSearch =
      rule.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rule.shortDesc.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rule.caraBaca.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rule.contohLafaz.includes(searchQuery);
    return matchesCat && matchesSearch;
  });

  const activeRule = TAJWID_RULES.find((r) => r.key === selectedRuleKey) || TAJWID_RULES[0];

  return (
    <div className="space-y-6 pb-28">
      {/* Top Banner Card */}
      <div className="bg-[#0F1115] rounded-3xl p-6 sm:p-8 border border-[#1F2128] relative overflow-hidden shadow-2xl">
        {/* Glow accent */}
        <div className="absolute -right-12 -bottom-12 w-56 h-56 bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/30 text-[#D4AF37] text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Panduan & Rujukan Tajwid Lengkap</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#E2E2E2] font-serif-title">
              Kajian Hukum Tajwid Al-Qur'an
            </h1>
            <p className="text-xs sm:text-sm text-[#8A8D9A] max-w-2xl leading-relaxed">
              Panduan lengkap kaidah tartil tilawah Al-Qur'an sesuai riwayat Imam Hafsh 'an 'Ashim. Dilengkapi pengkodean warna tajwid interaktif untuk mempermudah bacaan fasih dan hafalan mutqin.
            </p>
          </div>

          {/* Quick Stats / Legend Pill */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-[#15171E] p-3.5 rounded-2xl border border-[#2A2D35] shrink-0">
            <div className="text-center px-2">
              <span className="block text-xs font-bold text-pink-400">● Merah Muda</span>
              <span className="text-[10px] text-[#8A8D9A]">Ghunnah</span>
            </div>
            <div className="text-center px-2">
              <span className="block text-xs font-bold text-emerald-400">● Hijau</span>
              <span className="text-[10px] text-[#8A8D9A]">Idgham</span>
            </div>
            <div className="text-center px-2">
              <span className="block text-xs font-bold text-amber-400">● Oranye</span>
              <span className="text-[10px] text-[#8A8D9A]">Ikhfa</span>
            </div>
            <div className="text-center px-2">
              <span className="block text-xs font-bold text-red-500">● Merah</span>
              <span className="text-[10px] text-[#8A8D9A]">Mad Wajib/Lazim</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pb-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-[#D4AF37] text-[#0A0A0B] font-bold shadow'
                  : 'bg-[#0F1115] text-[#8A8D9A] hover:text-[#E2E2E2] border border-[#2A2D35]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-[#8A8D9A] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari hukum tajwid atau huruf..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-[#0F1115] border border-[#2A2D35] text-[#E2E2E2] placeholder-[#6A6D7A] focus:outline-none focus:border-[#D4AF37]"
          />
        </div>
      </div>

      {/* Main Grid: Left List + Right Detail View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Rules Grid (5 Cols on large) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-bold text-[#8A8D9A] uppercase tracking-wider">
              Daftar Hukum Tajwid ({filteredRules.length})
            </h3>
            <span className="text-[11px] text-[#6A6D7A]">Pilih untuk melihat detail</span>
          </div>

          <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
            {filteredRules.map((rule) => {
              const isSelected = rule.key === selectedRuleKey;
              return (
                <div
                  key={rule.key}
                  onClick={() => {
                    setSelectedRuleKey(rule.key);
                    if (window.innerWidth < 1024) {
                      document.getElementById('tajwid-detail-panel')?.scrollIntoView({ behavior: 'smooth' });
                    }
                  }}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    isSelected
                      ? 'bg-[#1A1C23] border-[#D4AF37] ring-1 ring-[#D4AF37]/50 shadow-lg'
                      : 'bg-[#0F1115] border-[#1F2128] hover:border-[#2A2D35] hover:bg-[#15171E]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {/* Color dot medallion */}
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 border"
                      style={{
                        backgroundColor: `${rule.color}20`,
                        borderColor: `${rule.color}50`,
                        color: rule.color
                      }}
                    >
                      ●
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-[#E2E2E2] flex items-center gap-2">
                        <span>{rule.name}</span>
                      </h4>
                      <span className="text-[10px] text-[#8A8D9A]">{rule.category}</span>
                    </div>
                  </div>

                  <ChevronRight
                    className={`w-4 h-4 transition ${
                      isSelected ? 'text-[#D4AF37] translate-x-1' : 'text-[#6A6D7A]'
                    }`}
                  />
                </div>
              );
            })}

            {filteredRules.length === 0 && (
              <div className="text-center py-12 bg-[#0F1115] rounded-2xl border border-[#1F2128]">
                <p className="text-xs text-[#8A8D9A]">Tidak ditemukan hukum tajwid yang sesuai pencarian.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Selected Rule Comprehensive Study Panel (7 Cols) */}
        <div className="lg:col-span-7" id="tajwid-detail-panel">
          <div className="bg-[#0F1115] rounded-3xl p-5 sm:p-7 border border-[#1F2128] space-y-6 shadow-xl sticky top-24">
            {/* Header of Active Rule */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#1F2128]">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-sm border"
                  style={{
                    backgroundColor: `${activeRule.color}25`,
                    borderColor: `${activeRule.color}60`,
                    color: activeRule.color
                  }}
                >
                  ●
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-[#8A8D9A] block">
                    {activeRule.category}
                  </span>
                  <h2 className="text-xl font-bold text-[#E2E2E2] font-serif-title">
                    {activeRule.name}
                  </h2>
                </div>
              </div>

              <span
                className="text-xs font-bold px-3 py-1 rounded-full border"
                style={{
                  backgroundColor: `${activeRule.color}15`,
                  color: activeRule.color,
                  borderColor: `${activeRule.color}40`
                }}
              >
                Kaidah Tajwid
              </span>
            </div>

            {/* Explanation & Definition */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-[#D4AF37] uppercase tracking-wider flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5" />
                <span>Pengertian & Kaidah Hukum</span>
              </h4>
              <p className="text-sm text-[#CCCCCC] leading-relaxed bg-[#15171E] p-4 rounded-2xl border border-[#2A2D35]">
                {activeRule.shortDesc}
              </p>
            </div>

            {/* Cara Membaca */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-[#D4AF37] uppercase tracking-wider flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5" />
                <span>Cara Membaca (Kaifiyatul Qira'ah)</span>
              </h4>
              <p className="text-sm text-[#E2E2E2] leading-relaxed bg-[#15171E] p-4 rounded-2xl border border-[#2A2D35]">
                {activeRule.caraBaca}
              </p>
            </div>

            {/* Huruf-Huruf Terkait */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-[#8A8D9A] uppercase tracking-wider">
                Huruf-Huruf Terkait ({activeRule.huruf.length})
              </h4>
              <div className="flex flex-wrap gap-2">
                {activeRule.huruf.map((h, i) => (
                  <span
                    key={i}
                    className="font-arabic font-bold text-lg px-3 py-1.5 rounded-xl bg-[#15171E] border border-[#2A2D35] text-[#D4AF37] shadow-inner"
                  >
                    {h}
                  </span>
                ))}
              </div>
            </div>

            {/* Contoh Lafaz Arab */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-[#8A8D9A] uppercase tracking-wider">
                Contoh Bacaan dalam Ayat Al-Qur'an
              </h4>
              <div className="p-5 rounded-2xl bg-[#15171E] border border-[#2A2D35] text-right">
                <p
                  className="font-arabic font-bold text-2xl sm:text-3xl leading-loose tracking-wide text-[#E2E2E2]"
                  dir="rtl"
                >
                  {splitExampleByHighlights(activeRule.contohLafaz, activeRule.contohSorotan).map((segment, index) => (
                    <span
                      key={`${index}-${segment.text}`}
                      style={segment.highlighted ? { color: activeRule.color } : undefined}
                    >
                      {segment.text}
                    </span>
                  ))}
                </p>
              </div>
            </div>

            {/* Summary Tip */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-[#D4AF37]/10 to-transparent border border-[#D4AF37]/20 flex items-start gap-3">
              <Sparkles className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
              <p className="text-xs text-[#8A8D9A] leading-relaxed">
                <strong>Tips Praktik:</strong> Anda dapat mengaktifkan fitur <em>"Tajwid Berwarna"</em> di menu <strong>Pengaturan</strong> agar setiap huruf di halaman Baca Al-Qur'an dan Mode Hafalan otomatis diberi tanda warna sesuai hukum tajwid ini.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
