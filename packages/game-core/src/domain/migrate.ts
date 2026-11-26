import { GameSnapshotSchema, SNAPSHOT_VERSION, type GameSnapshot } from '../contracts/game-snapshot.js'
import { getActDefinition } from './campaign.js'
import { createInitialState } from './engine.js'

/** Runes granted per New Game+ cleared in a version 1 save, so veterans start ascended. */
const RUNES_PER_LEGACY_NG_PLUS = 10

type Loose = Record<string, unknown>

function asRecord(value: unknown): Loose | null {
  return typeof value === 'object' && value !== null ? (value as Loose) : null
}

function num(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

/**
 * Upgrades a version 1 save (5 acts + New Game+) to version 2 (endless acts + meta progress).
 * The run keeps its act, party, upgrades, heroes and bestiary; each New Game+ becomes runes.
 */
function migrateV1(raw: Loose, nowIso: string): unknown {
  const fresh = createInitialState(nowIso)
  const campaign = asRecord(raw.campaign) ?? {}
  const ngPlus = Math.max(0, Math.floor(num(campaign.newGamePlus)))
  const won = campaign.status === 'victory'
  const act = won ? 6 : Math.max(1, Math.floor(num(campaign.act, 1)))
  const actDef = getActDefinition(act)
  const runes = ngPlus * RUNES_PER_LEGACY_NG_PLUS
  const monsters = Array.isArray(raw.monsters) ? raw.monsters : []

  return {
    ...raw,
    version: SNAPSHOT_VERSION,
    campaign: {
      act,
      actId: actDef.id,
      killsInAct: won ? 0 : num(campaign.killsInAct),
      killsToBoss: won ? actDef.killsToBoss : num(campaign.killsToBoss, actDef.killsToBoss),
      bossActive: won ? false : campaign.bossActive === true,
      highestActThisRun: act,
      totalKills: num(campaign.totalKills),
      totalBossesDefeated: num(campaign.totalBossesDefeated),
      totalEventsProcessed: num(campaign.totalEventsProcessed),
    },
    monsters: won ? fresh.monsters : monsters.map((m) => ({ ...asRecord(m), affix: null })),
    battleLog: Array.isArray(raw.battleLog)
      ? raw.battleLog.filter((entry) => asRecord(entry)?.code !== 'new_game_plus')
      : [],
    meta: {
      ...fresh.meta,
      ascensions: ngPlus,
      runes,
      totalRunesEarned: runes,
      highestActEver: act,
    },
    quests: fresh.quests,
  }
}

/** Parses a stored save of any known version into the current snapshot, or null if unusable. */
export function migrateSnapshot(raw: unknown, nowIso = new Date().toISOString()): GameSnapshot | null {
  const record = asRecord(raw)
  if (!record) return null
  const upgraded = record.version === 1 ? migrateV1(record, nowIso) : record
  const parsed = GameSnapshotSchema.safeParse(upgraded)
  return parsed.success ? parsed.data : null
}
