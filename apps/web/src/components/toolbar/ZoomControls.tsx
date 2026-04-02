'use client';

import { Minus, Plus } from 'lucide-react';
import FloatingPill from '../ui/FloatingPill';
import IconButton from '../ui/IconButton';

interface ZoomControlsProps {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
}

const ZoomControls = ({ zoom, onZoomIn, onZoomOut }: ZoomControlsProps) => {
  const percent = Math.round(zoom * 100);

  return (
    <FloatingPill className="flex items-center gap-0.5 p-1">
      <IconButton icon={Minus} label="Zoom out" size="sm" onClick={onZoomOut} />
      <span className="min-w-[38px] select-none text-center text-[11px] font-medium tabular-nums text-[#888]">
        {percent}%
      </span>
      <IconButton icon={Plus} label="Zoom in" size="sm" onClick={onZoomIn} />
    </FloatingPill>
  );
};

export default ZoomControls;
