import { RelicIdSchema, type MetaProgress, type RelicId } from '../contracts/game-snapshot.js'

export const ALL_RELICS: readonly RelicId[] = RelicIdSchema.options

/** Runes granted when a boss drops a relic the party already owns. */
export const DUPLICATE_RELIC_RUNES = 3

const BASE_DROP_CHANCE = 0.06
const DROP_CHANCE_PER_ENDLESS_ACT = 0.004
const MAX_DROP_CHANCE = 0.2
const FIRST_RELIC_MIN_ACT = 3

export type RelicRoll = { kind: 'none' } | { kind: 'new'; relic: RelicId } | { kind: 'duplicate' }

/**
 * Rolls a relic drop for a defeated boss. The first relic is guaranteed from Act 3 on, so every
 * player meets the system early; after that the chance grows with depth in the endless rift.
 */
export function rollRelicDrop(meta: MetaProgress, act: number, rng: () => number): RelicRoll {
  const guaranteed = meta.relics.length === 0 && act >= FIRST_RELIC_MIN_ACT
  const chance = Math.min(MAX_DROP_CHANCE, BASE_DROP_CHANCE + Math.max(0, act - 5) * DROP_CHANCE_PER_ENDLESS_ACT)
  if (!guaranteed && rng() >= chance) return { kind: 'none' }

  const missing = ALL_RELICS.filter((r) => !meta.relics.includes(r))
  if (missing.length === 0) return { kind: 'duplicate' }
  return { kind: 'new', relic: missing[Math.floor(rng() * missing.length) % missing.length]! }
}
