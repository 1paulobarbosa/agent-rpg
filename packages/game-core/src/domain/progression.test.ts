import { describe, expect, it } from 'vitest'
import {
  ASCENSION_MIN_ACT,
  AscensionLockedError,
  GameSnapshotSchema,
  InsufficientRunesError,
  TalentMaxLevelError,
  applyAgentEvent,
  ascend,
  buyTalent,
  buyUpgrade,
  collectLoot,
  createInitialState,
  dailyKey,
  getActDefinition,
  getModifiers,
  getQuestProgress,
  getTalentCost,
  getUpgradeCost,
  migrateSnapshot,
  rollAffix,
  rollRelicDrop,
  runesForAct,
  spawnMonsterFromTemplate,
  weeklyKey,
  type AgentEvent,
  type GameSnapshot,
} from '../index.js'

const NOW = '2026-11-26T14:00:00.000Z'
const RNG = { rng: () => 0.4 }

function event(overrides: Partial<AgentEvent> = {}): AgentEvent {
  return {
    id: 'e',
    source: 'claude-code',
    agentId: 'cc-1',
    agentName: 'Claude',
    kind: 'tool_call',
    toolName: 'Read',
    timestamp: NOW,
    ...overrides,
  }
}

function withMeta(state: GameSnapshot, meta: Partial<GameSnapshot['meta']>): GameSnapshot {
  return { ...state, meta: { ...state.meta, ...meta } }
}

describe('endless acts', () => {
  it('generates acts forever with growing monster HP and a cycling story boss', () => {
    const act5 = getActDefinition(5)
    const act6 = getActDefinition(6)
    const act40 = getActDefinition(40)
    expect(act6.id).toBe('endless_rift')
    expect(act6.hpScale).toBeGreaterThan(act5.hpScale)
    expect(act40.hpScale).toBeGreaterThan(act6.hpScale)
    expect(act40.killsToBoss).toBeLessThanOrEqual(15)

    const farBoss = spawnMonsterFromTemplate({ template: getActDefinition(100_000).boss, act: 100_000, serial: 1 })
    expect(Number.isFinite(farBoss.maxHp)).toBe(true)
    expect(GameSnapshotSchema.shape.monsters.element.safeParse(farBoss).success).toBe(true)

    const boss6 = spawnMonsterFromTemplate({ template: act6.boss, act: 6, serial: 1 })
    const boss5 = spawnMonsterFromTemplate({ template: act5.boss, act: 5, serial: 1 })
    expect(boss6.maxHp).toBeGreaterThan(boss5.maxHp)
  })

  it('rolls affixes only in the endless rift, and always for bosses there', () => {
    expect(rollAffix(5, () => 0)).toBeNull()
    expect(rollAffix(6, () => 0.99)).toBeNull()
    expect(rollAffix(6, () => 0.99, true)).not.toBeNull()
    const act = getActDefinition(8)
    const plain = spawnMonsterFromTemplate({ template: act.boss, act: 8, serial: 1 })
    const armored = spawnMonsterFromTemplate({ template: act.boss, act: 8, serial: 2, affix: 'armored' })
    expect(armored.maxHp).toBeGreaterThan(plain.maxHp)
    expect(armored.affix).toBe('armored')
  })
})

describe('ascension and talents', () => {
  it('locks ascension until the story finale and pays more runes the deeper the run', () => {
    const fresh = createInitialState(NOW)
    expect(() => ascend(fresh, NOW)).toThrow(AscensionLockedError)
    expect(runesForAct(ASCENSION_MIN_ACT - 1)).toBe(0)
    expect(runesForAct(ASCENSION_MIN_ACT)).toBeGreaterThan(0)
    expect(runesForAct(20)).toBeGreaterThan(runesForAct(10))
    expect(Number.isFinite(runesForAct(100_000))).toBe(true)
  })

  it('resets the run, keeps meta progress and archives lifetime kills and gold', () => {
    const base = createInitialState(NOW)
    const deep: GameSnapshot = withMeta(
      {
        ...base,
        campaign: { ...base.campaign, act: 9, highestActThisRun: 9, totalKills: 120, totalBossesDefeated: 8 },
        party: { ...base.party, level: 14, gold: 900, totalGoldEarned: 5000 },
        upgrades: { ...base.upgrades, runic_anvil: 4 },
      },
      { relics: ['test_totem'], talents: { ...base.meta.talents, quick_start: 2 } },
    )

    const ascended = ascend(deep, NOW)
    expect(ascended.campaign.act).toBe(1)
    expect(ascended.party.level).toBe(1)
    expect(ascended.party.gold).toBe(300)
    expect(ascended.upgrades.runic_anvil).toBe(0)
    expect(ascended.meta.ascensions).toBe(1)
    expect(ascended.meta.runes).toBeGreaterThanOrEqual(runesForAct(9))
    expect(ascended.meta.relics).toEqual(['test_totem'])
    expect(ascended.meta.stats.archivedKills).toBe(120)
    expect(ascended.meta.stats.archivedGold).toBe(5000)
    expect(ascended.meta.achievements).toContain('first_ascension')
    expect(GameSnapshotSchema.safeParse(ascended).success).toBe(true)
  })

  it('buys talents with runes, scales the cost and refuses past the cap or without runes', () => {
    const base = createInitialState(NOW)
    expect(() => buyTalent(base, 'sharpened_steel', NOW)).toThrow(InsufficientRunesError)

    const rich = withMeta(base, { runes: 100 })
    const bought = buyTalent(rich, 'sharpened_steel', NOW)
    expect(bought.meta.talents.sharpened_steel).toBe(1)
    expect(bought.meta.runes).toBe(100 - getTalentCost('sharpened_steel', 0))
    expect(getTalentCost('sharpened_steel', 5)).toBeGreaterThan(getTalentCost('sharpened_steel', 1))
    expect(getModifiers(bought.meta).damage).toBeGreaterThan(1)

    const maxed = buyTalent(withMeta(base, { runes: 1000 }), 'golden_touch', NOW, { max: true })
    expect(maxed.meta.talents.golden_touch).toBeGreaterThan(5)
    expect(maxed.meta.runes).toBeLessThan(getTalentCost('golden_touch', maxed.meta.talents.golden_touch))

    const capped = withMeta(base, { runes: 999, talents: { ...base.meta.talents, lucky_star: 25 } })
    expect(() => buyTalent(capped, 'lucky_star', NOW)).toThrow(TalentMaxLevelError)
  })
})

describe('relics', () => {
  it('guarantees the first relic from Act 3 and turns duplicates into runes', () => {
    const meta = createInitialState(NOW).meta
    expect(rollRelicDrop(meta, 2, () => 0.99)).toEqual({ kind: 'none' })
    expect(rollRelicDrop(meta, 3, () => 0.99).kind).toBe('new')

    const full = { ...meta, relics: [...GameSnapshotSchema.shape.meta.shape.relics.element.options] }
    expect(rollRelicDrop(full, 10, () => 0)).toEqual({ kind: 'duplicate' })
  })

  it('applies relic effects to combat and shop modifiers', () => {
    const meta = createInitialState(NOW).meta
    const mods = getModifiers({ ...meta, relics: ['test_totem', 'merchant_coin', 'phoenix_feather'] })
    expect(mods.zoneDamage.arena).toBe(1.5)
    expect(mods.zoneDamage.forge).toBe(1)
    expect(mods.errorDamage).toBeLessThan(1)
    expect(getUpgradeCost('runic_anvil', 0, mods.upgradeCost)).toBeLessThan(getUpgradeCost('runic_anvil', 0))
  })

  it('makes the merchant coin discount real when buying an upgrade', () => {
    const base = createInitialState(NOW)
    const state = withMeta({ ...base, party: { ...base.party, gold: 40 } }, { relics: ['merchant_coin'] })
    const bought = buyUpgrade(state, 'runic_anvil', NOW)
    expect(bought.party.gold).toBe(40 - getUpgradeCost('runic_anvil', 0, 0.85))
  })
})

describe('quests', () => {
  it('draws the same 3 daily and 2 weekly quests for the same day, and new ones the next day', () => {
    const a = createInitialState(NOW)
    const b = createInitialState('2026-11-26T23:59:00.000Z')
    expect(a.quests.active.map((q) => q.id)).toEqual(b.quests.active.map((q) => q.id))
    expect(a.quests.active.filter((q) => q.cadence === 'daily')).toHaveLength(3)
    expect(a.quests.active.filter((q) => q.cadence === 'weekly')).toHaveLength(2)

    const nextDay = applyAgentEvent(a, event({ timestamp: '2026-11-27T09:00:00.000Z' }), RNG)
    expect(nextDay.quests.dailyKey).toBe('2026-11-27')
    expect(nextDay.quests.weeklyKey).toBe(a.quests.weeklyKey)
  })

  it('uses UTC day and ISO week keys', () => {
    expect(dailyKey('2026-11-26T23:30:00-03:00')).toBe('2026-11-27')
    expect(weeklyKey('2026-11-26T12:00:00.000Z')).toBe('2026-W48')
    expect(weeklyKey('2027-01-01T12:00:00.000Z')).toBe('2026-W53')
  })

  it('counts real agent work toward a quest and pays runes and gold once when it completes', () => {
    const base = createInitialState(NOW)
    const quest = { id: 'q-test', cadence: 'daily' as const, metric: 'testRuns' as const, target: 2, baseline: 0, rewardRunes: 1, completed: false }
    let state: GameSnapshot = { ...base, quests: { ...base.quests, active: [quest] } }

    state = applyAgentEvent(state, event({ id: 't1', toolName: 'Bash' }), RNG)
    expect(getQuestProgress(state, state.quests.active[0]!)).toBe(1)
    expect(state.quests.active[0]!.completed).toBe(false)

    const runesBefore = state.meta.runes
    state = applyAgentEvent(state, event({ id: 't2', toolName: 'Bash' }), RNG)
    expect(state.quests.active[0]!.completed).toBe(true)
    expect(state.meta.runes).toBeGreaterThanOrEqual(runesBefore + 1)
    expect(state.battleLog.some((e) => e.code === 'quest_completed')).toBe(true)

    const after = applyAgentEvent(state, event({ id: 't3', toolName: 'Bash' }), RNG)
    expect(after.battleLog.filter((e) => e.code === 'quest_completed')).toHaveLength(1)
  })
})

describe('achievements and lifetime stats', () => {
  it('records what the agent did and unlocks achievements once', () => {
    let state = createInitialState(NOW)
    state = applyAgentEvent(state, event({ id: 'r', toolName: 'Read' }), RNG)
    state = applyAgentEvent(state, event({ id: 'e', toolName: 'Edit' }), RNG)
    state = applyAgentEvent(state, event({ id: 's', kind: 'skill_used', toolName: undefined, skillName: 'tdd' }), RNG)
    state = applyAgentEvent(state, event({ id: 'x', kind: 'tool_result', status: 'error' }), RNG)

    expect(state.meta.stats).toMatchObject({ toolCalls: 2, reads: 1, edits: 1, skillsUsed: 1, errors: 1 })

    const loot = state.loot[0]
    if (loot) state = collectLoot(state, loot.id, NOW)

    const veteran = { ...state, campaign: { ...state.campaign, totalKills: 100 } }
    const unlocked = applyAgentEvent(veteran, event({ id: 'k' }), RNG)
    expect(unlocked.meta.achievements).toEqual(expect.arrayContaining(['first_blood', 'monster_hunter']))
    const runes = unlocked.meta.runes
    expect(applyAgentEvent(unlocked, event({ id: 'k2' }), RNG).meta.runes).toBeGreaterThanOrEqual(runes)
  })
})

describe('save migration', () => {
  it('upgrades a version 1 save, turning New Game+ into ascensions and runes', () => {
    const current = createInitialState(NOW)
    const { meta: _meta, quests: _quests, ...rest } = current
    const v1 = {
      ...rest,
      version: 1,
      campaign: {
        act: 3,
        actId: 'deep_forge',
        killsInAct: 2,
        killsToBoss: 7,
        bossActive: false,
        status: 'playing',
        newGamePlus: 2,
        totalKills: 50,
        totalBossesDefeated: 12,
        totalEventsProcessed: 900,
      },
      monsters: current.monsters.map(({ affix: _affix, ...m }) => m),
    }

    const migrated = migrateSnapshot(v1, NOW)
    expect(migrated).not.toBeNull()
    expect(migrated!.version).toBe(2)
    expect(migrated!.campaign.act).toBe(3)
    expect(migrated!.meta.ascensions).toBe(2)
    expect(migrated!.meta.runes).toBe(20)
    expect(migrated!.quests.active.length).toBe(5)
  })

  it('moves a finished version 1 campaign into the endless rift', () => {
    const current = createInitialState(NOW)
    const { meta: _meta, quests: _quests, ...rest } = current
    const won = { ...rest, version: 1, campaign: { ...rest.campaign, act: 5, status: 'victory', newGamePlus: 0 } }
    expect(migrateSnapshot(won, NOW)!.campaign.act).toBe(6)
  })

  it('returns null for garbage and passes a current save through', () => {
    expect(migrateSnapshot('nope', NOW)).toBeNull()
    expect(migrateSnapshot({ version: 1 }, NOW)).toBeNull()
    const current = createInitialState(NOW)
    expect(migrateSnapshot(JSON.parse(JSON.stringify(current)), NOW)).toEqual(current)
  })
})
