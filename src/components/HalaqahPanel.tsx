import { confirmAction, promptText } from './AppDialog';
import React, { useEffect, useState } from 'react';
import { subscribeCloudAuth } from '../services/firebaseCloudService';
import { GoogleLogin } from './GoogleLogin';
import { flushPending, pendingCount, discardPending, activateTeacher, addManual, archiveManual, unlinkStudent, cancelTeacherRequest, changeTeacher, ensureProfile, lookupTeacher, renameStudent, requestTeacher, respondTeacherRequest, updateProfileName, saveVerse, watchConnectionRequest, watchConnectionRequests, watchProfile, watchRecords, watchStudents, type ConnectionRequest, type Profile, type Records, type Student, type Target } from '../services/halaqahService';
import { ALL_SURAHS } from '../data/surahList';
import type { HafalanVerseRecord } from '../types';
import { BookOpen, Check, ChevronDown, Copy, Edit2, Link2, Plus, RotateCcw, Save, Search, Send, StickyNote, Trash2, Unlink, User, X } from 'lucide-react';

const input = 'w-full rounded-xl border border-[#2A2D35] bg-[#0F1115] px-3 py-2.5 text-sm text-[#E2E2E2] outline-none transition focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/10 disabled:cursor-not-allowed disabled:opacity-50';
const button = 'rounded-xl border border-[#2A2D35] bg-[#15171E] px-3 py-2 text-sm font-semibold text-[#E2E2E2] transition hover:border-[#D4AF37]/50 hover:bg-[#1A1C23] disabled:cursor-not-allowed disabled:opacity-50';
export function HalaqahPanel({ teacherMode }: { teacherMode: boolean }) {
  const [uid, setUid] = useState<string | null>(null);
  const [loginBusy, setLoginBusy] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [linked, setLinked] = useState<Student[]>([]);
  const [manual, setManual] = useState<Student[]>([]);
  const [connectionRequest, setConnectionRequest] = useState<ConnectionRequest | null>(null);
  const [teacherRequests, setTeacherRequests] = useState<ConnectionRequest[]>([]);
  const [selected, setSelected] = useState<Student | null>(null);
  const [filter, setFilter] = useState('all');
  const [studentSearch, setStudentSearch] = useState('');
  const [pending, setPending] = useState(0);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [online, setOnline] = useState(navigator.onLine);
  useEffect(() => subscribeCloudAuth(id => { setUid(id); setProfile(null); setLinked([]); setManual([]); setConnectionRequest(null); setTeacherRequests([]); setSelected(null); }), []);
  useEffect(() => { const update = () => setOnline(navigator.onLine); window.addEventListener('online', update); window.addEventListener('offline', update); return () => { window.removeEventListener('online', update); window.removeEventListener('offline', update); }; }, []);
  const fail = (e: Error) => setError(e.message);
  useEffect(() => {
    if (!uid) { setPending(0); return; }
    const refresh = () => { try { setPending(pendingCount()); } catch (e) { fail(e as Error); } };
    const sync = () => { if (navigator.onLine) void flushPending().catch(fail).finally(refresh); };
    refresh(); sync(); window.addEventListener('online', sync); window.addEventListener('halaqah-pending', refresh);
    return () => { window.removeEventListener('online', sync); window.removeEventListener('halaqah-pending', refresh); };
  }, [uid]);
  async function act(task: () => Promise<unknown>) { setBusy(true); setError(''); try { await task(); } catch (e) { fail(e instanceof Error ? e : new Error(String(e))); } finally { setBusy(false); } }
  useEffect(() => { if (!uid) return; let active = true; ensureProfile().catch(e => { if (active) fail(e); }); const stop = watchProfile(uid, setProfile, fail); return () => { active = false; stop(); }; }, [uid]);
  useEffect(() => { if (!uid) return; return watchConnectionRequest(uid, setConnectionRequest, fail); }, [uid]);
  useEffect(() => { if (!uid || !teacherMode || !profile?.teacherCode) return; const a = watchStudents(uid, false, setLinked, fail); const b = watchStudents(uid, true, setManual, fail); const c = watchConnectionRequests(uid, setTeacherRequests, fail); return () => { a(); b(); c(); }; }, [uid, teacherMode, profile?.teacherCode]);
  useEffect(() => { if (selected && !(selected.manual ? manual : linked).some(s => s.id === selected.id)) setSelected(null); }, [linked, manual]);
  return <section className="max-w-7xl mx-auto w-full p-4 sm:p-6 space-y-4 border-b border-zinc-500/20" aria-label={teacherMode ? 'Halaman guru' : 'Halaman murid'}>
    <div className={`rounded-2xl border p-5 ${teacherMode ? 'border-amber-500/30 bg-amber-500/5' : 'border-emerald-500/30 bg-emerald-500/5'}`}>
      <p className="text-xs uppercase tracking-widest opacity-60">{teacherMode ? 'Halaqah' : 'Ruang belajar'}</p>
      <h2 className="text-2xl font-bold mt-1">{teacherMode ? 'Dashboard Guru' : 'Hafalan Murid'}</h2>
      <p className="text-sm opacity-70 mt-2">{teacherMode ? 'Kelola murid, tinjau permintaan, dan simak setoran hafalan.' : 'Baca Al-Quran, latih hafalan, dan catat setoran bersama guru pembimbing.'}</p>
      {(!uid || loginBusy) && <GoogleLogin onBusyChange={value => { if (value) setLoginBusy(true); }} onComplete={() => setLoginBusy(false)} />}
      {teacherMode && uid && profile && !profile.teacherCode && <button className={`${button} mt-4`} disabled={busy || !online} onClick={() => void act(activateTeacher)}>Aktifkan Akun Guru</button>}
    </div>
    {error && <p role="alert" className="text-red-500">{error}</p>}
    {pending > 0 && <div role="status">{pending} perubahan offline menunggu sinkronisasi. <button className={button} disabled={busy || !online} onClick={() => void act(flushPending)}>Coba Sinkron Lagi</button> <button className={button} onClick={async () => { if (await confirmAction('Buang perubahan offline dan gunakan versi server?')) discardPending(); }}>Buang Antrean</button></div>}
    {uid && !profile && <p>Memuat profil…</p>}
    {uid && profile && <div className="flex items-center gap-2 rounded-xl border border-(--border-main) bg-(--bg-card) p-2.5 text-sm text-(--text-main) shadow-sm">
      <span>Nama Tampilan: <strong className="text-(--gold-text)">{profile.name}</strong></span>
      <button
        type="button"
        className="grid h-8 w-8 shrink-0 cursor-pointer place-items-center rounded-lg border border-(--border-main) bg-(--bg-surface) text-(--text-muted) transition hover:bg-(--bg-card-hover) hover:text-(--text-main) disabled:cursor-not-allowed disabled:opacity-40"
        aria-label="Ubah nama tampilan"
        title="Ubah Nama"
        disabled={busy || !online}
        onClick={async () => {
          const newName = await promptText('Ubah nama tampilan Anda:', profile.name);
          if (newName !== null && newName.trim() && newName.trim() !== profile.name) {
            void act(() => updateProfileName(newName));
          }
        }}
      >
        <Edit2 className="h-3.5 w-3.5" />
      </button>
    </div>}
    {uid && profile && !teacherMode && <details className="group overflow-hidden rounded-2xl border border-[#24262E] bg-[#12141A]">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-3 marker:hidden sm:p-4">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#D4AF37]/10 text-[#D4AF37]"><Link2 className="h-4 w-4" /></span>
          <div className="min-w-0">
            <span className="block text-xs text-[#777A86]">Guru Pembimbing</span>
            <span className="block truncate text-sm font-semibold text-[#E2E2E2]">{profile.linkedTeacherName || 'Belum terhubung'}</span>
          </div>
        </div>
        <ChevronDown className="h-4 w-4 shrink-0 text-[#777A86] transition-transform group-open:rotate-180" aria-hidden="true" />
      </summary>
      <div className="border-t border-[#24262E] px-3 pb-3 pt-3 sm:px-4 sm:pb-4">
        {profile.linkedTeacherUid && <div className="mb-3 flex justify-end"><button type="button" className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-[#2A2D35] px-2.5 text-xs text-[#9A9DA8] transition hover:border-red-500/40 hover:text-red-400 disabled:opacity-50" disabled={busy || !online} onClick={async () => { if (await confirmAction('Putuskan akses guru? Hafalan tetap tersimpan.')) void act(() => changeTeacher(null)); }}><Unlink className="h-3.5 w-3.5" />Putuskan</button></div>}
        {connectionRequest ? <div role="status" className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#2A2D35] bg-[#0D0F14] px-3 py-2 text-xs text-[#9A9DA8]">
          <span>{connectionRequest.status === 'pending' ? <>Permintaan ke <strong className="text-[#E2E2E2]">{connectionRequest.teacherName}</strong> menunggu persetujuan.</> : <>Permintaan ke <strong className="text-[#E2E2E2]">{connectionRequest.teacherName}</strong> diblokir.</>}</span>
          <button type="button" className="font-semibold text-red-400 transition hover:text-red-300 disabled:opacity-50" disabled={busy || !online} onClick={() => void act(cancelTeacherRequest)}>Batalkan</button>
        </div> : <div className="flex items-end gap-2">
          <label className="min-w-0 flex-1"><span className="mb-1 block text-[11px] text-[#777A86]">Kode guru</span><input className={`${input} font-code tracking-wider`} aria-label="Kode Guru" value={code} maxLength={6} onChange={e => setCode(e.target.value.toUpperCase())} placeholder="A7K9X2" /></label>
          <button type="button" aria-label={profile.linkedTeacherUid ? 'Minta ganti guru' : 'Minta terhubung dengan guru'} title={profile.linkedTeacherUid ? 'Minta Ganti Guru' : 'Minta Terhubung'} className="grid h-10.5 w-10.5 shrink-0 place-items-center rounded-xl bg-[#D4AF37] text-[#0A0A0B] transition hover:bg-[#E0BE48] disabled:cursor-not-allowed disabled:opacity-40" disabled={busy || !online || code.trim().length !== 6} onClick={() => void act(async () => { const t = await lookupTeacher(code); if (await confirmAction(`Kirim permintaan ke ${t.teacherName}? Guru baru memperoleh akses setelah menerima. Hubungan guru lama tetap aktif sampai saat itu.`)) { await requestTeacher(t.code); setCode(''); } })}><Send className="h-4 w-4" /></button>
        </div>}
      </div>
    </details>}
    {uid && profile && !teacherMode && <section className="rounded-2xl border border-[#24262E] bg-[#12141A] p-4 sm:p-5" aria-label="Editor hafalan pribadi"><VerseEditor key={uid} target={{ uid }} /></section>}
    {uid && profile && teacherMode && profile.teacherCode && <div className="space-y-4 pb-24">
      <div className="grid grid-cols-3 gap-3" aria-label="Ringkasan halaqah">{[[linked.length, 'Murid terhubung'], [manual.length, 'Murid manual'], [teacherRequests.filter(r => r.status === 'pending').length, 'Permintaan baru']].map(([count, label]) => <div key={label} className="rounded-xl border border-amber-500/20 p-4"><strong className="block text-2xl">{count}</strong><span className="text-xs opacity-70">{label}</span></div>)}</div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-[#8A8D9A]">Kode Guru:</span>
        <strong className="font-code rounded-lg border border-[#2A2D35] bg-[#0F1115] px-2.5 py-1 text-lg font-bold tracking-widest text-[#D4AF37]">{profile.teacherCode}</strong>
        <button
          type="button"
          aria-label={copiedCode ? 'Kode guru tersalin' : 'Salin kode guru'}
          title={copiedCode ? 'Tersalin' : 'Salin Kode'}
          className="grid h-9 w-9 place-items-center rounded-xl border border-[#2A2D35] bg-[#15171E] text-[#8A8D9A] transition hover:border-[#D4AF37]/50 hover:bg-[#1A1C23] hover:text-[#E2E2E2]"
          onClick={async () => {
            void navigator.clipboard.writeText(profile.teacherCode).then(() => {
              setCopiedCode(true);
              setTimeout(() => setCopiedCode(false), 2000);
            }).catch(fail);
          }}
        >
          {copiedCode ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
        </button>
      </div>
      {teacherRequests.length > 0 && <section className="border rounded-xl p-3 space-y-2"><h2 className="font-bold">Permintaan Murid</h2>{teacherRequests.map(r => <div key={r.studentUid} className="border rounded-lg p-3 flex flex-wrap items-center justify-between gap-2"><span><strong>{r.studentName}</strong> · {r.status === 'blocked' ? 'Diblokir' : 'Menunggu'}</span><div className="flex flex-wrap gap-2">{r.status === 'pending' ? <><button className={button} disabled={busy || !online} onClick={() => void act(() => respondTeacherRequest(r, 'accept'))}>Terima</button><button className={button} disabled={busy || !online} onClick={() => void act(() => respondTeacherRequest(r, 'reject'))}>Tolak</button><button className={button} disabled={busy || !online} onClick={async () => { if (await confirmAction(`Blokir ${r.studentName}? Murid tidak dapat meminta terhubung lagi sampai blokir dibuka.`)) void act(() => respondTeacherRequest(r, 'block')); }}>Blokir</button></> : <button className={button} disabled={busy || !online} onClick={() => void act(() => respondTeacherRequest(r, 'unblock'))}>Buka Blokir</button>}</div></div>)}</section>}
      <form className="flex items-center gap-2" onSubmit={e => { e.preventDefault(); void act(async () => { await addManual(name); setName(''); }); }}>
        <input className={input} aria-label="Nama murid manual" value={name} maxLength={100} onChange={e => setName(e.target.value)} placeholder="Nama murid manual" required />
        <button
          type="submit"
          aria-label="Tambah murid manual"
          title="Tambah Murid Manual"
          className="flex h-10.5 shrink-0 items-center justify-center gap-1.5 rounded-xl bg-[#D4AF37] px-3 font-semibold text-[#0A0A0B] transition hover:bg-[#E0BE48] disabled:cursor-not-allowed disabled:opacity-40 sm:px-4"
          disabled={busy || !online || !name.trim()}
        >
          <Plus className="h-4 w-4 shrink-0" />
          <span className="hidden text-sm sm:inline">Tambah Murid Manual</span>
        </button>
      </form>
      <div className="flex flex-wrap items-center gap-2.5">
        <div className="flex items-center gap-2">
          <label htmlFor="filter-murid-select" className="text-xs font-medium text-[#8A8D9A]">Filter Murid:</label>
          <select
            id="filter-murid-select"
            className="rounded-lg border border-[#2A2D35] bg-[#0F1115] px-2.5 py-1 text-xs text-[#E2E2E2] outline-none transition focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]/20"
            value={filter}
            onChange={e => setFilter(e.target.value)}
          >
            <option value="all">Semua</option>
            <option value="linked">Akun Terhubung</option>
            <option value="manual">Manual</option>
          </select>
        </div>

        <div className="relative min-w-35 flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#777A86]" />
          <input
            type="search"
            value={studentSearch}
            onChange={e => setStudentSearch(e.target.value)}
            placeholder="Cari nama murid…"
            aria-label="Cari nama murid"
            className="w-full rounded-lg border border-[#2A2D35] bg-[#0F1115] py-1 pl-8 pr-2.5 text-xs text-[#E2E2E2] outline-none transition placeholder:text-[#666975] focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]/20"
          />
        </div>
      </div>
      {!linked.length && !manual.length && <p>Belum ada murid. Bagikan kode atau tambahkan murid manual.</p>}
      <ul className="grid gap-2.5 sm:grid-cols-2">{[...linked, ...manual].filter(s => {
        if (filter !== 'all' && (s.manual ? filter !== 'manual' : filter !== 'linked')) return false;
        if (studentSearch.trim()) {
          const q = studentSearch.toLowerCase().trim();
          const matchName = s.name.toLowerCase().includes(q);
          const matchAlias = s.alias?.toLowerCase().includes(q);
          const matchOriginal = s.originalName?.toLowerCase().includes(q);
          if (!matchName && !matchAlias && !matchOriginal) return false;
        }
        return true;
      }).map(s => {
        const isSelected = selected?.id === s.id && selected?.manual === s.manual;
        return (
          <li
            key={`${s.manual}-${s.id}`}
            className={`flex items-center justify-between gap-3 rounded-xl border p-3 transition ${
              isSelected
                ? 'border-[#D4AF37] bg-[#D4AF37]/10'
                : 'border-[#24262E] bg-[#12141A] hover:border-[#2A2D35]'
            }`}
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="truncate text-sm font-semibold text-[#E2E2E2]">{s.name}</span>
                <span className={`shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-medium ${
                  s.manual
                    ? 'border border-zinc-700 bg-zinc-800 text-zinc-400'
                    : 'border border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                }`}>
                  {s.manual ? 'Manual' : 'Sync'}
                </span>
              </div>
              {!s.manual && s.alias && s.originalName && s.alias !== s.originalName && (
                <span className="block truncate text-[11px] text-[#777A86]">Akun: {s.originalName}</span>
              )}
            </div>

            <div className="flex shrink-0 items-center gap-1.5">
              <button
                type="button"
                className={`flex h-8 items-center justify-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold transition ${
                  isSelected
                    ? 'bg-[#D4AF37] text-[#0A0A0B]'
                    : 'border border-[#2A2D35] bg-[#15171E] text-[#E2E2E2] hover:border-[#D4AF37]/50 hover:bg-[#1A1C23]'
                }`}
                onClick={() => setSelected(isSelected ? null : s)}
                aria-label={isSelected ? `Tutup setoran ${s.name}` : `Simak hafalan ${s.name}`}
                title="Simak / Edit Hafalan"
              >
                <BookOpen className="h-3.5 w-3.5 shrink-0" />
                <span className="hidden sm:inline">Simak</span>
              </button>

              <button
                type="button"
                className="grid h-8 w-8 place-items-center rounded-lg border border-[#2A2D35] bg-[#15171E] text-[#8A8D9A] transition hover:border-[#D4AF37]/50 hover:bg-[#1A1C23] hover:text-[#E2E2E2] disabled:cursor-not-allowed disabled:opacity-40"
                disabled={busy || !online}
                onClick={async () => {
                  const promptMsg = s.manual
                    ? 'Nama murid:'
                    : `Nama alias murid (hanya tampil di akun guru, kosongkan untuk reset):`;
                  const n = await promptText(promptMsg, s.alias || s.name);
                  if (n !== null) void act(() => renameStudent(s, n));
                }}
                aria-label={s.manual ? 'Edit nama murid' : 'Edit alias murid'}
                title={s.manual ? 'Edit Nama' : 'Edit Alias'}
              >
                <Edit2 className="h-3.5 w-3.5" />
              </button>

              <button
                type="button"
                className="grid h-8 w-8 place-items-center rounded-lg border border-[#2A2D35] bg-[#15171E] text-[#8A8D9A] transition hover:border-red-500/50 hover:bg-red-500/10 hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-40"
                disabled={busy || !online}
                onClick={async () => {
                  if (s.manual) {
                    if (await confirmAction('Hapus murid manual ini dari daftar halaqah? Catatan dan riwayat hafalan tetap tersimpan di database.')) {
                      void act(async () => {
                        await archiveManual(s.id);
                        if (selected?.id === s.id) setSelected(null);
                      });
                    }
                  } else {
                    if (await confirmAction(`Lepas hubungan dengan ${s.name}? Seluruh catatan dan hafalan murid tetap utuh tersimpan di akunnya.`)) {
                      void act(async () => {
                        await unlinkStudent(s.id);
                        if (selected?.id === s.id) setSelected(null);
                      });
                    }
                  }
                }}
                aria-label={s.manual ? 'Hapus murid manual' : 'Lepas hubungan murid'}
                title={s.manual ? 'Hapus Murid' : 'Lepas Murid'}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </li>
        );
      })}</ul>
      {selected && (
        <section className="relative space-y-4 rounded-2xl border border-[#24262E] bg-[#12141A] p-4 sm:p-5" aria-label={`Setoran hafalan ${selected.name}`}>
          <div className="flex items-start justify-between gap-4 border-b border-[#24262E] pb-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#D4AF37]">Setoran Hafalan</p>
              <h2 className="text-xl font-bold text-[#E2E2E2]">{selected.name}</h2>
            </div>
            <button
              type="button"
              className="grid h-8 w-8 shrink-0 place-items-center rounded-xl border border-[#2A2D35] bg-[#0F1115] text-[#8A8D9A] transition hover:border-[#D4AF37]/50 hover:bg-[#1A1C23] hover:text-[#E2E2E2]"
              onClick={() => setSelected(null)}
              aria-label="Tutup setoran"
              title="Tutup Setoran"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <VerseEditor
            key={`${selected.manual}-${selected.id}`}
            target={selected.manual ? { uid, manualId: selected.id } : { uid: selected.id }}
            onClose={() => setSelected(null)}
          />
        </section>
      )}
    </div>}
  </section>;
}

function VerseEditor({ target, onClose }: { target: Target; onClose?: () => void; key?: string }) {
  const [records, setRecords] = useState<Records>({});
  const [surah, setSurah] = useState(1);
  const [verse, setVerse] = useState(1);
  const [status, setStatus] = useState<HafalanVerseRecord['status']>('not_started');
  const [notes, setNotes] = useState('');
  const [repeat, setRepeat] = useState(0);
  const [revision, setRevision] = useState(0);
  const [dirty, setDirty] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const key = `${surah}_${verse}`;
  useEffect(() => watchRecords(target, r => { setRecords(r); setReady(true); }, e => { setRecords({}); setReady(false); setError(e.message); }), [target.uid, target.manualId]);
  const load = () => { const r = records[key]; setStatus(r?.status || 'not_started'); setNotes(r?.notes || ''); setRepeat(r?.repeatCount || 0); setRevision(r?.revision || 0); setDirty(false); };
  useEffect(() => { if (!dirty) load(); }, [records, key, dirty]);
  const values = Object.values(records) as HafalanVerseRecord[];
  const memorized = values.filter(r => r.status === 'memorized').length;
  const needsReview = values.filter(r => r.status === 'review_needed').length;
  const fieldLabel = 'mb-1.5 block text-xs font-medium text-[#9A9DA8]';

  return <div className="space-y-4">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <div className="flex items-center gap-2 text-[#E2E2E2]">
          <BookOpen className="h-4 w-4 text-[#D4AF37]" />
          <h3 className="font-semibold">Catatan per Ayat</h3>
        </div>
        <p className="mt-1 text-xs text-[#777A86]">Pilih ayat, perbarui status, lalu simpan perubahan.</p>
      </div>
      <div className="flex gap-2" aria-label="Ringkasan hafalan">
        <span className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-2.5 py-1.5 text-xs text-emerald-400"><strong>{ready ? memorized : '–'}</strong> mutqin</span>
        <span className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-2.5 py-1.5 text-xs text-amber-400"><strong>{ready ? needsReview : '–'}</strong> murojaah</span>
      </div>
    </div>

    {error && <p role="alert" className="rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</p>}

    <div className="grid gap-3 rounded-2xl border border-[#24262E] bg-[#0D0F14] p-3 sm:grid-cols-[minmax(0,1fr)_7rem_minmax(10rem,0.7fr)] sm:p-4">
      <label>
        <span className={fieldLabel}>Surah</span>
        <select className={input} disabled={dirty || busy} value={surah} onChange={e => { setSurah(Number(e.target.value)); setVerse(1); }}>
          {ALL_SURAHS.map(s => <option key={s.nomor} value={s.nomor}>{s.nomor}. {s.namaLatin}</option>)}
        </select>
      </label>
      <label>
        <span className={fieldLabel}>Ayat</span>
        <input className={input} disabled={dirty || busy} type="number" inputMode="numeric" onFocus={e => e.currentTarget.select()} min={1} max={ALL_SURAHS[surah - 1].jumlahAyat} value={verse} onChange={e => setVerse(Math.max(1, Math.min(ALL_SURAHS[surah - 1].jumlahAyat, Number(e.target.value) || 1)))} />
      </label>
      <label>
        <span className={fieldLabel}>Status hafalan</span>
        <select className={input} disabled={!ready || busy} value={status} onChange={e => { setStatus(e.target.value as HafalanVerseRecord['status']); setDirty(true); }}>
          <option value="not_started">Belum dimulai</option><option value="in_progress">Sedang dihafal</option><option value="review_needed">Perlu murojaah</option><option value="memorized">Mutqin</option>
        </select>
      </label>
      {dirty && <p className="text-xs text-amber-400 sm:col-span-3">Simpan atau batalkan perubahan sebelum berpindah ayat.</p>}
    </div>

    <form className="space-y-4" onSubmit={async e => { e.preventDefault(); setBusy(true); setError(''); try { await saveVerse(target, { surahNumber: surah, verseNumber: verse, status, notes, repeatCount: repeat }, revision); setDirty(false); } catch (e) { setError(e instanceof Error ? e.message : String(e)); } finally { setBusy(false); } }}>
      <label>
        <span className={`${fieldLabel} flex items-center gap-1.5`}><StickyNote className="h-3.5 w-3.5" /> Catatan</span>
        <textarea className={`${input} min-h-24 resize-y`} disabled={!ready || busy} value={notes} maxLength={2000} placeholder="Tulis koreksi, bagian yang perlu diulang, atau catatan setoran…" onChange={e => { setNotes(e.target.value); setDirty(true); }} />
        <span className="mt-1 block text-right text-[10px] text-[#666975]">{notes.length}/2000</span>
      </label>
      <div className="flex flex-col-reverse gap-2 border-t border-[#24262E] pt-4 sm:flex-row sm:justify-end">
        <button
          type="button"
          className={`${button} inline-flex items-center justify-center gap-2`}
          disabled={busy}
          onClick={async () => {
            load();
            if (onClose) onClose();
          }}
        >
          <X className="h-4 w-4" />
          Batal
        </button>
        <button className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#D4AF37] px-4 py-2.5 text-sm font-bold text-[#0A0A0B] transition hover:bg-[#E0BE48] disabled:cursor-not-allowed disabled:opacity-40" disabled={!ready || !dirty || busy}>{busy ? <><RotateCcw className="h-4 w-4 animate-spin" />Menyimpan…</> : <><Save className="h-4 w-4" />Simpan Hafalan</>}</button>
      </div>
      {!dirty && ready && <p className="flex items-center justify-end gap-1.5 text-xs text-[#777A86]"><Check className="h-3.5 w-3.5 text-emerald-500" />Data ayat tersinkron</p>}
    </form>
  </div>;
}
