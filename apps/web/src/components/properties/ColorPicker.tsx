'use client';

import { useRef } from 'react';

const PRESET_COLORS = [
  '#1B1B1B',
  '#E03131',
  '#2F9E44',
  '#1971C2',
  '#F08C00',
  '#9C36B5',
  '#0CA678',
  '#E8590C',
  '#868E96',
  '#F783AC',
] as const;

interface ColorPickerProps {
  label: string;
  value: string;
  onChange: (color: string) => void;
  disabled?: boolean;
}

const ColorPicker = ({ label, value, onChange, disabled }: ColorPickerProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const isPreset = PRESET_COLORS.includes(value as typeof PRESET_COLORS[number]);

  return (
    <div className={disabled ? 'opacity-40 pointer-events-none' : ''}>
      <span className="mb-2 block text-[13px] font-medium text-[#333]">{label}</span>
      <div className="flex flex-wrap gap-1.5">
        {PRESET_COLORS.map((color) => (
          <button
            key={color}
            onClick={() => onChange(color)}
            className={`h-7 w-7 rounded-sm transition-shadow ${
              value === color ? 'ring-2 ring-[#007AFF] ring-offset-1' : 'ring-1 ring-black/10'
            }`}
            style={{ backgroundColor: color }}
            aria-label={color}
          />
        ))}
        {/* Custom color swatch */}
        <button
          onClick={() => inputRef.current?.click()}
          className={`relative h-7 w-7 overflow-hidden rounded-sm transition-shadow ${
            !isPreset && value !== 'transparent' ? 'ring-2 ring-[#007AFF] ring-offset-1' : 'ring-1 ring-black/10'
          }`}
          style={{
            backgroundColor: !isPreset && value !== 'transparent' ? value : undefined,
            backgroundImage:
              isPreset || value === 'transparent'
                ? 'conic-gradient(#ccc 25%, #fff 25% 50%, #ccc 50% 75%, #fff 75%)'
                : undefined,
            backgroundSize: '8px 8px',
          }}
          aria-label="Custom color"
        >
          <input
            ref={inputRef}
            type="color"
            value={isPreset || value === 'transparent' ? '#000000' : value}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 cursor-pointer opacity-0"
            tabIndex={-1}
          />
        </button>
      </div>
    </div>
  );
};

export default ColorPicker;
