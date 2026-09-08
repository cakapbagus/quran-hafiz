import { describe, expect, it } from 'vitest';
import { TAJWID_RULES } from '../data/tajwidRules';
import {
  getExampleHighlightStyle,
  getRuleDisplayColor,
  splitExampleByHighlights
} from './TajwidGuideView';

describe('splitExampleByHighlights & TajwidGuideView examples', () => {
  it('highlights tanwin in iqlab example including the base letter', () => {
    const iqlabRule = TAJWID_RULES.find((r) => r.key === 'iqlab')!;
    expect(iqlabRule).toBeDefined();

    const segments = splitExampleByHighlights(iqlabRule.contohLafaz, iqlabRule.contohSorotan);
    const highlightedTexts = segments.filter((s) => s.highlighted).map((s) => s.text);

    // Both nun mati (نْ ب) and tanwin (مٌ ب) must be highlighted with their base letters
    expect(highlightedTexts).toContain('نْ ب');
    expect(highlightedTexts).toContain('مٌ ب');

    // Ensure the tanwin-bearing letter mim is not separated from its tanwin
    const unhighlightedTexts = segments.filter((s) => !s.highlighted).map((s) => s.text);
    expect(unhighlightedTexts.some((t) => t.endsWith('عَلِيم'))).toBe(false);
  });

  it('normalizes lone tanwin pattern gracefully to include preceding base letter', () => {
    // Even if a legacy pattern passes a lone tanwin without base letter: 'ٌ ب'
    const segments = splitExampleByHighlights('مِنْ بَعْدِ ، عَلِيمٌ بِذَاتِ', ['نْ ب', 'ٌ ب']);
    const highlightedTexts = segments.filter((s) => s.highlighted).map((s) => s.text);

    expect(highlightedTexts).toContain('نْ ب');
    expect(highlightedTexts).toContain('مٌ ب');
  });

  it('highlights tanwin in idgham bilaghunnah including the base letter', () => {
    const idghamRule = TAJWID_RULES.find((r) => r.key === 'idgham_bilaghunnah')!;
    const segments = splitExampleByHighlights(idghamRule.contohLafaz, idghamRule.contohSorotan);
    const highlightedTexts = segments.filter((s) => s.highlighted).map((s) => s.text);

    expect(highlightedTexts).toContain('نْ ر');
    expect(highlightedTexts).toContain('رٌ ر');
  });

  it('highlights tanwin in ikhfa haqiqi including the base letter', () => {
    const ikhfaRule = TAJWID_RULES.find((r) => r.key === 'ikhfa_haqiqi')!;
    const segments = splitExampleByHighlights(ikhfaRule.contohLafaz, ikhfaRule.contohSorotan);
    const highlightedTexts = segments.filter((s) => s.highlighted).map((s) => s.text);

    expect(highlightedTexts).toContain('نْ ك');
    expect(highlightedTexts).toContain('نْز');
    expect(highlightedTexts).toContain('بٌ ك');
  });

  it.each(['izhar_halqi', 'izhar_syafawi'] as const)(
    'underlines %s examples without color coding',
    (ruleKey) => {
      const rule = TAJWID_RULES.find((item) => item.key === ruleKey)!;
      const style = getExampleHighlightStyle(rule.key, rule.color);

      expect(style.textDecorationLine).toBe('underline');
      expect(style).not.toHaveProperty('color');
      expect(getRuleDisplayColor(rule)).toBe('#8A8D9A');
    }
  );

  it('retains color coding for non-izhar examples', () => {
    const rule = TAJWID_RULES.find((item) => item.key === 'iqlab')!;

    expect(getExampleHighlightStyle(rule.key, rule.color)).toEqual({ color: rule.color });
    expect(getRuleDisplayColor(rule)).toBe(rule.color);
  });
});
