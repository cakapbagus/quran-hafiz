import React, { useState } from 'react';
import { Bookmark } from '../types';
import { Bookmark as BookmarkIcon, Trash2, ArrowRight, BookOpen, Brain, Tag, Scroll, CheckSquare, Square } from 'lucide-react';

interface BookmarksViewProps {
  bookmarks: Bookmark[];
  onRemoveBookmark: (surahNumber: number, verseNumber: number) => void;
  onRemoveBookmarksBatch?: (items: Array<{ surahNumber: number; verseNumber: number }>) => void;
  onJumpToVerse: (surahNumber: number, verseNumber: number) => void;
  onOpenHafalanForVerse: (surahNumber: number, verseNumber: number) => void;
}

export const BookmarksView: React.FC<BookmarksViewProps> = ({
  bookmarks,
  onRemoveBookmark,
  onRemoveBookmarksBatch,
  onJumpToVerse,
  onOpenHafalanForVerse
}) => {
  const [filterTag, setFilterTag] = useState<string>('all');
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());

  const filteredBookmarks = bookmarks.filter((b) => {
    if (filterTag === 'all') return true;
    return b.colorTag === filterTag;
  });

  const getBookmarkKey = (surahNumber: number, verseNumber: number) => `${surahNumber}_${verseNumber}`;

  const toggleSelect = (surahNumber: number, verseNumber: number) => {
    const key = getBookmarkKey(surahNumber, verseNumber);
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedKeys.size === filteredBookmarks.length) {
      setSelectedKeys(new Set());
    } else {
      setSelectedKeys(new Set(filteredBookmarks.map((b) => getBookmarkKey(b.surahNumber, b.verseNumber))));
    }
  };

  const handleDeleteSelected = () => {
    if (selectedKeys.size === 0) return;
    const count = selectedKeys.size;
    if (!window.confirm(`Hapus ${count} bookmark yang dipilih?`)) return;

    const itemsToDelete = filteredBookmarks
      .filter((b) => selectedKeys.has(getBookmarkKey(b.surahNumber, b.verseNumber)))
      .map((b) => ({ surahNumber: b.surahNumber, verseNumber: b.verseNumber }));

    if (onRemoveBookmarksBatch) {
      onRemoveBookmarksBatch(itemsToDelete);
    } else {
      itemsToDelete.forEach((item) => onRemoveBookmark(item.surahNumber, item.verseNumber));
    }

    setSelectedKeys(new Set());
  };

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
          {/* Action Bar for Selection */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-[#15171E] rounded-2xl border border-[#1F2128]">
            <button
              onClick={handleSelectAll}
              className="flex items-center gap-2 text-xs font-semibold text-[#8A8D9A] hover:text-[#E2E2E2] transition cursor-pointer px-2 py-1 rounded-lg hover:bg-[#0F1115]"
            >
              {selectedKeys.size > 0 && selectedKeys.size === filteredBookmarks.length ? (
                <CheckSquare className="w-4 h-4 text-[#D4AF37]" />
              ) : (
                <Square className="w-4 h-4 text-[#8A8D9A]" />
              )}
              <span>
                {selectedKeys.size === filteredBookmarks.length
                  ? 'Batal Pilih Semua'
                  : 'Pilih Semua'}
              </span>
            </button>

            {selectedKeys.size > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#8A8D9A]">
                  {selectedKeys.size} dipilih
                </span>
                <button
                  onClick={handleDeleteSelected}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-950/40 border border-red-800/60 text-red-300 hover:bg-red-900/60 hover:text-red-200 text-xs font-semibold transition cursor-pointer shadow-sm"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Hapus Terpilih ({selectedKeys.size})</span>
                </button>
              </div>
            )}
          </div>

          {filteredBookmarks.map((bm) => {
            const isSelected = selectedKeys.has(getBookmarkKey(bm.surahNumber, bm.verseNumber));
            return (
              <div
                key={bm.id}
                className={`bg-[#15171E] rounded-3xl p-5 sm:p-6 border transition space-y-3 ${
                  isSelected
                    ? 'border-[#D4AF37]/60 shadow-[0_0_15px_rgba(212,175,55,0.08)] bg-[#171922]'
                    : 'border-[#1F2128] shadow-md hover:border-[#2A2D35]'
                }`}
              >
                <div className="flex items-center justify-between gap-3 pb-3 border-b border-[#1F2128]">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => toggleSelect(bm.surahNumber, bm.verseNumber)}
                      className="text-[#8A8D9A] hover:text-[#D4AF37] transition cursor-pointer p-0.5"
                      aria-label="Pilih bookmark"
                    >
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4 text-[#D4AF37]" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                    <span className="px-3 py-1 rounded-full bg-[#0F1115] text-[#D4AF37] text-xs font-bold border border-[#2A2D35]">
                      QS. {bm.surahName}:{bm.verseNumber}
                    </span>
                    <span className="text-[11px] text-[#8A8D9A] hidden sm:inline">
                      Disimpan: {new Date(bm.createdAt).toLocaleDateString('id-ID')}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onJumpToVerse(bm.surahNumber, bm.verseNumber)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0F1115] text-[#E2E2E2] border border-[#2A2D35] hover:bg-[#1A1C23] text-xs font-semibold transition cursor-pointer"
                    >
                      <BookOpen className="w-3.5 h-3.5 text-[#D4AF37]" />
                      <span className="hidden sm:inline">Baca Ayat</span>
                    </button>

                    <button
                      onClick={() => onOpenHafalanForVerse(bm.surahNumber, bm.verseNumber)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#D4AF37] text-[#0A0A0B] text-xs font-bold hover:bg-[#B8962D] transition cursor-pointer"
                    >
                      <Brain className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Latihan</span>
                    </button>

                    <button
                      onClick={() => onRemoveBookmark(bm.surahNumber, bm.verseNumber)}
                      className="p-1.5 rounded-xl text-[#8A8D9A] hover:text-red-400 hover:bg-[#0F1115] transition cursor-pointer"
                      aria-label="Hapus bookmark"
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
            );
          })}
        </div>
      )}
    </div>
  );
};
