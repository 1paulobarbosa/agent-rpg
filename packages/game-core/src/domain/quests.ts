import type { GameSnapshot, Quest, QuestBoard, QuestMetric } from '../contracts/game-snapshot.js'
import { getLifetimeValue } from './lifetime.js'

type Cadence = Quest['cadence']

interface QuestTemplate {
  readonly metric: QuestMetric
  readonly target: number
}

const DAILY_POOL: readonly QuestTemplate[] = [
  { metric: 'toolCalls', target: 150 },
  { metric: 'reads', target: 60 },
  { metric: 'edits', target: 40 },
  { metric: 'testRuns', target: 25 },
  { metric: 'skillsUsed', target: 3 },
  { metric: 'kills', target: 40 },
  { metric: 'bossKills', target: 2 },
  { metric: 'lootCollected', target: 10 },
]

const WEEKLY_POOL: readonly QuestTemplate[] = [
  { metric: 'toolCalls', target: 1000 },
  { metric: 'edits', target: 250 },
  { metric: 'testRuns', target: 150 },
  { metric: 'skillsUsed', target: 15 },
  { metric: 'kills', target: 300 },
  { metric: 'bossKills', target: 10 },
]

const QUESTS_PER_CADENCE: Readonly<Record<Cadence, number>> = { daily: 3, weekly: 2 }
const RUNES_PER_CADENCE: Readonly<Record<Cadence, number>> = { daily: 1, weekly: 5 }

/** Gold a finished quest pays, scaled to how deep the party is right now. */
export function questGoldReward(cadence: Cadence, act: number): number {
  return (cadence === 'daily' ? 60 : 400) * act
}

/** UTC day, e.g. 2026-11-26. Quests roll over at 00:00 UTC for everyone. */
export function dailyKey(nowIso: string): string {
  return new Date(nowIso).toISOString().slice(0, 10)
}

/** ISO-8601 week in UTC, e.g. 2026-W48. */
export function weeklyKey(nowIso: string): string {
  const date = new Date(`${dailyKey(nowIso)}T00:00:00.000Z`)
  const weekday = date.getUTCDay() || 7
  date.setUTCDate(date.getUTCDate() + 4 - weekday)
  const yearStart = Date.UTC(date.getUTCFullYear(), 0, 1)
  const week = Math.ceil(((date.getTime() - yearStart) / 86_400_000 + 1) / 7)
  return `${date.getUTCFullYear()}-W${String(week).padStart(2, '0')}`
}

/** Small deterministic PRNG so the same day gives the same quests on any machine. */
function seededRng(seed: string): () => number {
  let h = 2166136261
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619)
  return () => {
    h += 0x6d2b79f5
    let t = h
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function drawQuests(state: GameSnapshot, cadence: Cadence, key: string): Quest[] {
  const pool = [...(cadence === 'daily' ? DAILY_POOL : WEEKLY_POOL)]
  const rng = seededRng(`${cadence}:${key}`)
  const picked: Quest[] = []
  while (picked.length < QUESTS_PER_CADENCE[cadence] && pool.length > 0) {
    const [template] = pool.splice(Math.floor(rng() * pool.length), 1)
    picked.push({
      id: `${cadence}-${key}-${template!.metric}`,
      cadence,
      metric: template!.metric,
      target: template!.target,
      baseline: getLifetimeValue(state, template!.metric),
      rewardRunes: RUNES_PER_CADENCE[cadence],
      completed: false,
    })
  }
  return picked
}

/** Replaces the daily or weekly quests when their day or week has passed. */
export function refreshQuestBoard(state: GameSnapshot, nowIso: string): QuestBoard {
  const board = state.quests
  if (Number.isNaN(Date.parse(nowIso))) return board
  const today = dailyKey(nowIso)
  const week = weeklyKey(nowIso)
  if (board.dailyKey === today && board.weeklyKey === week) return board

  const keepDaily = board.dailyKey === today
  const keepWeekly = board.weeklyKey === week
  return {
    dailyKey: today,
    weeklyKey: week,
    active: [
      ...(keepDaily ? board.active.filter((q) => q.cadence === 'daily') : drawQuests(state, 'daily', today)),
      ...(keepWeekly ? board.active.filter((q) => q.cadence === 'weekly') : drawQuests(state, 'weekly', week)),
    ],
  }
}

export function getQuestProgress(state: GameSnapshot, quest: Quest): number {
  return Math.min(quest.target, Math.max(0, getLifetimeValue(state, quest.metric) - quest.baseline))
}
