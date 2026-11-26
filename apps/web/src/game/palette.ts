import type { ZoneId } from '@agent-rpg/game-core'

export const PIXEL_PALETTE: Record<string, string> = {
  '.': '',
  k: '#10141f', // dark pixel outline
  w: '#f8fafc', // white highlight
  s: '#f4c7a1', // skin tone
  d: '#d99b6c', // skin shadow
  r: '#ef4444', // crimson red
  R: '#991b1b', // deep red
  o: '#fb923c', // flame orange
  y: '#facc15', // gold yellow
  Y: '#ca8a04', // dark gold
  g: '#22c55e', // bright green
  G: '#15803d', // forest green
  e: '#10b981', // slime emerald
  c: '#38bdf8', // sky cyan
  b: '#3b82f6', // royal blue
  B: '#1d4ed8', // navy blue
  p: '#a855f7', // arcane purple
  P: '#6b21a8', // deep purple
  m: '#94a3b8', // steel silver
  M: '#475569', // dark iron
  t: '#92400e', // wood brown
  T: '#5c2808', // dark wood
}

export const ZONE_THEMES: Record<
  ZoneId,
  { ground: string; tileAlt: string; accent: string; border: string }
> = {
  tavern: {
    ground: '#2b2434',
    tileAlt: '#332b3e',
    accent: '#f59e0b',
    border: '#d97706',
  },
  research: {
    ground: '#162d24',
    tileAlt: '#1b382c',
    accent: '#34d399',
    border: '#10b981',
  },
  forge: {
    ground: '#2d1b18',
    tileAlt: '#3a221d',
    accent: '#fb923c',
    border: '#ea580c',
  },
  arena: {
    ground: '#302819',
    tileAlt: '#3b311f',
    accent: '#facc15',
    border: '#ca8a04',
  },
  citadel: {
    ground: '#1e1933',
    tileAlt: '#272042',
    accent: '#c084fc',
    border: '#9333ea',
  },
}
