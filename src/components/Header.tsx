import React, { useState } from 'react';
import {
  BookOpen,
  Brain,
  Bookmark,
  BarChart3,
  Moon,
  Sun,
  Search,
  Settings,
  RotateCcw,
  GraduationCap,
  Sparkles,
  Cloud,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { UserSettings, LastRead } from '../types';
import packageInfo from '../../package.json';

export type MainTabType = 'read' | 'hafalan' | 'ujian' | 'tajwid' | 'bookmark' | 'progress';

interface HeaderProps {
  activeTab: MainTabType;
  setActiveTab: (tab: MainTabType) => void;
  settings: UserSettings;
  updateSettings: (newSettings: Partial<UserSettings>) => void;
  lastRead: LastRead | null;
  onResumeLastRead: () => void;
  onOpenSettings: () => void;
  onOpenCloudSync: () => void;
  isCloudConnected?: boolean;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  bookmarksCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  settings,
  updateSettings,
  lastRead,
  onResumeLastRead,
  onOpenSettings,
  onOpenCloudSync,
  isCloudConnected = false,
  searchQuery,
  setSearchQuery,
  bookmarksCount
}) => {
  const [isNavCollapsed, setIsNavCollapsed] = useState(false);

  const toggleTheme = () => {
    const nextTheme = settings.theme === 'light' ? 'dark' : 'light';
    updateSettings({ theme: nextTheme });
  };

  return (
    <header className="sticky top-0 z-40 backdrop-blur-md bg-[#0F1115]/95 border-b border-[#1F2128] text-[#E2E2E2] shadow-xl transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Navbar Row */}
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo & Title */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('read')}>
            <img
              src="/quran-hafiz-logo.png"
              alt="Logo Quran Hafiz"
              className="w-10 h-10 object-contain"
            />
            <div>
              <h1 className="text-lg sm:text-xl font-bold tracking-wide text-[#D4AF37] font-serif-title flex items-center gap-2">
                Quran Hafiz
                <span className="text-xs text-[#8A8D9A] font-sans font-normal ml-0.5">v{packageInfo.version}</span>
              </h1>
            </div>
          </div>

          {/* Search Bar (When in Read or Hafalan tab) */}
          {(activeTab === 'read' || activeTab === 'hafalan') && (
            <div className="flex-1 max-w-md hidden md:block relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6A6D7A]" />
              <input
                type="text"
                placeholder="Cari nama surah, nomor, arti, atau Juz (contoh: Al-Kahf, 18, Juz 15)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-8 py-2 text-xs rounded-xl bg-[#1A1C23] border border-[#2A2D35] text-[#E2E2E2] placeholder-[#6A6D7A] focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]/50 transition"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#6A6D7A] hover:text-[#E2E2E2]"
                >
                  ✕
                </button>
              )}
            </div>
          )}

          {/* Actions & Utilities */}
          <div className="flex items-center gap-2">
            {/* Firebase Cloud Save button */}
            <button
              onClick={onOpenCloudSync}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                isCloudConnected
                  ? 'bg-emerald-950/30 border-emerald-700/50 text-emerald-300 hover:bg-emerald-900/40'
                  : 'bg-[#15171E] hover:bg-[#1A1C23] text-[#D4AF37] border-[#2A2D35]'
              }`}
              title="Cloud Save Firebase (Sinkronkan Data)"
            >
              <Cloud className="w-4 h-4 text-[#D4AF37]" />
              <span className="hidden sm:inline">
                {isCloudConnected ? 'Drive Terhubung' : 'Cloud Save'}
              </span>
              {isCloudConnected && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse" />
              )}
            </button>

            {/* Last Read Quick Resume */}
            {lastRead && (
              <button
                onClick={onResumeLastRead}
                title={`Lanjutkan Surah ${lastRead.surahName} Ayat ${lastRead.verseNumber}`}
                className="hidden lg:flex items-center gap-2 px-3 py-1.5 text-xs rounded-xl bg-[#15171E] hover:bg-[#1A1C23] text-[#D4AF37] border border-[#2A2D35] transition-all cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5 text-[#D4AF37] animate-spin-slow" />
                <span className="text-[#8A8D9A]">Terakhir: <strong className="text-[#E2E2E2] font-semibold">{lastRead.surahName} :{lastRead.verseNumber}</strong></span>
              </button>
            )}

            {/* Dark/Light mode toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl bg-[#1A1C23] text-[#D4AF37] hover:bg-[#2A2D35] border border-[#2A2D35] transition cursor-pointer"
              aria-label="Ganti tema"
            >
              {settings.theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>

            {/* Settings button */}
            <button
              onClick={onOpenSettings}
              className="p-2 rounded-xl bg-[#1A1C23] text-[#8A8D9A] hover:text-[#E2E2E2] hover:bg-[#2A2D35] border border-[#2A2D35] transition cursor-pointer"
              aria-label="Pengaturan tampilan dan audio"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        {!isNavCollapsed && (
        <nav className="flex flex-wrap items-center gap-1.5 sm:gap-2 py-2.5 border-t border-[#1F2128]">
          <button
            onClick={() => setActiveTab('read')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'read'
                ? 'bg-[#D4AF37] text-[#0A0A0B] shadow-lg shadow-[#D4AF37]/20 font-bold'
                : 'text-[#8A8D9A] hover:text-[#E2E2E2] hover:bg-[#15171E]'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span className={activeTab === 'read' ? '' : 'hidden sm:inline'}>Baca Al-Quran</span>
          </button>

          <button
            onClick={() => setActiveTab('hafalan')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'hafalan'
                ? 'bg-[#D4AF37] text-[#0A0A0B] shadow-lg shadow-[#D4AF37]/20 font-bold'
                : 'text-[#8A8D9A] hover:text-[#E2E2E2] hover:bg-[#15171E]'
            }`}
          >
            <Brain className="w-4 h-4" />
            <span className={activeTab === 'hafalan' ? '' : 'hidden sm:inline'}>Mode Hafalan</span>
            <span className={`px-1.5 py-0.2 text-[9px] rounded font-bold uppercase tracking-wider ${
              activeTab === 'hafalan' ? 'bg-[#0A0A0B] text-[#D4AF37]' : 'hidden sm:inline bg-[#1A1C23] text-[#D4AF37] border border-[#2A2D35]'
            }`}>Hafiz</span>
          </button>

          <button
            onClick={() => setActiveTab('ujian')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'ujian'
                ? 'bg-[#D4AF37] text-[#0A0A0B] shadow-lg shadow-[#D4AF37]/20 font-bold'
                : 'text-[#8A8D9A] hover:text-[#E2E2E2] hover:bg-[#15171E]'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span className={activeTab === 'ujian' ? '' : 'hidden sm:inline'}>Ujian Tahfidz</span>
            <span className={`px-1.5 py-0.2 text-[9px] rounded font-bold uppercase tracking-wider ${
              activeTab === 'ujian' ? 'bg-[#0A0A0B] text-[#D4AF37]' : 'hidden sm:inline bg-[#1A1C23] text-[#D4AF37] border border-[#2A2D35]'
            }`}>Ikhtibar</span>
          </button>

          <button
            onClick={() => setActiveTab('tajwid')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'tajwid'
                ? 'bg-[#D4AF37] text-[#0A0A0B] shadow-lg shadow-[#D4AF37]/20 font-bold'
                : 'text-[#8A8D9A] hover:text-[#E2E2E2] hover:bg-[#15171E]'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span className={activeTab === 'tajwid' ? '' : 'hidden sm:inline'}>Hukum Tajwid</span>
            <span className={`px-1.5 py-0.2 text-[9px] rounded font-bold uppercase tracking-wider ${
              activeTab === 'tajwid' ? 'bg-[#0A0A0B] text-[#D4AF37]' : 'hidden sm:inline bg-[#1A1C23] text-[#D4AF37] border border-[#2A2D35]'
            }`}>Tartil</span>
          </button>

          <button
            onClick={() => setActiveTab('bookmark')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'bookmark'
                ? 'bg-[#D4AF37] text-[#0A0A0B] shadow-lg shadow-[#D4AF37]/20 font-bold'
                : 'text-[#8A8D9A] hover:text-[#E2E2E2] hover:bg-[#15171E]'
            }`}
          >
            <Bookmark className="w-4 h-4" />
            <span className={activeTab === 'bookmark' ? '' : 'hidden sm:inline'}>Bookmark</span>
            {bookmarksCount > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                activeTab === 'bookmark' ? 'bg-[#0A0A0B] text-[#D4AF37]' : 'hidden sm:inline bg-[#D4AF37] text-[#0A0A0B]'
              }`}>
                {bookmarksCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('progress')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'progress'
                ? 'bg-[#D4AF37] text-[#0A0A0B] shadow-lg shadow-[#D4AF37]/20 font-bold'
                : 'text-[#8A8D9A] hover:text-[#E2E2E2] hover:bg-[#15171E]'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span className={activeTab === 'progress' ? '' : 'hidden sm:inline'}>Progres Hafalan</span>
          </button>
        </nav>
        )}

        <div className="flex h-4 items-end justify-end">
          <button
            type="button"
            onClick={() => setIsNavCollapsed((collapsed) => !collapsed)}
            aria-label={isNavCollapsed ? 'Perbesar navbar' : 'Kecilkan navbar'}
            aria-expanded={!isNavCollapsed}
            title={isNavCollapsed ? 'Perbesar navbar' : 'Kecilkan navbar'}
            className="flex h-4 w-9 items-center justify-center rounded-t-lg border border-b-0 border-[#2A2D35] bg-[#15171E] text-[#D4AF37] hover:bg-[#1A1C23] hover:border-[#D4AF37]/50 transition cursor-pointer"
          >
            {isNavCollapsed ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
          </button>
        </div>
      </div>
    </header>
  );
};
