import React, { useState } from 'react';
import { QARIS, getVerseAudioUrl } from '../data/qaris';
import { AudioPlaybackState, UserSettings, SurahDetail } from '../types';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Repeat,
  Volume2,
  VolumeX,
  Gauge,
  Sliders,
  ChevronUp,
  ChevronDown,
  X,
  Compass
} from 'lucide-react';

interface AudioPlayerBarProps {
  playbackState: AudioPlaybackState;
  currentSurah: SurahDetail | null;
  onPlayPause: () => void;
  onNextVerse: () => void;
  onPrevVerse: () => void;
  onSelectQari: (qariId: string) => void;
  onSetSpeed: (speed: number) => void;
  onSetLoopTarget: (count: number) => void;
  onClose: () => void;
  audioProgress: number; // 0 to 100
  currentTimeStr: string;
  durationTimeStr: string;
  onSeek: (percent: number) => void;
  settings: UserSettings;
}

export const AudioPlayerBar: React.FC<AudioPlayerBarProps> = ({
  playbackState,
  currentSurah,
  onPlayPause,
  onNextVerse,
  onPrevVerse,
  onSelectQari,
  onSetSpeed,
  onSetLoopTarget,
  onClose,
  audioProgress,
  currentTimeStr,
  durationTimeStr,
  onSeek,
  settings
}) => {
  const [showQariDropdown, setShowQariDropdown] = useState(false);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [showLoopMenu, setShowLoopMenu] = useState(false);

  const selectedQari = QARIS.find((q) => q.id === playbackState.qariId) || QARIS[0];

  if (!playbackState.surahNumber || !playbackState.verseNumber) {
    return null; // Hidden if no audio loaded
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#0F1115]/95 border-t border-[#1F2128] text-[#E2E2E2] backdrop-blur-md shadow-2xl transition-all">
      <input
        type="range"
        min={0}
        max={100}
        step={0.1}
        value={audioProgress}
        onChange={(event) => onSeek(Number(event.target.value))}
        aria-label="Posisi audio"
        className="block w-full h-1.5 accent-[#D4AF37] cursor-pointer"
      />

      <div className="max-w-7xl mx-auto px-4 py-2.5 sm:py-3 flex items-center justify-between gap-3">
        {/* Left: Surah & Verse Info + Qari Button */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-[#15171E] border border-[#2A2D35] flex items-center justify-center font-bold text-[#D4AF37] text-sm shrink-0">
            {playbackState.verseNumber}
          </div>
          <div className="min-w-0">
            <h4 className="text-xs sm:text-sm font-bold text-[#E2E2E2] truncate flex items-center gap-2">
              <span>{currentSurah?.namaLatin || `Surah ${playbackState.surahNumber}`}</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-[#1A1C23] text-[#D4AF37] border border-[#2A2D35]">
                Ayat {playbackState.verseNumber}
              </span>
            </h4>
            <button
              onClick={() => setShowQariDropdown(!showQariDropdown)}
              className="text-[11px] text-[#8A8D9A] hover:text-[#D4AF37] flex items-center gap-1 transition cursor-pointer truncate"
            >
              <span>{selectedQari.name}</span>
              <ChevronUp className="w-3 h-3 text-[#D4AF37]" />
            </button>
          </div>
        </div>

        {/* Center: Playback Controls */}
        <div className="flex items-center gap-2 sm:gap-4">
          <button
            onClick={onPrevVerse}
            className="p-2 rounded-xl text-[#8A8D9A] hover:text-[#E2E2E2] hover:bg-[#1A1C23] transition cursor-pointer"
            aria-label="Ayat sebelumnya"
          >
            <SkipBack className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
          </button>

          <button
            onClick={onPlayPause}
            className="p-3 rounded-2xl bg-[#D4AF37] text-[#0A0A0B] hover:bg-[#B8962D] font-bold shadow-lg shadow-[#D4AF37]/20 transition active:scale-95 cursor-pointer"
            aria-label={playbackState.isPlaying ? 'Jeda audio' : 'Putar audio'}
          >
            {playbackState.isPlaying ? (
              <Pause className="w-5 h-5 sm:w-6 sm:h-6 fill-current" />
            ) : (
              <Play className="w-5 h-5 sm:w-6 sm:h-6 fill-current pl-0.5" />
            )}
          </button>

          <button
            onClick={onNextVerse}
            className="p-2 rounded-xl text-[#8A8D9A] hover:text-[#E2E2E2] hover:bg-[#1A1C23] transition cursor-pointer"
            aria-label="Ayat selanjutnya"
          >
            <SkipForward className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
          </button>
        </div>

        {/* Right: Audio Speed & Looping Indicator */}
        <div className="flex items-center gap-2">
          {/* Repeat / Loop Modal Trigger */}
          <button
            onClick={() => setShowLoopMenu(!showLoopMenu)}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer border ${
              playbackState.repeatCountTarget > 1
                ? 'bg-[#D4AF37] text-[#0A0A0B] border-[#D4AF37]'
                : 'bg-[#15171E] text-[#8A8D9A] border-[#2A2D35] hover:text-[#E2E2E2]'
            }`}
            title="Pengaturan Looping Ayat"
          >
            <Repeat className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">
              {playbackState.repeatCountTarget > 1
                ? `Loop ${playbackState.repeatCountCurrent}/${playbackState.repeatCountTarget}x`
                : 'Loop 1x'}
            </span>
          </button>

          {/* Speed Selector */}
          <button
            onClick={() => setShowSpeedMenu(!showSpeedMenu)}
            className="px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-[#15171E] border border-[#2A2D35] text-[#8A8D9A] hover:text-[#E2E2E2] transition cursor-pointer"
            title="Kecepatan Putar Audio"
          >
            <Gauge className="w-3.5 h-3.5 inline mr-1 text-[#D4AF37]" />
            <span>{playbackState.playbackSpeed}x</span>
          </button>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[#8A8D9A] hover:text-[#E2E2E2] hover:bg-[#1A1C23] transition cursor-pointer shrink-0"
            aria-label="Tutup pemutar audio"
            title="Tutup pemutar audio"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Qari Selection Popup Dropdown */}
      {showQariDropdown && (
        <div className="absolute bottom-full left-2 right-2 sm:left-4 sm:right-auto sm:w-72 mb-2 bg-[#0F1115] border border-[#1F2128] rounded-2xl shadow-2xl p-2 z-50 animate-fade-in">
          <div className="flex items-center justify-between p-2 border-b border-[#1F2128] mb-1">
            <span className="text-xs font-bold text-[#D4AF37]">Pilih Qari Murottal:</span>
            <button onClick={() => setShowQariDropdown(false)} aria-label="Tutup pilihan qari" className="p-1 cursor-pointer">
              <X className="w-4 h-4 text-[#8A8D9A] hover:text-[#E2E2E2]" />
            </button>
          </div>
          <div className="max-h-60 overflow-y-auto space-y-1">
            {QARIS.map((qari) => (
              <button
                key={qari.id}
                onClick={() => {
                  onSelectQari(qari.id);
                  setShowQariDropdown(false);
                }}
                className={`w-full text-left p-2 rounded-xl text-xs flex items-center justify-between transition cursor-pointer ${
                  playbackState.qariId === qari.id
                    ? 'bg-[#D4AF37] text-[#0A0A0B] font-bold'
                    : 'text-[#E2E2E2] hover:bg-[#15171E]'
                }`}
              >
                <div>
                  <div className="font-semibold">{qari.name}</div>
                  <div className="text-[10px] opacity-80">{qari.style}</div>
                </div>
                <span className="font-arabic text-sm">{qari.arabicName}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Speed Menu Popup */}
      {showSpeedMenu && (
        <div className="absolute bottom-full right-2 sm:right-16 mb-2 bg-[#0F1115] border border-[#1F2128] rounded-2xl shadow-2xl p-2 z-50 animate-fade-in flex flex-col gap-1 w-48 max-w-[calc(100vw-1rem)]">
          <span className="text-[10px] font-bold text-[#D4AF37] px-2 py-1">Kecepatan:</span>
          {[0.75, 1, 1.25, 1.5, 2].map((s) => (
            <button
              key={s}
              onClick={() => {
                onSetSpeed(s);
                setShowSpeedMenu(false);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold text-left cursor-pointer ${
                playbackState.playbackSpeed === s
                  ? 'bg-[#D4AF37] text-[#0A0A0B] font-bold'
                  : 'text-[#E2E2E2] hover:bg-[#15171E]'
              }`}
            >
              {s}x {s === 1 ? '(Normal)' : s < 1 ? '(Lambat / Tartil)' : '(Cepat)'}
            </button>
          ))}
        </div>
      )}

      {/* Loop Menu Popup */}
      {showLoopMenu && (
        <div className="absolute bottom-full right-2 sm:right-4 mb-2 bg-[#0F1115] border border-[#1F2128] rounded-2xl shadow-2xl p-2 z-50 animate-fade-in flex flex-col gap-1 w-52 max-w-[calc(100vw-1rem)]">
          <span className="text-[10px] font-bold text-[#D4AF37] px-2 py-1">Ulang Ayat (Perulangan):</span>
          {[1, 3, 5, 10, 20].map((c) => (
            <button
              key={c}
              onClick={() => {
                onSetLoopTarget(c);
                setShowLoopMenu(false);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold text-left cursor-pointer ${
                playbackState.repeatCountTarget === c
                  ? 'bg-[#D4AF37] text-[#0A0A0B] font-bold'
                  : 'text-[#E2E2E2] hover:bg-[#15171E]'
              }`}
            >
              {c === 1 ? 'Tanpa Perulangan (1x)' : `Ulang ${c} Kali`}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
