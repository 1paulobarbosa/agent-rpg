import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { startWatcher, type RunningWatcher } from './app.js'
import type { WatcherConfig } from './config.js'

describe('startWatcher', () => {
  let tmp = ''
  let running: RunningWatcher | null = null

  beforeEach(() => {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'agent-rpg-app-'))
  })

  afterEach(async () => {
    await running?.close()
    running = null
    fs.rmSync(tmp, { recursive: true, force: true })
  })

  function configWith(overrides: Partial<WatcherConfig>): WatcherConfig {
    return {
      host: '127.0.0.1',
      port: 0,
      savePath: path.join(tmp, 'save.json'),
      antigravityDir: path.join(tmp, 'missing-agy'),
      claudeDir: path.join(tmp, 'missing-claude'),
      simulatorDefault: false,
      staticDir: null,
      ...overrides,
    }
  }

  it('turns the demo on when autoDemo is set and no agent log folder exists', async () => {
    running = await startWatcher(configWith({}), { autoDemo: true })
    expect(running.autoDemoEnabled).toBe(true)

    const health = (await (await fetch(`${running.url}/api/health`)).json()) as {
      sources: { simulator: boolean }
    }
    expect(health.sources.simulator).toBe(true)
  })

  it('keeps the demo off when a Claude Code log folder exists', async () => {
    const claudeDir = path.join(tmp, 'claude', 'projects')
    fs.mkdirSync(claudeDir, { recursive: true })
    running = await startWatcher(configWith({ claudeDir }), { autoDemo: true })
    expect(running.autoDemoEnabled).toBe(false)
  })

  it('rejects with EADDRINUSE when the port is taken', async () => {
    running = await startWatcher(configWith({}))
    await expect(startWatcher(configWith({ port: running.port }))).rejects.toMatchObject({
      code: 'EADDRINUSE',
    })
  })
})
