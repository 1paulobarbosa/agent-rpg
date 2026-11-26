import type { GameSnapshot } from '@agent-rpg/game-core'

export type HitTarget =
  | { kind: 'loot'; id: string }
  | { kind: 'hero'; id: string }
  | null

const LOOT_HIT_RADIUS = 18
const HERO_HIT_RADIUS = 20

/** Pure coordinate hit-test on virtual 640x384 world space (loot prioritized over heroes). */
export function findHitTarget(snapshot: GameSnapshot, worldX: number, worldY: number): HitTarget {
  for (let i = snapshot.loot.length - 1; i >= 0; i--) {
    const drop = snapshot.loot[i]!
    if (Math.hypot(drop.x - worldX, drop.y - worldY) <= LOOT_HIT_RADIUS) {
      return { kind: 'loot', id: drop.id }
    }
  }

  for (let i = snapshot.heroes.length - 1; i >= 0; i--) {
    const hero = snapshot.heroes[i]!
    if (Math.hypot(hero.x - worldX, hero.y - worldY) <= HERO_HIT_RADIUS) {
      return { kind: 'hero', id: hero.id }
    }
  }

  return null
}
