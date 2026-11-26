import { describe, expect, it } from 'vitest'
import { createInitialState, type GameSnapshot } from '@agent-rpg/game-core'
import { JuiceDirector } from './juice.js'
import { detectJuiceEvents } from './juice-events.js'

const NOW = '2026-11-26T14:30:00.000Z'

function withLog(state: GameSnapshot, entries: GameSnapshot['battleLog']): GameSnapshot {
  return { ...state, battleLog: [...entries, ...state.battleLog] }
}

describe('detectJuiceEvents', () => {
  it('turns only new crits, hits, kills and boss moments into effects', () => {
    const base = createInitialState(NOW)
    const next: GameSnapshot = withLog(
      {
        ...base,
        floatingTexts: [
          { id: 'c', x: 10, y: 10, text: 'CRIT -40!', tone: 'crit', ttlTicks: 5 },
          { id: 'h', x: 20, y: 20, text: '-9', tone: 'enemy', ttlTicks: 5 },
          { id: 'x', x: 30, y: 30, text: '+9 XP', tone: 'xp', ttlTicks: 5 },
        ],
      },
      [
        { id: 'b2', timestamp: NOW, code: 'relic_found', actor: 'Hero', detail: 'crit_dice' },
        { id: 'b1', timestamp: NOW, code: 'boss_slain', actor: 'Hero', target: 'flaky_hydra' },
      ],
    )

    const kinds = detectJuiceEvents(base, next).map((e) => e.kind)
    expect(kinds).toEqual(['crit', 'heroHit', 'goldBurst', 'bossDefeat', 'relic'])
    expect(detectJuiceEvents(next, next)).toEqual([])
  })

  it('reads the boss affix for the intro banner', () => {
    const base = createInitialState(NOW)
    const boss = { ...base.monsters[0]!, id: 'boss', kind: 'boss' as const, templateId: 'flaky_hydra', affix: 'swift' as const }
    const next = withLog({ ...base, monsters: [...base.monsters, boss] }, [
      { id: 'spawn', timestamp: NOW, code: 'boss_spawned', actor: 'flaky_hydra', amount: 8 },
    ])
    expect(detectJuiceEvents(base, next)).toEqual([{ kind: 'bossIntro', templateId: 'flaky_hydra', affix: 'swift' }])
  })
})

describe('JuiceDirector', () => {
  it('freezes the world on a boss kill, shakes, then settles', () => {
    const juice = new JuiceDirector(false, () => 0.9)
    juice.apply([{ kind: 'bossDefeat', templateId: 'flaky_hydra' }])
    expect(juice.frozen).toBe(true)
    expect(juice.shakeOffset()).not.toEqual({ x: 0, y: 0 })
    for (let i = 0; i < 200; i++) juice.step()
    expect(juice.frozen).toBe(false)
    expect(juice.shakeOffset()).toEqual({ x: 0, y: 0 })
    expect(juice.activeBanner).toBeNull()
  })

  it('queues banners so a relic does not hide the boss defeat', () => {
    const juice = new JuiceDirector(false)
    juice.apply([
      { kind: 'bossDefeat', templateId: 'flaky_hydra' },
      { kind: 'relic', relicId: 'crit_dice' },
    ])
    expect(juice.activeBanner).toBe('bossDefeat')
    for (let i = 0; i < 160; i++) juice.step()
    expect(juice.activeBanner).toBe('relic')
  })

  it('with reduced motion keeps banners but never shakes or freezes', () => {
    const juice = new JuiceDirector(true, () => 0.9)
    juice.apply([{ kind: 'bossDefeat', templateId: 'flaky_hydra' }, { kind: 'crit', x: 1, y: 1 }])
    expect(juice.frozen).toBe(false)
    expect(juice.shakeOffset()).toEqual({ x: 0, y: 0 })
    expect(juice.activeBanner).toBe('bossDefeat')
  })
})
