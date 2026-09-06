import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { GoogleLogin, WelcomeLoginModal } from './GoogleLogin';
import { signInGoogle, subscribeCloudAuth } from '../services/firebaseCloudService';
import { importLegacyHafalan } from '../services/halaqahService';

vi.mock('../services/firebaseCloudService', () => ({ signInGoogle: vi.fn(), subscribeCloudAuth: vi.fn() }));
vi.mock('../services/halaqahService', () => ({ importLegacyHafalan: vi.fn() }));
vi.mock('../services/storageService', () => ({ getStoredHafalanRecords: () => ({ local: { surahNumber: 1, verseNumber: 1 } }) }));
afterEach(() => { cleanup(); vi.useRealTimers(); });
beforeEach(() => {
  vi.resetAllMocks();
  localStorage.clear();
  vi.mocked(signInGoogle).mockResolvedValue('account');
  vi.mocked(importLegacyHafalan).mockResolvedValue(undefined);
  vi.mocked(subscribeCloudAuth).mockImplementation(callback => { callback(null); return () => {}; });
});

describe('Google login with optional local import', () => {
  it('does not import unless selected', async () => {
    const complete = vi.fn();
    render(<GoogleLogin onComplete={complete} />);
    expect((screen.getByRole('checkbox') as HTMLInputElement).checked).toBe(false);
    fireEvent.click(screen.getByRole('button', { name: 'Login Google' }));
    await waitFor(() => expect(complete).toHaveBeenCalled());
    expect(importLegacyHafalan).not.toHaveBeenCalled();
  });
  it('imports into the signed-in account when selected', async () => {
    render(<GoogleLogin />);
    fireEvent.click(screen.getByRole('checkbox', { name: 'Impor Hafalan Lokal Lama' }));
    fireEvent.click(screen.getByRole('button', { name: 'Login Google' }));
    await waitFor(() => expect(importLegacyHafalan).toHaveBeenCalledWith({ local: { surahNumber: 1, verseNumber: 1 } }, 'account'));
  });
  it('does not import after failed login', async () => {
    vi.mocked(signInGoogle).mockRejectedValue(new Error('Login dibatalkan'));
    render(<GoogleLogin />);
    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(screen.getByRole('button', { name: 'Login Google' }));
    expect(await screen.findByRole('alert')).toBeDefined();
    expect(importLegacyHafalan).not.toHaveBeenCalled();
  });
  it('keeps the banner open and explains an import failure', async () => {
    vi.mocked(importLegacyHafalan).mockRejectedValue(new Error('Jaringan terputus'));
    render(<WelcomeLoginModal />);
    fireEvent.click(screen.getByRole('checkbox', { name: 'Impor Hafalan Lokal Lama' }));
    fireEvent.click(screen.getByRole('button', { name: 'Login Google' }));
    expect((await screen.findByRole('alert')).textContent).toContain('Data lokal tetap tersimpan');
    expect(screen.getByRole('dialog')).toBeDefined();
  });
  it('closes the banner using the top-right button', () => {
    render(<WelcomeLoginModal />);
    fireEvent.click(screen.getByRole('button', { name: 'Tutup banner login' }));
    expect(screen.queryByRole('dialog')).toBeNull();
  });
  it('allows guests to dismiss the banner', () => {
    render(<WelcomeLoginModal />);
    fireEvent.click(screen.getByRole('button', { name: 'Nanti saja' }));
    expect(screen.queryByRole('dialog')).toBeNull();
  });
  it('stays open without a countdown and places the preference after dismiss', () => {
    vi.useFakeTimers();
    render(<WelcomeLoginModal />);
    act(() => { vi.advanceTimersByTime(60000); });
    expect(screen.getByRole('dialog')).toBeDefined();
    expect(screen.queryByRole('timer')).toBeNull();
    const dismiss = screen.getByRole('button', { name: 'Nanti saja' });
    const preference = screen.getByRole('checkbox', { name: 'Jangan tampilkan lagi untuk hari ini' });
    expect(dismiss.compareDocumentPosition(preference) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
  it('hides for today and reappears on the next local day', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 8, 6, 12));
    const first = render(<WelcomeLoginModal />);
    fireEvent.click(screen.getByRole('checkbox', { name: 'Jangan tampilkan lagi untuk hari ini' }));
    act(() => { vi.advanceTimersByTime(10000); });
    first.unmount();
    const second = render(<WelcomeLoginModal />);
    expect(screen.queryByRole('dialog')).toBeNull();
    second.unmount();
    vi.setSystemTime(new Date(2026, 8, 7, 0));
    render(<WelcomeLoginModal />);
    expect(screen.getByRole('dialog')).toBeDefined();
  });
  it('allows the daily preference to be unchecked', () => {
    const first = render(<WelcomeLoginModal />);
    const checkbox = screen.getByRole('checkbox', { name: 'Jangan tampilkan lagi untuk hari ini' });
    fireEvent.click(checkbox);
    fireEvent.click(checkbox);
    first.unmount();
    render(<WelcomeLoginModal />);
    expect(screen.getByRole('dialog')).toBeDefined();
  });
  it('keeps the banner open while login is pending', () => {
    vi.useFakeTimers();
    vi.mocked(signInGoogle).mockReturnValue(new Promise(() => {}));
    render(<WelcomeLoginModal />);
    fireEvent.click(screen.getByRole('button', { name: 'Login Google' }));
    expect((screen.getByRole('button', { name: 'Tutup banner login' }) as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByRole('button', { name: 'Nanti saja' }) as HTMLButtonElement).disabled).toBe(true);
    act(() => { vi.advanceTimersByTime(10000); });
    expect(screen.getByRole('dialog')).toBeDefined();
    expect(screen.queryByRole('timer')).toBeNull();
  });
  it('does not show the banner for an existing session', () => {
    vi.mocked(subscribeCloudAuth).mockImplementation(callback => { callback('account'); return () => {}; });
    render(<WelcomeLoginModal />);
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});
