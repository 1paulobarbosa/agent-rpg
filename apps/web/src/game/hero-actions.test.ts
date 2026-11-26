import { describe, expect, it } from 'vitest'
import { createInitialState, type GameSnapshot, type Hero } from '@agent-rpg/game-core'
import { actionBalloonText, detectHeroActions } from './hero-actions.js'

const NOW = '2026-11-26T14:30:00.000Z'

function hero(overrides: Partial<Hero>): Hero {
  return {
    id: 'h1',
    name: 'Sonnet Smith',
    source: 'claude-code',
    heroClass: 'knight',
    level: 1,
    hp: 100,
    maxHp: 100,
    xp: 0,
    zone: 'forge',
    x: 0,
    y: 0,
    targetX: 0,
    targetY: 0,
    state: 'attacking',
    activeSkill: null,
    buffSkill: null,
    buffCharges: 0,
    lastTool: 'Edit',
    lastFile: 'auth.ts',
    kills: 0,
    damageDealt: 10,
    lastActiveAt: NOW,
    actionTicks: 0,
    ...overrides,
  }
}

function withHeroes(heroes: Hero[]): GameSnapshot {
  return { ...createInitialState(NOW), heroes }
}

describe('detectHeroActions', () => {
  it('reports the tool, file, damage and the monster of the zone', () => {
    const prev = withHeroes([hero({})])
    const next = withHeroes([hero({ damageDealt: 44, lastActiveAt: '2026-11-26T14:30:05.000Z' })])
    const [action] = detectHeroActions(prev, next)
    expect(action).toMatchObject({ heroName: 'Sonnet Smith', tool: 'Edit', file: 'auth.ts', damage: 34, failed: false })
    expect(action?.targetTemplateId).toBe(next.monsters.find((m) => m.zone === 'forge')?.templateId)
  })

  it('marks a failed command when the hero lost HP', () => {
    const prev = withHeroes([hero({ zone: 'arena', lastTool: 'Bash', lastFile: null })])
    const next = withHeroes([hero({ zone: 'arena', lastTool: 'Bash', lastFile: null, hp: 80, lastActiveAt: '2026-11-26T14:30:05.000Z' })])
    expect(detectHeroActions(prev, next)[0]?.failed).toBe(true)
  })

  it('ignores heroes that did nothing since the last snapshot', () => {
    const state = withHeroes([hero({})])
    expect(detectHeroActions(state, state)).toEqual([])
  })
})

describe('actionBalloonText', () => {
  it('uses the icon of the tool, not of the zone the hero stands in', () => {
    expect(actionBalloonText({ tool: 'Edit', file: 'auth.ts', zone: 'citadel' })).toBe('✎ Edit auth.ts')
    expect(actionBalloonText({ tool: 'Bash', file: null, zone: 'citadel' })).toBe('▶ Bash')
  })

  it('cuts long file names', () => {
    const text = actionBalloonText({ tool: 'Read', file: 'a-very-long-component-name.tsx', zone: 'research' })
    expect(text).toHaveLength(24)
    expect(text.endsWith('…')).toBe(true)
  })
})
