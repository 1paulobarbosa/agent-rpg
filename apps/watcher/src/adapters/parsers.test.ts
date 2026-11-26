import { describe, expect, it } from 'vitest'
import { parseAntigravityLine } from './antigravity-parser.js'
import { parseClaudeCodeLine } from './claude-parser.js'

const SECRET_TOKEN = 'sk-super-secret-value-99887766'

describe('Antigravity JSONL parser', () => {
  it('extracts tool calls and skills while stripping all sensitive content', () => {
    const line = JSON.stringify({
      step_index: 4,
      source: 'MODEL',
      type: 'PLANNER_RESPONSE',
      status: 'DONE',
      created_at: '2026-11-26T14:10:00Z',
      thinking: `Do not leak ${SECRET_TOKEN}`,
      tool_calls: [
        {
          name: 'read_file',
          args: {
            Path: '/Users/dev/.gemini/config/plugins/acme/skills/security-review/SKILL.md',
          },
        },
        {
          name: 'edit_file',
          args: {
            Path: '/Users/dev/projects/demo-app/src/engine.ts',
            Replacement: `const password = "${SECRET_TOKEN}"`,
          },
        },
      ],
    })

    const events = parseAntigravityLine(line, 'conv-abc12345')
    expect(events.length).toBeGreaterThanOrEqual(2)

    const skillEvent = events.find((e) => e.kind === 'skill_used')
    expect(skillEvent?.skillName).toBe('security-review')

    const editEvent = events.find((e) => e.toolName === 'edit_file')
    expect(editEvent?.targetFile).toBe('engine.ts')

    expect(JSON.stringify(events)).not.toContain(SECRET_TOKEN)
  })

  it('detects command errors from Antigravity tool result lines without leaking stdout', () => {
    const line = JSON.stringify({
      step_index: 5,
      source: 'MODEL',
      type: 'GENERIC',
      status: 'DONE',
      created_at: '2026-11-26T14:10:05Z',
      content: `Command exited with code 1\nDATABASE_URL=${SECRET_TOKEN}`,
    })

    const events = parseAntigravityLine(line, 'conv-abc12345')
    expect(events).toHaveLength(1)
    expect(events[0]!.kind).toBe('tool_result')
    expect(events[0]!.status).toBe('error')
    expect(JSON.stringify(events)).not.toContain(SECRET_TOKEN)
  })

  it('ignores malformed lines gracefully', () => {
    expect(parseAntigravityLine('{not valid json', 'conv-1')).toEqual([])
  })
})

describe('Claude Code JSONL parser', () => {
  it('extracts tool_use, Skill invocations, model tier and tool_result errors safely', () => {
    const assistantLine = JSON.stringify({
      type: 'assistant',
      sessionId: 'claude-sess-9988',
      timestamp: '2026-11-26T14:12:00Z',
      message: {
        role: 'assistant',
        model: 'claude-opus-4-6',
        content: [
          { type: 'text', text: `Secret prompt ${SECRET_TOKEN}` },
          { type: 'tool_use', id: 'tu-1', name: 'Skill', input: { skill: 'webapp-testing' } },
          { type: 'tool_use', id: 'tu-2', name: 'Bash', input: { command: `echo ${SECRET_TOKEN}` } },
        ],
      },
    })

    const events = parseClaudeCodeLine(assistantLine, 'fallback')
    expect(events).toHaveLength(2)
    expect(events[0]!.kind).toBe('skill_used')
    expect(events[0]!.skillName).toBe('webapp-testing')
    expect(events[0]!.modelTier).toBe('deep')
    expect(events[1]!.toolName).toBe('Bash')
    expect(JSON.stringify(events)).not.toContain(SECRET_TOKEN)

    const errorResultLine = JSON.stringify({
      type: 'user',
      sessionId: 'claude-sess-9988',
      timestamp: '2026-11-26T14:12:05Z',
      message: {
        role: 'user',
        content: [
          { type: 'tool_result', tool_use_id: 'tu-2', is_error: true, content: `boom ${SECRET_TOKEN}` },
        ],
      },
    })

    const errEvents = parseClaudeCodeLine(errorResultLine, 'fallback')
    expect(errEvents).toHaveLength(1)
    expect(errEvents[0]!.kind).toBe('tool_result')
    expect(errEvents[0]!.status).toBe('error')
    expect(JSON.stringify(errEvents)).not.toContain(SECRET_TOKEN)
  })
})
