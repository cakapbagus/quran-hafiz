import { expect, test } from '@playwright/test';

const surahDetail = {
  nomor: 1,
  nama: 'الفاتحة',
  namaLatin: 'Al-Fatihah',
  jumlahAyat: 1,
  tempatTurun: 'Mekkah',
  arti: 'Pembukaan',
  deskripsi: '',
  audioFull: {},
  ayat: [{
    nomorAyat: 1,
    teksArab: 'بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ',
    teksLatin: 'Bismillahirrahmanirrahim',
    teksIndonesia: 'Dengan nama Allah Yang Maha Pengasih, Maha Penyayang',
    audio: { '05': 'http://127.0.0.1:4173/test.wav' }
  }]
};

function silentWav(): Buffer {
  const sampleRate = 8000;
  const samples = sampleRate * 2;
  const buffer = Buffer.alloc(44 + samples * 2);
  buffer.write('RIFF', 0); buffer.writeUInt32LE(36 + samples * 2, 4); buffer.write('WAVEfmt ', 8);
  buffer.writeUInt32LE(16, 16); buffer.writeUInt16LE(1, 20); buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(sampleRate, 24); buffer.writeUInt32LE(sampleRate * 2, 28); buffer.writeUInt16LE(2, 32); buffer.writeUInt16LE(16, 34);
  buffer.write('data', 36); buffer.writeUInt32LE(samples * 2, 40);
  return buffer;
}

async function mockQuranApi(page: import('@playwright/test').Page) {
  await page.route('**/test.wav', (route) => route.fulfill({ status: 200, contentType: 'audio/wav', body: silentWav() }));
  await page.route('**/api/v2/surat/1', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ data: surahDetail })
  }));
}

test('settings dialog supports keyboard focus and Escape', async ({ page }) => {
  await page.goto('/');
  const settingsButton = page.getByRole('button', { name: 'Pengaturan tampilan dan audio' });
  await settingsButton.focus();
  await settingsButton.click();
  const dialog = page.getByRole('dialog', { name: 'Pengaturan Aplikasi' });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Tutup dialog' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(settingsButton).toBeFocused();
});

test('loads a surah and renders its verse', async ({ page }) => {
  await mockQuranApi(page);
  await page.goto('/');
  await page.getByText('Al-Fatihah', { exact: true }).first().click();
  await expect(page.getByText(surahDetail.ayat[0].teksArab, { exact: true })).toBeVisible();
  await expect(page.getByRole('slider', { name: 'Ukuran tulisan Arab' })).toHaveCount(0);
});

test('shows memorization verses as a clickable mushaf with on-demand details', async ({ page }) => {
  await mockQuranApi(page);
  await page.goto('/');
  await page.getByText('Al-Fatihah', { exact: true }).first().click();
  await page.getByRole('button', { name: /Mode Hafalan/ }).click();

  const verse = page.getByRole('button', { name: 'Ayat 1. Klik untuk melihat latin dan arti' });
  await expect(verse).toBeVisible();
  await expect(page.getByLabel('Detail ayat 1')).toHaveCount(0);

  await verse.click();
  const details = page.getByLabel('Detail ayat 1');
  await expect(details).toBeVisible();
  await expect(details.getByText(surahDetail.ayat[0].teksLatin)).toBeVisible();
  await expect(details.getByText(surahDetail.ayat[0].teksIndonesia)).toBeVisible();
});

test('records audio with a fake microphone and persists it without an error', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'Fake microphone capture is Chromium-specific');
  await mockQuranApi(page);
  await page.goto('/');
  await page.getByText('Al-Fatihah', { exact: true }).first().click();
  await page.getByTitle('Rekam Suara Hafalan').click();
  await expect(page.getByRole('dialog', { name: 'Perekam Suara Hafalan' })).toBeVisible();
  await page.getByTitle('Mulai Rekam Suara Anda').click();
  await page.waitForTimeout(500);
  await page.getByRole('button', { name: 'Hentikan Rekaman' }).click();
  await expect(page.getByRole('button', { name: 'Dengar Suara Saya' })).toBeVisible();
  await expect(page.getByText('gagal disimpan', { exact: false })).toHaveCount(0);
});

test('plays a verse, exposes keyboard seek, and stops at the end', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'Reliable headless media playback is Chromium-specific');
  await mockQuranApi(page);
  await page.goto('/');
  await page.getByText('Al-Fatihah', { exact: true }).first().click();
  await page.getByRole('button', { name: 'Putar audio ayat' }).click();
  await expect(page.getByRole('button', { name: 'Jeda audio' }).last()).toBeVisible();
  const seek = page.getByRole('slider', { name: 'Posisi audio' });
  await expect(seek).toBeVisible();
  await seek.focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('button', { name: 'Putar audio', exact: true })).toBeVisible({ timeout: 5000 });
});
