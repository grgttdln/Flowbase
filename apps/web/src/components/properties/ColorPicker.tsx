'use client';

import { useRef, useState, useCallback } from 'react';
import { Ban } from 'lucide-react';

// Organized by row: dark, warm, cool, muted, light
const PRESET_COLORS = [
  // Row 1 — darks & neutrals
  ['#18181b', '#3f3f46', '#71717a', '#a1a1aa', '#d4d4d8'],
  // Row 2 — warm spectrum
  ['#dc2626', '#ea580c', '#d97706', '#F783AC', '#9C36B5'],
  // Row 3 — cool spectrum
  ['#7c3aed', '#2563eb', '#0891b2', '#0d9488', '#16a34a'],
] as const;

const ALL_PRESETS = PRESET_COLORS.flat();

interface ColorPickerProps {
  label: string;
  value: string;
  onChange: (color: string) => void;
  disabled?: boolean;
  allowTransparent?: boolean;
}

const ColorPicker = ({ label, value, onChange, disabled, allowTransparent }: ColorPickerProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [hexInput, setHexInput] = useState('');
  const [isEditingHex, setIsEditingHex] = useState(false);

  const isTransparent = value === 'transparent';
  const isPreset = ALL_PRESETS.includes(value as typeof ALL_PRESETS[number]);
  const displayHex = isTransparent ? '' : value.toUpperCase();

  const handleHexSubmit = useCallback(() => {
    setIsEditingHex(false);
    const cleaned = hexInput.trim().replace(/^#?/, '#');
    if (/^#[0-9a-fA-F]{6}$/.test(cleaned)) {
      onChange(cleaned.toLowerCase());
    }
  }, [hexInput, onChange]);

  return (
    <div className={disabled ? 'opacity-40 pointer-events-none' : ''}>
      <span className="mb-2.5 block text-[11px] font-semibold uppercase tracking-wider text-[#a1a1aa]">{label}</span>

      {/* Color grid */}
      <div className="flex flex-col gap-1.5">
        {PRESET_COLORS.map((row, rowIndex) => (
          <div key={rowIndex} className="flex gap-1.5">
            {row.map((color) => (
              <button
                key={color}
                onClick={() => onChange(color)}
                className={`h-[26px] w-[26px] rounded-full transition-all duration-150 ${
                  value === color
                    ? 'ring-2 ring-[#7c3aed] ring-offset-2 scale-110'
                    : 'ring-1 ring-black/[0.08] hover:scale-110 hover:ring-black/20'
                }`}
                style={{ backgroundColor: color }}
                aria-label={color}
              />
            ))}
            {/* Row-specific extras */}
            {rowIndex === 0 && (
              <>
                {allowTransparent && (
                  <button
                    onClick={() => onChange('transparent')}
                    className={`flex h-[26px] w-[26px] items-center justify-center rounded-full transition-all duration-150 ${
                      isTransparent
                        ? 'ring-2 ring-[#7c3aed] ring-offset-2 scale-110 bg-white'
                        : 'ring-1 ring-black/[0.08] bg-white hover:scale-110 hover:ring-black/20'
                    }`}
                    aria-label="No fill"
                  >
                    <Ban size={12} className="text-[#dc2626]" />
                  </button>
                )}
              </>
            )}
          </div>
        ))}
      </div>

      {/* Current color + hex input */}
      <div className="mt-3 flex items-center gap-2">
        {/* Color preview + native picker */}
        <button
          onClick={() => inputRef.current?.click()}
          className={`relative h-7 w-7 shrink-0 overflow-hidden rounded-lg transition-all duration-150 ${
            isTransparent
              ? 'ring-1 ring-black/[0.08]'
              : !isPreset
                ? 'ring-2 ring-[#7c3aed] ring-offset-1'
                : 'ring-1 ring-black/[0.08] hover:ring-black/20'
          }`}
          style={{
            backgroundColor: isTransparent ? undefined : value,
            backgroundImage: isTransparent
              ? 'conic-gradient(#e4e4e7 25%, #fff 25% 50%, #e4e4e7 50% 75%, #fff 75%)'
              : undefined,
            backgroundSize: '8px 8px',
          }}
          aria-label="Custom color"
        >
          <input
            ref={inputRef}
            type="color"
            value={isTransparent || isPreset ? '#000000' : value}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 cursor-pointer opacity-0"
            tabIndex={-1}
          />
        </button>

        {/* Hex input */}
        {isEditingHex ? (
          <input
            autoFocus
            value={hexInput}
            onChange={(e) => setHexInput(e.target.value)}
            onBlur={handleHexSubmit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleHexSubmit();
              if (e.key === 'Escape') setIsEditingHex(false);
            }}
            className="h-7 w-full rounded-lg border border-[#e4e4e7] bg-white px-2 text-[12px] font-mono text-[#18181b] outline-none focus:border-[#7c3aed]"
            placeholder="#000000"
          />
        ) : (
          <button
            onClick={() => {
              setHexInput(displayHex);
              setIsEditingHex(true);
            }}
            className="flex h-7 w-full items-center rounded-lg bg-[#fafafa] px-2 text-[12px] font-mono text-[#52525b] transition-colors hover:bg-[#f4f4f5]"
          >
            {isTransparent ? (
              <span className="text-[#a1a1aa]">None</span>
            ) : (
              displayHex
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export default ColorPicker;
