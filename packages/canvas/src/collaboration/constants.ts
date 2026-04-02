export const PRESENCE_COLORS = [
  '#E06C75',
  '#61AFEF',
  '#98C379',
  '#E5C07B',
  '#C678DD',
  '#56B6C2',
  '#D19A66',
  '#BE5046',
] as const

export const PRESENCE_COLOR_NAMES = [
  'Red',
  'Blue',
  'Green',
  'Yellow',
  'Purple',
  'Cyan',
  'Orange',
  'Crimson',
] as const

export const ANIMAL_NAMES = [
  'Fox',
  'Owl',
  'Bear',
  'Wolf',
  'Hawk',
  'Lynx',
  'Deer',
  'Crow',
  'Hare',
  'Seal',
  'Wren',
  'Moth',
] as const

export const CURSOR_THROTTLE_MS = 50
export const SELECTION_DEBOUNCE_MS = 100

export function getPresenceColor(index: number): string {
  return PRESENCE_COLORS[index % PRESENCE_COLORS.length]
}

export function getPresenceName(colorIndex: number): string {
  const colorName = PRESENCE_COLOR_NAMES[colorIndex % PRESENCE_COLOR_NAMES.length]
  const animalName = ANIMAL_NAMES[Math.floor(Math.random() * ANIMAL_NAMES.length)]
  return `${colorName} ${animalName}`
}
