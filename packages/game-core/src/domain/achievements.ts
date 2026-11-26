import type { GameSnapshot } from '../contracts/game-snapshot.js'
import { getLifetimeValue, type LifetimeMetric } from './lifetime.js'
import { ALL_RELICS } from './relics.js'

type AchievementSource = LifetimeMetric | 'highestAct' | 'ascensions' | 'relics'

export interface AchievementDefinition {
  readonly id: string
  readonly source: AchievementSource
  readonly threshold: number
  readonly runes: number
}

/** Long-term goals. Each unlocks once, forever, and pays runes. */
export const ACHIEVEMENTS: readonly AchievementDefinition[] = [
  { id: 'first_blood', source: 'kills', threshold: 1, runes: 1 },
  { id: 'monster_hunter', source: 'kills', threshold: 100, runes: 2 },
  { id: 'legion_slayer', source: 'kills', threshold: 1000, runes: 5 },
  { id: 'exterminator', source: 'kills', threshold: 10000, runes: 15 },
  { id: 'boss_hunter', source: 'bossKills', threshold: 10, runes: 3 },
  { id: 'boss_legend', source: 'bossKills', threshold: 100, runes: 10 },
  { id: 'rift_walker', source: 'highestAct', threshold: 10, runes: 5 },
  { id: 'rift_diver', source: 'highestAct', threshold: 25, runes: 10 },
  { id: 'abyss_lord', source: 'highestAct', threshold: 50, runes: 25 },
  { id: 'first_ascension', source: 'ascensions', threshold: 1, runes: 2 },
  { id: 'eternal', source: 'ascensions', threshold: 10, runes: 10 },
  { id: 'relic_seeker', source: 'relics', threshold: 3, runes: 3 },
  { id: 'relic_master', source: 'relics', threshold: ALL_RELICS.length, runes: 10 },
  { id: 'spellbook', source: 'skillsUsed', threshold: 100, runes: 3 },
  { id: 'test_marathon', source: 'testRuns', threshold: 500, runes: 5 },
  { id: 'bookworm', source: 'reads', threshold: 1000, runes: 3 },
  { id: 'blacksmith', source: 'edits', threshold: 1000, runes: 5 },
  { id: 'battle_scarred', source: 'errors', threshold: 100, runes: 2 },
  { id: 'tycoon', source: 'goldEarned', threshold: 100000, runes: 5 },
  { id: 'treasure_hunter', source: 'lootCollected', threshold: 250, runes: 3 },
]

export function getAchievementValue(state: GameSnapshot, source: AchievementSource): number {
  switch (source) {
    case 'highestAct':
      return state.meta.highestActEver
    case 'ascensions':
      return state.meta.ascensions
    case 'relics':
      return state.meta.relics.length
    default:
      return getLifetimeValue(state, source)
  }
}
