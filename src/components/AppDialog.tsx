import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { AlertCircle } from 'lucide-react';

type DialogOptions = { message: string; initialValue?: string; input: boolean };

function AppDialog({ message, initialValue = '', input, onResolve }: DialogOptions & { onResolve: (value: string | boolean | null) => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [value, setValue] = useState(initialValue);
  useEffect(() => {
    const dialog = ref.current!;
    const previous = document.activeElement as HTMLElement | null;
    dialog.showModal();
    dialog.querySelector<HTMLElement>(input ? 'input' : 'button')?.focus();
    const cancel = (event: Event) => { event.preventDefault(); onResolve(input ? null : false); };
    dialog.addEventListener('cancel', cancel);
    // Keep Escape and Tab inside this modal, including when opened over settings.
    const keyboard = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopImmediatePropagation();
        onResolve(input ? null : false);
      } else if (event.key === 'Tab') {
        event.stopImmediatePropagation();
        const controls = [...dialog.querySelectorAll<HTMLElement>('input, button')];
        const first = controls[0];
        const last = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', keyboard, true);
    return () => {
      dialog.removeEventListener('cancel', cancel);
      document.removeEventListener('keydown', keyboard, true);
      dialog.close();
      if (previous?.isConnected) previous.focus();
    };
  }, [input, onResolve]);

  return <dialog ref={ref} aria-labelledby="app-dialog-title" aria-describedby="app-dialog-message" aria-modal="true" className="fixed inset-0 m-auto w-[calc(100%-2rem)] max-w-md max-h-[90dvh] overflow-y-auto rounded-3xl border border-(--border-main) bg-(--bg-card) p-6 text-(--text-main) shadow-2xl backdrop:bg-black/80 backdrop:backdrop-blur-sm">
    <form onSubmit={event => { event.preventDefault(); onResolve(input ? value : true); }} className="space-y-5">
      <h2 id="app-dialog-title" className="flex items-center gap-3 text-lg font-bold font-serif-title"><AlertCircle className="h-6 w-6 text-(--gold-text)" />{input ? 'Ubah nama' : 'Konfirmasi tindakan'}</h2>
      <p id="app-dialog-message" className="text-sm leading-relaxed text-(--text-muted)">{message}</p>
      {input && <input aria-label="Nama" value={value} onChange={event => setValue(event.target.value)} className="w-full rounded-xl border border-(--border-main) bg-(--bg-surface) px-3 py-2.5 text-sm outline-none focus:border-[#D4AF37]" />}
      <div className="flex justify-end gap-3">
        <button type="button" onClick={() => onResolve(input ? null : false)} className="rounded-xl border border-(--border-main) px-4 py-2.5 text-sm font-semibold hover:bg-(--bg-card-hover)">Batal</button>
        <button type="submit" className="rounded-xl bg-[#D4AF37] px-4 py-2.5 text-sm font-semibold text-[#0A0A0B] hover:bg-[#E0BE48]">{input ? 'Simpan' : 'Lanjutkan'}</button>
      </div>
    </form>
  </dialog>;
}

// Serialize requests so rapid clicks cannot stack competing confirmation dialogs.
let queue: Promise<unknown> = Promise.resolve();
function openDialog(options: DialogOptions): Promise<string | boolean | null> {
  const result = queue.then(() => new Promise<string | boolean | null>(resolve => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);
    let settled = false;
    const onResolve = (value: string | boolean | null) => {
      if (settled) return;
      settled = true;
      queueMicrotask(() => { root.unmount(); container.remove(); resolve(value); });
    };
    root.render(<AppDialog {...options} onResolve={onResolve} />);
  }));
  queue = result;
  return result;
}

export async function confirmAction(message: string): Promise<boolean> {
  return (await openDialog({ message, input: false })) === true;
}

export async function promptText(message: string, initialValue = ''): Promise<string | null> {
  return await openDialog({ message, initialValue, input: true }) as string | null;
}
