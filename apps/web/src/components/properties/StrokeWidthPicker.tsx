'use client';

const WIDTHS = [
  { value: 1, label: 'Thin' },
  { value: 2, label: 'Medium' },
  { value: 4, label: 'Thick' },
] as const;

interface StrokeWidthPickerProps {
  value: number;
  onChange: (width: number) => void;
  disabled?: boolean;
}

const StrokeWidthPicker = ({ value, onChange, disabled }: StrokeWidthPickerProps) => {
  return (
    <div className={disabled ? 'opacity-40 pointer-events-none' : ''}>
      <span className="mb-2 block text-[13px] font-medium text-[#18181b]">Stroke width</span>
      <div className="flex gap-1.5">
        {WIDTHS.map(({ value: w, label }) => (
          <button
            key={w}
            onClick={() => onChange(w)}
            className={`flex h-9 w-16 items-center justify-center rounded-lg transition-colors ${
              value === w
                ? 'bg-[#ede9fe] text-[#18181b]'
                : 'bg-[#fafafa] text-[#52525b] hover:bg-[#e4e4e7]'
            }`}
            aria-label={label}
          >
            <div
              className="rounded-full bg-current"
              style={{ width: 24, height: w }}
            />
          </button>
        ))}
      </div>
    </div>
  );
};

export default StrokeWidthPicker;
