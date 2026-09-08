import React, { useEffect, useRef, useState } from 'react';
import {
  BookOpen,
  Brain,
  Bookmark,
  BarChart3,
  Monitor,
  Moon,
  Sun,
  Search,
  Settings,
  RotateCcw,
  GraduationCap,
  Sparkles,
  ArrowLeftRight,
  User,
  Menu
} from 'lucide-react';
import { UserSettings, LastRead } from '../types';
import packageInfo from '../../package.json';

export type MainTabType = 'read' | 'hafalan' | 'ujian' | 'tajwid' | 'bookmark' | 'progress';

interface HeaderProps {
  learningRoomOpen?: boolean;
  onToggleLearningRoom?: () => void;
  teacherMode?: boolean;
  setTeacherMode?: (teacher: boolean) => void;
  activeTab: MainTabType;
  isSurahListView: boolean;
  setActiveTab: (tab: MainTabType) => void;
  settings: UserSettings;
  updateSettings: (newSettings: Partial<UserSettings>) => void;
  lastRead: LastRead | null;
  onResumeLastRead: () => void;
  onOpenSettings: () => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  bookmarksCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  learningRoomOpen = false,
  onToggleLearningRoom,
  teacherMode = false,
  setTeacherMode,
  activeTab,
  isSurahListView,
  setActiveTab,
  settings,
  updateSettings,
  lastRead,
  onResumeLastRead,
  onOpenSettings,
  searchQuery,
  setSearchQuery,
  bookmarksCount
}) => {
  const [online, setOnline] = useState(navigator.onLine);
  const [headerHidden, setHeaderHidden] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const lastScrollY = useRef(window.scrollY);
  const mobileNavRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => { window.removeEventListener('online', update); window.removeEventListener('offline', update); };
  }, []);

  useEffect(() => {
    if (!mobileNavOpen) return;

    const closeOnOutsideClick = (event: PointerEvent) => {
      if (!mobileNavRef.current?.contains(event.target as Node)) setMobileNavOpen(false);
    };

    document.addEventListener('pointerdown', closeOnOutsideClick);
    return () => document.removeEventListener('pointerdown', closeOnOutsideClick);
  }, [mobileNavOpen]);

  useEffect(() => {
    let frameId: number | null = null;
    const updateHeaderVisibility = () => {
      const currentScrollY = Math.max(window.scrollY, 0);
      const scrollDifference = currentScrollY - lastScrollY.current;

      if (currentScrollY <= 16) {
        setHeaderHidden(false);
      } else if (scrollDifference > 4) {
        setHeaderHidden(true);
      } else if (scrollDifference < -4) {
        setHeaderHidden(false);
      }

      lastScrollY.current = currentScrollY;
      frameId = null;
    };
    const handleScroll = () => {
      if (frameId === null) frameId = window.requestAnimationFrame(updateHeaderVisibility);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (frameId !== null) window.cancelAnimationFrame(frameId);
    };
  }, []);

  const toggleTheme = () => {
    const nextTheme = settings.theme === 'system' ? 'dark' : settings.theme === 'dark' ? 'light' : 'system';
    updateSettings({ theme: nextTheme });
  };

  return (
    <header className={`sticky top-0 z-40 backdrop-blur-md bg-[#0F1115]/95 border-b border-[#1F2128] text-[#E2E2E2] shadow-xl transition-transform duration-300 ease-out ${headerHidden ? '-translate-y-full' : 'translate-y-0'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Navbar Row */}
        <div className="flex items-center justify-between min-h-16 py-3 gap-3 flex-wrap">
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <img
              src="/quran-hafiz-logo.png"
              alt="Logo Quran Hafiz"
              className="w-10 h-10 object-contain"
            />
            <div>
              <h1 className="text-lg sm:text-xl font-bold tracking-wide text-[#D4AF37] font-serif-title flex items-center gap-2">
                Quran Hafiz
                <span role="status" aria-label={online ? 'Online' : 'Offline'} title={online ? 'Online' : 'Offline'} className={`h-2.5 w-2.5 shrink-0 rounded-full ${online ? 'bg-green-500' : 'bg-red-500'}`} />
              </h1>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className="text-xs text-[#8A8D9A]">v{packageInfo.version}</span>
                <button
                  type="button"
                  onClick={() => setTeacherMode?.(!teacherMode)}
                  aria-label={teacherMode ? 'Mode Guru aktif. Klik untuk beralih ke Mode Murid' : 'Mode Murid aktif. Klik untuk beralih ke Mode Guru'}
                  title={teacherMode ? 'Klik untuk beralih ke Mode Murid' : 'Klik untuk beralih ke Mode Guru'}
                  className={`group flex items-center gap-1.5 rounded-xl border px-2.5 py-1 text-xs font-semibold transition cursor-pointer shadow-sm ${
                    teacherMode
                      ? 'border-[#D4AF37] bg-[#D4AF37]/15 text-[#D4AF37] hover:bg-[#D4AF37]/25'
                      : 'border-[#383C4A] bg-[#161820] text-[#E2E2E2] hover:border-[#D4AF37] hover:text-[#D4AF37]'
                  }`}
                >
                  {teacherMode ? (
                    <GraduationCap className="w-3.5 h-3.5 text-[#D4AF37]" />
                  ) : (
                    <User className="w-3.5 h-3.5 text-[#D4AF37]" />
                  )}
                  <span>{teacherMode ? 'Guru' : 'Murid'}</span>
                  <ArrowLeftRight className="w-3 h-3 text-[#8A8D9A] group-hover:text-[#D4AF37] transition-transform group-hover:rotate-180" />
                </button>

                {!teacherMode && (
                  <button
                    type="button"
                    onClick={onToggleLearningRoom}
                    aria-pressed={learningRoomOpen}
                    aria-label="Ruang Belajar"
                    title="Ruang Belajar"
                    className={`flex items-center gap-1.5 rounded-xl border px-2.5 py-1 text-xs font-semibold transition cursor-pointer shadow-sm ${
                      learningRoomOpen
                        ? 'bg-[#D4AF37] text-[#0A0A0B] border-[#D4AF37]'
                        : 'border-[#383C4A] bg-[#161820] text-[#D4AF37] hover:bg-[#1A1C23] hover:border-[#D4AF37]'
                    }`}
                  >
                    <GraduationCap className="w-3.5 h-3.5" />
                    <span>Ruang Belajar</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Global surah search is only available on the reading tab. */}
          {!teacherMode && !learningRoomOpen && activeTab === 'read' && isSurahListView && (
            <div className="flex-1 max-w-md hidden md:block relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6A6D7A]" />
              <input
                type="text"
                placeholder="Cari nama, nomor, atau arti surah..."
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
            {/* Last Read Quick Resume */}
            {!teacherMode && !learningRoomOpen && lastRead && (
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
              className={`${teacherMode ? 'flex' : 'hidden sm:flex'} p-2 rounded-xl bg-[#1A1C23] text-[#D4AF37] hover:bg-[#2A2D35] border border-[#2A2D35] transition cursor-pointer`}
              aria-label={`Ganti tema (saat ini: ${settings.theme})`}
              title={`Tema: ${settings.theme} · Klik untuk mengganti`}
            >
              {settings.theme === 'system' ? <Monitor className="w-4 h-4" /> : settings.theme === 'dark' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>

            {/* Settings button */}
            <button
              onClick={onOpenSettings}
              className={`${teacherMode ? 'flex' : 'hidden sm:flex'} p-2 rounded-xl bg-[#1A1C23] text-[#8A8D9A] hover:text-[#E2E2E2] hover:bg-[#2A2D35] border border-[#2A2D35] transition cursor-pointer`}
              aria-label="Pengaturan tampilan dan audio"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        {!teacherMode && (
        <div className="flex items-center justify-between gap-1.5 border-t border-[#1F2128]">
          <div ref={mobileNavRef} className="relative flex flex-1 items-center gap-1.5 py-2.5 sm:hidden">
            {([
              ['read', 'Baca Al-Quran', BookOpen],
              ['hafalan', 'Mode Hafalan', Brain],
              ['ujian', 'Ujian Tahfidz', GraduationCap],
              ['tajwid', 'Hukum Tajwid', Sparkles],
              ['bookmark', 'Bookmark', Bookmark],
              ['progress', 'Progres Hafalan', BarChart3]
            ] as const).filter(([tab]) => tab === activeTab).map(([tab, label, Icon]) => (
              <button
                key={tab}
                type="button"
                onClick={() => setMobileNavOpen(open => !open)}
                aria-label={`Menu aktif: ${label}. Klik untuk memilih menu navigasi`}
                aria-haspopup="menu"
                aria-expanded={mobileNavOpen}
                className="flex min-w-0 flex-1 items-center gap-2 rounded-xl bg-[#D4AF37] px-3.5 py-2 text-xs font-bold text-[#0A0A0B] shadow-lg shadow-[#D4AF37]/20 cursor-pointer"
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{label}</span>
                {tab === 'bookmark' && bookmarksCount > 0 && (
                  <span className="rounded-full bg-[#0A0A0B] px-1.5 py-0.5 text-[10px] font-bold text-[#D4AF37]">{bookmarksCount}</span>
                )}
              </button>
            ))}

            <button
              type="button"
              onClick={() => setMobileNavOpen(open => !open)}
              aria-label="Pilih menu navigasi"
              aria-haspopup="menu"
              aria-expanded={mobileNavOpen}
              className={`shrink-0 rounded-xl border p-2 transition cursor-pointer ${mobileNavOpen ? 'border-[#D4AF37] bg-[#D4AF37]/15 text-[#D4AF37]' : 'border-[#2A2D35] bg-[#1A1C23] text-[#E2E2E2] hover:border-[#D4AF37]'}`}
            >
              <Menu className="h-4 w-4" />
            </button>

            {mobileNavOpen && (
              <div role="menu" className="absolute left-0 top-full z-50 mt-1 w-64 overflow-hidden rounded-xl border border-[#2A2D35] bg-[#15171E] p-1.5 shadow-2xl">
                {([
                  ['read', 'Baca Al-Quran', BookOpen],
                  ['hafalan', 'Mode Hafalan', Brain],
                  ['ujian', 'Ujian Tahfidz', GraduationCap],
                  ['tajwid', 'Hukum Tajwid', Sparkles],
                  ['bookmark', 'Bookmark', Bookmark],
                  ['progress', 'Progres Hafalan', BarChart3]
                ] as const).map(([tab, label, Icon]) => (
                  <button
                    key={tab}
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setActiveTab(tab);
                      setMobileNavOpen(false);
                    }}
                    className={`flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm transition cursor-pointer ${activeTab === tab ? 'bg-[#D4AF37] font-bold text-[#0A0A0B]' : 'text-[#E2E2E2] hover:bg-[#20232B]'}`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="flex-1">{label}</span>
                    {tab === 'bookmark' && bookmarksCount > 0 && (
                      <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${activeTab === tab ? 'bg-[#0A0A0B] text-[#D4AF37]' : 'bg-[#D4AF37] text-[#0A0A0B]'}`}>{bookmarksCount}</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          <nav className="hidden flex-1 flex-wrap items-center gap-1.5 py-2.5 sm:flex sm:gap-2">
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

        {/* Khusus mobile: pindahkan theme selector dan setting ke sebelah navbar */}
        <div className="flex sm:hidden items-center gap-1.5 py-2 shrink-0 border-l border-[#1F2128] pl-2">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl bg-[#1A1C23] text-[#D4AF37] hover:bg-[#2A2D35] border border-[#2A2D35] transition cursor-pointer"
            aria-label={`Ganti tema (saat ini: ${settings.theme})`}
            title={`Tema: ${settings.theme} · Klik untuk mengganti`}
          >
            {settings.theme === 'system' ? <Monitor className="w-4 h-4" /> : settings.theme === 'dark' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </button>

          <button
            onClick={onOpenSettings}
            className="p-2 rounded-xl bg-[#1A1C23] text-[#8A8D9A] hover:text-[#E2E2E2] hover:bg-[#2A2D35] border border-[#2A2D35] transition cursor-pointer"
            aria-label="Pengaturan tampilan dan audio"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
      )}
      </div>
    </header>
  );
};
