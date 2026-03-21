import { useRef, useEffect, useCallback } from 'react';
import { Transformer, Rect } from 'react-konva';
import type Konva from 'konva';
import { useCanvasStore } from '../store/useCanvasStore';

interface SelectionLayerProps {
  stageRef: React.RefObject<Konva.Stage | null>;
}

const SelectionLayer = ({ stageRef }: SelectionLayerProps) => {
  const transformerRef = useRef<Konva.Transformer>(null);
  const { selectedIds, elements, updateElement } = useCanvasStore();

  useEffect(() => {
    const transformer = transformerRef.current;
    const stage = stageRef.current;
    if (!transformer || !stage) return;

    const layer = transformer.getLayer();
    if (!layer) return;

    // Exclude line/arrow elements — they use custom ArrowControls instead of Transformer
    const lineArrowIds = new Set(
      elements.filter((el) => el.type === 'line' || el.type === 'arrow').map((el) => el.id),
    );
    const selectedNodes = Array.from(selectedIds)
      .filter((id) => !lineArrowIds.has(id))
      .map((id) => stage.findOne(`#${id}`))
      .filter((node): node is Konva.Node => node !== null && node !== undefined);

    transformer.nodes(selectedNodes);
    layer.batchDraw();
  }, [selectedIds, elements, stageRef]);

  const handleTransformEnd = useCallback(() => {
    const transformer = transformerRef.current;
    if (!transformer) return;

    const nodes = transformer.nodes();
    nodes.forEach((node) => {
      const id = node.id();
      const scaleX = node.scaleX();
      const scaleY = node.scaleY();

      updateElement(id, {
        x: node.x(),
        y: node.y(),
        width: Math.max(5, node.width() * scaleX),
        height: Math.max(5, node.height() * scaleY),
        rotation: node.rotation(),
      });

      node.scaleX(1);
      node.scaleY(1);
    });
  }, [updateElement]);

  return (
    <Transformer
      ref={transformerRef}
      boundBoxFunc={(oldBox, newBox) => {
        if (Math.abs(newBox.width) < 5 || Math.abs(newBox.height) < 5) {
          return oldBox;
        }
        return newBox;
      }}
      onTransformEnd={handleTransformEnd}
      anchorSize={8}
      anchorCornerRadius={2}
      anchorStroke="#007AFF"
      anchorFill="#FFFFFF"
      borderStroke="#007AFF"
      borderStrokeWidth={1}
      rotateAnchorOffset={20}
      enabledAnchors={[
        'top-left',
        'top-center',
        'top-right',
        'middle-right',
        'bottom-right',
        'bottom-center',
        'bottom-left',
        'middle-left',
      ]}
    />
  );
};

export default SelectionLayer;
