'use client';

import { useEffect, useRef } from 'react';
import type Konva from 'konva';
import { FileJson, Image } from 'lucide-react';
import { exportFlowbase, exportPNG } from '@/lib/export';

interface ExportDialogProps {
  projectName: string;
  stageRef: React.RefObject<Konva.Stage | null>;
  onClose: () => void;
}

const ExportDialog = ({ projectName, stageRef, onClose }: ExportDialogProps) => {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose();
  };

  const handleFlowbase = () => {
    exportFlowbase(projectName);
    onClose();
  };

  const handlePNG = () => {
    if (stageRef.current) {
      exportPNG(projectName, stageRef.current);
    }
    onClose();
  };

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/20"
    >
      <div className="w-80 rounded-2xl bg-white p-6 shadow-[0_8px_32px_rgba(0,0,0,0.12)]">
        <h2 className="mb-1 text-lg font-semibold text-[#18181b]">Export Project</h2>
        <p className="mb-5 text-sm text-[#a1a1aa]">Choose a format</p>

        <div className="flex flex-col gap-2">
          <button
            onClick={handleFlowbase}
            className="flex items-center gap-3 rounded-xl px-4 py-3 text-left transition-colors hover:bg-[#fafafa]"
          >
            <FileJson size={20} className="text-[#7c3aed]" />
            <div>
              <div className="text-[13px] font-medium text-[#18181b]">Flowbase Project</div>
              <div className="text-[11px] text-[#a1a1aa]">.flowbase — full project data</div>
            </div>
          </button>

          <button
            onClick={handlePNG}
            className="flex items-center gap-3 rounded-xl px-4 py-3 text-left transition-colors hover:bg-[#fafafa]"
          >
            <Image size={20} className="text-[#16a34a]" />
            <div>
              <div className="text-[13px] font-medium text-[#18181b]">Image</div>
              <div className="text-[11px] text-[#a1a1aa]">.png — 2x resolution</div>
            </div>
          </button>
        </div>

        <button
          onClick={onClose}
          className="mt-4 w-full rounded-xl py-2 text-sm text-[#a1a1aa] transition-colors hover:bg-[#fafafa]"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default ExportDialog;
