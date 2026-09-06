import React, { useEffect, useState } from 'react';
import { Save, StickyNote, X } from 'lucide-react';
import { useDialogAccessibility } from '../hooks/useDialogAccessibility';

interface VerseNoteModalProps {
  open: boolean;
  surahName: string;
  verseNumber: number;
  initialNote: string;
  onClose: () => void;
  onSave: (note: string) => void;
}

export function VerseNoteModal({ open, surahName, verseNumber, initialNote, onClose, onSave }: VerseNoteModalProps) {
  const [note, setNote] = useState(initialNote);
  const dialogRef = useDialogAccessibility(onClose, open);

  useEffect(() => {
    if (open) setNote(initialNote);
  }, [initialNote, open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="verse-note-title" tabIndex={-1} className="w-full max-w-md rounded-3xl border border-[#2A2D35] bg-[#15171E] p-5 shadow-2xl outline-none sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#D4AF37]/10 text-[#D4AF37]"><StickyNote className="h-5 w-5" /></span>
            <div>
              <h2 id="verse-note-title" className="font-bold text-[#E2E2E2]">Catatan per Ayat</h2>
              <p className="text-xs text-[#8A8D9A]">QS. {surahName}:{verseNumber}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="rounded-xl border border-[#2A2D35] p-2 text-[#8A8D9A] transition hover:text-[#E2E2E2]" aria-label="Tutup catatan"><X className="h-4 w-4" /></button>
        </div>
        <textarea autoFocus value={note} onChange={(event) => setNote(event.target.value)} maxLength={2000} rows={6} placeholder="Tulis koreksi, bagian yang perlu diulang, atau catatan setoran…" className="mt-5 w-full resize-y rounded-2xl border border-[#2A2D35] bg-[#0F1115] p-3 text-sm text-[#E2E2E2] outline-none placeholder:text-[#666975] focus:border-[#D4AF37]" />
        <div className="mt-1 flex items-center justify-between text-[10px] text-[#666975]"><span>Tersinkron ke Catatan per Ayat</span><span>{note.length}/2000</span></div>
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-xl border border-[#2A2D35] px-3 py-2 text-xs font-semibold text-[#9A9DA8]">Batal</button>
          <button type="button" onClick={() => onSave(note.trim())} className="inline-flex items-center gap-2 rounded-xl bg-[#D4AF37] px-4 py-2 text-xs font-bold text-[#0A0A0B] hover:bg-[#E0BE48]"><Save className="h-4 w-4" />Simpan</button>
        </div>
      </section>
    </div>
  );
}
