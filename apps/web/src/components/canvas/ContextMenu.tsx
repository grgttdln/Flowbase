'use client';

import { useEffect, useRef, useCallback } from 'react';
import {
  Copy,
  ClipboardPaste,
  Trash2,
  Group,
  Ungroup,
  ArrowUp,
  ArrowDown,
  Sparkles,
  MessageSquare,
  Lightbulb,
  FileText,
  Wand2,
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

export type ContextMenuAction =
  | 'copy'
  | 'paste'
  | 'delete'
  | 'group'
  | 'ungroup'
  | 'bringForward'
  | 'sendBackward'
  | 'alignLeft'
  | 'alignCenterH'
  | 'alignRight'
  | 'alignTop'
  | 'alignCenterV'
  | 'alignBottom'
  | 'distributeH'
  | 'distributeV'
  | 'explain'
  | 'suggest'
  | 'summarize'
  | 'generate'
  | 'layout';

interface MenuItem {
  action: ContextMenuAction;
  label: string;
  icon: LucideIcon;
  shortcut?: string;
  isAI?: boolean;
  needsSelection?: boolean;
  needsMultiSelection?: boolean;
  needsMinElements?: number;
}

const MENU_ITEMS: (MenuItem | 'divider')[] = [
  { action: 'generate', label: 'Generate Diagram', icon: Wand2, isAI: true },
  { action: 'explain', label: 'Explain', icon: MessageSquare, isAI: true, needsSelection: true },
  { action: 'suggest', label: 'Suggest improvements', icon: Lightbulb, isAI: true, needsSelection: true },
  { action: 'summarize', label: 'Summarize', icon: FileText, isAI: true },
  { action: 'layout', label: 'Auto-Layout', icon: Sparkles, isAI: true, needsMinElements: 2 },
  'divider',
  { action: 'copy', label: 'Copy', icon: Copy, shortcut: '⌘C', needsSelection: true },
  { action: 'paste', label: 'Paste', icon: ClipboardPaste, shortcut: '⌘V' },
  { action: 'delete', label: 'Delete', icon: Trash2, shortcut: '⌫', needsSelection: true },
  'divider',
  { action: 'group', label: 'Group', icon: Group, shortcut: '⌘G', needsSelection: true },
  { action: 'ungroup', label: 'Ungroup', icon: Ungroup, shortcut: '⌘⇧G', needsSelection: true },
  'divider',
  { action: 'bringForward', label: 'Bring forward', icon: ArrowUp, shortcut: '⌘]', needsSelection: true },
  { action: 'sendBackward', label: 'Send backward', icon: ArrowDown, shortcut: '⌘[', needsSelection: true },
  'divider',
  { action: 'alignLeft', label: 'Align left', icon: AlignStartVertical, shortcut: '⌘⇧L', needsMultiSelection: true },
  { action: 'alignCenterH', label: 'Align center', icon: AlignCenterVertical, shortcut: '⌘⇧C', needsMultiSelection: true },
  { action: 'alignRight', label: 'Align right', icon: AlignEndVertical, shortcut: '⌘⇧R', needsMultiSelection: true },
  { action: 'alignTop', label: 'Align top', icon: AlignStartHorizontal, needsMultiSelection: true },
  { action: 'alignCenterV', label: 'Align middle', icon: AlignCenterHorizontal, needsMultiSelection: true },
  { action: 'alignBottom', label: 'Align bottom', icon: AlignEndHorizontal, needsMultiSelection: true },
  { action: 'distributeH', label: 'Distribute horizontally', icon: AlignHorizontalSpaceAround, needsMultiSelection: true },
  { action: 'distributeV', label: 'Distribute vertically', icon: AlignVerticalSpaceAround, needsMultiSelection: true },
];

interface ContextMenuProps {
  x: number;
  y: number;
  hasSelection: boolean;
  selectionCount: number;
  elementCount?: number;
  onAction: (action: ContextMenuAction) => void;
  onClose: () => void;
}

const ContextMenu = ({ x, y, hasSelection, selectionCount, elementCount = 0, onAction, onClose }: ContextMenuProps) => {
  const menuRef = useRef<HTMLDivElement>(null);

  // Clamp position to viewport
  const getPosition = useCallback(() => {
    const menu = menuRef.current;
    if (!menu) return { left: x, top: y };
    const rect = menu.getBoundingClientRect();
    const left = Math.min(x, window.innerWidth - rect.width - 8);
    const top = Math.min(y, window.innerHeight - rect.height - 8);
    return { left: Math.max(8, left), top: Math.max(8, top) };
  }, [x, y]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  // Adjust position after first render
  useEffect(() => {
    const menu = menuRef.current;
    if (!menu) return;
    const pos = getPosition();
    menu.style.left = `${pos.left}px`;
    menu.style.top = `${pos.top}px`;
  }, [getPosition]);

  const visibleItems = MENU_ITEMS.filter((item) => {
    if (item === 'divider') return true;
    if (item.needsSelection && !hasSelection) return false;
    if (item.needsMultiSelection && selectionCount < 2) return false;
    if (item.needsMinElements && elementCount < item.needsMinElements) return false;
    return true;
  });

  // Remove leading/trailing/consecutive dividers
  const cleanItems = visibleItems.filter((item, i, arr) => {
    if (item !== 'divider') return true;
    if (i === 0 || i === arr.length - 1) return false;
    if (arr[i - 1] === 'divider') return false;
    return true;
  });

  return (
    <div
      ref={menuRef}
      role="menu"
      className="fixed z-50 min-w-[200px] rounded-[14px] bg-white p-1.5 shadow-[0_8px_30px_rgba(0,0,0,0.12),0_0_0_1px_rgba(0,0,0,0.04)]"
      style={{
        left: x,
        top: y,
        animation: 'contextMenuIn 150ms ease-out',
      }}
    >
      {cleanItems.map((item, i) => {
        if (item === 'divider') {
          return <div key={`d-${i}`} className="mx-2 my-1 h-px bg-[#F0F0F0]" />;
        }

        const Icon = item.icon;
        const isAI = item.isAI;

        return (
          <button
            key={item.action}
            role="menuitem"
            onClick={() => {
              onAction(item.action);
              onClose();
            }}
            className={`flex w-full items-center gap-2.5 rounded-[10px] px-3 py-2 text-[13px] font-medium transition-colors duration-150 ${
              isAI
                ? 'text-[#007AFF] hover:bg-[rgba(0,122,255,0.06)]'
                : 'text-[#1C1C1E] hover:bg-black/[0.04]'
            }`}
          >
            {isAI ? (
              <Sparkles size={15} className="shrink-0" />
            ) : (
              <Icon size={15} className="shrink-0 text-[#666666]" />
            )}
            <span className="flex-1 text-left">{item.label}</span>
            {item.shortcut && (
              <span className="text-[11px] text-[#999999]">{item.shortcut}</span>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default ContextMenu;
