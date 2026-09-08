import React, { useMemo } from 'react';
import { isWaqafRule, TAJWID_COLOR_MAP } from '../data/tajwidRules';
import { parseAlQuranCloudTajwid } from '../data/alQuranCloudTajwid';

interface ColoredArabicVerseProps {
  arabicText: string;
  tajwidText?: string;
  fontSize: number;
  enableTajwid: boolean;
  className?: string;
}

export const ColoredArabicVerse: React.FC<ColoredArabicVerseProps> = ({
  arabicText,
  tajwidText,
  fontSize,
  enableTajwid,
  className = ''
}) => {
  const tokens = useMemo(() => {
    if (!enableTajwid || !tajwidText) return null;
    return parseAlQuranCloudTajwid(tajwidText);
  }, [tajwidText, enableTajwid]);

  if (!enableTajwid || !tokens) {
    return (
      <p
        className={`font-arabic font-bold text-[#E2E2E2] leading-loose tracking-wide transition-all ${className}`}
        style={{ fontSize: `${fontSize}px` }}
        dir="rtl"
      >
        {arabicText}
      </p>
    );
  }

  return (
    <p
      className={`font-arabic font-bold leading-loose tracking-wide transition-all ${className}`}
      style={{ fontSize: `${fontSize}px` }}
      dir="rtl"
    >
      {tokens.map((token, index) => {
        if (!token.rule) {
          return (
            <span key={index} className="text-[#E2E2E2]">
              {token.text}
            </span>
          );
        }

        const colorInfo = TAJWID_COLOR_MAP[token.rule];
        const textColor = colorInfo?.color || '#D4AF37';

        return (
          <span
            key={index}
            className={`transition-colors duration-150 ${isWaqafRule(token.rule) ? 'inline-block px-[0.12em]' : ''}`}
            style={{ color: textColor }}
            title={token.label}
          >
            {token.text}
          </span>
        );
      })}
    </p>
  );
};
