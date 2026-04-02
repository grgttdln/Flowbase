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
  StickyNote,
  Undo2,
  Redo2,
  Pointer,
  Eraser,
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
  { key: 'stickynote', icon: StickyNote, label: 'Sticky note', shortcut: 'S' },
  { key: 'laser', icon: Pointer, label: 'Laser pointer', shortcut: 'K' },
  { key: 'eraser', icon: Eraser, label: 'Eraser', shortcut: 'E' },
];

// Divider positions: after Select (index 0), after Diamond (index 3), after Arrow (index 5), after Eraser (index 10)
const DIVIDER_AFTER = new Set([0, 3, 5, 10]);

interface ToolPickerProps {
  activeTool: ToolType;
  onToolChange: (tool: ToolType) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
}

const Divider = () => (
  <div className="mx-0.5 h-5 w-px bg-black/[0.08]" />
);

const ToolPicker = ({ activeTool, onToolChange, canUndo, canRedo, onUndo, onRedo }: ToolPickerProps) => {
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
          {DIVIDER_AFTER.has(i) && <Divider />}
        </div>
      ))}
      <Divider />
      <IconButton
        icon={Undo2}
        label="Undo"
        shortcut="⌘Z"
        disabled={!canUndo}
        onClick={onUndo}
      />
      <IconButton
        icon={Redo2}
        label="Redo"
        shortcut="⌘⇧Z"
        disabled={!canRedo}
        onClick={onRedo}
      />
    </FloatingPill>
  );
};

export default ToolPicker;
