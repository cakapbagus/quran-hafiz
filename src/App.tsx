import React, { useState, useEffect, useRef } from 'react';
import {
  SurahDetail,
  Verse,
  Bookmark,
  HafalanVerseRecord,
  LastRead,
  UserSettings,
  AudioPlaybackState
} from './types';
import { ALL_SURAHS } from './data/surahList';
import { getVerseAudioUrl, QARIS } from './data/qaris';
import { fetchSurahDetail } from './services/quranApi';
import {
  getStoredSettings,
  saveStoredSettings,
  getStoredBookmarks,
  saveBookmark,
  removeBookmark,
  isVerseBookmarked,
  getStoredHafalanRecords,
  updateHafalanRecord,
  getStoredLastRead,
  saveLastRead,
  saveStoredBookmarks,
  saveStoredHafalanRecords,
  DEFAULT_SETTINGS
} from './services/storageService';
import {
  getStoredAccessToken,
  getStoredGoogleUser,
  uploadCloudBackup,
  buildBackupPayload
} from './services/googleDriveService';

import { Header, MainTabType } from './components/Header';
import { SurahList } from './components/SurahList';
import { VerseList } from './components/VerseList';
import { HafalanModeView } from './components/HafalanModeView';
import { BookmarksView } from './components/BookmarksView';
import { HafalanProgressView } from './components/HafalanProgressView';
import { ModeUjianTahfidzView } from './components/ModeUjianTahfidzView';
import { TajwidGuideView } from './components/TajwidGuideView';
import { SettingsModal } from './components/SettingsModal';
import { CloudSyncModal } from './components/CloudSyncModal';
import { VoiceRecorderModal } from './components/VoiceRecorderModal';
import { AudioPlayerBar } from './components/AudioPlayerBar';

export default function App() {
  const [activeTab, setActiveTab] = useState<MainTabType>('read');
  const [selectedSurahNumber, setSelectedSurahNumber] = useState<number | null>(null);
  const [currentSurahDetail, setCurrentSurahDetail] = useState<SurahDetail | null>(null);
  const [isLoadingSurah, setIsLoadingSurah] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Local Storage states
  const [settings, setSettings] = useState<UserSettings>(getStoredSettings());
  const [bookmarks, setBookmarks] = useState<Bookmark[]>(getStoredBookmarks());
  const [hafalanRecords, setHafalanRecords] = useState<Record<string, HafalanVerseRecord>>(getStoredHafalanRecords());
  const [lastRead, setLastRead] = useState<LastRead | null>(getStoredLastRead());

  // Cloud Sync state
  const [isCloudSyncOpen, setIsCloudSyncOpen] = useState<boolean>(false);
  const [isCloudConnected, setIsCloudConnected] = useState<boolean>(!!getStoredAccessToken());

  // Modals & Popups
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [voiceRecorderVerse, setVoiceRecorderVerse] = useState<{ surahNumber: number; verseNumber: number } | null>(null);
  const [playbackState, setPlaybackState] = useState<AudioPlaybackState>({
    isPlaying: false,
    surahNumber: null,
    verseNumber: null,
    qariId: settings.selectedQariId || 'mishary',
    playbackSpeed: 1.0,
    loopMode: 'none',
    repeatCountCurrent: 1,
    repeatCountTarget: 1,
    rangeStartVerse: null,
    rangeEndVerse: null,
    autoScrollEnabled: true
  });

  const [audioProgress, setAudioProgress] = useState<number>(0);
  const [currentTimeStr, setCurrentTimeStr] = useState<string>('00:00');
  const [durationTimeStr, setDurationTimeStr] = useState<string>('00:00');

  // Audio HTML Element Ref
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Apply Dark/Light theme class to html element
  useEffect(() => {
    if (settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    saveStoredSettings(settings);
  }, [settings]);

  // Debounced auto-sync with Google Drive if enabled & connected
  useEffect(() => {
    if (!settings.autoCloudSync) return;
    const token = getStoredAccessToken();
    if (!token) return;

    const timer = setTimeout(() => {
      const payload = buildBackupPayload(
        settings,
        bookmarks,
        hafalanRecords,
        lastRead,
        getStoredGoogleUser()?.email
      );
      uploadCloudBackup(token, payload).catch((e) => {
        console.warn('Background auto-sync failed silently:', e);
      });
    }, 4000);

    return () => clearTimeout(timer);
  }, [bookmarks, hafalanRecords, settings, lastRead]);

  // Sync HTML5 Audio element
  useEffect(() => {
    const audio = new Audio();
    audioRef.current = audio;

    const handleTimeUpdate = () => {
      if (audio.duration) {
        const pct = (audio.currentTime / audio.duration) * 100;
        setAudioProgress(pct);

        const curMin = Math.floor(audio.currentTime / 60);
        const curSec = Math.floor(audio.currentTime % 60);
        setCurrentTimeStr(`${String(curMin).padStart(2, '0')}:${String(curSec).padStart(2, '0')}`);

        const durMin = Math.floor(audio.duration / 60);
        const durSec = Math.floor(audio.duration % 60);
        setDurationTimeStr(`${String(durMin).padStart(2, '0')}:${String(durSec).padStart(2, '0')}`);
      }
    };

    const handleEnded = () => {
      setPlaybackState((prev) => {
        if (!prev.surahNumber || !prev.verseNumber) return prev;

        // Check repetition / looping logic
        if (prev.repeatCountCurrent < prev.repeatCountTarget) {
          // Replay same verse
          setTimeout(() => {
            if (audioRef.current) {
              audioRef.current.currentTime = 0;
              audioRef.current.play().catch(console.error);
            }
          }, 300);

          return {
            ...prev,
            repeatCountCurrent: prev.repeatCountCurrent + 1
          };
        }

        // Target repetitions completed for current verse -> advance to next verse in range or surah
        let nextVerseNum = prev.verseNumber + 1;
        const maxVerse = prev.rangeEndVerse || currentSurahDetail?.jumlahAyat || 286;

        if (nextVerseNum <= maxVerse) {
          // Play next verse
          setTimeout(() => {
            playVerseAudioInternal(prev.surahNumber!, nextVerseNum, prev.qariId, prev.playbackSpeed);
          }, 400);

          return {
            ...prev,
            verseNumber: nextVerseNum,
            repeatCountCurrent: 1
          };
        } else {
          // Reached end of range or surah
          return {
            ...prev,
            isPlaying: false,
            repeatCountCurrent: 1
          };
        }
      });
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.pause();
    };
  }, [currentSurahDetail]);

  // Load Surah Detail when selectedSurahNumber changes
  useEffect(() => {
    if (selectedSurahNumber === null) return;

    let isMounted = true;
    setIsLoadingSurah(true);

    fetchSurahDetail(selectedSurahNumber)
      .then((detail) => {
        if (isMounted) {
          setCurrentSurahDetail(detail);
          setIsLoadingSurah(false);
        }
      })
      .catch((err) => {
        console.error('Failed to load surah detail:', err);
        if (isMounted) setIsLoadingSurah(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedSurahNumber]);

  // Helper to play audio
  const playVerseAudioInternal = (
    surahNum: number,
    verseNum: number,
    qariId: string,
    speed: number
  ) => {
    if (!audioRef.current) return;

    // Determine audio url
    const verseObj = currentSurahDetail?.ayat.find((v) => v.nomorAyat === verseNum);
    const audioUrl = getVerseAudioUrl(surahNum, verseNum, qariId, verseObj?.audio);

    audioRef.current.src = audioUrl;
    audioRef.current.playbackRate = speed;
    audioRef.current.play().then(() => {
      setPlaybackState((prev) => ({
        ...prev,
        isPlaying: true,
        surahNumber: surahNum,
        verseNumber: verseNum,
        qariId,
        playbackSpeed: speed
      }));

      // Update last read position
      const surahMeta = ALL_SURAHS.find((s) => s.nomor === surahNum);
      const newLastRead: LastRead = {
        surahNumber: surahNum,
        surahName: surahMeta?.namaLatin || `Surah ${surahNum}`,
        verseNumber: verseNum,
        timestamp: new Date().toISOString()
      };
      setLastRead(newLastRead);
      saveLastRead(newLastRead);

      // Auto scroll to verse
      const elem = document.getElementById(`verse-${surahNum}-${verseNum}`);
      if (elem) {
        elem.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }).catch((e) => {
      console.warn('Audio playback interrupted or failed:', e);
    });
  };

  const handlePlayVerse = (verseNumber: number) => {
    if (!currentSurahDetail) return;
    playVerseAudioInternal(
      currentSurahDetail.nomor,
      verseNumber,
      playbackState.qariId,
      playbackState.playbackSpeed
    );
  };

  const handlePlayRangeAudio = (startVerse: number, endVerse: number, repeatCount: number) => {
    if (!currentSurahDetail) return;
    setPlaybackState((prev) => ({
      ...prev,
      repeatCountTarget: repeatCount,
      repeatCountCurrent: 1,
      rangeStartVerse: startVerse,
      rangeEndVerse: endVerse
    }));
    playVerseAudioInternal(
      currentSurahDetail.nomor,
      startVerse,
      playbackState.qariId,
      playbackState.playbackSpeed
    );
  };

  const handlePauseAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setPlaybackState((prev) => ({ ...prev, isPlaying: false }));
  };

  const handlePlayPauseToggle = () => {
    if (!audioRef.current) return;
    if (playbackState.isPlaying) {
      handlePauseAudio();
    } else {
      if (playbackState.surahNumber && playbackState.verseNumber) {
        audioRef.current.play().then(() => {
          setPlaybackState((prev) => ({ ...prev, isPlaying: true }));
        });
      } else if (currentSurahDetail) {
        handlePlayVerse(1);
      }
    }
  };

  const handleNextVerse = () => {
    if (!playbackState.surahNumber || !playbackState.verseNumber) return;
    const maxVerse = currentSurahDetail?.jumlahAyat || 286;
    if (playbackState.verseNumber < maxVerse) {
      handlePlayVerse(playbackState.verseNumber + 1);
    }
  };

  const handlePrevVerse = () => {
    if (!playbackState.surahNumber || !playbackState.verseNumber) return;
    if (playbackState.verseNumber > 1) {
      handlePlayVerse(playbackState.verseNumber - 1);
    }
  };

  const handleSelectQari = (qariId: string) => {
    setPlaybackState((prev) => ({ ...prev, qariId }));
    setSettings((prev) => ({ ...prev, selectedQariId: qariId }));

    // Replay with new qari if currently playing
    if (playbackState.surahNumber && playbackState.verseNumber) {
      playVerseAudioInternal(
        playbackState.surahNumber,
        playbackState.verseNumber,
        qariId,
        playbackState.playbackSpeed
      );
    }
  };

  const handleSetSpeed = (speed: number) => {
    if (audioRef.current) {
      audioRef.current.playbackRate = speed;
    }
    setPlaybackState((prev) => ({ ...prev, playbackSpeed: speed }));
  };

  const handleSetLoopTarget = (count: number) => {
    setPlaybackState((prev) => ({
      ...prev,
      repeatCountTarget: count,
      repeatCountCurrent: 1
    }));
  };

  const handleSeek = (percent: number) => {
    if (audioRef.current && audioRef.current.duration) {
      audioRef.current.currentTime = (percent / 100) * audioRef.current.duration;
    }
  };

  // Bookmark handlers
  const handleToggleBookmark = (verse: Verse, note?: string) => {
    if (!currentSurahDetail) return;
    if (isVerseBookmarked(currentSurahDetail.nomor, verse.nomorAyat)) {
      removeBookmark(currentSurahDetail.nomor, verse.nomorAyat);
    } else {
      saveBookmark({
        surahNumber: currentSurahDetail.nomor,
        surahName: currentSurahDetail.namaLatin,
        verseNumber: verse.nomorAyat,
        verseArab: verse.teksArab,
        verseTranslation: verse.teksIndonesia,
        note
      });
    }
    setBookmarks(getStoredBookmarks());
  };

  const handleRemoveBookmark = (surahNumber: number, verseNumber: number) => {
    removeBookmark(surahNumber, verseNumber);
    setBookmarks(getStoredBookmarks());
  };

  // Hafalan Record Handler
  const handleUpdateHafalanStatus = (
    verseNumber: number,
    status: HafalanVerseRecord['status']
  ) => {
    if (!currentSurahDetail) return;
    updateHafalanRecord(currentSurahDetail.nomor, verseNumber, { status });
    setHafalanRecords(getStoredHafalanRecords());
  };

  // Navigation handlers
  const handleSelectSurah = (surahNum: number) => {
    setSelectedSurahNumber(surahNum);
    setActiveTab('read');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleResumeLastRead = () => {
    if (lastRead) {
      setSelectedSurahNumber(lastRead.surahNumber);
      setActiveTab('read');
      setTimeout(() => {
        handlePlayVerse(lastRead.verseNumber);
      }, 500);
    }
  };

  const handleJumpToBookmark = (surahNum: number, verseNum: number) => {
    setSelectedSurahNumber(surahNum);
    setActiveTab('read');
    setTimeout(() => {
      const elem = document.getElementById(`verse-${surahNum}-${verseNum}`);
      if (elem) elem.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 600);
  };

  const handleOpenHafalanForVerse = (surahNum: number, verseNum: number) => {
    setSelectedSurahNumber(surahNum);
    setActiveTab('hafalan');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Restore Cloud Data handler
  const handleRestoreCloudData = (data: {
    settings?: UserSettings;
    customApiKey?: string;
    bookmarks?: Bookmark[];
    hafalanRecords?: Record<string, HafalanVerseRecord>;
    lastRead?: LastRead | null;
  }) => {
    if (data.settings) {
      const mergedSettings = {
        ...data.settings,
        customApiKey: data.customApiKey || data.settings.customApiKey
      };
      setSettings(mergedSettings);
      saveStoredSettings(mergedSettings);
    }
    if (data.bookmarks) {
      setBookmarks(data.bookmarks);
      saveStoredBookmarks(data.bookmarks);
    }
    if (data.hafalanRecords) {
      setHafalanRecords(data.hafalanRecords);
      saveStoredHafalanRecords(data.hafalanRecords);
    }
    if (data.lastRead !== undefined) {
      setLastRead(data.lastRead);
      if (data.lastRead) {
        saveLastRead(data.lastRead);
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 text-gray-900 dark:text-zinc-100 font-sans transition-colors duration-300 flex flex-col">
      {/* Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          if (tab === 'read' && selectedSurahNumber === null) {
            setSelectedSurahNumber(1);
          }
        }}
        settings={settings}
        updateSettings={(newSettings) => setSettings((prev) => ({ ...prev, ...newSettings }))}
        lastRead={lastRead}
        onResumeLastRead={handleResumeLastRead}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenCloudSync={() => setIsCloudSyncOpen(true)}
        isCloudConnected={isCloudConnected}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        bookmarksCount={bookmarks.length}
      />

      {/* Main Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {/* Tab 1: Read Al-Quran (Surah List OR Surah Detail View) */}
        {activeTab === 'read' && (
          <>
            {selectedSurahNumber === null ? (
              <SurahList
                onSelectSurah={handleSelectSurah}
                onPlaySurahAudio={(sNum) => {
                  setSelectedSurahNumber(sNum);
                  setTimeout(() => handlePlayVerse(1), 500);
                }}
                lastRead={lastRead}
                hafalanRecords={hafalanRecords}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
              />
            ) : isLoadingSurah ? (
              <div className="text-center py-24 space-y-3">
                <div className="w-12 h-12 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-sm font-semibold text-emerald-800 dark:text-amber-300">
                  Memuat Surah Ke-{selectedSurahNumber}...
                </p>
              </div>
            ) : currentSurahDetail ? (
              <div>
                <button
                  onClick={() => setSelectedSurahNumber(null)}
                  className="mb-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-emerald-200 dark:border-zinc-800 text-xs font-semibold text-emerald-800 dark:text-amber-300 hover:bg-emerald-50 dark:hover:bg-zinc-800 transition shadow-sm cursor-pointer"
                >
                  ← Kembali ke Daftar Surah (114)
                </button>

                <VerseList
                  surahDetail={currentSurahDetail}
                  settings={settings}
                  playbackState={playbackState}
                  onPlayVerse={handlePlayVerse}
                  onPauseAudio={handlePauseAudio}
                  onToggleBookmark={handleToggleBookmark}
                  isBookmarked={(vNum) => isVerseBookmarked(currentSurahDetail.nomor, vNum)}
                  hafalanRecords={hafalanRecords}
                  onUpdateHafalanStatus={handleUpdateHafalanStatus}
                  onOpenHafalanModeForVerse={(vNum) => handleOpenHafalanForVerse(currentSurahDetail.nomor, vNum)}
                  onOpenVoiceRecorder={(vNum) =>
                    setVoiceRecorderVerse({ surahNumber: currentSurahDetail.nomor, verseNumber: vNum })
                  }
                  onNavigateSurah={(sNum) => handleSelectSurah(sNum)}
                  activePlayingVerse={
                    playbackState.surahNumber === currentSurahDetail.nomor ? playbackState.verseNumber : null
                  }
                />
              </div>
            ) : null}
          </>
        )}

        {/* Tab 2: Hafalan Mode Workspace */}
        {activeTab === 'hafalan' && (
          <HafalanModeView
            currentSurah={currentSurahDetail}
            onSelectSurah={(sNum) => setSelectedSurahNumber(sNum)}
            settings={settings}
            hafalanRecords={hafalanRecords}
            onUpdateHafalanStatus={handleUpdateHafalanStatus}
            playbackState={playbackState}
            onPlayRangeAudio={handlePlayRangeAudio}
            onPauseAudio={handlePauseAudio}
            activePlayingVerse={playbackState.verseNumber}
            onOpenVoiceRecorder={(vNum) =>
              setVoiceRecorderVerse({ surahNumber: currentSurahDetail?.nomor || 67, verseNumber: vNum })
            }
          />
        )}

        {/* Tab 3: Mode Ujian Tahfidz (Ikhtibar) */}
        {activeTab === 'ujian' && (
          <ModeUjianTahfidzView
            onMarkVerseReviewNeeded={(sNum, vNum) => handleUpdateHafalanStatus(vNum, 'review_needed')}
            onOpenVerseReader={(sNum, vNum) => {
              setSelectedSurahNumber(sNum);
              setActiveTab('read');
            }}
          />
        )}

        {/* Tab 5: Hukum Tajwid Lengkap */}
        {activeTab === 'tajwid' && (
          <TajwidGuideView />
        )}

        {/* Tab 6: Bookmarks */}
        {activeTab === 'bookmark' && (
          <BookmarksView
            bookmarks={bookmarks}
            onRemoveBookmark={handleRemoveBookmark}
            onJumpToVerse={handleJumpToBookmark}
            onOpenHafalanForVerse={handleOpenHafalanForVerse}
          />
        )}

        {/* Tab 6: Hafalan Progress Analytics */}
        {activeTab === 'progress' && (
          <HafalanProgressView
            hafalanRecords={hafalanRecords}
            onSelectSurah={handleSelectSurah}
          />
        )}
      </main>

      {/* Floating Bottom Audio Player Dock */}
      <AudioPlayerBar
        playbackState={playbackState}
        currentSurah={currentSurahDetail}
        onPlayPause={handlePlayPauseToggle}
        onNextVerse={handleNextVerse}
        onPrevVerse={handlePrevVerse}
        onSelectQari={handleSelectQari}
        onSetSpeed={handleSetSpeed}
        onSetLoopTarget={handleSetLoopTarget}
        audioProgress={audioProgress}
        currentTimeStr={currentTimeStr}
        durationTimeStr={durationTimeStr}
        onSeek={handleSeek}
        settings={settings}
      />

      {/* Cloud Sync Modal */}
      <CloudSyncModal
        isOpen={isCloudSyncOpen}
        onClose={() => {
          setIsCloudSyncOpen(false);
          setIsCloudConnected(!!getStoredAccessToken());
        }}
        settings={settings}
        onUpdateSettings={(newSettings) => setSettings((prev) => ({ ...prev, ...newSettings }))}
        bookmarks={bookmarks}
        hafalanRecords={hafalanRecords}
        lastRead={lastRead}
        onRestoreData={handleRestoreCloudData}
      />

      {/* Settings Modal */}
      {isSettingsOpen && (
        <SettingsModal
          settings={settings}
          onUpdateSettings={(newSettings) => setSettings((prev) => ({ ...prev, ...newSettings }))}
          onClose={() => setIsSettingsOpen(false)}
          onOpenCloudSync={() => setIsCloudSyncOpen(true)}
          onClearCache={() => {
            localStorage.clear();
            alert('Cache berhasil dibersihkan!');
            window.location.reload();
          }}
        />
      )}

      {/* Voice Recorder Modal */}
      {voiceRecorderVerse && currentSurahDetail && (
        <VoiceRecorderModal
          surahNumber={voiceRecorderVerse.surahNumber}
          surahName={currentSurahDetail.namaLatin}
          verseNumber={voiceRecorderVerse.verseNumber}
          verseArab={
            currentSurahDetail.ayat.find((v) => v.nomorAyat === voiceRecorderVerse.verseNumber)?.teksArab || ''
          }
          qariAudioUrl={getVerseAudioUrl(
            voiceRecorderVerse.surahNumber,
            voiceRecorderVerse.verseNumber,
            settings.selectedQariId
          )}
          onClose={() => setVoiceRecorderVerse(null)}
        />
      )}
    </div>
  );
}
