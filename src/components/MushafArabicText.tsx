import React from 'react';
import { parseArabicTajwid, TAJWID_COLOR_MAP } from '../data/tajwidRules';

export const toArabicNumerals = (value: number) =>
  String(value).replace(/\d/g, (digit) => '٠١٢٣٤٥٦٧٨٩'[Number(digit)]);

interface MushafArabicTextProps {
  text: string;
  enableTajwid: boolean;
}

export const MushafArabicText: React.FC<MushafArabicTextProps> = ({ text, enableTajwid }) => {
  if (!enableTajwid) return <>{text}</>;

  return (
    <>
      {parseArabicTajwid(text).map((token, index) => (
        <span
          key={`${index}-${token.text}`}
          style={token.rule ? { color: TAJWID_COLOR_MAP[token.rule]?.color } : undefined}
          title={token.label}
        >
          {token.text}
        </span>
      ))}
    </>
  );
};
