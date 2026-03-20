'use client';

import { useEffect, useState } from 'react';
import { FlowbaseCanvas, useCanvasStore } from '@flowbase/canvas';
import type { ToolType } from '@flowbase/shared';

const TOOLS: { key: ToolType; label: string; shortcut: string }[] = [
  { key: 'select', label: 'Select', shortcut: 'V' },
  { key: 'rectangle', label: 'Rectangle', shortcut: 'R' },
  { key: 'ellipse', label: 'Ellipse', shortcut: 'O' },
  { key: 'diamond', label: 'Diamond', shortcut: 'D' },
  { key: 'line', label: 'Line', shortcut: 'L' },
  { key: 'arrow', label: 'Arrow', shortcut: 'A' },
  { key: 'freehand', label: 'Draw', shortcut: 'P' },
  { key: 'text', label: 'Text', shortcut: 'T' },
];

const CanvasEditor = () => {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const { activeTool, setTool, viewport, zoomTo, elements, selectedIds } = useCanvasStore();

  useEffect(() => {
    const updateDimensions = () => {
      setDimensions({ width: window.innerWidth, height: window.innerHeight });
    };
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Tool shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLInputElement) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      const tool = TOOLS.find((t) => t.shortcut.toLowerCase() === e.key.toLowerCase());
      if (tool) {
        setTool(tool.key);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setTool]);

  const zoomPercent = Math.round(viewport.zoom * 100);

  if (dimensions.width === 0) return null;

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-white">
      {/* Canvas */}
      <FlowbaseCanvas width={dimensions.width} height={dimensions.height} />

      {/* Floating toolbar - center top */}
      <div className="absolute left-1/2 top-4 z-10 flex -translate-x-1/2 items-center gap-0.5 rounded-xl bg-white p-1.5 shadow-[0_2px_12px_rgba(0,0,0,0.08),0_0_0_1px_rgba(0,0,0,0.04)]">
        {TOOLS.map((tool, i) => (
          <div key={tool.key} className="flex items-center">
            {(i === 4 || i === 6) && (
              <div className="mx-1 h-5 w-px bg-gray-200" />
            )}
            <button
              onClick={() => setTool(tool.key)}
              className={`flex h-9 w-9 items-center justify-center rounded-lg text-xs font-medium transition-colors ${
                activeTool === tool.key
                  ? 'bg-[#007AFF] text-white'
                  : 'text-gray-500 hover:bg-gray-50'
              }`}
              title={`${tool.label} (${tool.shortcut})`}
            >
              {tool.shortcut}
            </button>
          </div>
        ))}
      </div>

      {/* Logo - top left */}
      <div className="absolute left-4 top-4 z-10 rounded-xl bg-white px-3 py-2 text-sm font-bold text-[#007AFF] shadow-[0_2px_12px_rgba(0,0,0,0.08),0_0_0_1px_rgba(0,0,0,0.04)]">
        Flowbase
      </div>

      {/* Zoom controls - bottom left */}
      <div className="absolute bottom-4 left-4 z-10 flex items-center gap-0.5 rounded-xl bg-white p-1 shadow-[0_2px_12px_rgba(0,0,0,0.08),0_0_0_1px_rgba(0,0,0,0.04)]">
        <button
          onClick={() => zoomTo(viewport.zoom / 1.2)}
          className="flex h-7 w-7 items-center justify-center rounded-md text-gray-500 hover:bg-gray-50"
        >
          −
        </button>
        <span className="px-2 text-xs text-gray-400">{zoomPercent}%</span>
        <button
          onClick={() => zoomTo(viewport.zoom * 1.2)}
          className="flex h-7 w-7 items-center justify-center rounded-md text-gray-500 hover:bg-gray-50"
        >
          +
        </button>
      </div>

      {/* Status - bottom right */}
      <div className="absolute bottom-4 right-4 z-10 rounded-xl bg-white px-3 py-1.5 text-xs shadow-[0_2px_12px_rgba(0,0,0,0.08),0_0_0_1px_rgba(0,0,0,0.04)]">
        <span className="text-gray-400">
          {elements.length} element{elements.length !== 1 ? 's' : ''}
          {selectedIds.size > 0 && ` · ${selectedIds.size} selected`}
        </span>
      </div>
    </div>
  );
};

export default CanvasEditor;
