import React, { useState, useRef, useEffect, useId } from 'react';
import { ChevronDown, Search, X } from 'lucide-react';

interface VerseComboboxOption {
  value: number;
  label: string;
}

interface VerseComboboxProps {
  label: string;
  value: number;
  options: VerseComboboxOption[];
  onChange: (value: number) => void;
  placeholder?: string;
  ariaLabel?: string;
  variant?: 'default' | 'inline';
}

export const VerseCombobox: React.FC<VerseComboboxProps> = ({
  label,
  value,
  options,
  onChange,
  placeholder = 'Cari ayat...',
  ariaLabel,
  variant = 'default',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listboxId = useId();

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Focus search input when opening
  useEffect(() => {
    if (isOpen) {
      searchInputRef.current?.focus();
    }
  }, [isOpen]);

  const filteredOptions = options.filter((opt) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    const valStr = String(opt.value);
    const labelLower = opt.label.toLowerCase();
    return valStr.includes(q) || labelLower.includes(q);
  });

  const selectedOption = options.find((opt) => opt.value === value);

  const inline = variant === 'inline';

  return (
    <div
      className={`relative ${inline ? 'flex items-center gap-2 rounded-xl border border-[#2A2D35] bg-[#15171E] px-3 py-1.5' : ''}`}
      ref={containerRef}
    >
      <label className={`${inline ? 'hidden sm:inline text-[#8A8D9A] font-medium whitespace-nowrap' : 'block mb-1 text-[#8A8D9A] font-semibold'} text-xs`}>
        {label}{inline ? ':' : ''}
      </label>

      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => {
          setIsOpen((prev) => !prev);
          setSearchQuery('');
        }}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={ariaLabel || label}
        className={`${inline ? 'min-w-24 rounded-lg px-2.5 py-1 font-semibold' : 'w-full rounded-xl px-3 py-2 font-medium'} flex items-center justify-between gap-2 bg-[#0F1115] border border-[#2A2D35] text-xs text-[#E2E2E2] hover:border-[#D4AF37]/50 focus:outline-none focus:border-[#D4AF37] transition cursor-pointer`}
      >
        <span className="truncate">{selectedOption ? selectedOption.label : `Ayat ${value}`}</span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-[#8A8D9A] transition-transform duration-150 ${
            isOpen ? 'rotate-180 text-[#D4AF37]' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          id={listboxId}
          role="listbox"
          className={`absolute z-50 mt-1 rounded-xl bg-[#0F1115] border border-[#2A2D35] shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100 ${inline ? 'right-0 top-full w-48' : 'left-0 right-0'}`}
        >
          {/* Search Input Box */}
          <div className="p-2 border-b border-[#1F2128] bg-[#15171E] flex items-center gap-1.5">
            <Search className="w-3.5 h-3.5 text-[#6A6D7A] shrink-0" />
            <input
              ref={searchInputRef}
              type="text"
              inputMode="numeric"
              placeholder={placeholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setIsOpen(false);
                  setSearchQuery('');
                } else if (e.key === 'Enter' && filteredOptions.length > 0) {
                  onChange(filteredOptions[0].value);
                  setIsOpen(false);
                  setSearchQuery('');
                }
              }}
              className="w-full bg-transparent text-xs text-[#E2E2E2] placeholder-[#6A6D7A] outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="p-0.5 text-[#8A8D9A] hover:text-[#E2E2E2] cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Options List */}
          <div className="max-h-39 overflow-y-auto py-1 divide-y divide-[#1F2128]/30">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => {
                      onChange(opt.value);
                      setIsOpen(false);
                      setSearchQuery('');
                    }}
                    className={`w-full text-left px-3 py-1.5 text-xs transition cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'bg-[#D4AF37]/15 text-[#D4AF37] font-semibold'
                        : 'text-[#C5C7D0] hover:bg-[#1A1C23] hover:text-[#E2E2E2]'
                    }`}
                  >
                    <span>{opt.label}</span>
                    {isSelected && (
                      <span className="text-[10px] text-[#D4AF37] font-bold">✓</span>
                    )}
                  </button>
                );
              })
            ) : (
              <div className="px-3 py-3 text-center text-xs text-[#6A6D7A]">
                Ayat tidak ditemukan
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
