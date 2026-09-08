import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import App from './App';
import { fetchSurahDetail } from './services/quranApi';
import type { SurahDetail } from './types';

vi.mock('./services/firebaseCloudService', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./services/firebaseCloudService')>();
  return {
    ...actual,
    subscribeCloudAuth: vi.fn((cb) => {
      cb(null);
      return () => {};
    }),
    getCurrentUserId: vi.fn(() => null),
    getCurrentGoogleUser: vi.fn(() => null),
    signInGoogle: vi.fn(),
    signOutGoogle: vi.fn()
  };
});

vi.mock('./services/halaqahService', () => ({
  watchRecords: vi.fn(() => () => {}),
  saveVerse: vi.fn(),
  importLegacyHafalan: vi.fn()
}));

vi.mock('./services/quranApi', () => ({
  fetchSurahDetail: vi.fn(),
  clearQuranCache: vi.fn(),
  downloadAllSurahsToCache: vi.fn(),
  isAllSurahsCached: vi.fn(() => Promise.resolve(false))
}));

const mockSurah1: SurahDetail = {
  nomor: 1,
  nama: 'الفاتحة',
  namaLatin: 'Al-Fatihah',
  jumlahAyat: 7,
  tempatTurun: 'Mekkah',
  arti: 'Pembukaan',
  deskripsi: 'Deskripsi Al-Fatihah',
  audioFull: { '01': 'https://example.com/001.mp3' },
  ayat: [
    {
      nomorAyat: 1,
      teksArab: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
      teksLatin: 'Bismillahir rahmanir rahim',
      teksIndonesia: 'Dengan nama Allah Yang Maha Pengasih, Maha Penyayang',
      audio: { '01': 'https://example.com/001001.mp3' }
    }
  ]
};

const mockSurah2: SurahDetail = {
  nomor: 2,
  nama: 'البقرة',
  namaLatin: 'Al-Baqarah',
  jumlahAyat: 286,
  tempatTurun: 'Madinah',
  arti: 'Sapi Betina',
  deskripsi: 'Deskripsi Al-Baqarah',
  audioFull: { '01': 'https://example.com/002.mp3' },
  ayat: [
    {
      nomorAyat: 1,
      teksArab: 'الم',
      teksLatin: 'Alif Lam Mim',
      teksIndonesia: 'Alif Lam Mim',
      audio: { '01': 'https://example.com/002001.mp3' }
    }
  ]
};

describe('Android Back Navigation in Quran Reader', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    localStorage.clear();
    sessionStorage.clear();
    window.location.hash = '';

    window.history.replaceState({ quranMainTab: 'read', surahNumber: null, fromSurahList: false }, '', '/');

    vi.mocked(fetchSurahDetail).mockImplementation(async (surahNumber) => {
      if (surahNumber === 1) return mockSurah1;
      if (surahNumber === 2) return mockSurah2;
      return mockSurah1;
    });

    window.scrollTo = vi.fn();
    HTMLMediaElement.prototype.pause = vi.fn();
    HTMLMediaElement.prototype.play = vi.fn();
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn()
    }));
  });

  afterEach(() => {
    cleanup();
  });

  it('pushes history state with surahNumber and fromSurahList when opening a surah from the list', async () => {
    const pushStateSpy = vi.spyOn(window.history, 'pushState');

    render(<App />);

    // Expect SurahList to be visible (Al-Fatihah card is rendered)
    const alFatihahCard = await screen.findByText('Al-Fatihah');
    expect(alFatihahCard).toBeDefined();

    // Click on Al-Fatihah
    fireEvent.click(alFatihahCard);

    // Verify history.pushState was called with surahNumber: 1 and fromSurahList: true
    expect(pushStateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        quranMainTab: 'read',
        surahNumber: 1,
        fromSurahList: true
      }),
      '',
      expect.any(String)
    );

    // Verify that verse detail is displayed
    await waitFor(() => {
      expect(screen.getByText('← Kembali ke Daftar Surah (114)')).toBeDefined();
    });
  });

  it('returns to surah list when Android hardware back button (popstate) is triggered', async () => {
    render(<App />);

    // Select Al-Fatihah
    const alFatihahCard = await screen.findByText('Al-Fatihah');
    fireEvent.click(alFatihahCard);

    // Wait until surah reader view is displayed
    await waitFor(() => {
      expect(screen.getByText('← Kembali ke Daftar Surah (114)')).toBeDefined();
    });

    // Simulate Android hardware back button triggering popstate event with surahNumber: null
    act(() => {
      const popStateEvent = new PopStateEvent('popstate', {
        state: { quranMainTab: 'read', surahNumber: null, fromSurahList: false }
      });
      window.dispatchEvent(popStateEvent);
    });

    // Verify user is back on Daftar Surah
    await waitFor(() => {
      expect(screen.queryByText('← Kembali ke Daftar Surah (114)')).toBeNull();
      expect(screen.getByText('Al-Fatihah')).toBeDefined();
    });
  });

  it('replaces history state when navigating next surah from within VerseList', async () => {
    const replaceStateSpy = vi.spyOn(window.history, 'replaceState');

    render(<App />);

    // Select Al-Fatihah
    const alFatihahCard = await screen.findByText('Al-Fatihah');
    fireEvent.click(alFatihahCard);

    await waitFor(() => {
      expect(screen.getByText('← Kembali ke Daftar Surah (114)')).toBeDefined();
    });

    // Find the "Surah Selanjutnya (2)" button and click it
    const nextSurahButton = await screen.findByText(/Surah Selanjutnya \(2\)/i);
    fireEvent.click(nextSurahButton);

    // Should call replaceState (not pushState) so Android back won't cycle through all chapters
    expect(replaceStateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        quranMainTab: 'read',
        surahNumber: 2,
        fromSurahList: true
      }),
      '',
      expect.any(String)
    );

    // Now if Android back is pressed, it goes directly back to surah list
    act(() => {
      const popStateEvent = new PopStateEvent('popstate', {
        state: { quranMainTab: 'read', surahNumber: null, fromSurahList: false }
      });
      window.dispatchEvent(popStateEvent);
    });

    await waitFor(() => {
      expect(screen.queryByText('← Kembali ke Daftar Surah (114)')).toBeNull();
      expect(screen.getByText('Al-Fatihah')).toBeDefined();
    });
  });

  it('returns to surah list when on-screen "Kembali ke Daftar Surah (114)" button is clicked', async () => {
    const historyBackSpy = vi.spyOn(window.history, 'back');

    render(<App />);

    const alFatihahCard = await screen.findByText('Al-Fatihah');
    fireEvent.click(alFatihahCard);

    const backButton = await screen.findByText('← Kembali ke Daftar Surah (114)');
    fireEvent.click(backButton);

    // Verify history.back was called to keep browser stack in sync
    expect(historyBackSpy).toHaveBeenCalled();

    // Verify UI immediately returns to Daftar Surah
    await waitFor(() => {
      expect(screen.queryByText('← Kembali ke Daftar Surah (114)')).toBeNull();
      expect(screen.getByText('Al-Fatihah')).toBeDefined();
    });
  });

  it('returns to surah list when clicking "Baca" tab in Header while inside a surah', async () => {
    const historyBackSpy = vi.spyOn(window.history, 'back');

    render(<App />);

    const alFatihahCard = await screen.findByText('Al-Fatihah');
    fireEvent.click(alFatihahCard);

    await waitFor(() => {
      expect(screen.getByText('← Kembali ke Daftar Surah (114)')).toBeDefined();
    });

    // Click "Baca Al-Quran" tab in Header nav
    const headerNav = screen.getAllByRole('navigation')[0];
    const bacaTabButton = within(headerNav).getByRole('button', { name: /Baca Al-Quran/i });
    fireEvent.click(bacaTabButton);

    // Verify history.back was called
    expect(historyBackSpy).toHaveBeenCalled();

    // Verify back to surah list
    await waitFor(() => {
      expect(screen.queryByText('← Kembali ke Daftar Surah (114)')).toBeNull();
      expect(screen.getByText('Al-Fatihah')).toBeDefined();
    });
  });

  it('preserves history stack when navigating from surah detail to hafalan tab and pressing back', async () => {
    render(<App />);

    // Open Al-Fatihah
    const alFatihahCard = await screen.findByText('Al-Fatihah');
    fireEvent.click(alFatihahCard);

    await waitFor(() => {
      expect(screen.getByText('← Kembali ke Daftar Surah (114)')).toBeDefined();
    });

    // Switch to "Mode Hafalan" tab in header
    const headerNav = screen.getAllByRole('navigation')[0];
    const hafalanTabButton = within(headerNav).getByRole('button', { name: /Mode Hafalan/i });
    fireEvent.click(hafalanTabButton);

    // Simulate Android back button returning to Surah 1
    act(() => {
      const popStateEvent = new PopStateEvent('popstate', {
        state: { quranMainTab: 'read', surahNumber: 1, fromSurahList: true }
      });
      window.dispatchEvent(popStateEvent);
    });

    // Surah 1 should be visible again
    await waitFor(() => {
      expect(screen.getByText('← Kembali ke Daftar Surah (114)')).toBeDefined();
    });

    // Simulate second Android back button returning to Surah List
    act(() => {
      const popStateEvent = new PopStateEvent('popstate', {
        state: { quranMainTab: 'read', surahNumber: null, fromSurahList: false }
      });
      window.dispatchEvent(popStateEvent);
    });

    // User is back on Daftar Surah
    await waitFor(() => {
      expect(screen.queryByText('← Kembali ke Daftar Surah (114)')).toBeNull();
      expect(screen.getByText('Al-Fatihah')).toBeDefined();
    });
  });
});
