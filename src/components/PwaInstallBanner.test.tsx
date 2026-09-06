import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import PwaInstallBanner from './PwaInstallBanner';

function setNavigatorProperty(name: string, value: unknown) {
  Object.defineProperty(navigator, name, { configurable: true, value });
}

function createInstallPrompt(outcome: 'accepted' | 'dismissed' = 'accepted') {
  const event = new Event('beforeinstallprompt', { cancelable: true }) as Event & {
    prompt: ReturnType<typeof vi.fn>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
  };
  event.prompt = vi.fn().mockResolvedValue(undefined);
  event.userChoice = Promise.resolve({ outcome, platform: 'web' });
  return event;
}

describe('PwaInstallBanner', () => {
  beforeEach(() => {
    localStorage.clear();
    setNavigatorProperty('onLine', true);
    setNavigatorProperty('userAgent', 'Mozilla/5.0 Chrome/130');
    setNavigatorProperty('platform', 'Win32');
    setNavigatorProperty('maxTouchPoints', 0);
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: vi.fn().mockReturnValue({ matches: false }),
    });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('uses the native browser installation prompt when available', async () => {
    const user = userEvent.setup();
    render(<PwaInstallBanner />);
    const event = createInstallPrompt();

    fireEvent(window, event);
    await user.click(await screen.findByRole('button', { name: 'Instal aplikasi' }));

    expect(event.defaultPrevented).toBe(true);
    expect(event.prompt).toHaveBeenCalledOnce();
    await waitFor(() => expect(screen.queryByLabelText('Instal aplikasi Quran Hafiz')).toBeNull());
  });

  it('shows manual Add to Home Screen instructions on iOS', () => {
    setNavigatorProperty('userAgent', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)');

    render(<PwaInstallBanner />);

    expect(screen.getByText(/Tambahkan ke Layar Utama/)).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Instal aplikasi' })).toBeNull();
  });

  it('stores a dismissal and keeps the banner hidden after remounting', async () => {
    const user = userEvent.setup();
    const first = render(<PwaInstallBanner />);
    fireEvent(window, createInstallPrompt());

    await user.click(await screen.findByRole('button', { name: 'Tutup ajakan instal aplikasi' }));
    expect(screen.queryByLabelText('Instal aplikasi Quran Hafiz')).toBeNull();

    first.unmount();
    render(<PwaInstallBanner />);
    fireEvent(window, createInstallPrompt());
    expect(screen.queryByLabelText('Instal aplikasi Quran Hafiz')).toBeNull();
  });

  it('does not show in standalone mode and hides after app installation', () => {
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: vi.fn().mockReturnValue({ matches: true }),
    });
    const standalone = render(<PwaInstallBanner />);
    fireEvent(window, createInstallPrompt());
    expect(screen.queryByLabelText('Instal aplikasi Quran Hafiz')).toBeNull();

    standalone.unmount();
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: vi.fn().mockReturnValue({ matches: false }),
    });
    render(<PwaInstallBanner />);
    fireEvent(window, createInstallPrompt());
    expect(screen.getByLabelText('Instal aplikasi Quran Hafiz')).toBeTruthy();
    fireEvent(window, new Event('appinstalled'));
    expect(screen.queryByLabelText('Instal aplikasi Quran Hafiz')).toBeNull();
  });
});
