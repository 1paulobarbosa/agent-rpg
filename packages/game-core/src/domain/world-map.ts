import type { ZoneId } from '../contracts/game-snapshot.js'

export const WORLD_WIDTH = 640
export const WORLD_HEIGHT = 384
export const TILE_SIZE = 16

export interface ZoneLayout {
  readonly id: ZoneId
  readonly centerX: number
  readonly centerY: number
  readonly monsterAnchorX: number
  readonly monsterAnchorY: number
  readonly radius: number
}

export const WORLD_ZONES: Record<ZoneId, ZoneLayout> = {
  tavern: {
    id: 'tavern',
    centerX: 320,
    centerY: 196,
    monsterAnchorX: 320,
    monsterAnchorY: 196,
    radius: 54,
  },
  research: {
    id: 'research',
    centerX: 118,
    centerY: 94,
    monsterAnchorX: 162,
    monsterAnchorY: 82,
    radius: 62,
  },
  forge: {
    id: 'forge',
    centerX: 520,
    centerY: 94,
    monsterAnchorX: 472,
    monsterAnchorY: 82,
    radius: 62,
  },
  arena: {
    id: 'arena',
    centerX: 118,
    centerY: 298,
    monsterAnchorX: 164,
    monsterAnchorY: 288,
    radius: 62,
  },
  citadel: {
    id: 'citadel',
    centerX: 520,
    centerY: 298,
    monsterAnchorX: 468,
    monsterAnchorY: 288,
    radius: 66,
  },
}

export const COMBAT_ZONES: readonly ZoneId[] = ['research', 'forge', 'arena', 'citadel']

/** Computes a deterministic standing offset inside a zone so heroes do not overlap. */
export function getHeroZoneSlot(zone: ZoneId, slotIndex: number): { x: number; y: number } {
  const layout = WORLD_ZONES[zone]
  const angle = (slotIndex % 6) * (Math.PI / 3) + Math.PI / 6
  const distance = zone === 'tavern' ? 30 + (slotIndex % 2) * 14 : 34
  const baseX = zone === 'tavern' ? layout.centerX : layout.centerX - 18
  const baseY = layout.centerY + 8
  return {
    x: Math.round(clamp(baseX + Math.cos(angle) * distance, 32, WORLD_WIDTH - 32)),
    y: Math.round(clamp(baseY + Math.sin(angle) * (distance * 0.7), 36, WORLD_HEIGHT - 36)),
  }
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}
