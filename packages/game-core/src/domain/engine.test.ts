import { describe, expect, it } from 'vitest'
import {
  ENDLESS_ACT_ID,
  InsufficientGoldError,
  LootNotFoundError,
  applyAgentEvent,
  buyUpgrade,
  collectLoot,
  createInitialState,
  getUpgradeCost,
  STORY_ACTS,
  tickWorld,
  type AgentEvent,
} from '../index.js'

const FIXED_TIME = '2026-11-26T14:00:00.000Z'
const DETERMINISTIC_OPTIONS = { rng: () => 0.4 }

function makeEvent(overrides: Partial<AgentEvent> = {}): AgentEvent {
  return {
    id: 'evt-1',
    source: 'antigravity',
    agentId: 'agy-1',
    agentName: 'Antigravity',
    modelTier: 'standard',
    kind: 'tool_call',
    toolName: 'read_file',
    timestamp: FIXED_TIME,
    ...overrides,
  }
}

describe('RPG domain engine', () => {
  it('spawns a hero and moves it to research zone when an agent calls read_file', () => {
    const initial = createInitialState(FIXED_TIME)
    expect(initial.heroes).toHaveLength(0)

    const next = applyAgentEvent(initial, makeEvent(), DETERMINISTIC_OPTIONS)

    expect(next.heroes).toHaveLength(1)
    const hero = next.heroes[0]!
    expect(hero.id).toBe('agy-1')
    expect(hero.zone).toBe('research')
    expect(hero.lastTool).toBe('read_file')
    expect(hero.activeSkill).toBeTruthy()
    expect(next.campaign.totalEventsProcessed).toBe(1)
  })

  it('activates a skill buff and deals amplified damage on the next strike when any skill is used', () => {
    let state = createInitialState(FIXED_TIME)
    state = applyAgentEvent(
      state,
      makeEvent({ id: 'e1', agentId: 'claude-1', source: 'claude-code', toolName: 'edit_file' }),
      DETERMINISTIC_OPTIONS,
    )

    const monsterBeforePlain = state.monsters.find((m) => m.zone === 'forge')!
    const hpBeforePlain = monsterBeforePlain.hp
    const afterPlainHit = applyAgentEvent(
      state,
      makeEvent({ id: 'e2', agentId: 'claude-1', source: 'claude-code', toolName: 'edit_file' }),
      DETERMINISTIC_OPTIONS,
    )
    const plainDamage = hpBeforePlain - (afterPlainHit.monsters.find((m) => m.id === monsterBeforePlain.id)?.hp ?? 0)

    const afterSkill = applyAgentEvent(
      state,
      makeEvent({
        id: 'e3',
        agentId: 'claude-1',
        source: 'claude-code',
        kind: 'skill_used',
        skillName: 'frontend-design',
      }),
      DETERMINISTIC_OPTIONS,
    )
    const buffedHero = afterSkill.heroes.find((h) => h.id === 'claude-1')!
    expect(buffedHero.buffSkill).toBe('frontend-design')
    expect(buffedHero.buffCharges).toBeGreaterThan(0)

    const monsterBeforeBuff = afterSkill.monsters.find((m) => m.zone === 'forge')!
    const hpBeforeBuff = monsterBeforeBuff.hp
    const afterBuffHit = applyAgentEvent(
      afterSkill,
      makeEvent({ id: 'e4', agentId: 'claude-1', source: 'claude-code', toolName: 'edit_file' }),
      DETERMINISTIC_OPTIONS,
    )
    const buffedDamage = hpBeforeBuff - (afterBuffHit.monsters.find((m) => m.id === monsterBeforeBuff.id)?.hp ?? 0)

    expect(buffedDamage).toBeGreaterThan(plainDamage)
  })

  it('counter-attacks the hero on tool error and sends a knocked-out hero to rest in the tavern', () => {
    let state = createInitialState(FIXED_TIME)
    state = applyAgentEvent(
      state,
      makeEvent({ id: 'e1', toolName: 'run_command' }),
      DETERMINISTIC_OPTIONS,
    )

    const hpInitial = state.heroes[0]!.hp
    state = applyAgentEvent(
      state,
      makeEvent({ id: 'e2', kind: 'tool_result', status: 'error', toolName: 'run_command' }),
      DETERMINISTIC_OPTIONS,
    )
    expect(state.heroes[0]!.hp).toBeLessThan(hpInitial)

    for (let i = 3; i < 30 && state.heroes[0]!.state !== 'resting'; i++) {
      state = applyAgentEvent(
        state,
        makeEvent({ id: `e${i}`, kind: 'tool_result', status: 'error', toolName: 'run_command' }),
        DETERMINISTIC_OPTIONS,
      )
    }

    expect(state.heroes[0]!.state).toBe('resting')
    expect(state.heroes[0]!.zone).toBe('tavern')
    expect(state.meta.stats.errors).toBeGreaterThan(0)

    // Resting hero recovers HP over ticks
    const hpWhileResting = state.heroes[0]!.hp
    for (let tick = 0; tick < 10; tick++) {
      state = tickWorld(state, FIXED_TIME)
    }
    expect(state.heroes[0]!.hp).toBeGreaterThan(hpWhileResting)
  })

  it('clears the five story acts, announces the victory and keeps going into the endless rift', () => {
    let state = createInitialState(FIXED_TIME)
    let eventCounter = 0

    while (state.campaign.act <= STORY_ACTS + 1 && eventCounter < 4000) {
      eventCounter += 1
      const zoneTools = ['read_file', 'edit_file', 'run_command', 'call_mcp_tool'] as const
      const toolName = zoneTools[eventCounter % zoneTools.length]!
      state = applyAgentEvent(
        state,
        makeEvent({
          id: `raid-${eventCounter}`,
          agentId: `hero-${eventCounter % 3}`,
          agentName: `Hero ${eventCounter % 3}`,
          modelTier: eventCounter % 3 === 0 ? 'deep' : 'standard',
          toolName,
        }),
        DETERMINISTIC_OPTIONS,
      )
    }

    expect(state.campaign.act).toBe(STORY_ACTS + 2)
    expect(state.campaign.actId).toBe(ENDLESS_ACT_ID)
    expect(state.campaign.highestActThisRun).toBe(STORY_ACTS + 2)
    expect(state.meta.highestActEver).toBe(STORY_ACTS + 2)
    expect(state.campaign.totalBossesDefeated).toBe(STORY_ACTS + 1)
    expect(state.battleLog.some((e) => e.code === 'campaign_victory')).toBe(true)
    expect(state.meta.relics.length).toBeGreaterThan(0)
    expect(state.party.level).toBeGreaterThan(1)
  })

  it('buys camp upgrades with gold and refuses purchases with insufficient gold', () => {
    const initial = createInitialState(FIXED_TIME)
    expect(() => buyUpgrade(initial, 'runic_anvil', FIXED_TIME)).toThrow(InsufficientGoldError)

    const cost = getUpgradeCost('runic_anvil', 0)
    const rich = {
      ...initial,
      party: { ...initial.party, gold: cost + 10, totalGoldEarned: cost + 10 },
    }

    const updated = buyUpgrade(rich, 'runic_anvil', FIXED_TIME)
    expect(updated.upgrades.runic_anvil).toBe(1)
    expect(updated.party.gold).toBe(10)
  })

  it('collects loot drops on click and rejects unknown loot ids', () => {
    const initial = createInitialState(FIXED_TIME)
    expect(() => collectLoot(initial, 'missing-loot', FIXED_TIME)).toThrow(LootNotFoundError)

    const withLoot = {
      ...initial,
      loot: [
        {
          id: 'loot-1',
          x: 200,
          y: 150,
          gold: 35,
          kind: 'chest' as const,
          createdAt: FIXED_TIME,
          ttlTicks: 100,
        },
      ],
    }

    const collected = collectLoot(withLoot, 'loot-1', FIXED_TIME)
    expect(collected.loot).toHaveLength(0)
    expect(collected.party.gold).toBe(35)
  })
})
