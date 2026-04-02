'use client';

const SIZES = [
  { value: 16, label: 'S' },
  { value: 20, label: 'M' },
  { value: 28, label: 'L' },
  { value: 36, label: 'XL' },
] as const;

interface FontSizePickerProps {
  value: number;
  onChange: (size: number) => void;
  disabled?: boolean;
}

const FontSizePicker = ({ value, onChange, disabled }: FontSizePickerProps) => {
  return (
    <div className={disabled ? 'opacity-40 pointer-events-none' : ''}>
      <span className="mb-2 block text-[13px] font-medium text-[#18181b]">Font size</span>
      <div className="flex gap-1.5">
        {SIZES.map(({ value: s, label }) => (
          <button
            key={s}
            onClick={() => onChange(s)}
            className={`flex h-9 w-12 items-center justify-center rounded-lg text-[13px] font-medium transition-colors ${
              value === s
                ? 'bg-[#ede9fe] text-[#18181b]'
                : 'bg-[#fafafa] text-[#52525b] hover:bg-[#e4e4e7]'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default FontSizePicker;
