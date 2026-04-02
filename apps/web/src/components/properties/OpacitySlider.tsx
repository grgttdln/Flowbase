'use client';

import { useCallback, useRef } from 'react';

interface OpacitySliderProps {
  /** Opacity value 0-1 */
  value: number;
  onChange: (opacity: number) => void;
  onChangeStart?: () => void;
  disabled?: boolean;
}

const OpacitySlider = ({ value, onChange, onChangeStart, disabled }: OpacitySliderProps) => {
  const hasStarted = useRef(false);
  const displayValue = Math.round(value * 100);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!hasStarted.current && onChangeStart) {
        onChangeStart();
        hasStarted.current = true;
      }
      onChange(Number(e.target.value) / 100);
    },
    [onChange, onChangeStart],
  );

  const handlePointerUp = useCallback(() => {
    hasStarted.current = false;
  }, []);

  return (
    <div className={disabled ? 'opacity-40 pointer-events-none' : ''}>
      <span className="mb-2 block text-[13px] font-medium text-[#18181b]">Opacity</span>
      <input
        type="range"
        min={0}
        max={100}
        value={displayValue}
        onChange={handleChange}
        onPointerUp={handlePointerUp}
        className="h-2 w-full cursor-pointer appearance-none rounded-full bg-[#e4e4e7] accent-[#7c3aed]"
      />
      <div className="mt-1 flex justify-between text-[11px] text-[#a1a1aa]">
        <span>0</span>
        <span>{displayValue}</span>
        <span>100</span>
      </div>
    </div>
  );
};

export default OpacitySlider;
