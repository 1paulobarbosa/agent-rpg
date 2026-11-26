import path from 'node:path'
import type { AgentEvent } from '@agent-rpg/game-core'

interface RawToolCall {
  name?: unknown
  args?: Record<string, unknown>
}

interface RawAntigravityLine {
  step_index?: unknown
  source?: unknown
  type?: unknown
  status?: unknown
  created_at?: unknown
  content?: unknown
  tool_calls?: unknown
}

const SKILL_PATH_PATTERN = /\/skills\/([a-zA-Z0-9_-]{1,64})\/SKILL\.md$/i
const SAFE_NAME_PATTERN = /^[a-zA-Z0-9_.:-]{1,80}$/
const EXIT_CODE_PATTERN = /Command exited with code (\d+)/

function safeFileBasename(rawPath: unknown): string | undefined {
  if (typeof rawPath !== 'string' || !rawPath.trim()) return undefined
  const base = path.basename(rawPath.trim())
  if (!base || base.startsWith('.env')) return undefined
  return base.slice(0, 80)
}

function safeIdentifier(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  return SAFE_NAME_PATTERN.test(trimmed) ? trimmed : undefined
}

/** Parses one Antigravity transcript.jsonl line into sanitized AgentEvent items. */
export function parseAntigravityLine(line: string, sessionId: string): AgentEvent[] {
  if (!line.trim()) return []
  let parsed: RawAntigravityLine
  try {
    parsed = JSON.parse(line) as RawAntigravityLine
  } catch {
    return []
  }

  const shortId = sessionId.replace(/[^a-zA-Z0-9-]/g, '').slice(0, 8) || 'local'
  const agentId = `agy-${shortId}`
  const agentName = `AGY-${shortId.slice(0, 4).toUpperCase()}`
  const timestamp = typeof parsed.created_at === 'string' ? parsed.created_at : new Date().toISOString()
  const stepIndex = typeof parsed.step_index === 'number' ? parsed.step_index : 0
  const events: AgentEvent[] = []

  if (parsed.type === 'PLANNER_RESPONSE' && Array.isArray(parsed.tool_calls)) {
    parsed.tool_calls.forEach((raw, idx) => {
      const call = raw as RawToolCall
      const toolName = safeIdentifier(call?.name)
      if (!toolName) return

      const rawPath = call.args?.Path ?? call.args?.path ?? call.args?.ScriptPath
      if (typeof rawPath === 'string') {
        const skillMatch = rawPath.match(SKILL_PATH_PATTERN)
        if (skillMatch?.[1]) {
          events.push({
            id: `${agentId}-${stepIndex}-skill-${idx}`,
            source: 'antigravity',
            agentId,
            agentName,
            modelTier: 'standard',
            kind: 'skill_used',
            skillName: skillMatch[1],
            toolName,
            timestamp,
          })
          return
        }
      }

      const kind =
        toolName === 'invoke_subagent' || toolName === 'run_workflow'
          ? 'subagent_spawn'
          : 'tool_call'

      events.push({
        id: `${agentId}-${stepIndex}-tool-${idx}`,
        source: 'antigravity',
        agentId,
        agentName,
        modelTier: kind === 'subagent_spawn' ? 'deep' : 'standard',
        kind,
        toolName,
        targetFile: safeFileBasename(rawPath),
        timestamp,
      })
    })
  }

  if (parsed.type === 'GENERIC' && typeof parsed.content === 'string') {
    const exitMatch = parsed.content.match(EXIT_CODE_PATTERN)
    if (exitMatch?.[1]) {
      const code = Number(exitMatch[1])
      events.push({
        id: `${agentId}-${stepIndex}-cmd`,
        source: 'antigravity',
        agentId,
        agentName,
        kind: 'tool_result',
        toolName: 'run_command',
        status: code === 0 ? 'ok' : 'error',
        timestamp,
      })
    }
  }

  return events
}
