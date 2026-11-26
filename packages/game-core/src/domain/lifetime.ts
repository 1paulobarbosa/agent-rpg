import type { AgentEvent } from '../contracts/agent-event.js'
import type { GameSnapshot, LifetimeStats, QuestMetric } from '../contracts/game-snapshot.js'
import { mapEventToAction } from './skill-mapper.js'

export type LifetimeMetric = QuestMetric | 'errors' | 'goldEarned'

/** Lifetime value of a metric: counters in meta plus what the current run has done so far. */
export function getLifetimeValue(state: GameSnapshot, metric: LifetimeMetric): number {
  const { stats } = state.meta
  switch (metric) {
    case 'kills':
      return stats.archivedKills + state.campaign.totalKills
    case 'bossKills':
      return stats.archivedBossKills + state.campaign.totalBossesDefeated
    case 'goldEarned':
      return stats.archivedGold + state.party.totalGoldEarned
    default:
      return stats[metric]
  }
}

const ZONE_COUNTER = {
  research: 'reads',
  forge: 'edits',
  arena: 'testRuns',
  citadel: 'arcane',
} as const satisfies Record<string, keyof LifetimeStats>

/** Counts one agent event into the lifetime stats, by what the agent actually did. */
export function recordAgentEvent(stats: LifetimeStats, event: AgentEvent): LifetimeStats {
  if (event.kind === 'tool_result' && event.status === 'error') {
    return { ...stats, errors: stats.errors + 1 }
  }
  if (event.kind === 'skill_used') {
    return { ...stats, skillsUsed: stats.skillsUsed + 1 }
  }
  if (event.kind !== 'tool_call' && event.kind !== 'subagent_spawn') return stats

  const zone = mapEventToAction(event).zone
  const next = { ...stats, toolCalls: stats.toolCalls + 1 }
  if (zone !== 'tavern') next[ZONE_COUNTER[zone]] += 1
  return next
}

export function emptyLifetimeStats(): LifetimeStats {
  return {
    toolCalls: 0,
    reads: 0,
    edits: 0,
    testRuns: 0,
    arcane: 0,
    skillsUsed: 0,
    errors: 0,
    lootCollected: 0,
    archivedKills: 0,
    archivedBossKills: 0,
    archivedGold: 0,
  }
}
