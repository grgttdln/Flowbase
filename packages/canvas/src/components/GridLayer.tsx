import { Circle, Group } from 'react-konva';
import React, { useMemo } from 'react';

interface GridLayerProps {
  width: number;
  height: number;
  zoom: number;
  panX: number;
  panY: number;
}

const GridLayer = React.memo(({ width, height, zoom, panX, panY }: GridLayerProps) => {
  const spacing = 24;

  const dots = useMemo(() => {
    const startX = Math.floor(-panX / zoom / spacing) * spacing - spacing;
    const startY = Math.floor(-panY / zoom / spacing) * spacing - spacing;
    const endX = startX + (width / zoom) + spacing * 2;
    const endY = startY + (height / zoom) + spacing * 2;

    const result: { x: number; y: number }[] = [];
    for (let x = startX; x < endX; x += spacing) {
      for (let y = startY; y < endY; y += spacing) {
        result.push({ x, y });
      }
    }
    return result;
  }, [width, height, zoom, panX, panY]);

  return (
    <Group listening={false}>
      {dots.map((dot, i) => (
        <Circle
          key={i}
          x={dot.x}
          y={dot.y}
          radius={1}
          fill="#D0D0D0"
          opacity={0.5}
          listening={false}
          perfectDrawEnabled={false}
        />
      ))}
    </Group>
  );
});

GridLayer.displayName = 'GridLayer';

export default GridLayer;
