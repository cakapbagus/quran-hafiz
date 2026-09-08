import React from 'react';
import { isWaqafRule, TAJWID_COLOR_MAP } from '../data/tajwidRules';
import { parseAlQuranCloudTajwid } from '../data/alQuranCloudTajwid';

export const toArabicNumerals = (value: number) =>
  String(value).replace(/\d/g, (digit) => '٠١٢٣٤٥٦٧٨٩'[Number(digit)]);

interface MushafArabicTextProps {
  text: string;
  tajwidText?: string;
  enableTajwid: boolean;
}

export const MushafArabicText: React.FC<MushafArabicTextProps> = ({ text, tajwidText, enableTajwid }) => {
  if (!enableTajwid || !tajwidText) return <>{text}</>;

  return (
    <>
      {parseAlQuranCloudTajwid(tajwidText).map((token, index) => (
        <span
          key={`${index}-${token.text}`}
          className={isWaqafRule(token.rule) ? 'inline-block px-[0.12em]' : undefined}
          style={token.rule ? { color: TAJWID_COLOR_MAP[token.rule]?.color } : undefined}
          title={token.label}
        >
          {token.text}
        </span>
      ))}
    </>
  );
};
