import { act, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { BattleLogEntrySchema, createInitialState } from '@agent-rpg/game-core'
import { CampShop } from '../../widgets/camp-shop.js'
import { EN } from './en.js'
import { detectLocale, getLocale, setLocale } from './locale-store.js'
import { PT_BR } from './pt-br.js'

function keysOf(value: unknown, prefix = ''): string[] {
  if (typeof value !== 'object' || value === null) return [prefix]
  return Object.entries(value).flatMap(([key, child]) => keysOf(child, prefix ? `${prefix}.${key}` : key))
}

describe('i18n', () => {
  afterEach(() => act(() => setLocale('en')))

  it('keeps English and Portuguese copy in the same shape', () => {
    expect(keysOf(PT_BR).sort()).toEqual(keysOf(EN).sort())
  })

  it('defaults to English, picks pt-BR for Portuguese browsers and honours a saved choice', () => {
    expect(detectLocale(null, 'en-US')).toBe('en')
    expect(detectLocale(null, undefined)).toBe('en')
    expect(detectLocale(null, 'pt-BR')).toBe('pt-BR')
    expect(detectLocale('en', 'pt-BR')).toBe('en')
    expect(detectLocale('klingon', 'en-GB')).toBe('en')
  })

  it('re-renders widgets in Portuguese after the toggle and persists the choice', () => {
    const state = createInitialState('2026-11-26T14:30:00.000Z')
    render(<CampShop snapshot={state} busy={false} onBuyUpgrade={() => {}} />)
    expect(screen.getByText('CAMP SHOP')).toBeInTheDocument()

    act(() => setLocale('pt-BR'))
    expect(getLocale()).toBe('pt-BR')
    expect(screen.getByText('LOJA DO ACAMPAMENTO')).toBeInTheDocument()
    expect(localStorage.getItem('agent-rpg.locale')).toBe('pt-BR')
    expect(document.documentElement.lang).toBe('pt-BR')
  })

  it('formats every battle log code in both languages without Singularity-specific text', () => {
    const codes = BattleLogEntrySchema.shape.code.options
    for (const copy of [EN, PT_BR]) {
      for (const code of codes) {
        const line = copy.battleLog(
          { id: 'x', timestamp: '2026-11-26T14:30:00.000Z', code, actor: 'Hero', detail: 'mage', amount: 3 },
          () => 'Slime',
        )
        expect(line.length).toBeGreaterThan(0)
      }
      expect(JSON.stringify(copy.errors)).not.toMatch(/singularity/i)
    }
  })
})
