import React, { useEffect, useState } from 'react';
import { signInGoogle, subscribeCloudAuth } from '../services/firebaseCloudService';
import { flushPending, pendingCount, discardPending, activateTeacher, addManual, archiveManual, unlinkStudent, cancelTeacherRequest, changeTeacher, ensureProfile, lookupTeacher, renameStudent, requestTeacher, respondTeacherRequest, updateProfileName, saveVerse, watchConnectionRequest, watchConnectionRequests, watchProfile, watchRecords, watchStudents, type ConnectionRequest, type Profile, type Records, type Student, type Target } from '../services/halaqahService';
import { ALL_SURAHS } from '../data/surahList';
import type { HafalanVerseRecord } from '../types';

const input = 'border rounded-lg p-2 bg-white text-zinc-900';
const button = 'border rounded-lg px-3 py-2 hover:bg-amber-500/20 disabled:opacity-50';
export function HalaqahPanel({ teacherMode }: { teacherMode: boolean }) {
  const [uid, setUid] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [linked, setLinked] = useState<Student[]>([]);
  const [manual, setManual] = useState<Student[]>([]);
  const [connectionRequest, setConnectionRequest] = useState<ConnectionRequest | null>(null);
  const [teacherRequests, setTeacherRequests] = useState<ConnectionRequest[]>([]);
  const [selected, setSelected] = useState<Student | null>(null);
  const [filter, setFilter] = useState('all');
  const [pending, setPending] = useState(0);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
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
      {!uid && <button className={`${button} mt-4`} disabled={busy || !online} onClick={() => void act(signInGoogle)}>Login Google</button>}
      {teacherMode && uid && profile && !profile.teacherCode && <button className={`${button} mt-4`} disabled={busy || !online} onClick={() => void act(activateTeacher)}>Aktifkan Akun Guru</button>}
    </div>
    {error && <p role="alert" className="text-red-500">{error}</p>}
    {pending > 0 && <div role="status">{pending} perubahan offline menunggu sinkronisasi. <button className={button} disabled={busy || !online} onClick={() => void act(flushPending)}>Coba Sinkron Lagi</button> <button className={button} onClick={() => { if (window.confirm('Buang perubahan offline dan gunakan versi server?')) discardPending(); }}>Buang Antrean</button></div>}
    {uid && !profile && <p>Memuat profil…</p>}
    {uid && profile && <div className="flex items-center gap-2 text-sm bg-zinc-900/40 p-2.5 rounded-xl border border-zinc-800">
      <span>Nama Tampilan: <strong className="text-amber-400">{profile.name}</strong></span>
      <button
        className="text-xs px-2.5 py-1 rounded-lg border border-zinc-700 hover:bg-zinc-800 cursor-pointer transition text-zinc-300"
        disabled={busy || !online}
        onClick={() => {
          const newName = window.prompt('Ubah nama tampilan Anda (sebagai murid / guru):', profile.name);
          if (newName !== null && newName.trim() && newName.trim() !== profile.name) {
            void act(() => updateProfileName(newName));
          }
        }}
      >
        Ubah Nama
      </button>
    </div>}
    {uid && profile && !teacherMode && <details><summary className="cursor-pointer">Guru pembimbing: {profile.linkedTeacherName || 'Belum terhubung'}</summary>
      <div className="space-y-3 py-3">
        {connectionRequest && <div role="status" className="border rounded-lg p-3">
          {connectionRequest.status === 'pending' ? <>Permintaan ke <strong>{connectionRequest.teacherName}</strong> menunggu persetujuan guru.</> : <>Permintaan ke <strong>{connectionRequest.teacherName}</strong> diblokir oleh guru.</>}
          <button className={`${button} ml-2`} disabled={busy || !online} onClick={() => void act(cancelTeacherRequest)}>Batalkan</button>
        </div>}
        {!connectionRequest && <div className="flex flex-wrap gap-2"><label>Kode Guru <input className={input} aria-label="Kode Guru" value={code} maxLength={6} onChange={e => setCode(e.target.value.toUpperCase())} placeholder="A7K9X2" /></label>
          <button className={button} disabled={busy || !online} onClick={() => void act(async () => { const t = await lookupTeacher(code); if (window.confirm(`Kirim permintaan ke ${t.teacherName}? Guru baru memperoleh akses setelah menerima. Hubungan guru lama tetap aktif sampai saat itu.`)) { await requestTeacher(t.code); setCode(''); } })}>{profile.linkedTeacherUid ? 'Minta Ganti Guru' : 'Minta Terhubung'}</button>
        </div>}
        {profile.linkedTeacherUid && <button className={button} disabled={busy || !online} onClick={() => { if (window.confirm('Putuskan akses guru? Hafalan tetap tersimpan.')) void act(() => changeTeacher(null)); }}>Putuskan Hubungan</button>}
      </div>
    </details>}
    {uid && profile && !teacherMode && <details><summary className="cursor-pointer">Catatan dan setoran hafalan pribadi (sinkron)</summary><VerseEditor key={uid} target={{ uid }} /></details>}
    {uid && profile && teacherMode && profile.teacherCode && <div className="space-y-4 pb-24">
      <div className="grid grid-cols-3 gap-3" aria-label="Ringkasan halaqah">{[[linked.length, 'Murid terhubung'], [manual.length, 'Murid manual'], [teacherRequests.filter(r => r.status === 'pending').length, 'Permintaan baru']].map(([count, label]) => <div key={label} className="rounded-xl border border-amber-500/20 p-4"><strong className="block text-2xl">{count}</strong><span className="text-xs opacity-70">{label}</span></div>)}</div>
      <p>Kode Guru: <strong className="text-xl tracking-widest">{profile.teacherCode}</strong> <button className={button} onClick={() => void act(() => navigator.clipboard.writeText(profile.teacherCode))}>Salin Kode</button></p>
      {teacherRequests.length > 0 && <section className="border rounded-xl p-3 space-y-2"><h2 className="font-bold">Permintaan Siswa</h2>{teacherRequests.map(r => <div key={r.studentUid} className="border rounded-lg p-3 flex flex-wrap items-center justify-between gap-2"><span><strong>{r.studentName}</strong> · {r.status === 'blocked' ? 'Diblokir' : 'Menunggu'}</span><div className="flex flex-wrap gap-2">{r.status === 'pending' ? <><button className={button} disabled={busy || !online} onClick={() => void act(() => respondTeacherRequest(r, 'accept'))}>Terima</button><button className={button} disabled={busy || !online} onClick={() => void act(() => respondTeacherRequest(r, 'reject'))}>Tolak</button><button className={button} disabled={busy || !online} onClick={() => { if (window.confirm(`Blokir ${r.studentName}? Murid tidak dapat meminta terhubung lagi sampai blokir dibuka.`)) void act(() => respondTeacherRequest(r, 'block')); }}>Blokir</button></> : <button className={button} disabled={busy || !online} onClick={() => void act(() => respondTeacherRequest(r, 'unblock'))}>Buka Blokir</button>}</div></div>)}</section>}
      <form className="flex flex-wrap gap-2" onSubmit={e => { e.preventDefault(); void act(async () => { await addManual(name); setName(''); }); }}><input className={input} aria-label="Nama siswa manual" value={name} maxLength={100} onChange={e => setName(e.target.value)} placeholder="Nama siswa manual" required /><button className={button} disabled={busy || !online}>Tambah Siswa Manual</button></form>
      <label>Filter siswa <select className={input} value={filter} onChange={e => setFilter(e.target.value)}><option value="all">Semua</option><option value="linked">Akun Terhubung</option><option value="manual">Manual</option></select></label>
      {!linked.length && !manual.length && <p>Belum ada siswa. Bagikan kode atau tambahkan siswa manual.</p>}
      <ul className="grid sm:grid-cols-2 gap-3">{[...linked, ...manual].filter(s => filter === 'all' || (s.manual ? filter === 'manual' : filter === 'linked')).map(s => <li key={`${s.manual}-${s.id}`} className="border rounded-xl p-3 space-y-2">
        <div className="flex items-baseline justify-between gap-2">
          <div>
            <strong>{s.name}</strong>
            {!s.manual && s.alias && s.originalName && s.alias !== s.originalName && (
              <span className="text-xs text-zinc-400 block">Nama akun: {s.originalName}</span>
            )}
          </div>
          <span className="text-xs px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 shrink-0">{s.manual ? 'Manual' : 'Sync'}</span>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button className={button} onClick={() => setSelected(s)}>Simak / Edit Hafalan</button>
          <button className={button} disabled={busy || !online} onClick={() => {
            const promptMsg = s.manual
              ? 'Nama siswa:'
              : `Nama alias siswa (hanya tampil di akun guru, kosongkan untuk reset):`;
            const n = window.prompt(promptMsg, s.alias || s.name);
            if (n !== null) void act(() => renameStudent(s, n));
          }}>{s.manual ? 'Edit Nama' : 'Edit Alias'}</button>
          {s.manual ? (
            <button className={button} disabled={busy || !online} onClick={() => { if (window.confirm('Hapus siswa manual ini dari daftar halaqah? Catatan dan riwayat hafalan tetap tersimpan di database.')) void act(async () => { await archiveManual(s.id); if (selected?.id === s.id) setSelected(null); }); }}>Hapus Siswa</button>
          ) : (
            <button className={button} disabled={busy || !online} onClick={() => { if (window.confirm(`Lepas hubungan dengan ${s.name}? Seluruh catatan dan hafalan murid tetap utuh tersimpan di akunnya.`)) void act(async () => { await unlinkStudent(s.id); if (selected?.id === s.id) setSelected(null); }); }}>Hapus Siswa</button>
          )}
        </div>
      </li>)}</ul>
      {selected && <section className="border rounded-xl p-4"><h2 className="text-xl font-bold">Setoran: {selected.name}</h2><button className={button} onClick={() => setSelected(null)}>Tutup Setoran</button><VerseEditor key={`${selected.manual}-${selected.id}`} target={selected.manual ? { uid, manualId: selected.id } : { uid: selected.id }} /></section>}
    </div>}
  </section>;
}

function VerseEditor({ target }: { target: Target; key?: string }) {
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
  return <div className="space-y-3 py-4">
    <p>{ready ? `${values.filter(r => r.status === 'memorized').length} ayat mutqin · ${values.filter(r => r.status === 'review_needed').length} perlu murojaah` : 'Memuat hafalan…'}</p>
    {error && <p role="alert" className="text-red-500">{error}</p>}
    <div className="flex gap-3 flex-wrap"><label>Surah <select className={input} disabled={dirty || busy} value={surah} onChange={e => { setSurah(Number(e.target.value)); setVerse(1); }}>{ALL_SURAHS.map(s => <option key={s.nomor} value={s.nomor}>{s.nomor}. {s.namaLatin}</option>)}</select></label><label>Ayat <input className={input} disabled={dirty || busy} type="number" min={1} max={ALL_SURAHS[surah - 1].jumlahAyat} value={verse} onChange={e => setVerse(Math.max(1, Math.min(ALL_SURAHS[surah - 1].jumlahAyat, Number(e.target.value) || 1)))} /></label></div>
    <form className="flex flex-col gap-3" onSubmit={async e => { e.preventDefault(); setBusy(true); setError(''); try { await saveVerse(target, { surahNumber: surah, verseNumber: verse, status, notes, repeatCount: repeat }, revision); setDirty(false); } catch (e) { setError(e instanceof Error ? e.message : String(e)); } finally { setBusy(false); } }}>
      <label>Status <select className={input} disabled={!ready || busy} value={status} onChange={e => { setStatus(e.target.value as HafalanVerseRecord['status']); setDirty(true); }}><option value="not_started">Belum dimulai</option><option value="in_progress">Sedang dihafal</option><option value="review_needed">Perlu murojaah</option><option value="memorized">Mutqin</option></select></label>
      <label>Jumlah pengulangan <input className={input} disabled={!ready || busy} type="number" min={0} max={100000} value={repeat} onChange={e => { setRepeat(Number(e.target.value)); setDirty(true); }} /></label>
      <label>Catatan per ayat<textarea className={`${input} block w-full`} disabled={!ready || busy} value={notes} maxLength={2000} onChange={e => { setNotes(e.target.value); setDirty(true); }} /></label>
      <div className="flex gap-2"><button className={button} disabled={!ready || !dirty || busy}>{busy ? 'Menyimpan…' : 'Simpan Hafalan'}</button><button type="button" className={button} disabled={busy} onClick={load}>Muat Versi Terbaru / Batal</button></div>
    </form>
  </div>;
}
