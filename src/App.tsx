import { confirmAction } from './components/AppDialog';
import React, { useState, useEffect, useRef } from 'react';
import {
  SurahDetail,
  Verse,
  Bookmark,
  HafalanVerseRecord,
  HafalanStatusType,
  LastRead,
  UserSettings,
  AudioPlaybackState
} from './types';

import { getVerseAudioUrl, QARIS } from './data/qaris';
import { clearQuranCache, downloadAllSurahsToCache, fetchSurahDetail, isAllSurahsCached } from './services/quranApi';
import {
  getStoredSettings,
  saveStoredSettings,
  getStoredBookmarks,
  saveBookmark,
  removeBookmark,
  removeBookmarksBatch,
  isVerseBookmarked,
  getStoredHafalanRecords,
  updateHafalanRecord,
  updateSurahHafalanRecords,
  clearStoredHafalanRecords,
  getStoredLastRead,
  saveLastRead,
  clearStoredLastRead,
  restoreStoredDataAtomically,
  DEFAULT_SETTINGS
} from './services/storageService';
import {
  subscribeCloudAuth,
  getCurrentUserId as getStoredAccessToken,
  getCurrentGoogleUser as getStoredGoogleUser,
  uploadCloudBackup,
  findCloudBackupFile,
  buildBackupPayload,
  getStoredLastSyncedAt
} from './services/firebaseCloudService';

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
import { VerseNoteModal } from './components/VerseNoteModal';
import { AudioPlayerBar } from './components/AudioPlayerBar';
import { HalaqahPanel } from './components/HalaqahPanel';
import { WelcomeLoginModal } from './components/GoogleLogin';
import { saveVerse, watchRecords, type Records } from './services/halaqahService';

export default function App() {
  const [learningRoomOpen, setLearningRoomOpen] = useState(false);
  const [teacherMode, updateTeacherMode] = useState(() => window.location.hash === '#/guru');
  const setTeacherMode = (teacher: boolean) => {
    window.location.hash = teacher ? '/guru' : '/murid';
    updateTeacherMode(teacher);
  };
  useEffect(() => {
    const navigate = () => updateTeacherMode(window.location.hash === '#/guru');
    if (!window.location.hash) window.history.replaceState(null, '', '#/murid');
    window.addEventListener('hashchange', navigate);
    return () => window.removeEventListener('hashchange', navigate);
  }, []);
  const [sharedUid, setSharedUid] = useState<string | null>(null);
  const [sharedRecords, setSharedRecords] = useState<Records>({});
  const [sharedError, setSharedError] = useState('');
  const [sharedReady, setSharedReady] = useState(false);
  const [activeTab, setActiveTab] = useState<MainTabType>('read');
  const [selectedSurahNumber, setSelectedSurahNumber] = useState<number | null>(null);

  useEffect(() => {
    const historyState = window.history.state as Record<string, unknown> | null;
    const currentHistoryTab = historyState?.quranMainTab;

    if (activeTab === 'read') {
      if (currentHistoryTab && currentHistoryTab !== 'read') {
        window.history.back();
      } else if (currentHistoryTab !== 'read') {
        window.history.replaceState({ ...historyState, quranMainTab: 'read' }, '', window.location.href);
      }
    } else if (currentHistoryTab === 'read') {
      window.history.pushState({ ...historyState, quranMainTab: activeTab }, '', window.location.href);
    } else if (currentHistoryTab !== activeTab) {
      window.history.replaceState({ ...historyState, quranMainTab: activeTab }, '', window.location.href);
    }
  }, [activeTab]);

  useEffect(() => {
    const handleBackNavigation = (event: PopStateEvent) => {
      const historyTab = (event.state as Record<string, unknown> | null)?.quranMainTab;
      const validTabs: MainTabType[] = ['read', 'hafalan', 'ujian', 'tajwid', 'bookmark', 'progress'];
      setLearningRoomOpen(false);
      setActiveTab(validTabs.includes(historyTab as MainTabType) ? historyTab as MainTabType : 'read');
    };

    window.addEventListener('popstate', handleBackNavigation);
    return () => window.removeEventListener('popstate', handleBackNavigation);
  }, []);
  const [currentSurahDetail, setCurrentSurahDetail] = useState<SurahDetail | null>(null);
  const [isLoadingSurah, setIsLoadingSurah] = useState<boolean>(false);
  const [surahLoadError, setSurahLoadError] = useState<string | null>(null);
  const [surahLoadAttempt, setSurahLoadAttempt] = useState(0);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Local Storage states
  const [settings, setSettings] = useState<UserSettings>(getStoredSettings());
  const [bookmarks, setBookmarks] = useState<Bookmark[]>(getStoredBookmarks());
  const [hafalanRecords, setHafalanRecords] = useState<Record<string, HafalanVerseRecord>>(getStoredHafalanRecords());
  const [lastRead, setLastRead] = useState<LastRead | null>(getStoredLastRead());

  useEffect(() => {
    if (activeTab === 'hafalan') {
      setSelectedSurahNumber(lastRead?.surahNumber ?? 1);
    }
  }, [activeTab]);

  // Cloud Sync state
  const [isCloudSyncOpen, setIsCloudSyncOpen] = useState<boolean>(false);
  const [isCloudConnected, setIsCloudConnected] = useState<boolean>(!!getStoredAccessToken());

  useEffect(() => subscribeCloudAuth(uid => { setSharedUid(uid); setSharedRecords({}); setSharedReady(false); }), []);
  useEffect(() => {
    if (!sharedUid) { setHafalanRecords(getStoredHafalanRecords()); return; }
    setHafalanRecords({});
    return watchRecords({ uid: sharedUid }, records => { setSharedRecords(records); setHafalanRecords(records); setSharedReady(true); }, error => { setSharedReady(false); setHafalanRecords({}); setSharedError(error.message); });
  }, [sharedUid]);
  const updatePersonalStatus = (surahNumber: number, verseNumber: number, status: HafalanVerseRecord['status']) => {
    if (!sharedUid) { updateHafalanRecord(surahNumber, verseNumber, { status }); setHafalanRecords(getStoredHafalanRecords()); return; }
    if (!sharedReady) { setSharedError('Hafalan cloud belum siap.'); return; }
    const old = sharedRecords[`${surahNumber}_${verseNumber}`];
    setSharedError('');
    void saveVerse({ uid: sharedUid }, { surahNumber, verseNumber, repeatCount: old?.repeatCount || 0, notes: old?.notes || '', status }, old?.revision || 0).catch(error => setSharedError(error.message));
  };
  const updatePersonalNote = (surahNumber: number, verseNumber: number, notes: string) => {
    if (!sharedUid) {
      updateHafalanRecord(surahNumber, verseNumber, { notes });
      setHafalanRecords(getStoredHafalanRecords());
      setVerseNoteTarget(null);
      return;
    }
    if (!sharedReady) { setSharedError('Hafalan cloud belum siap.'); return; }
    const old = sharedRecords[`${surahNumber}_${verseNumber}`];
    setSharedError('');
    void saveVerse({ uid: sharedUid }, { surahNumber, verseNumber, repeatCount: old?.repeatCount || 0, notes, status: old?.status || 'not_started' }, old?.revision || 0)
      .then(() => setVerseNoteTarget(null))
      .catch(error => setSharedError(error.message));
  };
  const updateSurahPersonalStatus = async (surahNumber: number, totalVerses: number, status: HafalanStatusType) => {
    if (!sharedUid) {
      updateSurahHafalanRecords(surahNumber, totalVerses, status);
      setHafalanRecords(getStoredHafalanRecords());
      return;
    }
    if (!sharedReady) { setSharedError('Hafalan cloud belum siap.'); return; }
    setSharedError('');
    try {
      const saves = [];
      for (let v = 1; v <= totalVerses; v++) {
        const old = sharedRecords[`${surahNumber}_${v}`];
        saves.push(
          saveVerse(
            { uid: sharedUid },
            {
              surahNumber,
              verseNumber: v,
              repeatCount: old?.repeatCount || 0,
              notes: old?.notes || '',
              status
            },
            old?.revision || 0
          )
        );
      }
      await Promise.all(saves);
    } catch (error) {
      setSharedError(error instanceof Error ? error.message : String(error));
    }
  };

  // Modals & Popups
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [voiceRecorderVerse, setVoiceRecorderVerse] = useState<{ surahNumber: number; verseNumber: number } | null>(null);
  const [verseNoteTarget, setVerseNoteTarget] = useState<{ surahNumber: number; verseNumber: number; surahName: string } | null>(null);
  const [playbackState, setPlaybackState] = useState<AudioPlaybackState>({
    isPlaying: false,
    surahNumber: null,
    verseNumber: null,
    qariId: settings.selectedQariId || 'mishary',
    playbackSpeed: 1.0,
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
  const pendingReadActionRef = useRef<{ verseNumber: number; play: boolean } | null>(null);
  const playbackStateRef = useRef(playbackState);
  const settingsRef = useRef(settings);
  const surahDetailRef = useRef(currentSurahDetail);

  playbackStateRef.current = playbackState;
  settingsRef.current = settings;
  surahDetailRef.current = currentSurahDetail;

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const applyTheme = () => {
      const dark = settings.theme === 'dark' || (settings.theme === 'system' && media.matches);
      document.documentElement.classList.toggle('dark', dark);
      document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
    };
    applyTheme();
    media.addEventListener('change', applyTheme);
    return () => media.removeEventListener('change', applyTheme);
  }, [settings.theme]);
  useEffect(() => { saveStoredSettings(settings); }, [settings]);

  // Debounced automatic sync whenever Google Drive is connected.
  useEffect(() => {
    const token = getStoredAccessToken();
    if (!token || sharedUid) return;

    const timer = setTimeout(() => {
      const payload = buildBackupPayload(
        settings,
        bookmarks,
        hafalanRecords,
        lastRead,
        getStoredGoogleUser()?.email
      );
      findCloudBackupFile(token)
        .then((file) => {
          const lastSyncedAt = getStoredLastSyncedAt();
          const cloudChangedSinceLastSync = file && (
            !lastSyncedAt || new Date(file.modifiedTime).getTime() > new Date(lastSyncedAt).getTime() + 1000
          );
          if (cloudChangedSinceLastSync) {
            setIsCloudSyncOpen(true);
            return;
          }
          return uploadCloudBackup(token, payload, file?.id);
        })
        .catch((e) => {
          console.warn('Background auto-sync failed:', e);
          if (!getStoredAccessToken()) setIsCloudConnected(false);
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
      const prev = playbackStateRef.current;
      if (!prev.surahNumber || !prev.verseNumber) return;
      if (prev.repeatCountCurrent < prev.repeatCountTarget) {
        audio.currentTime = 0;
        audio.play().catch((error) => console.warn('Audio replay failed:', error));
        setPlaybackState({ ...prev, repeatCountCurrent: prev.repeatCountCurrent + 1 });
        return;
      }
      const nextVerseNum = prev.verseNumber + 1;
      const maxVerse = prev.rangeEndVerse || surahDetailRef.current?.jumlahAyat || 286;
      if (settingsRef.current.autoPlayNextVerse && nextVerseNum <= maxVerse) {
        const verse = surahDetailRef.current?.nomor === prev.surahNumber
          ? surahDetailRef.current.ayat.find((item) => item.nomorAyat === nextVerseNum)
          : undefined;
        audio.src = getVerseAudioUrl(prev.surahNumber, nextVerseNum, prev.qariId, verse?.audio);
        audio.playbackRate = prev.playbackSpeed;
        audio.play().catch((error) => console.warn('Audio next verse failed:', error));
        setPlaybackState({ ...prev, verseNumber: nextVerseNum, repeatCountCurrent: 1, isPlaying: true });
        return;
      }
      setPlaybackState({ ...prev, isPlaying: false, repeatCountCurrent: 1 });
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.pause();
    };
  }, []);

  // Load Surah Detail when selectedSurahNumber changes
  useEffect(() => {
    if (selectedSurahNumber === null) return;

    let isMounted = true;
    const controller = new AbortController();
    setIsLoadingSurah(true);
    setSurahLoadError(null);

    fetchSurahDetail(selectedSurahNumber, controller.signal)
      .then((detail) => {
        if (isMounted) {
          setCurrentSurahDetail(detail);
          setIsLoadingSurah(false);
        }
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        console.error('Failed to load surah detail:', err);
        if (isMounted) {
          setIsLoadingSurah(false);
          pendingReadActionRef.current = null;
          setSurahLoadError(err instanceof Error ? err.message : 'Gagal memuat data surah.');
        }
      });

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [selectedSurahNumber, surahLoadAttempt]);

  // Helper to play audio
  const playVerseAudioInternal = (
    surahNum: number,
    verseNum: number,
    qariId: string,
    speed: number
  ) => {
    if (!audioRef.current) return;

    // Determine audio url
    const verseObj = currentSurahDetail?.nomor === surahNum
      ? currentSurahDetail.ayat.find((v) => v.nomorAyat === verseNum)
      : undefined;
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


    }).catch((e) => {
      console.warn('Audio playback interrupted or failed:', e);
    });
  };

  useEffect(() => {
    const pending = pendingReadActionRef.current;
    if (!currentSurahDetail || !pending || currentSurahDetail.nomor !== selectedSurahNumber) return;
    pendingReadActionRef.current = null;
    if (pending.play) {
      playVerseAudioInternal(currentSurahDetail.nomor, pending.verseNumber, playbackState.qariId, playbackState.playbackSpeed);
    } else {
      requestAnimationFrame(() => document.getElementById('verse-' + currentSurahDetail.nomor + '-' + pending.verseNumber)?.scrollIntoView({ behavior: 'smooth', block: 'center' }));
    }
  }, [activeTab, currentSurahDetail, selectedSurahNumber]);

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

  const handleCloseAudioPlayer = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.removeAttribute('src');
      audioRef.current.load();
    }
    setAudioProgress(0);
    setCurrentTimeStr('00:00');
    setDurationTimeStr('00:00');
    setPlaybackState((prev) => ({
      ...prev,
      isPlaying: false,
      surahNumber: null,
      verseNumber: null,
      repeatCountCurrent: 1,
      rangeStartVerse: null,
      rangeEndVerse: null
    }));
  };

  const handlePlayPauseToggle = () => {
    if (!audioRef.current) return;
    if (playbackState.isPlaying) {
      handlePauseAudio();
    } else {
      if (playbackState.surahNumber && playbackState.verseNumber) {
        audioRef.current.play().then(() => {
          setPlaybackState((prev) => ({ ...prev, isPlaying: true }));
        }).catch((error) => console.warn('Audio playback failed:', error));
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

  const handleUpdateBookmarkNote = (bookmark: Bookmark, note: string) => {
    saveBookmark({
      surahNumber: bookmark.surahNumber,
      surahName: bookmark.surahName,
      verseNumber: bookmark.verseNumber,
      verseArab: bookmark.verseArab,
      verseTranslation: bookmark.verseTranslation,
      note: note || undefined,
      colorTag: bookmark.colorTag
    });
    setBookmarks(getStoredBookmarks());
  };

  const handleRemoveBookmark = (surahNumber: number, verseNumber: number) => {
    removeBookmark(surahNumber, verseNumber);
    setBookmarks(getStoredBookmarks());
  };

  const handleRemoveBookmarksBatch = (items: Array<{ surahNumber: number; verseNumber: number }>) => {
    removeBookmarksBatch(items);
    setBookmarks(getStoredBookmarks());
  };

  // Hafalan Record Handler
  const handleUpdateHafalanStatus = (
    verseNumber: number,
    status: HafalanVerseRecord['status']
  ) => {
    if (!currentSurahDetail) return;
    updatePersonalStatus(currentSurahDetail.nomor, verseNumber, status);
  };

  const handleUpdateSurahHafalanStatus = (
    surahNumber: number,
    totalVerses: number,
    status: HafalanStatusType
  ) => {
    void updateSurahPersonalStatus(surahNumber, totalVerses, status);
  };

  // Navigation handlers
  const handleUpdateHafalanRangeStatus = async (
    surahNumber: number,
    startVerse: number,
    endVerse: number,
    status: HafalanStatusType
  ) => {
    for (let verseNumber = startVerse; verseNumber <= endVerse; verseNumber++) {
      updatePersonalStatus(surahNumber, verseNumber, status);
    }
  };

  const handleOpenReadTab = () => {
    setLearningRoomOpen(false);
    pendingReadActionRef.current = null;
    setSelectedSurahNumber(null);
    setActiveTab('read');
  };

  const handleSelectSurah = (surahNum: number) => {
    setSelectedSurahNumber(surahNum);
    setActiveTab('read');
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  const handleMarkLastRead = async (surahNumber: number, verseNumber: number, surahName: string) => {
    const isActive = lastRead?.surahNumber === surahNumber && lastRead.verseNumber === verseNumber;
    if (isActive) {
      const confirmed = await confirmAction(`Hapus tanda dibaca terakhir pada Surah ${surahName} Ayat ${verseNumber}?`);
      if (!confirmed) return;
      setLastRead(null);
      clearStoredLastRead();
      return;
    }

    const newLastRead: LastRead = {
      surahNumber,
      surahName,
      verseNumber,
      timestamp: new Date().toISOString()
    };
    setLastRead(newLastRead);
    saveLastRead(newLastRead);
  };

  const handleResumeLastRead = () => {
    if (lastRead) {
      pendingReadActionRef.current = { verseNumber: lastRead.verseNumber, play: true };
      setSelectedSurahNumber(lastRead.surahNumber);
      setActiveTab('read');
    }
  };

  const handleJumpToBookmark = (surahNum: number, verseNum: number) => {
    pendingReadActionRef.current = { verseNumber: verseNum, play: false };
    setSelectedSurahNumber(surahNum);
    setActiveTab('read');
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
    const mergedSettings = data.settings
      ? { ...DEFAULT_SETTINGS, ...data.settings, customApiKey: settings.customApiKey }
      : settings;
    const nextBookmarks = data.bookmarks ?? bookmarks;
    const nextRecords = data.hafalanRecords ?? hafalanRecords;
    const nextLastRead = data.lastRead !== undefined ? data.lastRead : lastRead;
    restoreStoredDataAtomically(mergedSettings, nextBookmarks, nextRecords, nextLastRead);
    setSettings(getStoredSettings());
    setBookmarks(nextBookmarks);
    setHafalanRecords(nextRecords);
    setLastRead(nextLastRead);
  };

  return (
    <div className="min-h-screen bg-(--bg-app) text-(--text-main) font-sans transition-colors duration-300 flex flex-col">

      {sharedError && <p role="alert" className="p-4 text-red-500">{sharedError}</p>}
      {/* Header */}
      <Header
        teacherMode={teacherMode}
        learningRoomOpen={learningRoomOpen}
        onToggleLearningRoom={() => setLearningRoomOpen(open => !open)}
        setTeacherMode={setTeacherMode}
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setLearningRoomOpen(false);
          if (tab === 'read') {
            handleOpenReadTab();
            return;
          }
          setActiveTab(tab);
        }}
        settings={settings}
        updateSettings={(newSettings) => setSettings((prev) => ({ ...prev, ...newSettings }))}
        lastRead={lastRead}
        onResumeLastRead={handleResumeLastRead}
        onOpenSettings={() => setIsSettingsOpen(true)}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        bookmarksCount={bookmarks.length}
      />

      <WelcomeLoginModal />
      <div hidden={!teacherMode && !learningRoomOpen}>
        <HalaqahPanel teacherMode={teacherMode} />
        {!teacherMode && <div className="max-w-7xl mx-auto px-4 pb-4"><button type="button" className="border rounded-xl px-4 py-2 hover:bg-emerald-500/10" onClick={() => setLearningRoomOpen(false)}>Kembali ke Al-Quran</button></div>}
      </div>
      <div hidden={teacherMode || learningRoomOpen}>
      {/* Main Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {/* Tab 1: Read Al-Quran (Surah List OR Surah Detail View) */}
        {activeTab === 'read' && (
          <>
            {selectedSurahNumber === null ? (
              <SurahList
                onSelectSurah={handleSelectSurah}
                onPlaySurahAudio={(sNum) => {
                  pendingReadActionRef.current = { verseNumber: 1, play: true };
                  setSelectedSurahNumber(sNum);
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
            ) : surahLoadError ? (
              <div className="text-center py-24 space-y-4" role="alert">
                <p className="text-sm font-semibold text-red-500 max-w-md mx-auto">{surahLoadError}</p>
                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={() => {
                      setSurahLoadError(null);
                      setSelectedSurahNumber(null);
                    }}
                    className="px-4 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-emerald-200 dark:border-zinc-800 text-xs font-semibold text-emerald-800 dark:text-amber-300 hover:bg-emerald-50 dark:hover:bg-zinc-800 transition shadow-sm cursor-pointer"
                  >
                    ← Kembali ke Daftar Surah
                  </button>
                  <button
                    onClick={() => setSurahLoadAttempt((attempt) => attempt + 1)}
                    className="px-4 py-2 rounded-xl bg-amber-400 text-zinc-950 text-xs font-bold hover:bg-amber-300 transition shadow-sm cursor-pointer"
                  >
                    Coba Lagi
                  </button>
                </div>
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
                  onUpdateSurahHafalanStatus={handleUpdateSurahHafalanStatus}
                  onOpenHafalanModeForVerse={(vNum) => handleOpenHafalanForVerse(currentSurahDetail.nomor, vNum)}
                  onOpenVoiceRecorder={(vNum) =>
                    setVoiceRecorderVerse({ surahNumber: currentSurahDetail.nomor, verseNumber: vNum })
                  }
                  onNavigateSurah={(sNum) => handleSelectSurah(sNum)}
                  activePlayingVerse={
                    playbackState.surahNumber === currentSurahDetail.nomor ? playbackState.verseNumber : null
                  }
                  targetVerseNumber={pendingReadActionRef.current?.verseNumber}
                  onEditVerseNote={(vNum) => setVerseNoteTarget({ surahNumber: currentSurahDetail.nomor, verseNumber: vNum, surahName: currentSurahDetail.namaLatin })}
                  onMarkLastRead={(vNum) => handleMarkLastRead(currentSurahDetail.nomor, vNum, currentSurahDetail.namaLatin)}
                  lastReadVerseNumber={lastRead?.surahNumber === currentSurahDetail.nomor ? lastRead.verseNumber : null}
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
            onUpdateHafalanRangeStatus={handleUpdateHafalanRangeStatus}
            playbackState={playbackState}
            onPlayRangeAudio={handlePlayRangeAudio}
            onPauseAudio={handlePauseAudio}
            activePlayingVerse={playbackState.verseNumber}
            onOpenVoiceRecorder={(vNum) =>
              setVoiceRecorderVerse({ surahNumber: currentSurahDetail?.nomor || 67, verseNumber: vNum })
            }
            onEditVerseNote={(vNum) => setVerseNoteTarget({ surahNumber: currentSurahDetail?.nomor || 1, verseNumber: vNum, surahName: currentSurahDetail?.namaLatin || 'Al-Fatihah' })}
            onMarkLastRead={(vNum) => handleMarkLastRead(currentSurahDetail?.nomor || 1, vNum, currentSurahDetail?.namaLatin || 'Al-Fatihah')}
            lastReadVerseNumber={lastRead && lastRead.surahNumber === currentSurahDetail?.nomor ? lastRead.verseNumber : null}
          />
        )}

        {/* Tab 3: Mode Ujian Tahfidz (Ikhtibar) */}
        {activeTab === 'ujian' && (
          <ModeUjianTahfidzView
            onMarkVerseReviewNeeded={(sNum, vNum) => {
              if (!sNum) return;
              updatePersonalStatus(sNum, vNum, 'review_needed');
            }}
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
            onRemoveBookmarksBatch={handleRemoveBookmarksBatch}
            onJumpToVerse={handleJumpToBookmark}
            onOpenHafalanForVerse={handleOpenHafalanForVerse}
            onUpdateBookmarkNote={handleUpdateBookmarkNote}
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

      </div>
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
        onClose={handleCloseAudioPlayer}
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
        bookmarks={bookmarks}
        hafalanRecords={hafalanRecords}
        lastRead={lastRead}
        onRestoreData={handleRestoreCloudData}
        hasLegacyHafalan={Object.keys(getStoredHafalanRecords()).length > 0}
        onImportLegacyHafalan={async () => {
          if (!sharedUid) throw new Error('Silakan hubungkan akun Google terlebih dahulu.');
          const localRecords = getStoredHafalanRecords();
          for (const [key, record] of Object.entries(localRecords) as [string, HafalanVerseRecord][]) {
            if (!sharedRecords[key]) {
              await saveVerse({ uid: sharedUid }, record, 0);
            }
          }
        }}
      />

      {/* Settings Modal */}
      {isSettingsOpen && (
        <SettingsModal
          settings={settings}
          onClose={() => setIsSettingsOpen(false)}
          onOpenCloudSync={() => setIsCloudSyncOpen(true)}
          onUpdateSettings={(newSettings) => setSettings((prev) => ({ ...prev, ...newSettings }))}
          onDownloadAllSurahs={downloadAllSurahsToCache}
          onCheckAllSurahsCached={isAllSurahsCached}
          onClearCache={() => {
            clearQuranCache()
              .then(() => window.location.reload())
              .catch((error) => console.warn('Failed to clear Quran cache:', error));
          }}
          onResetProgress={async () => {
            if (await confirmAction('Apakah Anda yakin ingin mereset seluruh progres hafalan? Tindakan ini akan mengosongkan status hafalan lokal.')) {
              clearStoredHafalanRecords();
              setHafalanRecords({});
              setIsSettingsOpen(false);
            }
          }}
        />
      )}

      {/* Voice Recorder Modal */}
      {verseNoteTarget && <VerseNoteModal
        open
        surahName={verseNoteTarget.surahName}
        verseNumber={verseNoteTarget.verseNumber}
        initialNote={hafalanRecords[`${verseNoteTarget.surahNumber}_${verseNoteTarget.verseNumber}`]?.notes || ''}
        onClose={() => setVerseNoteTarget(null)}
        onSave={(note) => updatePersonalNote(verseNoteTarget.surahNumber, verseNoteTarget.verseNumber, note)}
      />}

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
