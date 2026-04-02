'use client';

import { Download, Settings, Keyboard, Share2 } from 'lucide-react';
import FloatingPill from '../ui/FloatingPill';
import IconButton from '../ui/IconButton';

interface ActionGroupProps {
  onExport: () => void;
  onSettings: () => void;
  onShortcuts: () => void;
  onShare?: () => void;
  isSharing?: boolean;
}

const ActionGroup = ({ onExport, onSettings, onShortcuts, onShare, isSharing }: ActionGroupProps) => {
  return (
    <FloatingPill className="flex items-center gap-0.5 p-1">
      {onShare && (
        <IconButton
          icon={Share2}
          label={isSharing ? 'Sharing' : 'Share'}
          size="sm"
          isActive={isSharing}
          onClick={onShare}
        />
      )}
      <IconButton icon={Download} label="Export" size="sm" onClick={onExport} />
      <IconButton icon={Keyboard} label="Shortcuts" shortcut="?" size="sm" onClick={onShortcuts} />
      <IconButton icon={Settings} label="Settings" size="sm" onClick={onSettings} />
    </FloatingPill>
  );
};

export default ActionGroup;
