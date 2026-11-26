import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { loadConfig, parsePort } from './config.js'

const HOME = path.resolve('/home/dev')

describe('loadConfig', () => {
  it('uses localhost defaults and ~/.claude/projects when nothing is set', () => {
    const config = loadConfig({}, HOME)
    expect(config.host).toBe('127.0.0.1')
    expect(config.port).toBe(4310)
    expect(config.claudeDir).toBe(path.join(HOME, '.claude', 'projects'))
    expect(config.staticDir).toBeNull()
  })

  it('reads Claude Code transcripts from CLAUDE_CONFIG_DIR when it is set', () => {
    const config = loadConfig({ CLAUDE_CONFIG_DIR: '/home/dev/.claude-work' }, HOME)
    expect(config.claudeDir).toBe(path.join('/home/dev/.claude-work', 'projects'))
  })

  it('lets AGENT_RPG_CLAUDE_DIR override CLAUDE_CONFIG_DIR', () => {
    const config = loadConfig(
      { CLAUDE_CONFIG_DIR: '/home/dev/.claude-work', AGENT_RPG_CLAUDE_DIR: '/logs/claude' },
      HOME,
    )
    expect(config.claudeDir).toBe('/logs/claude')
  })

  it('falls back to the default port when AGENT_RPG_PORT is invalid', () => {
    expect(loadConfig({ AGENT_RPG_PORT: '99999' }, HOME).port).toBe(4310)
    expect(loadConfig({ AGENT_RPG_PORT: '5000' }, HOME).port).toBe(5000)
  })
})

describe('parsePort', () => {
  it('accepts 1-65535 only', () => {
    expect(parsePort('8080')).toBe(8080)
    expect(parsePort('0')).toBeNull()
    expect(parsePort('abc')).toBeNull()
    expect(parsePort(undefined)).toBeNull()
  })
})
