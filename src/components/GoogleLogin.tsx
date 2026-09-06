import React, { useCallback, useEffect, useRef, useState } from 'react';
import { BookOpen, Cloud, ShieldCheck, Users, LogIn, X } from 'lucide-react';
import { signInGoogle, subscribeCloudAuth } from '../services/firebaseCloudService';
import { importLegacyHafalan } from '../services/halaqahService';
import { getStoredHafalanRecords } from '../services/storageService';
import { useDialogAccessibility } from '../hooks/useDialogAccessibility';

export function GoogleLogin({ onComplete, onBusyChange }: { onComplete?: () => void; onBusyChange?: (busy: boolean) => void }) {
  const [importLocal, setImportLocal] = useState(false);
  const [busy, setBusy] = useState(false);
  const locked = useRef(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [online, setOnline] = useState(navigator.onLine);
  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => { window.removeEventListener('online', update); window.removeEventListener('offline', update); };
  }, []);
  const login = async () => {
    if (locked.current) return;
    locked.current = true;
    setBusy(true);
    onBusyChange?.(true);
    setError('');
    setMessage('');
    let signedIn = false;
    try {
      const uid = await signInGoogle();
      signedIn = true;
      if (importLocal) await importLegacyHafalan(getStoredHafalanRecords(), uid);
      setMessage(importLocal ? 'Login berhasil. Impor hafalan lokal selesai.' : 'Login berhasil.');
      onComplete?.();
    } catch (cause) {
      const detail = cause instanceof Error ? cause.message : String(cause);
      setError(signedIn ? `Login berhasil, tetapi impor belum selesai: ${detail} Data lokal tetap tersimpan. Coba impor kembali melalui Cloud Save.` : detail);
    } finally {
      locked.current = false;
      setBusy(false);
      onBusyChange?.(false);
    }
  };
  return <div className="mt-4 space-y-3">
    <button type="button" onClick={() => void login()} disabled={busy || !online} className="flex items-center justify-center gap-2 rounded-xl bg-[#D4AF37] px-4 py-2.5 text-sm font-semibold text-[#0A0A0B] transition hover:bg-[#E0BE48] disabled:cursor-not-allowed disabled:opacity-50"><LogIn className="h-4 w-4" />{busy ? 'Memproses…' : 'Login Google'}</button>
    <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={importLocal} disabled={busy} onChange={event => setImportLocal(event.target.checked)} className="h-4 w-4 accent-[#D4AF37]" />Impor Hafalan Lokal Lama</label>
    <p className="text-xs text-(--text-muted)">Jika dicentang, hafalan di perangkat ini ditambahkan ke akun setelah login. Hafalan cloud yang sudah ada tidak ditimpa.</p>
    {!online && <p role="status" className="text-sm text-(--text-muted)">Hubungkan internet untuk login.</p>}
    {error && <p role="alert" className="text-sm text-red-500">{error}</p>}
    {message && <p role="status" className="text-sm text-(--gold-text)">{message}</p>}
  </div>;
}


const LOGIN_BANNER_HIDDEN_DATE = 'login_banner_hidden_date';
function localDateKey() {
  const now = new Date();
  return `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
}
function isLoginBannerHiddenToday() {
  try { return localStorage.getItem(LOGIN_BANNER_HIDDEN_DATE) === localDateKey(); }
  catch { return false; }
}

function LoginBanner({ onClose }: { onClose: () => void }) {
  const [busy, setBusy] = useState(false);
  const [hideToday, setHideToday] = useState(false);

  const close = useCallback(() => { if (!busy) onClose(); }, [busy, onClose]);
  const dialogRef = useDialogAccessibility(close);
  return <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/10 p-4 backdrop-blur-[1px]">
    <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="login-banner-title" aria-describedby="login-banner-description" className="relative max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-[2rem] border border-(--border-main) bg-(--bg-card) text-(--text-main) shadow-xl">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-linear-to-b from-[#D4AF37]/15 to-transparent" aria-hidden="true" />
          <div className="relative p-6 sm:p-8">
          <button type="button" aria-label="Tutup banner login" disabled={busy} onClick={close} className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full border border-(--border-main) bg-(--bg-surface) text-(--text-muted) transition hover:bg-(--bg-card-hover) hover:text-(--text-main) focus-visible:outline-2 focus-visible:outline-[#D4AF37] disabled:cursor-not-allowed disabled:opacity-50"><X className="h-4 w-4" aria-hidden="true" /></button>
          <div className="mb-5 flex items-center justify-between gap-3 pr-8">
            <span className="grid h-14 w-14 place-items-center rounded-2xl border border-[#D4AF37]/30 bg-[#D4AF37]/10 text-(--gold-text)"><BookOpen className="h-7 w-7" aria-hidden="true" /></span>
            <span className="rounded-full border border-[#D4AF37]/20 bg-[#D4AF37]/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-(--gold-text)">Quran Hafiz</span>
          </div>
      <h2 id="login-banner-title" className="max-w-xs text-2xl font-bold leading-tight font-serif-title sm:text-3xl">Simpan hafalan bersama akun Anda</h2>
      <p id="login-banner-description" className="mt-3 text-sm text-(--text-muted)">Login Google untuk menyinkronkan hafalan dan terhubung dengan guru. Anda juga dapat melanjutkan tanpa akun.</p>
      <div className="mt-5 grid grid-cols-3 gap-2 text-center text-[11px] text-(--text-muted)">
        {[{ Icon: Cloud, label: 'Sinkron hafalan' }, { Icon: Users, label: 'Terhubung guru' }, { Icon: ShieldCheck, label: 'Data pribadi' }].map(({ Icon, label }) => {
          return <div key={label} className="rounded-2xl border border-(--border-main) bg-(--bg-surface) px-2 py-3"><Icon className="mx-auto mb-2 h-4 w-4 text-(--gold-text)" aria-hidden="true" />{label}</div>;
        })}
      </div>
      <div className="mt-5 border-t border-(--border-main) pt-1 [&_button]:w-full">
        <GoogleLogin onComplete={onClose} onBusyChange={setBusy} />
      </div>
      <button type="button" disabled={busy} onClick={close} className="mt-4 w-full rounded-xl border border-slate-500 bg-slate-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400 disabled:cursor-not-allowed disabled:opacity-50">Nanti saja</button>
            <label className="mt-3 flex w-fit cursor-pointer items-center justify-start gap-1.5 py-1 text-left text-[10px] leading-4 text-(--text-muted)">
              <input type="checkbox" checked={hideToday} onChange={event => {
                const checked = event.target.checked;
                setHideToday(checked);
                try {
                  if (checked) localStorage.setItem(LOGIN_BANNER_HIDDEN_DATE, localDateKey());
                  else localStorage.removeItem(LOGIN_BANNER_HIDDEN_DATE);
                } catch { /* The banner remains usable when browser storage is unavailable. */ }
              }} className="h-3 w-3 shrink-0 accent-[#D4AF37]" />
              Jangan tampilkan lagi untuk hari ini
            </label>

      </div>
    </div>
  </div>;
}

export function WelcomeLoginModal() {
  const [open, setOpen] = useState(false);
  const checked = useRef(false);
  const close = useCallback(() => setOpen(false), []);
  useEffect(() => subscribeCloudAuth(uid => {
    // Only decide once per page visit, after Firebase restores the existing session.
    if (checked.current) return;
    checked.current = true;
    setOpen(!uid && !isLoginBannerHiddenToday());
  }), []);
  return open ? <LoginBanner onClose={close} /> : null;
}
