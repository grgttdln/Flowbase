/** Custom SVG cursors encoded as data URIs for canvas tools. */

const svgCursor = (svg: string, hotX: number, hotY: number, fallback = 'crosshair') =>
  `url("data:image/svg+xml,${encodeURIComponent(svg)}") ${hotX} ${hotY}, ${fallback}`;

// Violet arrow for select (matches the global cursor style)
export const CURSOR_SELECT = svgCursor(
  `<svg width="22" height="22" viewBox="0 0 22 22" xmlns="http://www.w3.org/2000/svg">
    <path d="M2 1L20 9.5L11 11L9.5 20L2 1Z" fill="white" stroke="white" stroke-width="3" stroke-linejoin="round"/>
    <path d="M2 1L20 9.5L11 11L9.5 20L2 1Z" fill="#7c3aed" stroke="#7c3aed" stroke-width="1.5" stroke-linejoin="round"/>
  </svg>`,
  2, 1, 'default',
);

// Plus/crosshair for shape placement (rectangle, ellipse, diamond, stickynote)
export const CURSOR_PLUS = svgCursor(
  `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
    <line x1="12" y1="4" x2="12" y2="20" stroke="#18181b" stroke-width="1.5" stroke-linecap="round"/>
    <line x1="4" y1="12" x2="20" y2="12" stroke="#18181b" stroke-width="1.5" stroke-linecap="round"/>
  </svg>`,
  12, 12,
);

// Crosshair for lines/arrows
export const CURSOR_CROSSHAIR = svgCursor(
  `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="5" fill="none" stroke="#18181b" stroke-width="1.2"/>
    <line x1="12" y1="2" x2="12" y2="8" stroke="#18181b" stroke-width="1.2" stroke-linecap="round"/>
    <line x1="12" y1="16" x2="12" y2="22" stroke="#18181b" stroke-width="1.2" stroke-linecap="round"/>
    <line x1="2" y1="12" x2="8" y2="12" stroke="#18181b" stroke-width="1.2" stroke-linecap="round"/>
    <line x1="16" y1="12" x2="22" y2="12" stroke="#18181b" stroke-width="1.2" stroke-linecap="round"/>
  </svg>`,
  12, 12,
);

// Pencil for freehand drawing
export const CURSOR_PENCIL = svgCursor(
  `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
    <path d="M3 21l1.5-4.5L17.3 3.7a1.4 1.4 0 012 0l1 1a1.4 1.4 0 010 2L7.5 19.5z" fill="none" stroke="#18181b" stroke-width="1.4" stroke-linejoin="round"/>
    <path d="M14 6l4 4" fill="none" stroke="#18181b" stroke-width="1.4" stroke-linecap="round"/>
    <path d="M3 21l1.5-4.5L7.5 19.5z" fill="#18181b"/>
  </svg>`,
  2, 22,
);

// Eraser
export const CURSOR_ERASER = svgCursor(
  `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
    <path d="M9 20h11M5.5 13.5L14 5l5 5-8.5 8.5a2 2 0 01-1.4.6H6.2a2 2 0 01-1.4-.6l-1.3-1.3a2 2 0 010-2.8z" fill="none" stroke="#18181b" stroke-width="1.4" stroke-linejoin="round" stroke-linecap="round"/>
    <path d="M9.5 16.5l-4-4" fill="none" stroke="#18181b" stroke-width="1.2" stroke-linecap="round"/>
  </svg>`,
  4, 20,
);

// Sticky note — small yellow note with folded corner and a plus
export const CURSOR_STICKYNOTE = svgCursor(
  `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28">
    <rect x="4" y="4" width="18" height="18" rx="2" fill="#fef08a" stroke="#ca8a04" stroke-width="1.2"/>
    <path d="M18 4v4a2 2 0 002 2h4" fill="#fde047" stroke="#ca8a04" stroke-width="1" stroke-linejoin="round"/>
    <line x1="13" y1="9" x2="13" y2="17" stroke="#92400e" stroke-width="1.5" stroke-linecap="round"/>
    <line x1="9" y1="13" x2="17" y2="13" stroke="#92400e" stroke-width="1.5" stroke-linecap="round"/>
  </svg>`,
  13, 13,
);

// Laser pointer — short thick wand with glowing red dot at tip
export const CURSOR_LASER = svgCursor(
  `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#71717a"/>
        <stop offset="60%" stop-color="#3f3f46"/>
        <stop offset="100%" stop-color="#18181b"/>
      </linearGradient>
    </defs>
    <line x1="9" y1="9" x2="22" y2="22" stroke="url(#g)" stroke-width="5.5" stroke-linecap="round"/>
    <line x1="9" y1="9" x2="22" y2="22" stroke="white" stroke-width="1.5" stroke-linecap="round" opacity="0.12"/>
    <line x1="18" y1="18" x2="22" y2="22" stroke="#52525b" stroke-width="7" stroke-linecap="round"/>
    <circle cx="6" cy="6" r="4" fill="#ef4444" opacity="0.2"/>
    <circle cx="6" cy="6" r="2.5" fill="#ef4444"/>
    <circle cx="5.5" cy="5.5" r="1" fill="white" opacity="0.7"/>
  </svg>`,
  6, 6,
);
