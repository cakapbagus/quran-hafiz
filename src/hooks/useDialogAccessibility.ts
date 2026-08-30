import { useEffect, useRef } from 'react';

let lastFocusedElement: HTMLElement | null = null;
if (typeof document !== 'undefined') {
  document.addEventListener('focusin', (event) => { lastFocusedElement = event.target as HTMLElement; });
}

export function useDialogAccessibility(onClose: () => void, enabled = true) {
  const dialogRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!enabled) return;
    const active = document.activeElement as HTMLElement | null;
    const previous = active && active !== document.body ? active : lastFocusedElement;
    const dialog = dialogRef.current;
    const firstFocusable = dialog?.querySelector<HTMLElement>('button, input, select, textarea, [tabindex]:not([tabindex="-1"])');
    firstFocusable?.focus();
    queueMicrotask(() => { if (dialog?.isConnected && !dialog.contains(document.activeElement)) firstFocusable?.focus(); });
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') return onClose();
      if (event.key !== 'Tab' || !dialog) return;
      const focusable = [...dialog.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])')];
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      queueMicrotask(() => { if (previous?.isConnected) previous.focus(); });
    };
  }, [enabled, onClose]);
  return dialogRef;
}
