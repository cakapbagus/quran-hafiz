import { confirmAction } from './AppDialog';
import React, { useState, useEffect } from 'react';
import { useDialogAccessibility } from '../hooks/useDialogAccessibility';
import {
  X,
  Cloud,
  CloudCheck,
  CloudUpload,
  CloudDownload,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Lock,
  Key,
  Eye,
  EyeOff,
  User,
  LogOut,
  Trash2,
  RefreshCw,
  FileJson,
  Bookmark as BookmarkIcon,
  Brain,
  Sliders,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import {
  UserSettings,
  Bookmark,
  HafalanVerseRecord,
  LastRead,
  GoogleUserProfile,
  CloudBackupPayload
} from '../types';
import {
  getCurrentUserId,
  subscribeCloudAuth,
  disconnectCloud,
  getCurrentGoogleUser,

  getStoredLastSyncedAt,
  saveStoredLastSyncedAt,
  signInGoogle,
  findCloudBackupFile,
  uploadCloudBackup,
  downloadCloudBackup,
  deleteCloudBackup,
  deleteUserAccount,
  buildBackupPayload
} from '../services/firebaseCloudService';

function backupDataMatchesLocal(
  backup: CloudBackupPayload,
  settings: UserSettings,
  bookmarks: Bookmark[],
  hafalanRecords: Record<string, HafalanVerseRecord>,
  lastRead: LastRead | null
): boolean {
  const localData = buildBackupPayload(settings, bookmarks, hafalanRecords, lastRead).data;
  const normalize = (data: CloudBackupPayload['data']) => {
    const { customApiKey: _customApiKey, autoCloudSync: _autoCloudSync, ...safeSettings } = data.settings;
    return { ...data, settings: safeSettings };
  };
  return JSON.stringify(normalize(backup.data)) === JSON.stringify(normalize(localData));
}

interface CloudSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: UserSettings;

  bookmarks: Bookmark[];
  hafalanRecords: Record<string, HafalanVerseRecord>;
  lastRead: LastRead | null;
  onRestoreData: (data: CloudBackupPayload['data']) => void;
  onImportLegacyHafalan?: () => Promise<void> | void;
  hasLegacyHafalan?: boolean;
}

export const CloudSyncModal: React.FC<CloudSyncModalProps> = ({
  isOpen,
  onClose,
  settings,

  bookmarks,
  hafalanRecords,
  lastRead,
  onRestoreData,
  onImportLegacyHafalan,
  hasLegacyHafalan = false
}) => {
  const dialogRef = useDialogAccessibility(onClose);
  const [isImportingLegacy, setIsImportingLegacy] = useState(false);
  const [token, setToken] = useState<string | null>(getCurrentUserId());
  const [userProfile, setUserProfile] = useState<GoogleUserProfile | null>(getCurrentGoogleUser());
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(getStoredLastSyncedAt());

  const [isLoadingAuth, setIsLoadingAuth] = useState<boolean>(false);
  const [isSyncingUpload, setIsSyncingUpload] = useState<boolean>(false);
  const [isSyncingDownload, setIsSyncingDownload] = useState<boolean>(false);

  const [cloudFileInfo, setCloudFileInfo] = useState<{ id: string; modifiedTime: string; size?: number } | null>(null);
  const [isCheckingCloudFile, setIsCheckingCloudFile] = useState<boolean>(false);
  const [isDeletingCloud, setIsDeletingCloud] = useState<boolean>(false);

  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [conflictingBackup, setConflictingBackup] = useState<CloudBackupPayload | null>(null);

  useEffect(() => subscribeCloudAuth((uid) => {
    setToken(uid);
    setUserProfile(getCurrentGoogleUser());
    setLastSyncedAt(getStoredLastSyncedAt());
    setConflictingBackup(null);
    setCloudFileInfo(null);
  }), []);

  // Check the server whenever the dialog opens.
  useEffect(() => {
    let cancelled = false;
    if (token && isOpen) {

      // Check existing backup file in Drive
      setIsCheckingCloudFile(true);
      findCloudBackupFile(token)
        .then(async (file) => {
          if (cancelled) return;
          setCloudFileInfo(file);
          const lastSync = getStoredLastSyncedAt();
          if (file && (!lastSync || file.modifiedTime !== lastSync)) {
            const backup = await downloadCloudBackup(token, file.id);
            if (cancelled) return;
            if (backupDataMatchesLocal(backup, settings, bookmarks, hafalanRecords, lastRead)) {
              saveStoredLastSyncedAt(file.modifiedTime);
              setLastSyncedAt(file.modifiedTime);
            } else {
              setConflictingBackup(backup);
              setStatusMessage({
                type: 'info',
                text: 'Data Firebase berbeda dari data lokal. Pilih data yang ingin dipertahankan sebelum sinkronisasi dilanjutkan.'
              });
            }
          }
          setIsCheckingCloudFile(false);
        })
        .catch((err) => {
          if (cancelled) return;
          setStatusMessage({ type: 'error', text: err.message });
          if (!getCurrentUserId()) setToken(null);
          setIsCheckingCloudFile(false);
        });
    } else {
      setCloudFileInfo(null);
    }
    return () => { cancelled = true; };
  }, [token, isOpen]);

  if (!isOpen) return null;

  // Handle Google Login
  const handleConnectGoogle = async () => {
    setIsLoadingAuth(true);
    setStatusMessage(null);
    try {
      const userId = await signInGoogle();
      setToken(userId);
      const profile = getCurrentGoogleUser();
      setUserProfile(profile);
      setStatusMessage({
        type: 'success',
        text: `Berhasil terhubung dengan Firebase akun ${profile?.email || 'Anda'}!`
      });

    } catch (err: any) {
      console.error('Google Sign In failed:', err);
      setStatusMessage({
        type: 'error',
        text: err?.message || 'Gagal menghubungkan akun Google. Pastikan mengizinkan akses popup.'
      });
    } finally {
      setIsLoadingAuth(false);
    }
  };

  // Handle Google Logout / Disconnect
  const handleDisconnectGoogle = async () => {
    try { await disconnectCloud(); } catch (error) {
      setStatusMessage({ type: 'error', text: error instanceof Error ? error.message : 'Gagal keluar dari Firebase.' });
      return;
    }
    setToken(null);
    setUserProfile(null);
    setCloudFileInfo(null);
    setConflictingBackup(null);
    setStatusMessage({
      type: 'info',
      text: 'Akun Google telah diputuskan dari aplikasi.'
    });
  };

  // Handle Upload / Cloud Save
  const handleUploadBackup = async () => {
    if (!token) {
      await handleConnectGoogle();
      return;
    }

    setIsSyncingUpload(true);
    setStatusMessage(null);

    try {
      const payload = buildBackupPayload(
        settings,
        bookmarks,
        hafalanRecords,
        lastRead,
        userProfile?.email
      );

      const res = await uploadCloudBackup(token, payload, cloudFileInfo?.modifiedTime ?? null);
      setCloudFileInfo({
        id: res.fileId,
        modifiedTime: res.modifiedTime,
        size: res.size
      });
      setLastSyncedAt(res.modifiedTime);
      saveStoredLastSyncedAt(res.modifiedTime);

      setStatusMessage({
        type: 'success',
        text: 'Semua data (Pengaturan, Bookmark, Status Hafalan, dan Terakhir Dibaca) berhasil dicadangkan ke Firebase!'
      });
    } catch (err: any) {
      console.error('Backup failed:', err);
      if (!getCurrentUserId()) setToken(null);
      setStatusMessage({
        type: 'error',
        text: err?.message || 'Gagal mencadangkan data ke Firebase.'
      });
    } finally {
      setIsSyncingUpload(false);
    }
  };

  const keepLocalData = async () => {
    if (!token) return;
    setIsSyncingUpload(true);
    try {
      const result = await uploadCloudBackup(
        token,
        buildBackupPayload(settings, bookmarks, hafalanRecords, lastRead, userProfile?.email),
        cloudFileInfo?.modifiedTime ?? null
      );
      setCloudFileInfo({ id: result.fileId, modifiedTime: result.modifiedTime, size: result.size });
      setLastSyncedAt(result.modifiedTime);
      setConflictingBackup(null);
      setStatusMessage({ type: 'success', text: 'Data lokal dipertahankan dan telah disinkronkan ke Firebase.' });
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err?.message || 'Gagal menyimpan data lokal ke Firebase.' });
    } finally {
      setIsSyncingUpload(false);
    }
  };

  const useCloudData = () => {
    if (!conflictingBackup) return;
    onRestoreData(conflictingBackup.data);
    const syncedAt = cloudFileInfo?.modifiedTime || conflictingBackup.exportedAt;
    saveStoredLastSyncedAt(syncedAt);
    setLastSyncedAt(syncedAt);
    setConflictingBackup(null);
    setStatusMessage({ type: 'success', text: 'Data Firebase diterapkan ke perangkat ini. Sinkronisasi otomatis dilanjutkan.' });
  };

  // Handle Download / Restore
  const handleRestoreBackup = async () => {
    if (!token) {
      await handleConnectGoogle();
      return;
    }

    if (!await confirmAction('Pemulihan akan menimpa pengaturan, bookmark, progres hafalan, dan posisi baca lokal. Lanjutkan?')) return;

    setIsSyncingDownload(true);
    setStatusMessage(null);

    try {
      const targetFile = cloudFileInfo || (await findCloudBackupFile(token));
      if (!targetFile) {
        throw new Error('Tidak ditemukan berkas cadangan (users/UID/backups/current) di Firebase Anda.');
      }

      const backup = await downloadCloudBackup(token, targetFile.id);
      onRestoreData(backup.data);

      setLastSyncedAt(targetFile.modifiedTime);
      saveStoredLastSyncedAt(targetFile.modifiedTime);

      setStatusMessage({
        type: 'success',
        text: `Data berhasil dipulihkan! (${backup.data.bookmarks?.length || 0} Bookmark, ${
          Object.keys(backup.data.hafalanRecords || {}).length
        } Ayat Hafalan dimuat).`
      });
    } catch (err: any) {
      console.error('Restore failed:', err);
      if (!getCurrentUserId()) setToken(null);
      setStatusMessage({
        type: 'error',
        text: err?.message || 'Gagal memulihkan data dari Firebase.'
      });
    } finally {
      setIsSyncingDownload(false);
    }
  };

  // Handle Delete Account & Purge Cloud Data
  const handleDeleteAccount = async () => {
    if (!token) return;

    const confirmed = await confirmAction(
      'PERINGATAN: Tindakan ini akan menghapus akun dan seluruh data Anda di Firebase secara permanen. Data lokal di perangkat ini tidak akan dihapus. Jika ingin menautkan kembali nantinya, Anda harus login Google kembali. Lanjutkan?'
    );
    if (!confirmed) return;

    setIsDeletingCloud(true);
    setStatusMessage(null);

    try {
      await deleteCloudBackup(token);
      try {
        await deleteUserAccount();
      } catch (authErr: any) {
        console.warn('Gagal menghapus akun auth, fallback ke disconnect:', authErr);
        await disconnectCloud();
      }
      setToken(null);
      setUserProfile(null);
      setCloudFileInfo(null);
      setConflictingBackup(null);
      setLastSyncedAt(null);
      setStatusMessage({
        type: 'success',
        text: 'Akun dan seluruh data di Firebase berhasil dihapus. Silakan login Google kembali jika ingin menautkan.'
      });
    } catch (err: any) {
      console.error('Delete account failed:', err);
      setStatusMessage({
        type: 'error',
        text: err?.message || 'Gagal menghapus akun dari Firebase.'
      });
    } finally {
      setIsDeletingCloud(false);
    }
  };

  // Count memorization statistics
  const hafalanList = Object.values(hafalanRecords) as HafalanVerseRecord[];
  const totalHafalanCount = hafalanList.length;
  const memorizedCount = hafalanList.filter((r) => r.status === 'memorized').length;
  const inProgressCount = hafalanList.filter(
    (r) => r.status === 'in_progress' || r.status === 'review_needed'
  ).length;

  const formatTimestamp = (tsStr: string | null) => {
    if (!tsStr) return 'Belum pernah';
    try {
      const d = new Date(tsStr);
      return d.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return tsStr;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="cloud-dialog-title" className="bg-[#15171E] rounded-3xl max-w-xl w-full p-6 sm:p-7 space-y-6 shadow-2xl border border-[#1F2128] max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#1F2128]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#D4AF37]/15 border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37]">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h2 id="cloud-dialog-title" className="text-lg font-bold text-[#E2E2E2] flex items-center gap-2 font-serif-title">
                Cloud Save
              </h2>
              <p className="text-xs text-[#8A8D9A]">
                Simpan & sinkronkan data aplikasi secara privat ke Google Firebase
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Tutup dialog"
            className="p-2 rounded-xl text-[#8A8D9A] hover:text-[#E2E2E2] hover:bg-[#1F2128] transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Toast / Alert Message */}
        {statusMessage && (
          <div
            className={`p-3.5 rounded-2xl text-xs flex items-start gap-3 border transition-all ${
              statusMessage.type === 'success'
                ? 'bg-emerald-950/30 border-emerald-800/50 text-emerald-300'
                : statusMessage.type === 'error'
                ? 'bg-red-950/30 border-red-800/50 text-red-300'
                : 'bg-[#1A1C23] border-[#2A2D35] text-[#D4AF37]'
            }`}
          >
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            ) : statusMessage.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            ) : (
              <Sparkles className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
            )}
            <span className="leading-relaxed">{statusMessage.text}</span>
          </div>
        )}

        {conflictingBackup && (
          <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-700/50 space-y-3" role="alert">
            <div>
              <h3 className="text-sm font-bold text-amber-300">Konflik data ditemukan</h3>
              <p className="text-[11px] text-amber-100/70 mt-1">
                Cadangan Firebase ({conflictingBackup.data.bookmarks.length} bookmark, {Object.keys(conflictingBackup.data.hafalanRecords).length} progres hafalan) berbeda dari data lokal ({bookmarks.length} bookmark, {Object.keys(hafalanRecords).length} progres hafalan).
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button onClick={keepLocalData} disabled={isSyncingUpload} className="p-2.5 rounded-xl bg-[#D4AF37] text-[#0A0A0B] text-xs font-bold disabled:opacity-50 cursor-pointer">
                Pertahankan Data Lokal
              </button>
              <button onClick={useCloudData} disabled={isSyncingUpload} className="p-2.5 rounded-xl bg-[#1A1C23] border border-amber-700/50 text-amber-200 text-xs font-bold disabled:opacity-50 cursor-pointer">
                Gunakan Data Firebase
              </button>
            </div>
          </div>
        )}

        {/* Section 1: Google Account Connection Status */}
        <div className="p-4 rounded-2xl bg-[#0F1115] border border-[#2A2D35] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {userProfile?.picture ? (
                <img
                  src={userProfile.picture}
                  alt={userProfile.name || 'User'}
                  className="w-11 h-11 rounded-full border border-[#D4AF37]/50 shadow"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-11 h-11 rounded-full bg-[#1A1C23] border border-[#2A2D35] flex items-center justify-center text-[#8A8D9A]">
                  <User className="w-5 h-5" />
                </div>
              )}
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#E2E2E2]">
                    {userProfile?.name || 'Google Firebase'}
                  </span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${
                      token
                        ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800/40'
                        : 'bg-[#1A1C23] text-[#8A8D9A] border-[#2A2D35]'
                    }`}
                  >
                    {token ? 'Terhubung' : 'Belum Terhubung'}
                  </span>
                </div>
                <p className="text-[11px] text-[#8A8D9A]">
                  {userProfile?.email || 'Hubungkan akun Google untuk aktivasi backup awan'}
                </p>
              </div>
            </div>

            {token ? (
              <button
                onClick={handleDisconnectGoogle}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1A1C23] hover:bg-[#2A2D35] text-red-400 border border-[#2A2D35] text-xs font-semibold transition cursor-pointer"
                title="Putuskan akun Google"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Putuskan</span>
              </button>
            ) : (
              <button
                onClick={handleConnectGoogle}
                disabled={isLoadingAuth}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#D4AF37] hover:bg-[#E5C358] text-[#0A0A0B] font-bold text-xs shadow-md transition cursor-pointer disabled:opacity-50"
              >
                {isLoadingAuth ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Cloud className="w-4 h-4" />
                )}
                <span>Hubungkan Google</span>
              </button>
            )}
          </div>

          {/* Scope & Safety Notice */}
          <div className="pt-3 border-t border-[#1F2128] flex items-center justify-between text-[11px] text-[#8A8D9A]">
            <span className="flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>Backup privat dengan Firebase Security Rules</span>
            </span>
          </div>
        </div>

        {/* Section 2: Data Snapshot & Sync Summary */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-[#8A8D9A] uppercase tracking-wide">
              Ringkasan Data Lokal Anda
            </h3>
            <span className="text-[11px] text-[#8A8D9A]">
              Terakhir Sync: <strong className="text-[#E2E2E2]">{formatTimestamp(lastSyncedAt)}</strong>
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-3 rounded-2xl bg-[#0F1115] border border-[#2A2D35] text-center">
              <BookmarkIcon className="w-4 h-4 text-[#D4AF37] mx-auto mb-1" />
              <span className="text-base font-bold text-[#E2E2E2] block">{bookmarks.length}</span>
              <span className="text-[10px] text-[#8A8D9A]">Bookmark</span>
            </div>

            <div className="p-3 rounded-2xl bg-[#0F1115] border border-[#2A2D35] text-center">
              <Brain className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
              <span className="text-base font-bold text-[#E2E2E2] block">{memorizedCount}</span>
              <span className="text-[10px] text-[#8A8D9A]">Ayat Mutqin</span>
            </div>

            <div className="p-3 rounded-2xl bg-[#0F1115] border border-[#2A2D35] text-center">
              <RefreshCw className="w-4 h-4 text-amber-400 mx-auto mb-1" />
              <span className="text-base font-bold text-[#E2E2E2] block">{inProgressCount}</span>
              <span className="text-[10px] text-[#8A8D9A]">Ayat Dihapal</span>
            </div>

            <div className="p-3 rounded-2xl bg-[#0F1115] border border-[#2A2D35] text-center">
              <Sliders className="w-4 h-4 text-blue-400 mx-auto mb-1" />
              <span className="text-base font-bold text-[#E2E2E2] block">Tersimpan</span>
              <span className="text-[10px] text-[#8A8D9A]">Pengaturan</span>
            </div>
          </div>
        </div>

        {/* Section 3: Keamanan & Privasi Data */}
        {/*
          <div className="p-4 rounded-2xl bg-[#0F1115] border border-[#2A2D35] space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-[#E2E2E2] flex items-center gap-2">
                <Lock className="w-4 h-4 text-emerald-400" />
                <span>Keamanan & Privasi Cloud Save</span>
              </h3>
              <span className="text-[10px] text-emerald-400 font-semibold px-2 py-0.5 rounded-full bg-emerald-950/40 border border-emerald-800/40">
                Aman & Privat
              </span>
            </div>
            <p className="text-[11px] text-[#8A8D9A] leading-relaxed">
              Data yang dicadangkan mencakup <strong>Pengaturan</strong>, <strong>Daftar Bookmark & Catatan</strong>, <strong>Riwayat Status Hafalan</strong>, serta <strong>Terakhir Dibaca</strong>.
            </p>
          </div>
          */}

        {/* Section 4: Cloud Actions (Backup Now & Restore Data) */}
        <div className="space-y-3 pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Backup Button */}
            <button
              onClick={handleUploadBackup}
              disabled={isCheckingCloudFile || isLoadingAuth || isSyncingUpload || isSyncingDownload || !!conflictingBackup}
              className="flex items-center justify-center gap-2 p-3.5 rounded-2xl bg-[#D4AF37] hover:bg-[#E5C358] text-[#0A0A0B] font-bold text-xs shadow-lg transition cursor-pointer disabled:opacity-50"
            >
              {isSyncingUpload ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CloudUpload className="w-4 h-4" />
              )}
              <span>Cadangkan ke Firebase</span>
            </button>

            {/* Restore Button */}
            <button
              onClick={handleRestoreBackup}
              disabled={isCheckingCloudFile || isLoadingAuth || isSyncingUpload || isSyncingDownload || !token || !!conflictingBackup}
              className="flex items-center justify-center gap-2 p-3.5 rounded-2xl bg-[#1A1C23] hover:bg-[#2A2D35] text-[#E2E2E2] border border-[#2A2D35] font-semibold text-xs transition cursor-pointer disabled:opacity-40"
            >
              {isSyncingDownload ? (
                <Loader2 className="w-4 h-4 animate-spin text-[#D4AF37]" />
              ) : (
                <CloudDownload className="w-4 h-4 text-[#D4AF37]" />
              )}
              <span>Pulihkan dari Firebase</span>
            </button>
          </div>

          {/* Cloud file status hint */}
          {cloudFileInfo && (
            <div className="p-3 rounded-xl bg-[#0F1115] border border-[#2A2D35] flex items-center justify-between text-[11px] text-[#8A8D9A]">
              <span className="flex items-center gap-2">
                <FileJson className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>Cadangan Firebase: <strong className="text-[#E2E2E2]">users/UID/backups/current</strong></span>
              </span>
              <span>{formatTimestamp(cloudFileInfo.modifiedTime)}</span>
            </div>
          )}

          {/* Import Legacy Hafalan Local */}
          {token && onImportLegacyHafalan && (
            <div className="p-3.5 rounded-2xl bg-[#0F1115] border border-[#2A2D35] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div>
                <p className="text-xs font-semibold text-[#E2E2E2]">Impor Hafalan Lokal Lama</p>
                <p className="text-[11px] text-[#8A8D9A]">
                  Tambahkan ayat hafalan di perangkat ini ke akun cloud (hanya ayat yang belum ada).
                </p>
              </div>
              <button
                type="button"
                disabled={isImportingLegacy || !hasLegacyHafalan}
                onClick={async () => {
                  if (!await confirmAction('Impor hafalan lokal lama ke akun ini? Hanya ayat yang belum ada di cloud akan ditambahkan.')) return;
                  setIsImportingLegacy(true);
                  try {
                    await onImportLegacyHafalan();
                    setStatusMessage({ type: 'success', text: 'Hafalan lokal berhasil diimpor ke akun cloud.' });
                  } catch (err: any) {
                    setStatusMessage({ type: 'error', text: err?.message || 'Gagal mengimpor hafalan lokal.' });
                  } finally {
                    setIsImportingLegacy(false);
                  }
                }}
                className="shrink-0 px-3.5 py-2 rounded-xl border border-[#D4AF37]/50 text-[#D4AF37] hover:bg-[#D4AF37]/10 text-xs font-semibold disabled:opacity-40 transition cursor-pointer"
              >
                {isImportingLegacy ? 'Mengimpor…' : 'Impor Hafalan Lokal'}
              </button>
            </div>
          )}

          {/* Delete Account Button */}
          {token && (
            <div className="pt-2">
              <button
                onClick={handleDeleteAccount}
                disabled={isCheckingCloudFile || isLoadingAuth || isSyncingUpload || isSyncingDownload || isDeletingCloud}
                className="w-full flex items-center justify-center gap-2 p-3 rounded-2xl bg-[#0F1115] border border-red-900/50 text-red-400 font-semibold text-xs hover:bg-red-950/20 transition cursor-pointer disabled:opacity-50"
                title="Hapus akun dan seluruh data di Firebase"
              >
                {isDeletingCloud ? (
                  <Loader2 className="w-4 h-4 animate-spin text-red-400" />
                ) : (
                  <Trash2 className="w-4 h-4 text-red-400" />
                )}
                <span>Hapus Akun</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-xs font-bold rounded-xl bg-[#1A1C23] hover:bg-[#2A2D35] text-[#E2E2E2] border border-[#2A2D35] cursor-pointer transition"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
