import React, { useState } from 'react';
import { Bookmark } from '../types';
import { Bookmark as BookmarkIcon, Trash2, ArrowRight, BookOpen, Brain, Tag, Scroll } from 'lucide-react';

interface BookmarksViewProps {
  bookmarks: Bookmark[];
  onRemoveBookmark: (surahNumber: number, verseNumber: number) => void;
  onJumpToVerse: (surahNumber: number, verseNumber: number) => void;
  onOpenHafalanForVerse: (surahNumber: number, verseNumber: number) => void;
}

export const BookmarksView: React.FC<BookmarksViewProps> = ({
  bookmarks,
  onRemoveBookmark,
  onJumpToVerse,
  onOpenHafalanForVerse
}) => {
  const [filterTag, setFilterTag] = useState<string>('all');

  const filteredBookmarks = bookmarks.filter((b) => {
    if (filterTag === 'all') return true;
    return b.colorTag === filterTag;
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-28">
      {/* Top Banner */}
      <div className="bg-[#0F1115] text-[#E2E2E2] rounded-3xl p-6 sm:p-8 shadow-2xl border border-[#1F2128] relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center gap-3 relative z-10">
          <div className="p-2.5 rounded-2xl bg-[#15171E] border border-[#2A2D35] text-[#D4AF37]">
            <BookmarkIcon className="w-6 h-6 fill-current" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#D4AF37] font-serif-title">
              Bookmark & Catatan Simpanan
            </h1>
            <p className="text-xs sm:text-sm text-[#8A8D9A]">
              {bookmarks.length} Ayat tersimpan dalam daftar favorit Anda
            </p>
          </div>
        </div>
      </div>

      {/* Bookmarks List */}
      {bookmarks.length === 0 ? (
        <div className="text-center py-16 bg-[#15171E] rounded-3xl border border-[#1F2128] space-y-3">
          <BookmarkIcon className="w-12 h-12 mx-auto text-[#8A8D9A]" />
          <h3 className="text-base font-bold text-[#E2E2E2]">Belum Ada Bookmark</h3>
          <p className="text-xs text-[#8A8D9A] max-w-sm mx-auto">
            Klik ikon bookmark pada ayat Al-Quran saat membaca untuk menyimpannya di sini.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBookmarks.map((bm) => (
            <div
              key={bm.id}
              className="bg-[#15171E] rounded-3xl p-5 sm:p-6 border border-[#1F2128] shadow-md hover:border-[#2A2D35] transition space-y-3"
            >
              <div className="flex items-center justify-between gap-3 pb-3 border-b border-[#1F2128]">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-[#0F1115] text-[#D4AF37] text-xs font-bold border border-[#2A2D35]">
                    QS. {bm.surahName}:{bm.verseNumber}
                  </span>
                  <span className="text-[11px] text-[#8A8D9A]">
                    Disimpan: {new Date(bm.createdAt).toLocaleDateString('id-ID')}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onJumpToVerse(bm.surahNumber, bm.verseNumber)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0F1115] text-[#E2E2E2] border border-[#2A2D35] hover:bg-[#1A1C23] text-xs font-semibold transition cursor-pointer"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-[#D4AF37]" />
                    <span>Baca Ayat</span>
                  </button>

                  <button
                    onClick={() => onOpenHafalanForVerse(bm.surahNumber, bm.verseNumber)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#D4AF37] text-[#0A0A0B] text-xs font-bold hover:bg-[#B8962D] transition cursor-pointer"
                  >
                    <Brain className="w-3.5 h-3.5" />
                    <span>Latihan Hafalan</span>
                  </button>

                  <button
                    onClick={() => onRemoveBookmark(bm.surahNumber, bm.verseNumber)}
                    className="p-1.5 rounded-xl text-[#8A8D9A] hover:text-red-400 hover:bg-[#0F1115] transition cursor-pointer"
                    title="Hapus Bookmark"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Verse Text Arab */}
              <div className="text-right py-1">
                <p className="font-arabic text-2xl font-bold text-[#E2E2E2] leading-relaxed" dir="rtl">
                  {bm.verseArab}
                </p>
              </div>

              {/* Verse Translation */}
              <p className="text-xs text-[#8A8D9A]">
                "{bm.verseTranslation}"
              </p>

              {/* Note if present */}
              {bm.note && (
                <div className="p-3 bg-[#0F1115] rounded-2xl border border-[#2A2D35] text-xs text-[#D4AF37]">
                  <strong className="block mb-0.5 text-[11px] uppercase tracking-wide opacity-80">Catatan Anda:</strong>
                  {bm.note}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
