import { useRef, useEffect, useCallback } from 'react';
import { Line } from 'react-konva';
import type Konva from 'konva';

export interface LaserTrail {
  id: number;
  points: number[];
  createdAt: number;
}

const TRAIL_LIFETIME = 1000; // total ms before fully gone
const FADE_START = 200; // ms of full opacity before fading

interface LaserLayerProps {
  trails: LaserTrail[];
  onCleanup: (expiredIds: number[]) => void;
}

const LaserLayer = ({ trails, onCleanup }: LaserLayerProps) => {
  const lineRefs = useRef<Map<number, Konva.Line>>(new Map());
  const rafRef = useRef<number>(0);

  const animate = useCallback(() => {
    const now = performance.now();
    const expired: number[] = [];

    lineRefs.current.forEach((line, id) => {
      const trail = trails.find((t) => t.id === id);
      if (!trail) return;

      const age = now - trail.createdAt;
      if (age > TRAIL_LIFETIME) {
        expired.push(id);
        return;
      }

      if (age > FADE_START) {
        const fadeProgress = (age - FADE_START) / (TRAIL_LIFETIME - FADE_START);
        line.opacity(1 - fadeProgress);
      } else {
        line.opacity(1);
      }
    });

    if (expired.length > 0) {
      onCleanup(expired);
    }

    if (trails.length > 0) {
      rafRef.current = requestAnimationFrame(animate);
    }
  }, [trails, onCleanup]);

  useEffect(() => {
    if (trails.length > 0) {
      rafRef.current = requestAnimationFrame(animate);
    }
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [trails.length > 0, animate]);

  const setRef = useCallback((id: number) => (node: Konva.Line | null) => {
    if (node) {
      lineRefs.current.set(id, node);
    } else {
      lineRefs.current.delete(id);
    }
  }, []);

  return (
    <>
      {trails.map((trail) => (
        <Line
          key={trail.id}
          ref={setRef(trail.id)}
          points={trail.points}
          stroke="#e53e3e"
          strokeWidth={3}
          tension={0.3}
          lineCap="round"
          lineJoin="round"
          globalCompositeOperation="source-over"
          listening={false}
          shadowColor="#e53e3e"
          shadowBlur={8}
          shadowOpacity={0.6}
        />
      ))}
    </>
  );
};

export default LaserLayer;
