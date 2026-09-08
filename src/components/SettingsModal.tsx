import React, { useEffect, useState } from 'react';
import { useDialogAccessibility } from '../hooks/useDialogAccessibility';
import { ArabicFont, UserSettings } from '../types';
import { QARIS } from '../data/qaris';
import { X, Sliders, Type, Volume2, Monitor, Moon, Sun, Trash2, Cloud, Sparkles, BookOpen, Rows3, RotateCcw, Download } from 'lucide-react';

interface SettingsModalProps {
  settings: UserSettings;
  onUpdateSettings: (newSettings: Partial<UserSettings>) => void;
  onClose: () => void;
  onClearCache: () => void;
  onDownloadAllSurahs: (onProgress: (completed: number, total: number) => void) => Promise<void>;
  onCheckAllSurahsCached: () => Promise<boolean>;
  onResetProgress?: () => void;
  onOpenCloudSync?: () => void;
}

const ARABIC_FONT_OPTIONS: Array<{ value: ArabicFont; label: string }> = [
  { value: 'scheherazade_new', label: 'Scheherazade New' },
  { value: 'lpmq_isep_misbah', label: 'LPMQ Isep Misbah' },
  { value: 'amiri', label: 'Amiri' },
  { value: 'noto_naskh_arabic', label: 'Noto Naskh Arabic' }
];

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  onUpdateSettings,
  onClose,
  onClearCache,
  onDownloadAllSurahs,
  onCheckAllSurahsCached,
  onResetProgress,
  onOpenCloudSync
}) => {
  const dialogRef = useDialogAccessibility(onClose);
  const [cacheDownloadProgress, setCacheDownloadProgress] = useState<{ completed: number; total: number } | null>(null);
  const [cacheDownloadMessage, setCacheDownloadMessage] = useState('');
  const [allSurahsCached, setAllSurahsCached] = useState<boolean | null>(null);

  useEffect(() => {
    let active = true;
    onCheckAllSurahsCached()
      .then((cached) => { if (active) setAllSurahsCached(cached); })
      .catch(() => { if (active) setAllSurahsCached(false); });
    return () => { active = false; };
  }, [onCheckAllSurahsCached]);

  const handleDownloadAllSurahs = async () => {
    setCacheDownloadProgress({ completed: 0, total: 114 });
    setCacheDownloadMessage('');
    try {
      await onDownloadAllSurahs((completed, total) => setCacheDownloadProgress({ completed, total }));
      setAllSurahsCached(true);
      setCacheDownloadMessage('Seluruh data surah berhasil disimpan untuk akses offline.');
    } catch (error) {
      setCacheDownloadMessage(error instanceof Error ? error.message : 'Gagal mengunduh seluruh data surah.');
    } finally {
      setCacheDownloadProgress(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="settings-dialog-title" className="bg-[#15171E] rounded-3xl max-w-lg w-full p-6 space-y-6 shadow-2xl border border-[#1F2128] max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-[#1F2128]">
          <h2 id="settings-dialog-title" className="text-lg font-bold text-[#E2E2E2] flex items-center gap-2 font-serif-title">
            <Sliders className="w-5 h-5 text-[#D4AF37]" />
            <span>Pengaturan Aplikasi</span>
          </h2>
          <button
            onClick={onClose}
            aria-label="Tutup dialog"
            className="p-1 rounded-xl text-[#8A8D9A] hover:text-[#E2E2E2] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cloud Sync Firebase Banner */}
        {onOpenCloudSync && (
          <div className="p-4 rounded-2xl bg-linear-to-r from-[#D4AF37]/15 to-[#D4AF37]/5 border border-[#D4AF37]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#D4AF37]/20 border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37] shrink-0">
                <Cloud className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-[#E2E2E2] flex items-center gap-1.5">
                  <span>Cloud Save Firebase</span>
                  <Sparkles className="w-3 h-3 text-[#D4AF37]" />
                </h4>
                <p className="text-[10px] text-[#8A8D9A]">
                  Cadangkan pengaturan, bookmark, dan progres hafalan ke akun Google
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                onClose();
                onOpenCloudSync();
              }}
              className="px-3.5 py-1.5 rounded-xl bg-[#D4AF37] hover:bg-[#E5C358] text-[#0A0A0B] text-xs font-bold transition cursor-pointer shrink-0 shadow"
            >
              Buka Cloud Sync
            </button>
          </div>
        )}

        {/* Theme Settings */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-[#8A8D9A] uppercase tracking-wide flex items-center gap-2">
            <Sun className="w-4 h-4 text-[#D4AF37]" />
            <span>Tema Tampilan Aplikasi</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button type="button" aria-pressed={settings.theme === 'system'} onClick={() => onUpdateSettings({ theme: 'system' })} className={`p-3 rounded-2xl border flex items-center justify-center gap-2 text-xs font-bold transition cursor-pointer ${settings.theme === 'system' ? 'bg-[#1A1C23] border-[#D4AF37] text-[#D4AF37] ring-1 ring-[#D4AF37]/50' : 'bg-[#0F1115] border-[#2A2D35] text-[#8A8D9A] hover:text-[#E2E2E2]'}`}><Monitor className="w-4 h-4" />System (Default)</button>
            <button
              aria-pressed={settings.theme === 'dark'}
              onClick={() => onUpdateSettings({ theme: 'dark' })}
              className={`p-3 rounded-2xl border flex items-center justify-between text-xs font-bold transition cursor-pointer ${
                settings.theme === 'dark'
                  ? 'bg-[#1A1C23] border-[#D4AF37] text-[#D4AF37] ring-1 ring-[#D4AF37]/50'
                  : 'bg-[#0F1115] border-[#2A2D35] text-[#8A8D9A] hover:text-[#E2E2E2]'
              }`}
            >
              <span className="flex items-center gap-2">
                <Moon className="w-4 h-4" />
                <span>Dark</span>
              </span>
              {settings.theme === 'dark' && <span className="w-2 h-2 rounded-full bg-[#D4AF37]" />}
            </button>

            <button
              aria-pressed={settings.theme === 'light'}
                            onClick={() => onUpdateSettings({ theme: 'light' })}
              className={`p-3 rounded-2xl border flex items-center justify-between text-xs font-bold transition cursor-pointer ${
                settings.theme === 'light'
                  ? 'bg-[#1A1C23] border-[#D4AF37] text-[#D4AF37] ring-1 ring-[#D4AF37]/50'
                  : 'bg-[#0F1115] border-[#2A2D35] text-[#8A8D9A] hover:text-[#E2E2E2]'
              }`}
            >
              <span className="flex items-center gap-2">
                <Sun className="w-4 h-4" />
                <span>Light</span>
              </span>
              {settings.theme === 'light' && <span className="w-2 h-2 rounded-full bg-[#D4AF37]" />}
            </button>
          </div>
        </div>

        {/* Quran Display Modes */}
        <div className="space-y-3 border-t border-[#1F2128] pt-2">
          <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-[#8A8D9A]">
            <BookOpen className="h-4 w-4 text-[#D4AF37]" />
            <span>Model Tampilan Alquran</span>
          </h3>

          {([
            { key: 'readDisplayMode', label: 'Baca Alquran' },
            { key: 'hafalanDisplayMode', label: 'Mode Hafalan' }
          ] as const).map(({ key, label }) => (
            <div key={key} className="space-y-2 rounded-2xl border border-[#2A2D35] bg-[#0F1115] p-3">
              <p className="text-xs font-semibold text-[#E2E2E2]">{label}</p>
              <div className="grid grid-cols-2 gap-2" role="group" aria-label={`Tampilan ${label}`}>
                <button
                  type="button"
                  onClick={() => onUpdateSettings({ [key]: 'verse' })}
                  className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold transition cursor-pointer ${
                    settings[key] === 'verse'
                      ? 'border-[#D4AF37] bg-[#D4AF37]/15 text-[#D4AF37]'
                      : 'border-[#2A2D35] bg-[#15171E] text-[#8A8D9A] hover:text-[#E2E2E2]'
                  }`}
                  aria-pressed={settings[key] === 'verse'}
                >
                  <Rows3 className="h-4 w-4" />
                  Per Ayat
                </button>
                <button
                  type="button"
                  onClick={() => onUpdateSettings({ [key]: 'mushaf' })}
                  className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold transition cursor-pointer ${
                    settings[key] === 'mushaf'
                      ? 'border-[#D4AF37] bg-[#D4AF37]/15 text-[#D4AF37]'
                      : 'border-[#2A2D35] bg-[#15171E] text-[#8A8D9A] hover:text-[#E2E2E2]'
                  }`}
                  aria-pressed={settings[key] === 'mushaf'}
                >
                  <BookOpen className="h-4 w-4" />
                  Mushaf
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Arabic Typography Settings */}
        <div className="space-y-3">
          <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-[#8A8D9A]">
            <Type className="h-4 w-4 text-[#D4AF37]" />
            <span>Tulisan Arab</span>
          </h3>

          <div className="space-y-4 rounded-2xl border border-[#2A2D35] bg-[#0F1115] p-3">
            <label className="block space-y-2">
              <span className="text-xs font-semibold text-[#E2E2E2]">Font</span>
              <select
                value={settings.arabicFont}
                onChange={(event) => onUpdateSettings({ arabicFont: event.target.value as ArabicFont })}
                className="w-full rounded-xl border border-[#2A2D35] bg-[#15171E] px-3 py-2.5 text-sm font-semibold text-[#E2E2E2] outline-none transition focus:border-[#D4AF37]"
                aria-label="Pilih font tulisan Arab"
              >
                {ARABIC_FONT_OPTIONS.map((font) => (
                  <option key={font.value} value={font.value}>{font.label}</option>
                ))}
              </select>
            </label>

            <div className="space-y-2 border-t border-[#2A2D35] pt-4">
              <div className="flex items-center justify-between text-xs font-semibold text-[#E2E2E2]">
                <label htmlFor="arabic-font-size">Ukuran</label>
                <span className="text-[#D4AF37]">{settings.arabicFontSize}px</span>
              </div>
              <input
                id="arabic-font-size"
                type="range"
                min={20}
                max={48}
                value={settings.arabicFontSize}
                onChange={(e) => onUpdateSettings({ arabicFontSize: Number(e.target.value) })}
                className="w-full cursor-pointer accent-[#D4AF37]"
              />
              <div className="rounded-xl border border-[#2A2D35] bg-[#15171E] p-3 text-right font-arabic font-bold text-[#E2E2E2]" style={{ fontSize: `${settings.arabicFontSize}px` }}>
                بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
              </div>
            </div>
          </div>
        </div>

        {/* Display Toggles */}
        <div className="space-y-2 pt-2 border-t border-[#1F2128]">
          <h3 className="text-xs font-bold text-[#8A8D9A] uppercase tracking-wide">
            Tampilan, Terjemahan & Tajwid
          </h3>

          <label className="flex items-center justify-between p-3 rounded-2xl bg-[#0F1115] border border-[#2A2D35] cursor-pointer hover:border-[#D4AF37]/50 transition">
            <div className="space-y-0.5">
              <span className="text-xs font-semibold text-[#E2E2E2] flex items-center gap-1.5">
                <span>Tajwid Berwarna</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#D4AF37]/20 text-[#D4AF37] font-bold">Rekomendasi</span>
              </span>
              <span className="text-[10px] text-[#8A8D9A] block">
                Mewarnai hukum tajwid (ghunnah, ikhfa, idgham, mad, qalqalah, dll.)
              </span>
            </div>
            <input
              type="checkbox"
              checked={settings.enableColoredTajwid ?? true}
              onChange={(e) => onUpdateSettings({ enableColoredTajwid: e.target.checked })}
              className="w-4 h-4 accent-[#D4AF37] rounded cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between p-3 rounded-2xl bg-[#0F1115] border border-[#2A2D35] cursor-pointer">
            <span className="text-xs font-semibold text-[#E2E2E2]">
              Terjemahan Bahasa Indonesia
            </span>
            <input
              type="checkbox"
              checked={settings.showTranslation}
              onChange={(e) => onUpdateSettings({ showTranslation: e.target.checked })}
              className="w-4 h-4 accent-[#D4AF37] rounded cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between p-3 rounded-2xl bg-[#0F1115] border border-[#2A2D35] cursor-pointer">
            <span className="text-xs font-semibold text-[#E2E2E2]">
              Transliterasi Latin
            </span>
            <input
              type="checkbox"
              checked={settings.showLatin}
              onChange={(e) => onUpdateSettings({ showLatin: e.target.checked })}
              className="w-4 h-4 accent-[#D4AF37] rounded cursor-pointer"
            />
          </label>
        </div>

        {/* Qari Default */}
        <div className="space-y-2 pt-2 border-t border-[#1F2128]">
          <h3 className="text-xs font-bold text-[#8A8D9A] uppercase tracking-wide flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-[#D4AF37]" />
            <span>Qari Murottal Utama</span>
          </h3>
          <select
            value={settings.selectedQariId}
            onChange={(e) => onUpdateSettings({ selectedQariId: e.target.value })}
            className="w-full p-2.5 text-xs rounded-xl border border-[#2A2D35] bg-[#0F1115] text-[#E2E2E2] font-medium focus:outline-none focus:border-[#D4AF37]"
          >
            {QARIS.map((q) => (
              <option key={q.id} value={q.id}>
                {q.name} ({q.style})
              </option>
            ))}
          </select>
        </div>

        {/* Download All Cache, Clear Cache, & Reset Progress */}
        <div className="pt-2 border-t border-[#1F2128] space-y-2">
          <button
            onClick={() => void handleDownloadAllSurahs()}
            disabled={cacheDownloadProgress !== null || allSurahsCached !== false}
            className="w-full flex items-center justify-center gap-2 p-3 rounded-2xl bg-[#0F1115] border border-[#D4AF37]/40 text-[#D4AF37] font-semibold text-xs hover:bg-[#D4AF37]/10 transition cursor-pointer disabled:cursor-not-allowed disabled:opacity-70"
          >
            <Download className="w-4 h-4" />
            <span>{cacheDownloadProgress ? `Mengunduh Data Surah (${cacheDownloadProgress.completed}/${cacheDownloadProgress.total})` : allSurahsCached === true ? 'Seluruh Cache Data Surah Telah Diunduh' : allSurahsCached === null ? 'Memeriksa Cache Data Surah...' : 'Download Seluruh Cache Data Surah'}</span>
          </button>
          {cacheDownloadMessage && <p role="status" className="px-2 text-center text-[11px] text-[#8A8D9A]">{cacheDownloadMessage}</p>}

          <button
            onClick={onClearCache}
            className="w-full flex items-center justify-center gap-2 p-3 rounded-2xl bg-[#0F1115] border border-red-900/50 text-red-400 font-semibold text-xs hover:bg-red-950/20 transition cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span>Bersihkan Cache Data Surah</span>
          </button>

          {onResetProgress && (
            <button
              onClick={onResetProgress}
              className="w-full flex items-center justify-center gap-2 p-3 rounded-2xl bg-[#0F1115] border border-amber-900/50 text-amber-400 font-semibold text-xs hover:bg-amber-950/20 transition cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset Seluruh Progress Hafalan</span>
            </button>
          )}
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-xs font-bold rounded-xl bg-[#D4AF37] text-[#0A0A0B] hover:bg-[#B8962D] shadow cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
