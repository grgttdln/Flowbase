'use client';

import { useEffect } from 'react';
import { X } from 'lucide-react';
import { SHORTCUTS, SHORTCUT_CATEGORIES } from '@/constants/shortcuts';

interface ShortcutsPanelProps {
  open: boolean;
  onClose: () => void;
}

const ShortcutsPanel = ({ open, onClose }: ShortcutsPanelProps) => {
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20" onClick={onClose}>
      <div
        className="w-[520px] max-h-[80vh] overflow-y-auto rounded-2xl bg-white shadow-[0_8px_30px_rgba(0,0,0,0.15)]"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Keyboard shortcuts"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#e4e4e7] px-5 py-3.5">
          <span className="text-[15px] font-semibold text-[#18181b]">Keyboard Shortcuts</span>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-[#a1a1aa] transition-colors hover:bg-black/[0.04] hover:text-[#52525b]"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-5">
          {SHORTCUT_CATEGORIES.map((category) => {
            const items = SHORTCUTS.filter((s) => s.category === category);
            if (items.length === 0) return null;
            return (
              <div key={category}>
                <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-[#a1a1aa]">
                  {category}
                </h3>
                <div className="space-y-1">
                  {items.map((shortcut) => (
                    <div
                      key={shortcut.label}
                      className="flex items-center justify-between rounded-lg px-2 py-1.5"
                    >
                      <span className="text-[13px] text-[#18181b]">{shortcut.label}</span>
                      <div className="flex items-center gap-1">
                        {shortcut.keys.map((key) => (
                          <kbd
                            key={key}
                            className="inline-flex min-w-[24px] items-center justify-center rounded-md border border-[#e4e4e7] bg-[#fafafa] px-1.5 py-0.5 text-[11px] font-medium text-[#52525b]"
                          >
                            {key}
                          </kbd>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ShortcutsPanel;
