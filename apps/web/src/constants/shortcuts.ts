export interface Shortcut {
  keys: string[];
  label: string;
  category: string;
}

export const SHORTCUT_CATEGORIES = ['Tools', 'Canvas', 'Editing', 'Alignment', 'Other'] as const;

export const SHORTCUTS: Shortcut[] = [
  // Tools
  { keys: ['V'], label: 'Select', category: 'Tools' },
  { keys: ['R'], label: 'Rectangle', category: 'Tools' },
  { keys: ['O'], label: 'Ellipse', category: 'Tools' },
  { keys: ['D'], label: 'Diamond', category: 'Tools' },
  { keys: ['L'], label: 'Line', category: 'Tools' },
  { keys: ['A'], label: 'Arrow', category: 'Tools' },
  { keys: ['P'], label: 'Freehand', category: 'Tools' },
  { keys: ['T'], label: 'Text', category: 'Tools' },

  // Canvas
  { keys: ['Scroll'], label: 'Zoom', category: 'Canvas' },
  { keys: ['Space', 'Drag'], label: 'Pan', category: 'Canvas' },
  { keys: ['⌘', '0'], label: 'Reset zoom', category: 'Canvas' },

  // Editing
  { keys: ['⌘', 'Z'], label: 'Undo', category: 'Editing' },
  { keys: ['⌘', '⇧', 'Z'], label: 'Redo', category: 'Editing' },
  { keys: ['⌘', 'C'], label: 'Copy', category: 'Editing' },
  { keys: ['⌘', 'V'], label: 'Paste', category: 'Editing' },
  { keys: ['⌫'], label: 'Delete', category: 'Editing' },
  { keys: ['⌘', 'G'], label: 'Group', category: 'Editing' },
  { keys: ['⌘', '⇧', 'G'], label: 'Ungroup', category: 'Editing' },

  // Alignment
  { keys: ['⌘', '⇧', 'L'], label: 'Align left', category: 'Alignment' },
  { keys: ['⌘', '⇧', 'C'], label: 'Align center', category: 'Alignment' },
  { keys: ['⌘', '⇧', 'R'], label: 'Align right', category: 'Alignment' },
  { keys: ['⌘', '⇧', 'T'], label: 'Align top', category: 'Alignment' },
  { keys: ['⌘', '⇧', 'M'], label: 'Align middle', category: 'Alignment' },
  { keys: ['⌘', '⇧', 'B'], label: 'Align bottom', category: 'Alignment' },
  { keys: ['⌘', '⇧', 'H'], label: 'Distribute horizontally', category: 'Alignment' },
  { keys: ['⌘', '⇧', 'V'], label: 'Distribute vertically', category: 'Alignment' },

  // Other
  { keys: ['?'], label: 'Keyboard shortcuts', category: 'Other' },
];
