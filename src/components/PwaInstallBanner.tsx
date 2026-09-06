import { Download, Share, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import packageInfo from '../../package.json';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

const DISMISSAL_DURATION_MS = 7 * 24 * 60 * 60 * 1000;
const DISMISSAL_KEY = `quran-hafiz:pwa-install-dismissed:${packageInfo.version}`;

function isStandalone() {
  return window.matchMedia?.('(display-mode: standalone)').matches
    || Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
}

export function isIosDevice() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent)
    || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

function wasRecentlyDismissed() {
  const dismissedAt = Number(localStorage.getItem(DISMISSAL_KEY));
  return Number.isFinite(dismissedAt) && Date.now() - dismissedAt < DISMISSAL_DURATION_MS;
}

export default function PwaInstallBanner() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [hidden, setHidden] = useState(() => isStandalone() || wasRecentlyDismissed());
  const ios = isIosDevice();

  useEffect(() => {
    const handleInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };
    const handleInstalled = () => {
      setInstallPrompt(null);
      setHidden(true);
    };

    window.addEventListener('beforeinstallprompt', handleInstallPrompt);
    window.addEventListener('appinstalled', handleInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleInstallPrompt);
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, []);

  const dismiss = () => {
    localStorage.setItem(DISMISSAL_KEY, String(Date.now()));
    setHidden(true);
  };

  const install = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    setInstallPrompt(null);
    if (choice.outcome === 'accepted') setHidden(true);
  };

  if (hidden || isStandalone() || !navigator.onLine || (!installPrompt && !ios)) return null;

  return (
    <aside
      aria-label="Instal aplikasi Quran Hafiz"
      className="fixed bottom-3 left-1/2 z-90 w-[min(94vw,28rem)] -translate-x-1/2 rounded-xl border border-[#D4AF37]/40 bg-[#15171E] p-3 text-[#E2E2E2] shadow-2xl"
    >
      <button
        type="button"
        onClick={dismiss}
        aria-label="Tutup ajakan instal aplikasi"
        className="absolute right-2 top-2 cursor-pointer rounded-md p-1 text-[#8A8D9A] transition hover:bg-[#2A2D35] hover:text-white"
      >
        <X className="h-4 w-4" />
      </button>
      <div className="flex items-center gap-2.5 pr-6">
        <img src="/pwa-192x192.png" alt="" className="h-9 w-9 shrink-0 rounded-lg" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-[#D4AF37]">Instal Quran Hafiz</p>
          {ios && !installPrompt ? (
            <p className="mt-0.5 text-xs leading-4 text-[#B5B7C0]">
              <Share className="mx-0.5 inline h-3.5 w-3.5" aria-label="Bagikan" />
              <strong className="text-[#E2E2E2]">Bagikan</strong>, lalu pilih
              {' '}<strong className="text-[#E2E2E2]">Tambahkan ke Layar Utama</strong>.
            </p>
          ) : (
            <div className="mt-0.5 flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
              <p className="min-w-48 flex-1 text-xs leading-4 text-[#B5B7C0]">
                Akses cepat dan gunakan konten tersimpan saat offline.
              </p>
              <button
                type="button"
                onClick={install}
                aria-label="Instal aplikasi"
                className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg bg-[#D4AF37] px-3 py-1.5 text-xs font-bold text-[#0A0A0B] transition hover:bg-[#E2C45A]"
              >
                <Download className="h-3.5 w-3.5" /> Instal
              </button>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
