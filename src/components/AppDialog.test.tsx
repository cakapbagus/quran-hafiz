import { beforeAll, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { confirmAction, promptText } from './AppDialog';

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = vi.fn(function (this: HTMLDialogElement) { this.open = true; });
  HTMLDialogElement.prototype.close = vi.fn(function (this: HTMLDialogElement) { this.open = false; });
});

describe('AppDialog', () => {
  it('waits for confirmation and removes the modal afterward', async () => {
    const result = confirmAction('Hapus bookmark?');
    fireEvent.click(await screen.findByRole('button', { name: 'Lanjutkan' }));
    expect(await result).toBe(true);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('cancels on Escape without forwarding it to underlying dialogs', async () => {
    const result = confirmAction('Reset progres?');
    await screen.findByRole('dialog');
    const underlying = vi.fn();
    document.addEventListener('keydown', underlying);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(await result).toBe(false);
    expect(underlying).not.toHaveBeenCalled();
    document.removeEventListener('keydown', underlying);
  });

  it('supports editing and clearing an alias', async () => {
    const result = promptText('Nama alias murid:', 'Ahmad');
    const input = await screen.findByRole('textbox', { name: 'Nama' });
    expect((input as HTMLInputElement).value).toBe('Ahmad');
    fireEvent.change(input, { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: 'Simpan' }));
    expect(await result).toBe('');
  });

  it('queues requests and distinguishes cancellation from an empty name', async () => {
    const first = promptText('Nama:');
    const second = confirmAction('Lanjut?');
    fireEvent.click(await screen.findByRole('button', { name: 'Batal' }));
    expect(await first).toBeNull();
    await waitFor(() => expect(screen.getByText('Lanjut?')).toBeDefined());
    fireEvent.click(screen.getByRole('button', { name: 'Batal' }));
    expect(await second).toBe(false);
  });
});
