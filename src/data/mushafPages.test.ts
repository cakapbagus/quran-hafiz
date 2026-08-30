import { describe, expect, it } from 'vitest';
import { getMushafPage } from './mushafPages';

describe('getMushafPage', () => {
  it('uses the standard 604-page Madinah Mushaf boundaries', () => {
    expect(getMushafPage(1, 1)).toBe(1);
    expect(getMushafPage(2, 1)).toBe(2);
    expect(getMushafPage(2, 5)).toBe(2);
    expect(getMushafPage(2, 6)).toBe(3);
    expect(getMushafPage(2, 286)).toBe(49);
    expect(getMushafPage(114, 6)).toBe(604);
  });

  it('supports pages shared by adjacent surahs', () => {
    expect(getMushafPage(4, 176)).toBe(106);
    expect(getMushafPage(5, 1)).toBe(106);
  });
});
