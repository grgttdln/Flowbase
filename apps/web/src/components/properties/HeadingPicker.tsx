'use client';

const HEADINGS = [
  { label: 'Heading 1', fontSize: 48, displaySize: 28, fontWeight: 800 },
  { label: 'Heading 2', fontSize: 36, displaySize: 24, fontWeight: 700 },
  { label: 'Heading 3', fontSize: 28, displaySize: 20, fontWeight: 700 },
  { label: 'Heading 4', fontSize: 24, displaySize: 17, fontWeight: 500 },
  { label: 'Heading 5', fontSize: 18, displaySize: 15, fontWeight: 400 },
  { label: 'Heading 6', fontSize: 14, displaySize: 13, fontWeight: 400 },
] as const;

interface HeadingPickerProps {
  currentFontSize: number;
  onChange: (fontSize: number) => void;
  disabled?: boolean;
}

const HeadingPicker = ({ currentFontSize, onChange, disabled }: HeadingPickerProps) => {
  return (
    <div className={disabled ? 'opacity-40 pointer-events-none' : ''}>
      <span className="mb-2 block text-[13px] font-medium text-[#18181b]">Heading</span>
      <div className="flex flex-col gap-0.5">
        {HEADINGS.map((h) => (
          <button
            key={h.label}
            onClick={() => onChange(h.fontSize)}
            className={`rounded-lg px-3 py-1.5 text-left transition-colors ${
              currentFontSize === h.fontSize
                ? 'bg-[#ede9fe] text-[#18181b]'
                : 'text-[#3f3f46] hover:bg-[#f4f4f5]'
            }`}
          >
            <span
              style={{
                fontSize: `${h.displaySize}px`,
                fontWeight: h.fontWeight,
                letterSpacing: h.fontWeight >= 700 ? '-0.02em' : '0',
              }}
            >
              {h.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default HeadingPicker;
