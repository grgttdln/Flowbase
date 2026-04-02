'use client';

import { X, FileText, GitBranch, LayoutGrid, Network, Columns3 } from 'lucide-react';
import type { Element } from '@flowbase/shared';
import { generateId } from '@flowbase/shared';

interface Template {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  elements: () => Element[];
}

/* ─── Helper to create an element with defaults ─── */
const el = (
  overrides: Partial<Element> & Pick<Element, 'type' | 'x' | 'y' | 'width' | 'height'>,
): Element => ({
  id: generateId(),
  rotation: 0,
  fill: 'transparent',
  stroke: '#7c3aed',
  strokeWidth: 2,
  opacity: 1,
  zIndex: 0,
  locked: false,
  ...overrides,
});

/* ─── Arrow helper ─── */
const arrow = (
  fromId: string,
  fromAnchor: 'top' | 'bottom' | 'left' | 'right',
  toId: string,
  toAnchor: 'top' | 'bottom' | 'left' | 'right',
  x: number,
  y: number,
  w: number,
  h: number,
  z: number,
): Element => ({
  id: generateId(),
  type: 'arrow',
  x,
  y,
  width: w,
  height: h,
  rotation: 0,
  fill: 'transparent',
  stroke: '#7c3aed',
  strokeWidth: 2,
  opacity: 1,
  zIndex: z,
  locked: false,
  startBinding: { elementId: fromId, anchor: fromAnchor },
  endBinding: { elementId: toId, anchor: toAnchor },
  autoRoute: true,
});

/* ─── Templates ─── */
const makeFlowchart = (): Element[] => {
  const start = el({ type: 'ellipse', x: 300, y: 80, width: 160, height: 60, fill: '#7c3aed', stroke: '#7c3aed', text: 'Start', fontSize: 16, zIndex: 0 });
  const process1 = el({ type: 'rectangle', x: 300, y: 200, width: 160, height: 70, text: 'Process', fontSize: 16, zIndex: 1 });
  const decision = el({ type: 'diamond', x: 280, y: 330, width: 200, height: 120, text: 'Decision?', fontSize: 16, zIndex: 2 });
  const process2 = el({ type: 'rectangle', x: 300, y: 510, width: 160, height: 70, text: 'Action A', fontSize: 16, zIndex: 3 });
  const process3 = el({ type: 'rectangle', x: 540, y: 355, width: 160, height: 70, text: 'Action B', fontSize: 16, zIndex: 4 });
  const end = el({ type: 'ellipse', x: 300, y: 640, width: 160, height: 60, fill: '#dc2626', stroke: '#dc2626', text: 'End', fontSize: 16, zIndex: 5 });

  return [
    start, process1, decision, process2, process3, end,
    arrow(start.id, 'bottom', process1.id, 'top', 380, 140, 0, 60, 6),
    arrow(process1.id, 'bottom', decision.id, 'top', 380, 270, 0, 60, 7),
    arrow(decision.id, 'bottom', process2.id, 'top', 380, 450, 0, 60, 8),
    arrow(decision.id, 'right', process3.id, 'left', 480, 390, 60, 0, 9),
    arrow(process2.id, 'bottom', end.id, 'top', 380, 580, 0, 60, 10),
  ];
};

const makeMindMap = (): Element[] => {
  const center = el({ type: 'ellipse', x: 280, y: 260, width: 200, height: 80, fill: '#7c3aed', stroke: '#7c3aed', text: 'Main Idea', fontSize: 18, zIndex: 0 });
  const b1 = el({ type: 'rectangle', x: 40, y: 80, width: 150, height: 56, fill: '#f5f3ff', text: 'Topic A', fontSize: 14, zIndex: 1 });
  const b2 = el({ type: 'rectangle', x: 560, y: 80, width: 150, height: 56, fill: '#f5f3ff', text: 'Topic B', fontSize: 14, zIndex: 2 });
  const b3 = el({ type: 'rectangle', x: 40, y: 460, width: 150, height: 56, fill: '#f5f3ff', text: 'Topic C', fontSize: 14, zIndex: 3 });
  const b4 = el({ type: 'rectangle', x: 560, y: 460, width: 150, height: 56, fill: '#f5f3ff', text: 'Topic D', fontSize: 14, zIndex: 4 });

  return [
    center, b1, b2, b3, b4,
    arrow(center.id, 'left', b1.id, 'right', 190, 190, 90, 0, 5),
    arrow(center.id, 'right', b2.id, 'left', 480, 190, 80, 0, 6),
    arrow(center.id, 'left', b3.id, 'right', 190, 400, 90, 0, 7),
    arrow(center.id, 'right', b4.id, 'left', 480, 400, 80, 0, 8),
  ];
};

const makeWireframe = (): Element[] => [
  // Nav bar
  el({ type: 'rectangle', x: 80, y: 60, width: 600, height: 50, stroke: '#8E8E93', fill: '#FAFAF9', zIndex: 0 }),
  el({ type: 'text', x: 100, y: 72, width: 80, height: 26, text: 'Logo', fontSize: 18, stroke: '#1C1917', zIndex: 1 }),
  el({ type: 'rectangle', x: 540, y: 70, width: 60, height: 30, stroke: '#8E8E93', zIndex: 2 }),
  el({ type: 'rectangle', x: 610, y: 70, width: 60, height: 30, stroke: '#8E8E93', zIndex: 3 }),
  // Hero
  el({ type: 'rectangle', x: 80, y: 130, width: 600, height: 200, stroke: '#8E8E93', fill: '#F5F5F4', zIndex: 4 }),
  el({ type: 'text', x: 240, y: 190, width: 280, height: 30, text: 'Hero Section', fontSize: 22, stroke: '#1C1917', zIndex: 5 }),
  el({ type: 'rectangle', x: 300, y: 260, width: 160, height: 40, stroke: '#7c3aed', fill: '#7c3aed', text: 'CTA Button', fontSize: 14, zIndex: 6 }),
  // Content grid
  el({ type: 'rectangle', x: 80, y: 360, width: 185, height: 140, stroke: '#8E8E93', fill: '#FAFAF9', zIndex: 7 }),
  el({ type: 'rectangle', x: 287, y: 360, width: 185, height: 140, stroke: '#8E8E93', fill: '#FAFAF9', zIndex: 8 }),
  el({ type: 'rectangle', x: 495, y: 360, width: 185, height: 140, stroke: '#8E8E93', fill: '#FAFAF9', zIndex: 9 }),
  // Footer
  el({ type: 'rectangle', x: 80, y: 530, width: 600, height: 50, stroke: '#8E8E93', fill: '#FAFAF9', zIndex: 10 }),
];

const makeOrgChart = (): Element[] => {
  const ceo = el({ type: 'rectangle', x: 280, y: 60, width: 180, height: 60, fill: '#7c3aed', stroke: '#7c3aed', text: 'CEO', fontSize: 16, zIndex: 0 });
  const cto = el({ type: 'rectangle', x: 80, y: 200, width: 160, height: 56, text: 'CTO', fontSize: 14, zIndex: 1 });
  const cfo = el({ type: 'rectangle', x: 290, y: 200, width: 160, height: 56, text: 'CFO', fontSize: 14, zIndex: 2 });
  const cmo = el({ type: 'rectangle', x: 500, y: 200, width: 160, height: 56, text: 'CMO', fontSize: 14, zIndex: 3 });
  const dev1 = el({ type: 'rectangle', x: 20, y: 330, width: 130, height: 50, fill: '#f5f3ff', text: 'Engineering', fontSize: 12, zIndex: 4 });
  const dev2 = el({ type: 'rectangle', x: 170, y: 330, width: 130, height: 50, fill: '#f5f3ff', text: 'Product', fontSize: 12, zIndex: 5 });

  return [
    ceo, cto, cfo, cmo, dev1, dev2,
    arrow(ceo.id, 'bottom', cto.id, 'top', 200, 120, 0, 80, 6),
    arrow(ceo.id, 'bottom', cfo.id, 'top', 370, 120, 0, 80, 7),
    arrow(ceo.id, 'bottom', cmo.id, 'top', 530, 120, 0, 80, 8),
    arrow(cto.id, 'bottom', dev1.id, 'top', 100, 256, 0, 74, 9),
    arrow(cto.id, 'bottom', dev2.id, 'top', 230, 256, 0, 74, 10),
  ];
};

const makeKanban = (): Element[] => {
  const cols = ['To Do', 'In Progress', 'Done'];
  const colColors = ['#dc2626', '#d97706', '#16a34a'];
  const elements: Element[] = [];
  let z = 0;

  cols.forEach((title, ci) => {
    const x = 60 + ci * 220;
    // Column header
    elements.push(el({ type: 'rectangle', x, y: 60, width: 190, height: 44, fill: colColors[ci], stroke: colColors[ci], text: title, fontSize: 14, zIndex: z++ }));
    // Cards
    for (let r = 0; r < 3; r++) {
      elements.push(el({ type: 'stickynote', x, y: 120 + r * 80, width: 190, height: 64, text: `Task ${ci * 3 + r + 1}`, fontSize: 13, zIndex: z++ }));
    }
  });

  return elements;
};

const TEMPLATES: Template[] = [
  {
    id: 'blank',
    name: 'Blank canvas',
    description: 'Start from scratch',
    icon: <FileText size={22} strokeWidth={1.5} />,
    elements: () => [],
  },
  {
    id: 'flowchart',
    name: 'Flowchart',
    description: 'Process flow with decisions',
    icon: <GitBranch size={22} strokeWidth={1.5} />,
    elements: makeFlowchart,
  },
  {
    id: 'mindmap',
    name: 'Mind map',
    description: 'Central idea with branches',
    icon: <Network size={22} strokeWidth={1.5} />,
    elements: makeMindMap,
  },
  {
    id: 'wireframe',
    name: 'Wireframe',
    description: 'Basic page layout',
    icon: <LayoutGrid size={22} strokeWidth={1.5} />,
    elements: makeWireframe,
  },
  {
    id: 'orgchart',
    name: 'Org chart',
    description: 'Team hierarchy',
    icon: <Network size={22} strokeWidth={1.5} className="rotate-180" />,
    elements: makeOrgChart,
  },
  {
    id: 'kanban',
    name: 'Kanban board',
    description: 'Task columns with cards',
    icon: <Columns3 size={22} strokeWidth={1.5} />,
    elements: makeKanban,
  },
];

/* ─── Mini canvas preview ─── */
const TemplatePreview = ({ elements }: { elements: Element[] }) => {
  if (elements.length === 0) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="h-8 w-8 rounded-lg border-2 border-dashed border-[#D6D3D1] opacity-40" />
      </div>
    );
  }

  // Calculate bounds for scaling
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const e of elements) {
    minX = Math.min(minX, e.x);
    minY = Math.min(minY, e.y);
    maxX = Math.max(maxX, e.x + e.width);
    maxY = Math.max(maxY, e.y + e.height);
  }
  const bw = maxX - minX;
  const bh = maxY - minY;
  const pad = 16;
  const viewW = 200;
  const viewH = 120;
  const scale = Math.min((viewW - pad * 2) / bw, (viewH - pad * 2) / bh);

  return (
    <svg width="100%" height="100%" viewBox={`0 0 ${viewW} ${viewH}`} className="overflow-visible">
      <g transform={`translate(${(viewW - bw * scale) / 2}, ${(viewH - bh * scale) / 2}) scale(${scale})`}>
        {elements.map((e) => {
          const rx = e.x - minX;
          const ry = e.y - minY;
          const fill = e.fill === 'transparent' ? 'none' : e.fill;
          const stroke = e.stroke || '#7c3aed';

          if (e.type === 'ellipse') {
            return (
              <ellipse
                key={e.id}
                cx={rx + e.width / 2}
                cy={ry + e.height / 2}
                rx={e.width / 2}
                ry={e.height / 2}
                fill={fill}
                stroke={stroke}
                strokeWidth={2 / scale}
                opacity={0.7}
              />
            );
          }
          if (e.type === 'diamond') {
            const cx = rx + e.width / 2;
            const cy = ry + e.height / 2;
            return (
              <polygon
                key={e.id}
                points={`${cx},${ry} ${rx + e.width},${cy} ${cx},${ry + e.height} ${rx},${cy}`}
                fill={fill}
                stroke={stroke}
                strokeWidth={2 / scale}
                opacity={0.7}
              />
            );
          }
          if (e.type === 'arrow' || e.type === 'line') {
            return (
              <line
                key={e.id}
                x1={rx}
                y1={ry}
                x2={rx + e.width}
                y2={ry + e.height}
                stroke={stroke}
                strokeWidth={1.5 / scale}
                opacity={0.5}
              />
            );
          }
          // Rectangle, stickynote, text, etc.
          return (
            <rect
              key={e.id}
              x={rx}
              y={ry}
              width={e.width}
              height={e.height}
              rx={e.type === 'stickynote' ? 4 : 2}
              fill={fill}
              stroke={stroke}
              strokeWidth={2 / scale}
              opacity={0.7}
            />
          );
        })}
      </g>
    </svg>
  );
};

/* ─── Dialog ─── */
interface TemplateDialogProps {
  open: boolean;
  onClose: () => void;
  onSelect: (name: string, elements: Element[]) => void;
}

const TemplateDialog = ({ open, onClose, onSelect }: TemplateDialogProps) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20" onClick={onClose}>
      <div
        className="w-[640px] max-h-[85vh] overflow-hidden rounded-2xl bg-white shadow-[0_8px_30px_rgba(0,0,0,0.15)] animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Choose a template"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#F0EFED] px-6 py-4">
          <div>
            <h2 className="text-[16px] font-semibold text-[#1C1917]">New project</h2>
            <p className="mt-0.5 text-[13px] text-[#78716C]">Choose a template to get started</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-[#A8A29E] transition-colors hover:bg-black/[0.04] hover:text-[#57534E]"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Template grid */}
        <div className="overflow-y-auto p-6">
          <div className="grid grid-cols-3 gap-3">
            {TEMPLATES.map((t) => {
              const previewElements = t.elements();
              return (
                <button
                  key={t.id}
                  onClick={() => onSelect(t.id === 'blank' ? 'Untitled' : t.name, previewElements)}
                  className="group flex cursor-pointer flex-col overflow-hidden rounded-xl ring-1 ring-black/[0.06] transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:ring-[#7c3aed]/40 hover:shadow-[0_4px_20px_rgba(124,58,237,0.1)] active:scale-[0.98]"
                >
                  {/* Preview area */}
                  <div className="flex h-[100px] items-center justify-center bg-[#FAFAF9] transition-colors duration-300 group-hover:bg-[#f5f3ff]/60">
                    <TemplatePreview elements={previewElements} />
                  </div>
                  {/* Label */}
                  <div className="flex items-start gap-2.5 border-t border-black/[0.04] px-3.5 py-3">
                    <span className="mt-0.5 flex-shrink-0 text-[#78716C] transition-colors duration-300 group-hover:text-[#7c3aed]">
                      {t.icon}
                    </span>
                    <div className="text-left">
                      <p className="text-[13px] font-medium text-[#1C1917]">{t.name}</p>
                      <p className="text-[11px] text-[#A8A29E]">{t.description}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TemplateDialog;
