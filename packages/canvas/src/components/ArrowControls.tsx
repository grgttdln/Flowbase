'use client';

import { Circle, Group, Line } from 'react-konva';
import type Konva from 'konva';
import type { Element } from '@flowbase/shared';

interface ArrowControlsProps {
  element: Element;
  onEndpointDragStart: (elementId: string, pointIndex: number) => void;
  onEndpointDragMove: (elementId: string, pointIndex: number, x: number, y: number) => void;
  onEndpointDragEnd: (elementId: string, pointIndex: number) => void;
  onSegmentDblClick: (elementId: string, segmentIndex: number, x: number, y: number) => void;
}

const HANDLE_RADIUS = 5;
const MID_HANDLE_RADIUS = 4;

const ArrowControls = ({
  element,
  onEndpointDragStart,
  onEndpointDragMove,
  onEndpointDragEnd,
  onSegmentDblClick,
}: ArrowControlsProps) => {
  const points = element.points ?? [0, 0, element.width, element.height];
  if (points.length < 4) return null;

  // Build absolute point positions (points are relative to element.x, element.y)
  const absPoints: { x: number; y: number }[] = [];
  for (let i = 0; i < points.length; i += 2) {
    absPoints.push({ x: element.x + points[i], y: element.y + points[i + 1] });
  }

  // Invisible hit areas for each segment (for double-click to add bend point)
  const segments: React.ReactNode[] = [];
  for (let i = 0; i < absPoints.length - 1; i++) {
    const segIdx = i;
    segments.push(
      <Line
        key={`seg-${i}`}
        points={[absPoints[i].x, absPoints[i].y, absPoints[i + 1].x, absPoints[i + 1].y]}
        stroke="transparent"
        strokeWidth={12}
        hitStrokeWidth={12}
        onDblClick={(e) => {
          const stage = e.target.getStage();
          if (!stage) return;
          const pos = stage.getPointerPosition();
          if (!pos) return;
          const transform = stage.getAbsoluteTransform().copy().invert();
          const canvasPos = transform.point(pos);
          onSegmentDblClick(element.id, segIdx, canvasPos.x, canvasPos.y);
        }}
      />,
    );
  }

  // Control point handles
  const handles: React.ReactNode[] = absPoints.map((pt, i) => {
    const isEndpoint = i === 0 || i === absPoints.length - 1;
    const pointIndex = i;
    return (
      <Circle
        key={`handle-${i}`}
        x={pt.x}
        y={pt.y}
        radius={isEndpoint ? HANDLE_RADIUS : MID_HANDLE_RADIUS}
        fill={isEndpoint ? '#FFFFFF' : '#007AFF'}
        stroke="#007AFF"
        strokeWidth={2}
        draggable
        onDragStart={() => onEndpointDragStart(element.id, pointIndex)}
        onDragMove={(e: Konva.KonvaEventObject<DragEvent>) => {
          const node = e.target;
          onEndpointDragMove(element.id, pointIndex, node.x(), node.y());
        }}
        onDragEnd={() => onEndpointDragEnd(element.id, pointIndex)}
      />
    );
  });

  return (
    <Group>
      {segments}
      {handles}
    </Group>
  );
};

export default ArrowControls;
