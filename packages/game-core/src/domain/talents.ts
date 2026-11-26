import type { TalentId } from '../contracts/client-command.js'
import type { GameSnapshot } from '../contracts/game-snapshot.js'
import { pushLog } from './combat-helpers.js'
import { InsufficientRunesError, TalentMaxLevelError } from './errors.js'

export interface TalentDefinition {
  readonly id: TalentId
  readonly baseCost: number
  readonly costMultiplier: number
  readonly maxLevel: number | null
}

/** Permanent upgrades bought with runes. They survive every ascension. */
export const TALENT_CATALOG: Readonly<Record<TalentId, TalentDefinition>> = {
  sharpened_steel: { id: 'sharpened_steel', baseCost: 3, costMultiplier: 1.3, maxLevel: null },
  golden_touch: { id: 'golden_touch', baseCost: 2, costMultiplier: 1.35, maxLevel: null },
  scholar: { id: 'scholar', baseCost: 2, costMultiplier: 1.35, maxLevel: null },
  iron_will: { id: 'iron_will', baseCost: 2, costMultiplier: 1.3, maxLevel: null },
  quick_start: { id: 'quick_start', baseCost: 4, costMultiplier: 1.5, maxLevel: 20 },
  lucky_star: { id: 'lucky_star', baseCost: 5, costMultiplier: 1.45, maxLevel: 25 },
}

export const TALENT_ORDER: readonly TalentId[] = [
  'sharpened_steel',
  'golden_touch',
  'scholar',
  'iron_will',
  'quick_start',
  'lucky_star',
]

export function getTalentCost(talentId: TalentId, currentLevel: number): number {
  const def = TALENT_CATALOG[talentId]
  return Math.round(def.baseCost * Math.pow(def.costMultiplier, Math.max(0, currentLevel)))
}

export function isTalentMaxed(talentId: TalentId, currentLevel: number): boolean {
  const max = TALENT_CATALOG[talentId].maxLevel
  return max !== null && currentLevel >= max
}

/** Safety bound for "buy max", far above what any rune balance can reach. */
const MAX_LEVELS_PER_PURCHASE = 5000

/** Spends runes on one level of a permanent talent, or as many levels as affordable with `max`. */
export function buyTalent(
  state: GameSnapshot,
  talentId: TalentId,
  nowIso = new Date().toISOString(),
  options: { max?: boolean } = {},
): GameSnapshot {
  const startLevel = state.meta.talents[talentId]
  if (isTalentMaxed(talentId, startLevel)) throw new TalentMaxLevelError(talentId)

  const firstCost = getTalentCost(talentId, startLevel)
  if (state.meta.runes < firstCost) throw new InsufficientRunesError(firstCost, state.meta.runes)

  let level = startLevel
  let runes = state.meta.runes
  const limit = options.max ? MAX_LEVELS_PER_PURCHASE : 1
  for (let bought = 0; bought < limit && !isTalentMaxed(talentId, level); bought++) {
    const cost = getTalentCost(talentId, level)
    if (runes < cost) break
    runes -= cost
    level += 1
  }

  return {
    ...state,
    updatedAt: nowIso,
    meta: { ...state.meta, runes, talents: { ...state.meta.talents, [talentId]: level } },
    battleLog: pushLog(state.battleLog, {
      id: `log-talent-${talentId}-${level}-${nowIso}`,
      timestamp: nowIso,
      code: 'talent_bought',
      actor: talentId,
      amount: level,
    }),
  }
}
