import { describe, expect, it } from 'vitest'
import { zoneForTool } from './skill-mapper.js'

describe('zoneForTool', () => {
  it('sends each kind of tool to its zone, for Claude Code and Antigravity names', () => {
    expect(zoneForTool('Read')).toBe('research')
    expect(zoneForTool('Grep')).toBe('research')
    expect(zoneForTool('Edit')).toBe('forge')
    expect(zoneForTool('write_file')).toBe('forge')
    expect(zoneForTool('Bash')).toBe('arena')
    expect(zoneForTool('run_command')).toBe('arena')
    expect(zoneForTool('Task')).toBe('citadel')
    expect(zoneForTool('mcp__figma__get_file')).toBe('citadel')
  })

  it('treats an unknown tool as research', () => {
    expect(zoneForTool('SomethingNew')).toBe('research')
  })
})
