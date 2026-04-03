'use client';

import { X, FileText, GitBranch, LayoutGrid, Network, Columns3, Target, Map, Brain } from 'lucide-react';
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
  const cx = 260;
  const w = 180;
  const h = 60;

  const start = el({ type: 'ellipse', x: cx, y: 60, width: w, height: h, fill: '#7c3aed', stroke: '#7c3aed', text: 'Start', fontSize: 16, zIndex: 0 });
  const input = el({ type: 'rectangle', x: cx, y: 170, width: w, height: h, fill: '#f5f3ff', text: 'Receive request', fontSize: 14, zIndex: 1 });
  const validate = el({ type: 'rectangle', x: cx, y: 280, width: w, height: h, fill: '#f5f3ff', text: 'Validate input', fontSize: 14, zIndex: 2 });
  const decision = el({ type: 'diamond', x: cx - 20, y: 390, width: 220, height: 120, text: 'Valid?', fontSize: 16, zIndex: 3 });
  const process = el({ type: 'rectangle', x: cx, y: 560, width: w, height: h, fill: '#f0fdf4', stroke: '#16a34a', text: 'Process data', fontSize: 14, zIndex: 4 });
  const error = el({ type: 'rectangle', x: cx + 290, y: 420, width: w, height: h, fill: '#fef2f2', stroke: '#dc2626', text: 'Return error', fontSize: 14, zIndex: 5 });
  const respond = el({ type: 'rectangle', x: cx, y: 670, width: w, height: h, fill: '#f5f3ff', text: 'Send response', fontSize: 14, zIndex: 6 });
  const end = el({ type: 'ellipse', x: cx, y: 780, width: w, height: h, fill: '#18181b', stroke: '#18181b', text: 'End', fontSize: 16, zIndex: 7 });

  const yesLabel = el({ type: 'text', x: cx + 55, y: 520, width: 40, height: 18, text: 'Yes', fontSize: 12, stroke: '#16a34a', zIndex: 16 });
  const noLabel = el({ type: 'text', x: cx + 210, y: 435, width: 30, height: 18, text: 'No', fontSize: 12, stroke: '#dc2626', zIndex: 17 });

  let z = 8;
  return [
    start, input, validate, decision, process, error, respond, end, yesLabel, noLabel,
    arrow(start.id, 'bottom', input.id, 'top', cx + 90, 120, 0, 50, z++),
    arrow(input.id, 'bottom', validate.id, 'top', cx + 90, 230, 0, 50, z++),
    arrow(validate.id, 'bottom', decision.id, 'top', cx + 90, 340, 0, 50, z++),
    arrow(decision.id, 'bottom', process.id, 'top', cx + 90, 510, 0, 50, z++),
    arrow(decision.id, 'right', error.id, 'left', cx + 200, 450, 90, 0, z++),
    arrow(process.id, 'bottom', respond.id, 'top', cx + 90, 620, 0, 50, z++),
    arrow(respond.id, 'bottom', end.id, 'top', cx + 90, 740, 0, 40, z++),
  ];
};

const makeMindMap = (): Element[] => {
  // Center hub — all branches radiate from this
  const center = el({ type: 'ellipse', x: 320, y: 270, width: 200, height: 80, fill: '#7c3aed', stroke: '#7c3aed', text: 'Project Plan', fontSize: 18, zIndex: 0 });

  // Dimensions
  const bw = 150; const bh = 50;
  const sw = 110; const sh = 38;
  const subGap = 16;

  // Left branch center x = 145, sub-branch total = 110+16+110 = 236, starts at 145-118 = 27
  const lx = 70; // branch x
  const lsx1 = 27; const lsx2 = 27 + sw + subGap; // sub-branch x positions

  // Right branch center x = 675, sub-branches centered similarly
  const rx = 600; // branch x
  const rsx1 = 600 + (bw / 2) - sw - (subGap / 2); // = 557
  const rsx2 = rsx1 + sw + subGap; // = 683

  // ── Left branches ──
  const research = el({ type: 'rectangle', x: lx, y: 180, width: bw, height: bh, fill: '#eff6ff', stroke: '#3b82f6', text: 'Research', fontSize: 14, zIndex: 1 });
  const r1 = el({ type: 'rectangle', x: lsx1, y: 80, width: sw, height: sh, fill: '#f0f7ff', stroke: '#93c5fd', text: 'User interviews', fontSize: 11, zIndex: 2 });
  const r2 = el({ type: 'rectangle', x: lsx2, y: 80, width: sw, height: sh, fill: '#f0f7ff', stroke: '#93c5fd', text: 'Market analysis', fontSize: 11, zIndex: 3 });

  const dev = el({ type: 'rectangle', x: lx, y: 400, width: bw, height: bh, fill: '#fef3c7', stroke: '#d97706', text: 'Development', fontSize: 14, zIndex: 4 });
  const d1 = el({ type: 'rectangle', x: lsx1, y: 510, width: sw, height: sh, fill: '#fffbeb', stroke: '#fbbf24', text: 'Frontend', fontSize: 11, zIndex: 5 });
  const d2 = el({ type: 'rectangle', x: lsx2, y: 510, width: sw, height: sh, fill: '#fffbeb', stroke: '#fbbf24', text: 'Backend', fontSize: 11, zIndex: 6 });

  // ── Right branches ──
  const design = el({ type: 'rectangle', x: rx, y: 180, width: bw, height: bh, fill: '#f0fdf4', stroke: '#16a34a', text: 'Design', fontSize: 14, zIndex: 7 });
  const ds1 = el({ type: 'rectangle', x: rsx1, y: 80, width: sw, height: sh, fill: '#f0fdf8', stroke: '#86efac', text: 'Wireframes', fontSize: 11, zIndex: 8 });
  const ds2 = el({ type: 'rectangle', x: rsx2, y: 80, width: sw, height: sh, fill: '#f0fdf8', stroke: '#86efac', text: 'Prototypes', fontSize: 11, zIndex: 9 });

  const launch = el({ type: 'rectangle', x: rx, y: 400, width: bw, height: bh, fill: '#fce7f3', stroke: '#e11d48', text: 'Launch', fontSize: 14, zIndex: 10 });
  const l1 = el({ type: 'rectangle', x: rsx1, y: 510, width: sw, height: sh, fill: '#fff1f2', stroke: '#fda4af', text: 'Beta testing', fontSize: 11, zIndex: 11 });
  const l2 = el({ type: 'rectangle', x: rsx2, y: 510, width: sw, height: sh, fill: '#fff1f2', stroke: '#fda4af', text: 'Go-to-market', fontSize: 11, zIndex: 12 });

  let z = 13;
  return [
    center,
    research, r1, r2,
    dev, d1, d2,
    design, ds1, ds2,
    launch, l1, l2,
    // Center → branches
    arrow(center.id, 'left', research.id, 'right', 220, 250, 100, 0, z++),
    arrow(center.id, 'left', dev.id, 'right', 220, 400, 100, 0, z++),
    arrow(center.id, 'right', design.id, 'left', 520, 250, 80, 0, z++),
    arrow(center.id, 'right', launch.id, 'left', 520, 400, 80, 0, z++),
    // Branch → sub-branches (>60px gap for clean auto-routing)
    arrow(research.id, 'top', r1.id, 'bottom', lsx1 + sw / 2, 118, 0, 62, z++),
    arrow(research.id, 'top', r2.id, 'bottom', lsx2 + sw / 2, 118, 0, 62, z++),
    arrow(dev.id, 'bottom', d1.id, 'top', lsx1 + sw / 2, 450, 0, 60, z++),
    arrow(dev.id, 'bottom', d2.id, 'top', lsx2 + sw / 2, 450, 0, 60, z++),
    arrow(design.id, 'top', ds1.id, 'bottom', rsx1 + sw / 2, 118, 0, 62, z++),
    arrow(design.id, 'top', ds2.id, 'bottom', rsx2 + sw / 2, 118, 0, 62, z++),
    arrow(launch.id, 'bottom', l1.id, 'top', rsx1 + sw / 2, 450, 0, 60, z++),
    arrow(launch.id, 'bottom', l2.id, 'top', rsx2 + sw / 2, 450, 0, 60, z++),
  ];
};

const makeWireframe = (): Element[] => [
  // Nav bar
  el({ type: 'rectangle', x: 80, y: 60, width: 640, height: 50, stroke: '#d4d4d8', fill: '#ffffff', zIndex: 0 }),
  el({ type: 'text', x: 100, y: 72, width: 80, height: 26, text: 'Logo', fontSize: 18, stroke: '#18181b', zIndex: 1 }),
  el({ type: 'text', x: 350, y: 76, width: 50, height: 20, text: 'Home', fontSize: 12, stroke: '#71717a', zIndex: 2 }),
  el({ type: 'text', x: 420, y: 76, width: 60, height: 20, text: 'About', fontSize: 12, stroke: '#71717a', zIndex: 3 }),
  el({ type: 'text', x: 500, y: 76, width: 70, height: 20, text: 'Pricing', fontSize: 12, stroke: '#71717a', zIndex: 4 }),
  el({ type: 'rectangle', x: 610, y: 70, width: 90, height: 32, stroke: '#7c3aed', fill: '#7c3aed', text: 'Sign up', fontSize: 12, zIndex: 5 }),

  // Hero section
  el({ type: 'rectangle', x: 80, y: 130, width: 640, height: 220, stroke: '#e4e4e7', fill: '#fafafa', zIndex: 6 }),
  el({ type: 'text', x: 180, y: 170, width: 440, height: 36, text: 'Build something amazing', fontSize: 28, stroke: '#18181b', zIndex: 7 }),
  el({ type: 'text', x: 220, y: 216, width: 360, height: 20, text: 'A short description of your product goes here.', fontSize: 13, stroke: '#71717a', zIndex: 8 }),
  el({ type: 'rectangle', x: 320, y: 260, width: 160, height: 44, stroke: '#7c3aed', fill: '#7c3aed', text: 'Get started', fontSize: 14, zIndex: 9 }),

  // Features section label
  el({ type: 'text', x: 340, y: 380, width: 120, height: 24, text: 'Features', fontSize: 18, stroke: '#18181b', zIndex: 10 }),

  // Feature cards
  el({ type: 'rectangle', x: 80, y: 420, width: 195, height: 130, stroke: '#e4e4e7', fill: '#ffffff', zIndex: 11 }),
  el({ type: 'ellipse', x: 100, y: 440, width: 32, height: 32, fill: '#f5f3ff', stroke: '#7c3aed', zIndex: 12 }),
  el({ type: 'text', x: 100, y: 486, width: 155, height: 20, text: 'Feature one', fontSize: 14, stroke: '#18181b', zIndex: 13 }),
  el({ type: 'text', x: 100, y: 510, width: 155, height: 20, text: 'Short description', fontSize: 11, stroke: '#a1a1aa', zIndex: 14 }),

  el({ type: 'rectangle', x: 302, y: 420, width: 195, height: 130, stroke: '#e4e4e7', fill: '#ffffff', zIndex: 15 }),
  el({ type: 'ellipse', x: 322, y: 440, width: 32, height: 32, fill: '#f0fdf4', stroke: '#16a34a', zIndex: 16 }),
  el({ type: 'text', x: 322, y: 486, width: 155, height: 20, text: 'Feature two', fontSize: 14, stroke: '#18181b', zIndex: 17 }),
  el({ type: 'text', x: 322, y: 510, width: 155, height: 20, text: 'Short description', fontSize: 11, stroke: '#a1a1aa', zIndex: 18 }),

  el({ type: 'rectangle', x: 525, y: 420, width: 195, height: 130, stroke: '#e4e4e7', fill: '#ffffff', zIndex: 19 }),
  el({ type: 'ellipse', x: 545, y: 440, width: 32, height: 32, fill: '#fef3c7', stroke: '#d97706', zIndex: 20 }),
  el({ type: 'text', x: 545, y: 486, width: 155, height: 20, text: 'Feature three', fontSize: 14, stroke: '#18181b', zIndex: 21 }),
  el({ type: 'text', x: 545, y: 510, width: 155, height: 20, text: 'Short description', fontSize: 11, stroke: '#a1a1aa', zIndex: 22 }),

  // Footer
  el({ type: 'rectangle', x: 80, y: 590, width: 640, height: 50, stroke: '#e4e4e7', fill: '#fafafa', zIndex: 23 }),
  el({ type: 'text', x: 100, y: 602, width: 200, height: 20, text: 'Logo', fontSize: 14, stroke: '#18181b', zIndex: 24 }),
  el({ type: 'text', x: 530, y: 604, width: 180, height: 20, text: '\u00A9 2026 Company Inc.', fontSize: 11, stroke: '#a1a1aa', zIndex: 25 }),
];

const makeOrgChart = (): Element[] => {
  // Symmetrical layout centered at x ≈ 390
  const topW = 200; const topH = 64;
  const midW = 160; const midH = 54;
  const botW = 130; const botH = 44;

  // ── Level 1: CEO ──
  const ceo = el({ type: 'rectangle', x: 290, y: 50, width: topW, height: topH, fill: '#7c3aed', stroke: '#7c3aed', text: 'CEO', fontSize: 16, zIndex: 0 });

  // ── Level 2: VPs (evenly spaced) ──
  const vp1x = 60;   // VP Engineering
  const vp2x = 310;  // VP Finance
  const vp3x = 560;  // VP Marketing
  const vpY = 190;

  const vpEng = el({ type: 'rectangle', x: vp1x, y: vpY, width: midW, height: midH, fill: '#eff6ff', stroke: '#3b82f6', text: 'VP Engineering', fontSize: 13, zIndex: 1 });
  const vpFin = el({ type: 'rectangle', x: vp2x, y: vpY, width: midW, height: midH, fill: '#f0fdf4', stroke: '#16a34a', text: 'VP Finance', fontSize: 13, zIndex: 2 });
  const vpMkt = el({ type: 'rectangle', x: vp3x, y: vpY, width: midW, height: midH, fill: '#fef3c7', stroke: '#d97706', text: 'VP Marketing', fontSize: 13, zIndex: 3 });

  // ── Level 3: Teams (2 per VP, centered under parent) ──
  const teamY = 320;
  const teamGap = 16;
  const teamOffL = (midW - botW * 2 - teamGap) / 2; // offset to center 2 boxes under parent

  const eng = el({ type: 'rectangle', x: vp1x + teamOffL, y: teamY, width: botW, height: botH, fill: '#f0f7ff', stroke: '#93c5fd', text: 'Engineering', fontSize: 12, zIndex: 4 });
  const product = el({ type: 'rectangle', x: vp1x + teamOffL + botW + teamGap, y: teamY, width: botW, height: botH, fill: '#f0f7ff', stroke: '#93c5fd', text: 'Product', fontSize: 12, zIndex: 5 });

  const finance = el({ type: 'rectangle', x: vp2x + teamOffL, y: teamY, width: botW, height: botH, fill: '#f0fdf8', stroke: '#86efac', text: 'Accounting', fontSize: 12, zIndex: 6 });
  const ops = el({ type: 'rectangle', x: vp2x + teamOffL + botW + teamGap, y: teamY, width: botW, height: botH, fill: '#f0fdf8', stroke: '#86efac', text: 'Operations', fontSize: 12, zIndex: 7 });

  const mktg = el({ type: 'rectangle', x: vp3x + teamOffL, y: teamY, width: botW, height: botH, fill: '#fffbeb', stroke: '#fbbf24', text: 'Marketing', fontSize: 12, zIndex: 8 });
  const sales = el({ type: 'rectangle', x: vp3x + teamOffL + botW + teamGap, y: teamY, width: botW, height: botH, fill: '#fffbeb', stroke: '#fbbf24', text: 'Sales', fontSize: 12, zIndex: 9 });

  // ── Level 4: Individual roles (under Engineering & Marketing) ──
  const roleY = 430;
  const roleW = 110; const roleH = 38;

  const fe = el({ type: 'rectangle', x: vp1x + teamOffL - 10, y: roleY, width: roleW, height: roleH, fill: '#f8fafc', stroke: '#bfdbfe', text: 'Frontend', fontSize: 11, zIndex: 10 });
  const be = el({ type: 'rectangle', x: vp1x + teamOffL + roleW + 6, y: roleY, width: roleW, height: roleH, fill: '#f8fafc', stroke: '#bfdbfe', text: 'Backend', fontSize: 11, zIndex: 11 });

  const content = el({ type: 'rectangle', x: vp3x + teamOffL - 10, y: roleY, width: roleW, height: roleH, fill: '#fefce8', stroke: '#fde68a', text: 'Content', fontSize: 11, zIndex: 12 });
  const growth = el({ type: 'rectangle', x: vp3x + teamOffL + roleW + 6, y: roleY, width: roleW, height: roleH, fill: '#fefce8', stroke: '#fde68a', text: 'Growth', fontSize: 11, zIndex: 13 });

  let z = 14;
  return [
    ceo, vpEng, vpFin, vpMkt,
    eng, product, finance, ops, mktg, sales,
    fe, be, content, growth,
    // CEO → VPs
    arrow(ceo.id, 'bottom', vpEng.id, 'top', vp1x + midW / 2, topH + 50, 0, 76, z++),
    arrow(ceo.id, 'bottom', vpFin.id, 'top', vp2x + midW / 2, topH + 50, 0, 76, z++),
    arrow(ceo.id, 'bottom', vpMkt.id, 'top', vp3x + midW / 2, topH + 50, 0, 76, z++),
    // VPs → Teams
    arrow(vpEng.id, 'bottom', eng.id, 'top', eng.x + botW / 2, vpY + midH, 0, 76, z++),
    arrow(vpEng.id, 'bottom', product.id, 'top', product.x + botW / 2, vpY + midH, 0, 76, z++),
    arrow(vpFin.id, 'bottom', finance.id, 'top', finance.x + botW / 2, vpY + midH, 0, 76, z++),
    arrow(vpFin.id, 'bottom', ops.id, 'top', ops.x + botW / 2, vpY + midH, 0, 76, z++),
    arrow(vpMkt.id, 'bottom', mktg.id, 'top', mktg.x + botW / 2, vpY + midH, 0, 76, z++),
    arrow(vpMkt.id, 'bottom', sales.id, 'top', sales.x + botW / 2, vpY + midH, 0, 76, z++),
    // Teams → Roles
    arrow(eng.id, 'bottom', fe.id, 'top', fe.x + roleW / 2, teamY + botH, 0, 42, z++),
    arrow(eng.id, 'bottom', be.id, 'top', be.x + roleW / 2, teamY + botH, 0, 42, z++),
    arrow(mktg.id, 'bottom', content.id, 'top', content.x + roleW / 2, teamY + botH, 0, 42, z++),
    arrow(mktg.id, 'bottom', growth.id, 'top', growth.x + roleW / 2, teamY + botH, 0, 42, z++),
  ];
};

const makeKanban = (): Element[] => {
  const taskNames = [
    ['Set up CI/CD', 'Design login page', 'Write API docs'],
    ['Build auth flow', 'Code review #42', 'Fix nav bug'],
    ['Deploy v1.2', 'Update README', 'Onboard new dev'],
  ];
  const cols = ['To Do', 'In Progress', 'Done'];
  const colColors = ['#dc2626', '#d97706', '#16a34a'];
  const colBg = ['#fef2f2', '#fffbeb', '#f0fdf4'];
  const elements: Element[] = [];
  let z = 0;

  cols.forEach((title, ci) => {
    const x = 60 + ci * 230;
    // Column background
    elements.push(el({ type: 'rectangle', x: x - 5, y: 50, width: 210, height: 370, fill: '#fafafa', stroke: '#e4e4e7', strokeWidth: 1, zIndex: z++ }));
    // Column header
    elements.push(el({ type: 'rectangle', x, y: 60, width: 200, height: 44, fill: colColors[ci], stroke: colColors[ci], text: title, fontSize: 14, zIndex: z++ }));
    // Cards
    for (let r = 0; r < 3; r++) {
      elements.push(el({ type: 'stickynote', x, y: 120 + r * 90, width: 200, height: 72, fill: colBg[ci], stroke: colColors[ci], text: taskNames[ci][r], fontSize: 13, zIndex: z++ }));
    }
  });

  return elements;
};

const makeSWOT = (): Element[] => {
  // Title
  const title = el({ type: 'text', x: 240, y: 30, width: 300, height: 30, text: 'SWOT Analysis', fontSize: 24, stroke: '#18181b', zIndex: 0 });

  // Quadrants
  const strengths = el({ type: 'rectangle', x: 60, y: 80, width: 320, height: 220, fill: '#f0fdf4', stroke: '#16a34a', text: 'Strengths', fontSize: 18, zIndex: 1 });
  const weaknesses = el({ type: 'rectangle', x: 400, y: 80, width: 320, height: 220, fill: '#fef2f2', stroke: '#dc2626', text: 'Weaknesses', fontSize: 18, zIndex: 2 });
  const opportunities = el({ type: 'rectangle', x: 60, y: 320, width: 320, height: 220, fill: '#eff6ff', stroke: '#3b82f6', text: 'Opportunities', fontSize: 18, zIndex: 3 });
  const threats = el({ type: 'rectangle', x: 400, y: 320, width: 320, height: 220, fill: '#fef3c7', stroke: '#d97706', text: 'Threats', fontSize: 18, zIndex: 4 });

  // Sticky notes in each quadrant
  const s1 = el({ type: 'stickynote', x: 80, y: 140, width: 130, height: 50, fill: '#dcfce7', stroke: '#16a34a', text: 'Strong brand', fontSize: 11, zIndex: 5 });
  const s2 = el({ type: 'stickynote', x: 225, y: 140, width: 130, height: 50, fill: '#dcfce7', stroke: '#16a34a', text: 'Skilled team', fontSize: 11, zIndex: 6 });
  const s3 = el({ type: 'stickynote', x: 80, y: 210, width: 130, height: 50, fill: '#dcfce7', stroke: '#16a34a', text: 'Low costs', fontSize: 11, zIndex: 7 });

  const w1 = el({ type: 'stickynote', x: 420, y: 140, width: 130, height: 50, fill: '#fee2e2', stroke: '#dc2626', text: 'Small market share', fontSize: 11, zIndex: 8 });
  const w2 = el({ type: 'stickynote', x: 565, y: 140, width: 130, height: 50, fill: '#fee2e2', stroke: '#dc2626', text: 'Limited funding', fontSize: 11, zIndex: 9 });

  const o1 = el({ type: 'stickynote', x: 80, y: 380, width: 130, height: 50, fill: '#dbeafe', stroke: '#3b82f6', text: 'New markets', fontSize: 11, zIndex: 10 });
  const o2 = el({ type: 'stickynote', x: 225, y: 380, width: 130, height: 50, fill: '#dbeafe', stroke: '#3b82f6', text: 'Partnerships', fontSize: 11, zIndex: 11 });

  const t1 = el({ type: 'stickynote', x: 420, y: 380, width: 130, height: 50, fill: '#fef9c3', stroke: '#d97706', text: 'Competitors', fontSize: 11, zIndex: 12 });
  const t2 = el({ type: 'stickynote', x: 565, y: 380, width: 130, height: 50, fill: '#fef9c3', stroke: '#d97706', text: 'Regulation', fontSize: 11, zIndex: 13 });

  return [title, strengths, weaknesses, opportunities, threats, s1, s2, s3, w1, w2, o1, o2, t1, t2];
};

const makeUserJourney = (): Element[] => {
  const phases = ['Awareness', 'Consideration', 'Purchase', 'Onboarding', 'Retention'];
  const phaseColors = ['#7c3aed', '#3b82f6', '#16a34a', '#d97706', '#e11d48'];
  const phaseBg = ['#f5f3ff', '#eff6ff', '#f0fdf4', '#fffbeb', '#fff1f2'];
  const actions = [
    'Sees social ad',
    'Reads blog post',
    'Starts free trial',
    'Completes setup',
    'Invites team',
  ];
  const emotions = [
    'Curious',
    'Interested',
    'Excited',
    'Focused',
    'Satisfied',
  ];

  const elements: Element[] = [];
  let z = 0;

  // Title
  elements.push(el({ type: 'text', x: 220, y: 30, width: 400, height: 30, text: 'User Journey Map', fontSize: 24, stroke: '#18181b', zIndex: z++ }));

  // Row labels
  elements.push(el({ type: 'text', x: 10, y: 92, width: 80, height: 20, text: 'Phase', fontSize: 13, stroke: '#71717a', zIndex: z++ }));
  elements.push(el({ type: 'text', x: 10, y: 172, width: 80, height: 20, text: 'Action', fontSize: 13, stroke: '#71717a', zIndex: z++ }));
  elements.push(el({ type: 'text', x: 10, y: 272, width: 80, height: 20, text: 'Emotion', fontSize: 13, stroke: '#71717a', zIndex: z++ }));

  const phaseEls: Element[] = [];

  phases.forEach((phase, i) => {
    const x = 100 + i * 160;

    // Phase header
    const phaseEl = el({ type: 'rectangle', x, y: 80, width: 140, height: 44, fill: phaseColors[i], stroke: phaseColors[i], text: phase, fontSize: 13, zIndex: z++ });
    phaseEls.push(phaseEl);
    elements.push(phaseEl);

    // Action card
    elements.push(el({ type: 'stickynote', x, y: 150, width: 140, height: 56, fill: phaseBg[i], stroke: phaseColors[i], text: actions[i], fontSize: 11, zIndex: z++ }));

    // Emotion
    elements.push(el({ type: 'ellipse', x: x + 25, y: 250, width: 90, height: 40, fill: phaseBg[i], stroke: phaseColors[i], text: emotions[i], fontSize: 11, zIndex: z++ }));
  });

  // Arrows between phases
  for (let i = 0; i < phaseEls.length - 1; i++) {
    elements.push(arrow(phaseEls[i].id, 'right', phaseEls[i + 1].id, 'left', phaseEls[i].x + 140, 102, 20, 0, z++));
  }

  return elements;
};

const makeRetro = (): Element[] => {
  const elements: Element[] = [];
  let z = 0;

  // Title
  elements.push(el({ type: 'text', x: 200, y: 30, width: 400, height: 30, text: 'Sprint Retrospective', fontSize: 24, stroke: '#18181b', zIndex: z++ }));

  // Three columns
  const cols = [
    { title: 'What went well', color: '#16a34a', bg: '#f0fdf4', noteBg: '#dcfce7', notes: ['Shipped on time', 'Great teamwork', 'Clean PR reviews'] },
    { title: 'What to improve', color: '#d97706', bg: '#fffbeb', noteBg: '#fef9c3', notes: ['Too many meetings', 'Unclear specs', 'Slow CI pipeline'] },
    { title: 'Action items', color: '#3b82f6', bg: '#eff6ff', noteBg: '#dbeafe', notes: ['Limit meetings to 30m', 'Write specs before sprint', 'Upgrade CI runners'] },
  ];

  cols.forEach((col, ci) => {
    const x = 40 + ci * 250;
    // Column bg
    elements.push(el({ type: 'rectangle', x, y: 80, width: 230, height: 420, fill: col.bg, stroke: col.color, strokeWidth: 1, zIndex: z++ }));
    // Column header
    elements.push(el({ type: 'rectangle', x: x + 10, y: 90, width: 210, height: 44, fill: col.color, stroke: col.color, text: col.title, fontSize: 14, zIndex: z++ }));
    // Notes
    col.notes.forEach((note, ni) => {
      elements.push(el({ type: 'stickynote', x: x + 15, y: 150 + ni * 100, width: 200, height: 72, fill: col.noteBg, stroke: col.color, text: note, fontSize: 12, zIndex: z++ }));
    });
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
    description: 'Central idea with sub-branches',
    icon: <Brain size={22} strokeWidth={1.5} />,
    elements: makeMindMap,
  },
  {
    id: 'wireframe',
    name: 'Wireframe',
    description: 'Landing page layout',
    icon: <LayoutGrid size={22} strokeWidth={1.5} />,
    elements: makeWireframe,
  },
  {
    id: 'orgchart',
    name: 'Org chart',
    description: 'Team hierarchy with departments',
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
  {
    id: 'swot',
    name: 'SWOT analysis',
    description: 'Strengths, weaknesses & more',
    icon: <Target size={22} strokeWidth={1.5} />,
    elements: makeSWOT,
  },
  {
    id: 'journey',
    name: 'User journey',
    description: 'Map the customer experience',
    icon: <Map size={22} strokeWidth={1.5} />,
    elements: makeUserJourney,
  },
  {
    id: 'retro',
    name: 'Retrospective',
    description: 'Sprint review with action items',
    icon: <GitBranch size={22} strokeWidth={1.5} className="rotate-90" />,
    elements: makeRetro,
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
        className="w-[720px] max-h-[85vh] overflow-hidden rounded-2xl bg-white shadow-[0_8px_30px_rgba(0,0,0,0.15)] animate-in fade-in zoom-in-95 duration-200"
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
