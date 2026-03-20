'use client';

import { Undo2, Redo2, Download, Settings } from 'lucide-react';
import FloatingPill from '../ui/FloatingPill';
import IconButton from '../ui/IconButton';

interface ActionGroupProps {
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onExport: () => void;
  onSettings: () => void;
}

const ActionGroup = ({ canUndo, canRedo, onUndo, onRedo, onExport, onSettings }: ActionGroupProps) => {
  return (
    <FloatingPill className="flex items-center gap-0.5 p-1.5">
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
      <div className="mx-1 h-5 w-px bg-[#E5E5E5]" />
      <IconButton icon={Download} label="Export" onClick={onExport} />
      <IconButton icon={Settings} label="Settings" onClick={onSettings} />
    </FloatingPill>
  );
};

export default ActionGroup;
