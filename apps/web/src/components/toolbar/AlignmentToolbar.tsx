'use client';

import { useMemo } from 'react';
import { useCanvasStore, getSelectionBounds } from '@flowbase/canvas';
import {
  AlignStartVertical,
  AlignCenterVertical,
  AlignEndVertical,
  AlignStartHorizontal,
  AlignCenterHorizontal,
  AlignEndHorizontal,
  AlignHorizontalSpaceAround,
  AlignVerticalSpaceAround,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface AlignButton {
  icon: LucideIcon;
  label: string;
  action: () => void;
  minCount: number;
}

const AlignmentToolbar = () => {
  const {
    selectedIds,
    elements,
    viewport,
    alignLeft,
    alignCenterH,
    alignRight,
    alignTop,
    alignCenterV,
    alignBottom,
    distributeH,
    distributeV,
  } = useCanvasStore();

  const selected = useMemo(
    () => elements.filter((el) => selectedIds.has(el.id)),
    [elements, selectedIds],
  );

  const bounds = useMemo(() => getSelectionBounds(selected), [selected]);

  if (selected.length < 2 || !bounds) return null;

  // Convert canvas coords to screen coords
  const screenX = bounds.x * viewport.zoom + viewport.panX + (bounds.width * viewport.zoom) / 2;
  const screenY = bounds.y * viewport.zoom + viewport.panY;

  const buttons: AlignButton[] = [
    { icon: AlignStartVertical, label: 'Align left', action: alignLeft, minCount: 2 },
    { icon: AlignCenterVertical, label: 'Align center horizontally', action: alignCenterH, minCount: 2 },
    { icon: AlignEndVertical, label: 'Align right', action: alignRight, minCount: 2 },
    { icon: AlignStartHorizontal, label: 'Align top', action: alignTop, minCount: 2 },
    { icon: AlignCenterHorizontal, label: 'Align center vertically', action: alignCenterV, minCount: 2 },
    { icon: AlignEndHorizontal, label: 'Align bottom', action: alignBottom, minCount: 2 },
    { icon: AlignHorizontalSpaceAround, label: 'Distribute horizontally', action: distributeH, minCount: 3 },
    { icon: AlignVerticalSpaceAround, label: 'Distribute vertically', action: distributeV, minCount: 3 },
  ];

  return (
    <div
      className="fixed z-20 flex items-center gap-0.5 rounded-xl bg-white px-1.5 py-1 shadow-[0_2px_12px_rgba(0,0,0,0.1),0_0_0_1px_rgba(0,0,0,0.04)]"
      style={{
        left: screenX,
        top: screenY - 48,
        transform: 'translateX(-50%)',
      }}
    >
      {buttons.map(({ icon: Icon, label, action, minCount }, i) => (
        <span key={label}>
          {i === 6 && (
            <span className="mx-0.5 inline-block h-5 w-px bg-[#E5E5E5]" />
          )}
          <button
            onClick={action}
            disabled={selected.length < minCount}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-[#666] transition-colors hover:bg-black/[0.04] hover:text-[#333] disabled:pointer-events-none disabled:opacity-30"
            aria-label={label}
            title={label}
          >
            <Icon size={15} />
          </button>
        </span>
      ))}
    </div>
  );
};

export default AlignmentToolbar;
