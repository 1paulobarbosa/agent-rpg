import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { createInitialState } from '@agent-rpg/game-core'
import { findHitTarget } from '../game/hit-test.js'
import { fetchGameState } from '../shared/api/client.js'
import { CampShop } from '../widgets/camp-shop.js'
import { HeroInspector } from '../widgets/hero-inspector.js'
import { AscensionPanel } from '../widgets/ascension-panel.js'
import { QuestsPanel } from '../widgets/quests-panel.js'
import { TrophiesPanel } from '../widgets/trophies-panel.js'
import { VictoryModal } from '../widgets/victory-modal.js'
import { formatCompact } from './format.js'

describe('Web client contract & RPG UI', () => {
  it('parses a valid GameSnapshot from /api/state and rejects broken payloads', async () => {
    const snapshot = createInitialState('2026-11-26T14:30:00.000Z')
    const valid = await fetchGameState(async () => ({
      ok: true,
      status: 200,
      json: async () => snapshot,
    }))
    expect(valid.campaign.act).toBe(1)

    await expect(
      fetchGameState(async () => ({
        ok: true,
        status: 200,
        json: async () => ({ broken: true }),
      })),
    ).rejects.toThrow()
  })

  it('finds clickable loot before heroes at a canvas coordinate', () => {
    const base = createInitialState('2026-11-26T14:30:00.000Z')
    const state = {
      ...base,
      loot: [
        {
          id: 'chest-1',
          x: 120,
          y: 120,
          gold: 20,
          kind: 'chest' as const,
          createdAt: '2026-11-26T14:30:00.000Z',
          ttlTicks: 80,
        },
      ],
    }

    expect(findHitTarget(state, 122, 118)).toEqual({ kind: 'loot', id: 'chest-1' })
    expect(findHitTarget(state, 500, 300)).toBeNull()
  })

  it('renders empty state in HeroInspector when no hero is active yet', () => {
    const empty = createInitialState('2026-11-26T14:30:00.000Z')
    render(<HeroInspector snapshot={empty} selectedHeroId={null} onSelectHero={() => {}} />)
    expect(screen.getByText(/no active agents yet/i)).toBeInTheDocument()
  })

  it('enables affordable upgrades in CampShop and emits buy callback on click', () => {
    const base = createInitialState('2026-11-26T14:30:00.000Z')
    const rich = { ...base, party: { ...base.party, gold: 50, totalGoldEarned: 50 } }
    const onBuy = vi.fn()

    render(<CampShop snapshot={rich} busy={false} onBuyUpgrade={onBuy} />)
    const anvilBtn = screen.getByRole('button', { name: /runic anvil/i })
    expect(anvilBtn).not.toBeDisabled()
    fireEvent.click(anvilBtn)
    expect(onBuy).toHaveBeenCalledWith('runic_anvil')
  })

  it('renders the Act V modal with keep going and ascend actions only when open', () => {
    const base = createInitialState('2026-11-26T14:30:00.000Z')
    const cleared = { ...base, campaign: { ...base.campaign, act: 6, highestActThisRun: 6, totalKills: 42 } }
    const onAscend = vi.fn()
    const { rerender } = render(
      <VictoryModal snapshot={cleared} open={false} onKeepGoing={() => {}} onAscend={onAscend} />,
    )
    expect(screen.queryByRole('dialog')).toBeNull()

    rerender(<VictoryModal snapshot={cleared} open onKeepGoing={() => {}} onAscend={onAscend} />)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /keep going/i })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /ascend: \+\d+ runes/i }))
    expect(onAscend).toHaveBeenCalled()
  })

  it('locks ascension before Act V and buys talents with runes', () => {
    const base = createInitialState('2026-11-26T14:30:00.000Z')
    const onAscend = vi.fn()
    const onBuy = vi.fn()
    const { rerender } = render(
      <AscensionPanel snapshot={base} busy={false} onAscend={onAscend} onBuyTalent={onBuy} />,
    )
    expect(screen.getByRole('button', { name: /reach act 5 to ascend/i })).toBeDisabled()
    expect(screen.getByRole('button', { name: /^buy sharpened steel$/i })).toBeDisabled()

    const rich = {
      ...base,
      campaign: { ...base.campaign, act: 7, highestActThisRun: 7 },
      meta: { ...base.meta, runes: 50 },
    }
    rerender(<AscensionPanel snapshot={rich} busy={false} onAscend={onAscend} onBuyTalent={onBuy} />)
    fireEvent.click(screen.getByRole('button', { name: /ascend: \+\d+ runes/i }))
    expect(onAscend).toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: /^max sharpened steel$/i }))
    expect(onBuy).toHaveBeenCalledWith('sharpened_steel', true)
  })

  it('shows today\'s quests with progress, and every relic slot and achievement', () => {
    const base = createInitialState('2026-11-26T14:30:00.000Z')
    render(<QuestsPanel snapshot={base} />)
    expect(screen.getAllByText(/\d+\/\d+/).length).toBe(5)

    const withRelic = { ...base, meta: { ...base.meta, relics: ['test_totem' as const] } }
    render(<TrophiesPanel snapshot={withRelic} />)
    expect(screen.getByText('Test Totem')).toBeInTheDocument()
    expect(screen.getAllByText('???')).toHaveLength(9)
    expect(screen.getByText(/achievements 0\/20/i)).toBeInTheDocument()
  })

  it('formats huge numbers compactly', () => {
    expect(formatCompact(950)).toBe('950')
    expect(formatCompact(12_345)).toBe('12.3K')
    expect(formatCompact(4_560_000)).toBe('4.56M')
    expect(formatCompact(7.2e30)).toBe('7.20e30')
    expect(formatCompact(Infinity)).toBe('∞')
  })
})
