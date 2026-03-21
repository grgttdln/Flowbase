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
      <span className="mb-2 block text-[13px] font-medium text-[#333]">Stroke width</span>
      <div className="flex gap-1.5">
        {WIDTHS.map(({ value: w, label }) => (
          <button
            key={w}
            onClick={() => onChange(w)}
            className={`flex h-9 w-16 items-center justify-center rounded-lg transition-colors ${
              value === w
                ? 'bg-[#E8E0FF] text-[#333]'
                : 'bg-[#F5F5F5] text-[#666] hover:bg-[#EBEBEB]'
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
