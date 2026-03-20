import { Rect } from 'react-konva';

interface SelectionBoxProps {
  visible: boolean;
  x: number;
  y: number;
  width: number;
  height: number;
}

const SelectionBox = ({ visible, x, y, width, height }: SelectionBoxProps) => {
  if (!visible) return null;

  return (
    <Rect
      x={x}
      y={y}
      width={width}
      height={height}
      fill="rgba(0, 122, 255, 0.08)"
      stroke="#007AFF"
      strokeWidth={1}
      dash={[4, 4]}
      listening={false}
    />
  );
};

export default SelectionBox;
