import { afterEach, describe, expect, it } from 'vitest'
import { GameSnapshotSchema, type GameSnapshot } from '@agent-rpg/game-core'
import { SessionHub, type SaveStorePort } from '../application/session-hub.js'
import { createHttpServer } from '../http/server.js'

class InMemorySaveStore implements SaveStorePort {
  saved: GameSnapshot | null = null
  load(): GameSnapshot | null {
    return this.saved
  }
  save(snapshot: GameSnapshot): void {
    this.saved = snapshot
  }
}

describe('Watcher HTTP & SSE API contract', () => {
  let closeServer: (() => Promise<void>) | null = null

  afterEach(async () => {
    if (closeServer) {
      await closeServer()
      closeServer = null
    }
  })

  it('serves health, valid GameSnapshot state, SSE stream and processes validated client commands', async () => {
    const store = new InMemorySaveStore()
    const hub = new SessionHub({
      store,
      clock: () => '2026-11-26T14:20:00.000Z',
      rng: () => 0.4,
      initialSimulatorEnabled: false,
    })

    const server = createHttpServer(hub)
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()))
    closeServer = () => new Promise<void>((resolve) => server.close(() => resolve()))

    const address = server.address()
    if (!address || typeof address === 'string') throw new Error('Expected numeric port')
    const baseUrl = `http://127.0.0.1:${address.port}`

    const healthRes = await fetch(`${baseUrl}/api/health`)
    expect(healthRes.status).toBe(200)
    const health = (await healthRes.json()) as { status: string }
    expect(health.status).toBe('ok')

    const stateRes = await fetch(`${baseUrl}/api/state`)
    expect(stateRes.status).toBe(200)
    const parsedState = GameSnapshotSchema.parse(await stateRes.json())
    expect(parsedState.campaign.act).toBe(1)

    // Verify SSE /api/events sends an initial valid snapshot event
    const controller = new AbortController()
    const sseRes = await fetch(`${baseUrl}/api/events`, { signal: controller.signal })
    expect(sseRes.status).toBe(200)
    expect(sseRes.headers.get('content-type')).toContain('text/event-stream')
    const reader = sseRes.body!.getReader()
    const firstChunk = await reader.read()
    const sseText = new TextDecoder().decode(firstChunk.value)
    expect(sseText).toContain('event: snapshot')
    const dataLine = sseText.split('\n').find((l) => l.startsWith('data: '))
    expect(dataLine).toBeTruthy()
    GameSnapshotSchema.parse(JSON.parse(dataLine!.slice('data: '.length)))
    controller.abort()

    const raidRes = await fetch(`${baseUrl}/api/commands`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ type: 'trigger_raid' }),
    })
    expect(raidRes.status).toBe(200)
    const raidJson = (await raidRes.json()) as { ok: boolean; state: unknown }
    expect(raidJson.ok).toBe(true)
    const afterRaid = GameSnapshotSchema.parse(raidJson.state)
    expect(afterRaid.heroes.length).toBeGreaterThan(0)
    expect(store.saved).not.toBeNull()

    const badCommandRes = await fetch(`${baseUrl}/api/commands`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ type: 'buy_upgrade', upgradeId: 'runic_anvil' }),
    })
    expect(badCommandRes.status).toBe(400)
    const badJson = (await badCommandRes.json()) as { code: string }
    expect(badJson.code).toBe('INSUFFICIENT_GOLD')

    const invalidShapeRes = await fetch(`${baseUrl}/api/commands`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ type: 'unknown_hack' }),
    })
    expect(invalidShapeRes.status).toBe(400)

    const lockedAscendRes = await fetch(`${baseUrl}/api/commands`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ type: 'ascend' }),
    })
    expect(lockedAscendRes.status).toBe(400)
    expect(((await lockedAscendRes.json()) as { code: string }).code).toBe('ASCENSION_LOCKED')

    const talentRes = await fetch(`${baseUrl}/api/commands`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ type: 'buy_talent', talentId: 'sharpened_steel', max: true }),
    })
    expect(((await talentRes.json()) as { code: string }).code).toBe('INSUFFICIENT_RUNES')
  })
})
