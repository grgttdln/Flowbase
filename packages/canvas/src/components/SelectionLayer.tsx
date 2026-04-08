import { useRef, useEffect, useCallback, useMemo } from 'react';
import { Transformer, Rect } from 'react-konva';
import type Konva from 'konva';
import { useCanvasStore } from '../store/useCanvasStore';

interface SelectionLayerProps {
  stageRef: React.RefObject<Konva.Stage | null>;
}

const SelectionLayer = ({ stageRef }: SelectionLayerProps) => {
  const transformerRef = useRef<Konva.Transformer>(null);
  const selectedIds = useCanvasStore((s) => s.selectedIds);
  const elements = useCanvasStore((s) => s.elements);
  const updateElement = useCanvasStore((s) => s.updateElement);

  const lineArrowIds = useMemo(
    () => new Set(elements.filter((el) => el.type === 'line' || el.type === 'arrow').map((el) => el.id)),
    [elements]
  );

  useEffect(() => {
    const transformer = transformerRef.current;
    const stage = stageRef.current;
    if (!transformer || !stage) return;

    const layer = transformer.getLayer();
    if (!layer) return;

    const selectedNodes = Array.from(selectedIds)
      .filter((id) => !lineArrowIds.has(id))
      .map((id) => stage.findOne(`#${id}`))
      .filter((node): node is Konva.Node => node !== null && node !== undefined);

    transformer.nodes(selectedNodes);
    layer.batchDraw();
  }, [selectedIds, lineArrowIds, stageRef]);

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
      anchorStyleFunc={(anchor) => {
        const isCorner = anchor.hasName('top-left') || anchor.hasName('top-right')
          || anchor.hasName('bottom-left') || anchor.hasName('bottom-right');
        if (!isCorner) {
          anchor.fill('transparent');
          anchor.stroke('transparent');
          anchor.width(12);
          anchor.height(12);
        }
      }}
    />
  );
};

export default SelectionLayer;
