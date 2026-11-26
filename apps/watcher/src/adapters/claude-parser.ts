import path from 'node:path'
import type { AgentEvent, ModelTier } from '@agent-rpg/game-core'

interface ClaudeContentBlock {
  type?: unknown
  id?: unknown
  name?: unknown
  input?: Record<string, unknown>
  is_error?: unknown
  tool_use_id?: unknown
}

interface RawClaudeLine {
  type?: unknown
  sessionId?: unknown
  agentId?: unknown
  timestamp?: unknown
  message?: {
    role?: unknown
    model?: unknown
    content?: unknown
  }
}

const SAFE_TOKEN_PATTERN = /^[a-zA-Z0-9_.:/-]{1,80}$/

function detectModelTier(model: unknown): ModelTier {
  if (typeof model !== 'string') return 'standard'
  const lowered = model.toLowerCase()
  if (lowered.includes('opus')) return 'deep'
  if (lowered.includes('haiku')) return 'fast'
  return 'standard'
}

function safeToken(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  return SAFE_TOKEN_PATTERN.test(trimmed) ? trimmed : undefined
}

function safeFileBasename(input: Record<string, unknown> | undefined): string | undefined {
  if (!input) return undefined
  const candidate = input.file_path ?? input.path ?? input.notebook_path
  if (typeof candidate !== 'string' || !candidate.trim()) return undefined
  const base = path.basename(candidate.trim())
  if (!base || base.startsWith('.env')) return undefined
  return base.slice(0, 80)
}

/** Parses one Claude Code JSONL line into sanitized AgentEvent items. */
export function parseClaudeCodeLine(line: string, fallbackSessionId: string): AgentEvent[] {
  if (!line.trim()) return []
  let parsed: RawClaudeLine
  try {
    parsed = JSON.parse(line) as RawClaudeLine
  } catch {
    return []
  }

  const rawId =
    typeof parsed.agentId === 'string' && parsed.agentId.trim()
      ? parsed.agentId
      : typeof parsed.sessionId === 'string' && parsed.sessionId.trim()
        ? parsed.sessionId
        : fallbackSessionId
  const shortId = rawId.replace(/[^a-zA-Z0-9-]/g, '').slice(0, 8) || 'local'
  const agentId = `claude-${shortId}`
  const agentName = `CLAUDE-${shortId.slice(0, 4).toUpperCase()}`
  const timestamp = typeof parsed.timestamp === 'string' ? parsed.timestamp : new Date().toISOString()
  const content = parsed.message?.content
  if (!Array.isArray(content)) return []

  const events: AgentEvent[] = []
  const modelTier = detectModelTier(parsed.message?.model)

  if (parsed.type === 'assistant') {
    content.forEach((rawBlock, idx) => {
      const block = rawBlock as ClaudeContentBlock
      if (block?.type !== 'tool_use') return
      const toolName = safeToken(block.name)
      if (!toolName) return
      const blockId = typeof block.id === 'string' ? block.id.slice(0, 24) : String(idx)

      if (toolName === 'Skill') {
        const skillName = safeToken(block.input?.skill) ?? 'claude-skill'
        events.push({
          id: `${agentId}-${blockId}-skill`,
          source: 'claude-code',
          agentId,
          agentName,
          modelTier,
          kind: 'skill_used',
          toolName,
          skillName,
          timestamp,
        })
        return
      }

      const kind = toolName === 'Agent' || toolName === 'Task' ? 'subagent_spawn' : 'tool_call'
      events.push({
        id: `${agentId}-${blockId}-tool`,
        source: 'claude-code',
        agentId,
        agentName,
        modelTier,
        kind,
        toolName,
        targetFile: safeFileBasename(block.input),
        timestamp,
      })
    })
  }

  if (parsed.type === 'user') {
    content.forEach((rawBlock, idx) => {
      const block = rawBlock as ClaudeContentBlock
      if (block?.type !== 'tool_result') return
      if (block.is_error !== true) return
      const refId = typeof block.tool_use_id === 'string' ? block.tool_use_id.slice(0, 24) : String(idx)
      events.push({
        id: `${agentId}-${refId}-err`,
        source: 'claude-code',
        agentId,
        agentName,
        kind: 'tool_result',
        status: 'error',
        timestamp,
      })
    })
  }

  return events
}
