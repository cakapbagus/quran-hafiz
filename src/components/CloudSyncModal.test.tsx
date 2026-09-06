import React, { useState } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CloudSyncModal } from './CloudSyncModal';
import { DEFAULT_SETTINGS } from '../services/storageService';

vi.mock('../services/firebaseCloudService', () => ({
  getCurrentUserId: vi.fn(() => null),
  getCurrentGoogleUser: vi.fn(() => null),
  getStoredLastSyncedAt: vi.fn(() => null),
  subscribeCloudAuth: vi.fn(() => () => {}),
  findCloudBackupFile: vi.fn().mockResolvedValue(null),
  uploadCloudBackup: vi.fn().mockResolvedValue({ id: '123', modifiedTime: '2026-09-06' }),
  deleteCloudBackup: vi.fn().mockResolvedValue(undefined),
  disconnectCloud: vi.fn().mockResolvedValue(undefined),
  buildBackupPayload: vi.fn(() => ({ data: { settings: DEFAULT_SETTINGS, bookmarks: [], hafalanRecords: {}, lastRead: null } })),
  saveStoredLastSyncedAt: vi.fn()
}));

describe('CloudSyncModal', () => {
  it('renders and transitions from closed to open without React hook errors', () => {
    const TestComponent = () => {
      const [isOpen, setIsOpen] = useState(false);
      return (
        <div>
          <button onClick={() => setIsOpen(true)}>Open Modal</button>
          <CloudSyncModal
            isOpen={isOpen}
            onClose={() => setIsOpen(false)}
            settings={DEFAULT_SETTINGS}
            bookmarks={[]}
            hafalanRecords={{}}
            lastRead={null}
            onRestoreData={() => {}}
          />
        </div>
      );
    };

    render(<TestComponent />);
    expect(screen.queryByRole('dialog')).toBeNull();

    // Opening the modal caused React Error #310 when hooks were rendered conditionally
    fireEvent.click(screen.getByText('Open Modal'));
    expect(screen.getByRole('dialog')).toBeDefined();
  });
});
