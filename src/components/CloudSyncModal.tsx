import React, { useState, useEffect } from 'react';
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
  getStoredAccessToken,
  saveStoredAccessToken,
  getStoredGoogleUser,
  saveStoredGoogleUser,
  getStoredLastSyncedAt,
  saveStoredLastSyncedAt,
  requestGoogleAccessToken,
  fetchGoogleUserProfile,
  findCloudBackupFile,
  uploadCloudBackup,
  downloadCloudBackup,
  buildBackupPayload
} from '../services/googleDriveService';

interface CloudSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: UserSettings;
  onUpdateSettings: (newSettings: Partial<UserSettings>) => void;
  bookmarks: Bookmark[];
  hafalanRecords: Record<string, HafalanVerseRecord>;
  lastRead: LastRead | null;
  onRestoreData: (data: CloudBackupPayload['data']) => void;
}

export const CloudSyncModal: React.FC<CloudSyncModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  bookmarks,
  hafalanRecords,
  lastRead,
  onRestoreData
}) => {
  const [token, setToken] = useState<string | null>(getStoredAccessToken());
  const [userProfile, setUserProfile] = useState<GoogleUserProfile | null>(getStoredGoogleUser());
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(getStoredLastSyncedAt());
  
  const [isLoadingAuth, setIsLoadingAuth] = useState<boolean>(false);
  const [isSyncingUpload, setIsSyncingUpload] = useState<boolean>(false);
  const [isSyncingDownload, setIsSyncingDownload] = useState<boolean>(false);
  
  const [cloudFileInfo, setCloudFileInfo] = useState<{ id: string; modifiedTime: string; size?: number } | null>(null);
  const [isCheckingCloudFile, setIsCheckingCloudFile] = useState<boolean>(false);
  
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Check user info and cloud backup file when token is available
  useEffect(() => {
    if (token) {
      // Fetch or refresh profile
      fetchGoogleUserProfile(token).then((profile) => {
        if (profile) setUserProfile(profile);
      });

      // Check existing backup file in Drive
      setIsCheckingCloudFile(true);
      findCloudBackupFile(token)
        .then((file) => {
          setCloudFileInfo(file);
          setIsCheckingCloudFile(false);
        })
        .catch((err) => {
          console.warn('Failed to check cloud file:', err);
          setIsCheckingCloudFile(false);
        });
    } else {
      setCloudFileInfo(null);
    }
  }, [token]);

  if (!isOpen) return null;

  // Handle Google Login
  const handleConnectGoogle = async () => {
    setIsLoadingAuth(true);
    setStatusMessage(null);
    try {
      const accessToken = await requestGoogleAccessToken();
      setToken(accessToken);
      const profile = await fetchGoogleUserProfile(accessToken);
      setUserProfile(profile);
      setStatusMessage({
        type: 'success',
        text: `Berhasil terhubung dengan Google Drive akun ${profile?.email || 'Anda'}!`
      });
      
      // Auto check cloud backup file
      const file = await findCloudBackupFile(accessToken);
      setCloudFileInfo(file);
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
  const handleDisconnectGoogle = () => {
    saveStoredAccessToken(null);
    saveStoredGoogleUser(null);
    setToken(null);
    setUserProfile(null);
    setCloudFileInfo(null);
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

      const res = await uploadCloudBackup(token, payload, cloudFileInfo?.id);
      setCloudFileInfo({
        id: res.fileId,
        modifiedTime: res.modifiedTime,
        size: res.size
      });
      setLastSyncedAt(res.modifiedTime);
      saveStoredLastSyncedAt(res.modifiedTime);

      setStatusMessage({
        type: 'success',
        text: 'Semua data (Pengaturan, Bookmark, Status Hafalan, dan Terakhir Dibaca) berhasil dicadangkan ke Google Drive!'
      });
    } catch (err: any) {
      console.error('Backup failed:', err);
      setStatusMessage({
        type: 'error',
        text: err?.message || 'Gagal mencadangkan data ke Google Drive.'
      });
    } finally {
      setIsSyncingUpload(false);
    }
  };

  // Handle Download / Restore
  const handleRestoreBackup = async () => {
    if (!token) {
      await handleConnectGoogle();
      return;
    }

    setIsSyncingDownload(true);
    setStatusMessage(null);

    try {
      const targetFile = cloudFileInfo || (await findCloudBackupFile(token));
      if (!targetFile) {
        throw new Error('Tidak ditemukan berkas cadangan (murottal_quran_cloud_backup.json) di Google Drive Anda.');
      }

      const backup = await downloadCloudBackup(token, targetFile.id);
      onRestoreData(backup.data);

      setLastSyncedAt(new Date().toISOString());
      saveStoredLastSyncedAt(new Date().toISOString());

      setStatusMessage({
        type: 'success',
        text: `Data berhasil dipulihkan! (${backup.data.bookmarks?.length || 0} Bookmark, ${
          Object.keys(backup.data.hafalanRecords || {}).length
        } Ayat Hafalan dimuat).`
      });
    } catch (err: any) {
      console.error('Restore failed:', err);
      setStatusMessage({
        type: 'error',
        text: err?.message || 'Gagal memulihkan data dari Google Drive.'
      });
    } finally {
      setIsSyncingDownload(false);
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
      <div className="bg-[#15171E] rounded-3xl max-w-xl w-full p-6 sm:p-7 space-y-6 shadow-2xl border border-[#1F2128] max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#1F2128]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#D4AF37]/15 border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37]">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#E2E2E2] flex items-center gap-2 font-serif-title">
                Cloud Save Google Drive
              </h2>
              <p className="text-xs text-[#8A8D9A]">
                Simpan & sinkronkan data aplikasi secara privat ke Google Drive
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
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
                    {userProfile?.name || 'Google Drive'}
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
              <span>Privasi Aman (Hanya membaca file aplikasi di Drive Anda)</span>
            </span>
            <span className="text-[10px] text-[#6A6D7A] hidden sm:inline">
              murottal_quran_cloud_backup.json
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
            Data yang dicadangkan mencakup <strong>Pengaturan</strong>, <strong>Daftar Bookmark & Catatan</strong>, <strong>Riwayat Status Hafalan</strong>, serta <strong>Terakhir Dibaca</strong>. Kredensial API Key <em>tidak pernah disimpan</em> ke dalam Google Drive demi keamanan akun Anda.
          </p>
        </div>

        {/* Section 4: Cloud Actions (Backup Now & Restore Data) */}
        <div className="space-y-3 pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Backup Button */}
            <button
              onClick={handleUploadBackup}
              disabled={isSyncingUpload || isSyncingDownload}
              className="flex items-center justify-center gap-2 p-3.5 rounded-2xl bg-[#D4AF37] hover:bg-[#E5C358] text-[#0A0A0B] font-bold text-xs shadow-lg transition cursor-pointer disabled:opacity-50"
            >
              {isSyncingUpload ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CloudUpload className="w-4 h-4" />
              )}
              <span>Cadangkan ke Google Drive</span>
            </button>

            {/* Restore Button */}
            <button
              onClick={handleRestoreBackup}
              disabled={isSyncingUpload || isSyncingDownload || !token}
              className="flex items-center justify-center gap-2 p-3.5 rounded-2xl bg-[#1A1C23] hover:bg-[#2A2D35] text-[#E2E2E2] border border-[#2A2D35] font-semibold text-xs transition cursor-pointer disabled:opacity-40"
            >
              {isSyncingDownload ? (
                <Loader2 className="w-4 h-4 animate-spin text-[#D4AF37]" />
              ) : (
                <CloudDownload className="w-4 h-4 text-[#D4AF37]" />
              )}
              <span>Pulihkan dari Google Drive</span>
            </button>
          </div>

          {/* Cloud file status hint */}
          {cloudFileInfo && (
            <div className="p-3 rounded-xl bg-[#0F1115] border border-[#2A2D35] flex items-center justify-between text-[11px] text-[#8A8D9A]">
              <span className="flex items-center gap-2">
                <FileJson className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>Berkas di Drive: <strong className="text-[#E2E2E2]">murottal_quran_cloud_backup.json</strong></span>
              </span>
              <span>{formatTimestamp(cloudFileInfo.modifiedTime)}</span>
            </div>
          )}
        </div>

        {/* Section 5: Auto-Sync Option */}
        <div className="pt-3 border-t border-[#1F2128]">
          <label className="flex items-center justify-between p-3.5 rounded-2xl bg-[#0F1115] border border-[#2A2D35] cursor-pointer">
            <div>
              <span className="text-xs font-semibold text-[#E2E2E2] block">
                Sinkronisasi Otomatis
              </span>
              <span className="text-[10px] text-[#8A8D9A]">
                Otomatis mengunggah perubahan hafalan & bookmark ke Google Drive
              </span>
            </div>
            <input
              type="checkbox"
              checked={!!settings.autoCloudSync}
              onChange={(e) => onUpdateSettings({ autoCloudSync: e.target.checked })}
              className="w-4 h-4 accent-[#D4AF37] rounded cursor-pointer"
            />
          </label>
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
