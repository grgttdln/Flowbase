'use client';

import { useCallback, useMemo } from 'react';
import { useCanvasStore, useStyleDefaults, getToolCategory } from '@flowbase/canvas';
import type { Element } from '@flowbase/shared';
import ColorPicker from './ColorPicker';
import StrokeWidthPicker from './StrokeWidthPicker';
import OpacitySlider from './OpacitySlider';
import FontSizePicker from './FontSizePicker';
import LayerControls from './LayerControls';

type SidebarMode = 'defaults' | 'element';

interface SectionVisibility {
  stroke: boolean;
  fill: boolean;
  strokeWidth: boolean;
  fontSize: boolean;
  opacity: boolean;
  layers: boolean;
}

function getSections(elementType: string): SectionVisibility {
  switch (elementType) {
    case 'rectangle':
    case 'ellipse':
    case 'diamond':
      return { stroke: true, fill: true, strokeWidth: true, fontSize: false, opacity: true, layers: true };
    case 'line':
    case 'arrow':
    case 'freehand':
      return { stroke: true, fill: false, strokeWidth: true, fontSize: false, opacity: true, layers: true };
    case 'text':
      return { stroke: true, fill: false, strokeWidth: false, fontSize: true, opacity: true, layers: true };
    default:
      return { stroke: true, fill: true, strokeWidth: true, fontSize: false, opacity: true, layers: true };
  }
}

const PropertiesSidebar = () => {
  const {
    activeTool,
    selectedIds,
    elements,
    updateElement,
    pushHistory,
    bringForward,
    sendBackward,
    bringToFront,
    sendToBack,
  } = useCanvasStore();

  const styleDefaults = useStyleDefaults();

  // Determine visibility and mode
  const selectedElement = useMemo<Element | null>(() => {
    if (selectedIds.size === 0) return null;
    return elements.find((el) => selectedIds.has(el.id)) ?? null;
  }, [selectedIds, elements]);

  const mode: SidebarMode = selectedElement ? 'element' : 'defaults';
  const category = getToolCategory(activeTool);
  const isVisible = selectedElement !== null || (activeTool !== 'select' && category !== null);

  // What element type are we editing?
  const elementType = selectedElement?.type ?? activeTool;
  const sections = getSections(elementType);
  const isLocked = selectedElement?.locked ?? false;

  // Current values — from element or from defaults
  const currentStroke = selectedElement?.stroke ?? (category ? styleDefaults[category].stroke : '#007AFF');
  const currentFill = selectedElement?.fill ?? (category ? styleDefaults[category].fill : 'transparent');
  const currentStrokeWidth = selectedElement?.strokeWidth ?? (category ? styleDefaults[category].strokeWidth : 2);
  const currentOpacity = selectedElement?.opacity ?? (category ? styleDefaults[category].opacity : 1);
  const currentFontSize = selectedElement?.fontSize ?? (category ? styleDefaults[category].fontSize : 16);

  // Batch update selected elements
  const updateSelected = useCallback(
    (updates: Partial<Element>) => {
      if (selectedIds.size === 0) return;
      pushHistory();
      for (const id of selectedIds) {
        updateElement(id, updates);
      }
    },
    [selectedIds, pushHistory, updateElement],
  );

  const handleChange = useCallback(
    (field: string, value: string | number) => {
      if (mode === 'element') {
        updateSelected({ [field]: value });
      } else if (category) {
        styleDefaults.update(category, { [field]: value });
      }
    },
    [mode, category, updateSelected, styleDefaults],
  );

  // Opacity needs special handling for debounced undo
  const handleOpacityStart = useCallback(() => {
    if (mode === 'element' && selectedIds.size > 0) {
      pushHistory();
    }
  }, [mode, selectedIds, pushHistory]);

  const handleOpacityChange = useCallback(
    (value: number) => {
      if (mode === 'element') {
        // Don't push history here — pushed on start
        for (const id of selectedIds) {
          updateElement(id, { opacity: value });
        }
      } else if (category) {
        styleDefaults.update(category, { opacity: value });
      }
    },
    [mode, selectedIds, updateElement, category, styleDefaults],
  );

  return (
    <div
      className={`fixed left-0 top-[72px] z-[5] h-[calc(100vh-88px)] w-[220px] overflow-y-auto rounded-r-2xl bg-white shadow-lg transition-transform duration-200 ease-out ${
        isVisible ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      <div className="space-y-5 p-4">
        {sections.stroke && (
          <ColorPicker
            label="Stroke"
            value={currentStroke}
            onChange={(c) => handleChange('stroke', c)}
            disabled={isLocked}
          />
        )}

        {sections.fill && (
          <ColorPicker
            label="Background"
            value={currentFill}
            onChange={(c) => handleChange('fill', c)}
            disabled={isLocked}
          />
        )}

        {sections.strokeWidth && (
          <StrokeWidthPicker
            value={currentStrokeWidth}
            onChange={(w) => handleChange('strokeWidth', w)}
            disabled={isLocked}
          />
        )}

        {sections.fontSize && (
          <FontSizePicker
            value={currentFontSize}
            onChange={(s) => handleChange('fontSize', s)}
            disabled={isLocked}
          />
        )}

        {sections.opacity && (
          <OpacitySlider
            value={currentOpacity}
            onChange={handleOpacityChange}
            onChangeStart={handleOpacityStart}
            disabled={isLocked}
          />
        )}

        {sections.layers && mode === 'element' && (
          <LayerControls
            onSendToBack={sendToBack}
            onSendBackward={sendBackward}
            onBringForward={bringForward}
            onBringToFront={bringToFront}
            disabled={isLocked}
          />
        )}
      </div>
    </div>
  );
};

export default PropertiesSidebar;
