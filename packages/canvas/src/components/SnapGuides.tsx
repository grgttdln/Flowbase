import { Line } from 'react-konva';
import type { SnapGuide } from '../utils/snapping';
import React from 'react';

interface SnapGuidesProps {
  guides: SnapGuide[];
  viewportWidth: number;
  viewportHeight: number;
  zoom: number;
  panX: number;
  panY: number;
}

const SnapGuides = React.memo(({ guides, viewportWidth, viewportHeight, zoom, panX, panY }: SnapGuidesProps) => {
  if (guides.length === 0) return null;

  const startX = -panX / zoom - 1000;
  const startY = -panY / zoom - 1000;
  const endX = startX + viewportWidth / zoom + 2000;
  const endY = startY + viewportHeight / zoom + 2000;

  return (
    <>
      {guides.map((guide, i) =>
        guide.orientation === 'vertical' ? (
          <Line
            key={`v-${i}`}
            points={[guide.position, startY, guide.position, endY]}
            stroke="#007AFF"
            strokeWidth={1 / zoom}
            dash={[4 / zoom, 4 / zoom]}
            listening={false}
          />
        ) : (
          <Line
            key={`h-${i}`}
            points={[startX, guide.position, endX, guide.position]}
            stroke="#007AFF"
            strokeWidth={1 / zoom}
            dash={[4 / zoom, 4 / zoom]}
            listening={false}
          />
        ),
      )}
    </>
  );
});

SnapGuides.displayName = 'SnapGuides';

export default SnapGuides;
