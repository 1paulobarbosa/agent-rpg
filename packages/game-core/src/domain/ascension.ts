import type { GameSnapshot } from '../contracts/game-snapshot.js'
import { MAX_GAME_VALUE, STORY_ACTS, createInitialZoneMonsters, getActDefinition } from './campaign.js'
import { getHeroMaxHp, pushLog, xpRequiredForLevel } from './combat-helpers.js'
import { AscensionLockedError } from './errors.js'
import { getModifiers } from './modifiers.js'
import { settleProgress } from './progress.js'
import { getHeroZoneSlot } from './world-map.js'

/** The deepest act of the run must reach the story finale before the party may ascend. */
export const ASCENSION_MIN_ACT = STORY_ACTS

/**
 * Runes an ascension pays for the deepest act reached in the run. The exponential term keeps
 * pace with the exponential talent costs, so every run pushes the wall a few acts further.
 */
export function runesForAct(highestAct: number): number {
  if (highestAct < ASCENSION_MIN_ACT) return 0
  const depth = highestAct - ASCENSION_MIN_ACT
  return Math.floor(Math.min(MAX_GAME_VALUE, 3 * Math.pow(depth + 1, 1.3) * Math.pow(1.22, depth)))
}

/**
 * Prestige reset: the run (act, level, gold, camp upgrades) starts over, the party earns runes,
 * and everything in `meta` (talents, relics, achievements, lifetime stats) is kept.
 */
export function ascend(state: GameSnapshot, nowIso = new Date().toISOString()): GameSnapshot {
  const highest = state.campaign.highestActThisRun
  if (highest < ASCENSION_MIN_ACT) throw new AscensionLockedError(ASCENSION_MIN_ACT)

  const runes = runesForAct(highest)
  const { stats } = state.meta
  const meta = {
    ...state.meta,
    ascensions: state.meta.ascensions + 1,
    runes: state.meta.runes + runes,
    totalRunesEarned: state.meta.totalRunesEarned + runes,
    stats: {
      ...stats,
      archivedKills: stats.archivedKills + state.campaign.totalKills,
      archivedBossKills: stats.archivedBossKills + state.campaign.totalBossesDefeated,
      archivedGold: stats.archivedGold + state.party.totalGoldEarned,
    },
  }
  const mods = getModifiers(meta)
  const maxHp = getHeroMaxHp(1, 0, mods.maxHp)
  const act1 = getActDefinition(1)

  const next: GameSnapshot = {
    ...state,
    updatedAt: nowIso,
    campaign: {
      act: 1,
      actId: act1.id,
      killsInAct: 0,
      killsToBoss: act1.killsToBoss,
      bossActive: false,
      highestActThisRun: 1,
      totalKills: 0,
      totalBossesDefeated: 0,
      totalEventsProcessed: state.campaign.totalEventsProcessed,
    },
    party: {
      level: 1,
      xp: 0,
      xpToNextLevel: xpRequiredForLevel(1),
      gold: mods.startGold,
      totalGoldEarned: 0,
    },
    upgrades: { runic_anvil: 0, tavern_hearth: 0, arcane_tome: 0, party_potion: 0 },
    heroes: state.heroes.map((hero, idx) => {
      const slot = getHeroZoneSlot('tavern', idx)
      return {
        ...hero,
        level: 1,
        hp: maxHp,
        maxHp,
        zone: 'tavern' as const,
        targetX: slot.x,
        targetY: slot.y,
        state: 'idle' as const,
        buffSkill: null,
        buffCharges: 0,
      }
    }),
    monsters: createInitialZoneMonsters(1),
    loot: [],
    meta,
    battleLog: pushLog(state.battleLog, {
      id: `log-ascend-${meta.ascensions}`,
      timestamp: nowIso,
      code: 'ascended',
      actor: 'party',
      detail: String(highest),
      amount: runes,
    }),
  }
  return settleProgress(next, nowIso)
}
