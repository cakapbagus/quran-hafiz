import { useEffect, useState } from 'react';

export default function OfflineNotice() {
  const [offline, setOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const update = () => setOffline(!navigator.onLine);
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, []);

  if (!offline) return null;

  return (
    <div role="status" className="fixed bottom-4 left-1/2 z-100 w-[min(90vw,32rem)] -translate-x-1/2 rounded-xl bg-amber-100 p-3 text-center text-sm text-amber-950 shadow-lg pointer-events-none">
      Anda sedang offline. Surah yang sudah dibuka dan data lokal tetap tersedia.
      Audio streaming dan Google Drive memerlukan internet.
    </div>
  );
}
