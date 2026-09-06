import { expect, test } from '@playwright/test';

test('reopens the app and a saved surah without internet', async ({ page, context, browserName }) => {
  test.skip(browserName !== 'chromium', 'Service Worker offline regression runs in Chrome');
  await page.route('**/api/v2/surat/1', (route) => route.fulfill({
    json: { data: {
      nomor: 1, nama: 'الفاتحة', namaLatin: 'Al-Fatihah', jumlahAyat: 1,
      tempatTurun: 'Mekkah', arti: 'Pembukaan', deskripsi: '', audioFull: {},
      ayat: [{ nomorAyat: 1, teksArab: 'بسم الله', teksLatin: 'Bismillah',
        teksIndonesia: 'Dengan nama Allah', audio: {} }],
    } },
  }));
  await page.goto('/');
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller) {
      await new Promise<void>((resolve) => navigator.serviceWorker.addEventListener('controllerchange', () => resolve(), { once: true }));
    }
  });
  await page.getByText('Al-Fatihah', { exact: true }).first().click();
  await expect(page.getByText('بسم الله', { exact: true })).toBeVisible();
  await expect.poll(() => page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve) => {
      const request = indexedDB.open('quran_hafiz_cache_v1', 1);
      request.onsuccess = () => resolve(request.result);
    });
    return new Promise<boolean>((resolve) => {
      const request = db.transaction('surahs').objectStore('surahs').get('murottal_quran_surah_v3_1');
      request.onsuccess = () => { db.close(); resolve(Boolean(request.result)); };
    });
  })).toBe(true);
  await page.unrouteAll();
  await context.setOffline(true);
  // Chromium can report onLine=true after a SW-served reload despite network emulation.
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'onLine', { configurable: true, get: () => false });
    window.addEventListener('online', () => {
      Object.defineProperty(navigator, 'onLine', { configurable: true, get: () => true });
    });
  });
  await page.reload();
  await expect(page.getByRole('status')).toContainText('Anda sedang offline');
  await page.getByText('Al-Fatihah', { exact: true }).first().click();
  await expect(page.getByText('بسم الله', { exact: true })).toBeVisible();
  await context.setOffline(false);
  await page.evaluate(() => window.dispatchEvent(new Event('online')));
  await expect(page.getByRole('status')).toHaveCount(0);
});
