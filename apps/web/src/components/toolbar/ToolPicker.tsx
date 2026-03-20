'use client';

import {
  MousePointer2,
  Square,
  Circle,
  Diamond,
  Minus,
  MoveUpRight,
  Pencil,
  Type,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { ToolType } from '@flowbase/shared';
import FloatingPill from '../ui/FloatingPill';
import IconButton from '../ui/IconButton';

const TOOLS: { key: ToolType; icon: LucideIcon; label: string; shortcut: string }[] = [
  { key: 'select', icon: MousePointer2, label: 'Select', shortcut: 'V' },
  { key: 'rectangle', icon: Square, label: 'Rectangle', shortcut: 'R' },
  { key: 'ellipse', icon: Circle, label: 'Ellipse', shortcut: 'O' },
  { key: 'diamond', icon: Diamond, label: 'Diamond', shortcut: 'D' },
  { key: 'line', icon: Minus, label: 'Line', shortcut: 'L' },
  { key: 'arrow', icon: MoveUpRight, label: 'Arrow', shortcut: 'A' },
  { key: 'freehand', icon: Pencil, label: 'Draw', shortcut: 'P' },
  { key: 'text', icon: Type, label: 'Text', shortcut: 'T' },
];

// Divider positions: after Select (index 0), after Diamond (index 3), after Arrow (index 5)
const DIVIDER_AFTER = new Set([0, 3, 5]);

interface ToolPickerProps {
  activeTool: ToolType;
  onToolChange: (tool: ToolType) => void;
}

const ToolPicker = ({ activeTool, onToolChange }: ToolPickerProps) => {
  return (
    <FloatingPill className="flex items-center gap-0.5 p-1.5">
      {TOOLS.map((tool, i) => (
        <div key={tool.key} className="flex items-center">
          <IconButton
            icon={tool.icon}
            label={tool.label}
            shortcut={tool.shortcut}
            isActive={activeTool === tool.key}
            onClick={() => onToolChange(tool.key)}
          />
          {DIVIDER_AFTER.has(i) && (
            <div className="mx-1 h-5 w-px bg-[#E5E5E5]" />
          )}
        </div>
      ))}
    </FloatingPill>
  );
};

export default ToolPicker;
