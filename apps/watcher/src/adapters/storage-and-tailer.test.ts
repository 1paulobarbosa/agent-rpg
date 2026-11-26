import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { createInitialState, type AgentEvent } from '@agent-rpg/game-core'
import { JsonlTailer } from './jsonl-tailer.js'
import { FileSaveStore } from './save-store.js'

describe('Watcher filesystem adapters', () => {
  const tempDirs: string[] = []

  afterEach(() => {
    for (const dir of tempDirs.splice(0)) {
      fs.rmSync(dir, { recursive: true, force: true })
    }
  })

  it('persists and restores a GameSnapshot atomically on disk', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'agent-rpg-save-'))
    tempDirs.push(dir)
    const savePath = path.join(dir, 'nested', 'save.json')
    const store = new FileSaveStore(savePath)

    expect(store.load()).toBeNull()

    const initial = createInitialState('2026-11-26T15:00:00.000Z')
    const modified = { ...initial, party: { ...initial.party, gold: 125, totalGoldEarned: 125 } }
    store.save(modified)

    const loaded = store.load()
    expect(loaded?.party.gold).toBe(125)
    expect(fs.existsSync(`${savePath}.tmp`)).toBe(false)
  })

  it('migrates a version 1 save and backs up a save it cannot read instead of losing it', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'agent-rpg-migrate-'))
    tempDirs.push(dir)
    const savePath = path.join(dir, 'save.json')
    const store = new FileSaveStore(savePath, () => new Date('2026-11-26T15:00:00.000Z'))

    const current = createInitialState('2026-11-26T15:00:00.000Z')
    const { meta: _meta, quests: _quests, ...rest } = current
    const v1 = {
      ...rest,
      version: 1,
      campaign: { ...rest.campaign, status: 'playing', newGamePlus: 1 },
      monsters: current.monsters.map(({ affix: _affix, ...m }) => m),
    }
    fs.writeFileSync(savePath, JSON.stringify(v1))
    expect(store.load()?.meta.ascensions).toBe(1)

    fs.writeFileSync(savePath, '{"version": 99, "broken": true}')
    expect(store.load()).toBeNull()
    const backups = fs.readdirSync(dir).filter((f) => f.includes('.unreadable-'))
    expect(backups).toHaveLength(1)
    expect(fs.readFileSync(path.join(dir, backups[0]!), 'utf8')).toContain('broken')
  })

  it('tails appended JSONL lines incrementally from Antigravity and Claude Code folders', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'agent-rpg-tail-'))
    tempDirs.push(dir)

    const agyLogDir = path.join(dir, 'agy', 'session-9999', '.system_generated', 'logs')
    const claudeProjDir = path.join(dir, 'claude', 'demo-proj')
    fs.mkdirSync(agyLogDir, { recursive: true })
    fs.mkdirSync(claudeProjDir, { recursive: true })

    const agyFile = path.join(agyLogDir, 'transcript.jsonl')
    const claudeFile = path.join(claudeProjDir, 'sess-1234.jsonl')
    fs.writeFileSync(agyFile, '', 'utf8')
    fs.writeFileSync(claudeFile, '', 'utf8')

    const captured: AgentEvent[] = []
    let latestSources = { antigravity: false, claudeCode: false }
    const tailer = new JsonlTailer(
      { antigravityDir: path.join(dir, 'agy'), claudeDir: path.join(dir, 'claude') },
      {
        onEvent: (evt) => captured.push(evt),
        onSourcesChanged: (src) => {
          latestSources = src
        },
      },
    )

    tailer.poll()
    expect(latestSources).toEqual({ antigravity: true, claudeCode: true })
    expect(captured).toHaveLength(0)

    fs.appendFileSync(
      agyFile,
      `${JSON.stringify({
        step_index: 1,
        type: 'PLANNER_RESPONSE',
        created_at: '2026-11-26T15:01:00Z',
        tool_calls: [{ name: 'write_file', args: { Path: '/tmp/hero.ts' } }],
      })}\n`,
    )
    fs.appendFileSync(
      claudeFile,
      `${JSON.stringify({
        type: 'assistant',
        sessionId: 'sess-1234',
        timestamp: '2026-11-26T15:01:01Z',
        message: {
          role: 'assistant',
          model: 'claude-sonnet-4-6',
          content: [{ type: 'tool_use', id: 'tu-9', name: 'Read', input: { file_path: '/tmp/app.ts' } }],
        },
      })}\n`,
    )

    tailer.poll()
    expect(captured).toHaveLength(2)
    expect(captured.map((e) => e.source).sort()).toEqual(['antigravity', 'claude-code'])

    // Polling again without new lines must not duplicate events.
    tailer.poll()
    expect(captured).toHaveLength(2)
  })
})
