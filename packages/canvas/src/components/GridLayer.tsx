import { Shape } from 'react-konva';
import React from 'react';

interface GridLayerProps {
  width: number;
  height: number;
  zoom: number;
  panX: number;
  panY: number;
}

const GridLayer = React.memo(({ width, height, zoom, panX, panY }: GridLayerProps) => {
  const spacing = 24;

  return (
    <Shape
      listening={false}
      perfectDrawEnabled={false}
      sceneFunc={(context) => {
        const startX = Math.floor(-panX / zoom / spacing) * spacing - spacing;
        const startY = Math.floor(-panY / zoom / spacing) * spacing - spacing;
        const endX = startX + width / zoom + spacing * 2;
        const endY = startY + height / zoom + spacing * 2;
        const radius = 1;

        context.fillStyle = 'rgba(208, 208, 208, 0.5)';
        context.beginPath();
        for (let x = startX; x < endX; x += spacing) {
          for (let y = startY; y < endY; y += spacing) {
            context.moveTo(x + radius, y);
            context.arc(x, y, radius, 0, Math.PI * 2);
          }
        }
        context.fill();
      }}
    />
  );
});

GridLayer.displayName = 'GridLayer';

export default GridLayer;
