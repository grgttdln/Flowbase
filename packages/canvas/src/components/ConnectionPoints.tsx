import { Circle } from 'react-konva';
import type { Element } from '@flowbase/shared';
import { getAnchorPoints } from '../utils/connectors';

interface ConnectionPointsProps {
  elements: Element[];
  /** Only show for shapes near this position */
  nearX?: number;
  nearY?: number;
  /** Max distance to show connection points */
  threshold?: number;
  /** Currently snapped anchor — highlight it differently */
  snappedAnchor?: { elementId: string; anchor: string } | null;
}

const ConnectionPoints = ({
  elements,
  nearX,
  nearY,
  threshold = 80,
  snappedAnchor,
}: ConnectionPointsProps) => {
  const connectableTypes = new Set(['rectangle', 'ellipse', 'diamond', 'text']);

  const nearbyElements = elements.filter((el) => {
    if (!connectableTypes.has(el.type)) return false;
    if (nearX == null || nearY == null) return false;
    const cx = el.x + el.width / 2;
    const cy = el.y + el.height / 2;
    return Math.hypot(cx - nearX, cy - nearY) < threshold + Math.max(el.width, el.height) / 2;
  });

  return (
    <>
      {nearbyElements.map((el) =>
        getAnchorPoints(el).map((anchor) => {
          const isSnapped =
            snappedAnchor?.elementId === anchor.elementId &&
            snappedAnchor?.anchor === anchor.anchor;
          return (
            <Circle
              key={`${anchor.elementId}-${anchor.anchor}`}
              x={anchor.x}
              y={anchor.y}
              radius={isSnapped ? 5 : 4}
              fill={isSnapped ? '#007AFF' : 'white'}
              stroke="#007AFF"
              strokeWidth={isSnapped ? 2 : 1.5}
              listening={false}
            />
          );
        }),
      )}
    </>
  );
};

export default ConnectionPoints;
