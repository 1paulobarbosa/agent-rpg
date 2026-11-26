import type { AgentEvent } from '../contracts/agent-event.js'
import type { HeroClass, SkillEffect, ZoneId } from '../contracts/game-snapshot.js'

export interface MappedAction {
  readonly zone: ZoneId
  readonly skillKey: string
  readonly basePower: number
  readonly effectKind: SkillEffect['kind']
  readonly effectColor: string
}

const READ_TOOLS = new Set([
  'read_file',
  'Read',
  'Grep',
  'Glob',
  'search_web',
  'WebSearch',
  'WebFetch',
  'list_resources',
  'read_resource',
  'ToolSearch',
])

const FORGE_TOOLS = new Set([
  'write_file',
  'edit_file',
  'Write',
  'Edit',
  'MultiEdit',
  'NotebookEdit',
])

const ARENA_TOOLS = new Set([
  'run_command',
  'Bash',
  'manage_task',
  'run_workflow',
])

const CITADEL_TOOLS = new Set([
  'invoke_subagent',
  'define_subagent',
  'send_message',
  'Agent',
  'Task',
  'Skill',
  'call_mcp_tool',
  'swarm',
])

/** Maps an incoming agent event into a map biome, RPG skill key, power and visual effect. */
export function mapEventToAction(event: AgentEvent): MappedAction {
  if (event.kind === 'skill_used' || event.skillName) {
    return {
      zone: 'citadel',
      skillKey: event.skillName ?? 'arcane_skill',
      basePower: 38,
      effectKind: 'aura',
      effectColor: '#c084fc',
    }
  }

  if (event.kind === 'subagent_spawn') {
    return {
      zone: 'citadel',
      skillKey: 'summon_ally',
      basePower: 34,
      effectKind: 'shield',
      effectColor: '#38bdf8',
    }
  }

  const tool = event.toolName ?? ''
  if (FORGE_TOOLS.has(tool)) {
    return {
      zone: 'forge',
      skillKey: 'forge_strike',
      basePower: 34,
      effectKind: 'slash',
      effectColor: '#fb923c',
    }
  }

  if (ARENA_TOOLS.has(tool)) {
    return {
      zone: 'arena',
      skillKey: 'arena_volley',
      basePower: 32,
      effectKind: 'arrow',
      effectColor: '#facc15',
    }
  }

  if (CITADEL_TOOLS.has(tool) || tool.startsWith('mcp__')) {
    return {
      zone: 'citadel',
      skillKey: 'arcane_bolt',
      basePower: 35,
      effectKind: 'bolt',
      effectColor: '#a78bfa',
    }
  }

  if (READ_TOOLS.has(tool)) {
    return {
      zone: 'research',
      skillKey: 'scout_radar',
      basePower: 26,
      effectKind: 'bolt',
      effectColor: '#34d399',
    }
  }

  return {
    zone: 'research',
    skillKey: 'basic_strike',
    basePower: 24,
    effectKind: 'slash',
    effectColor: '#94a3b8',
  }
}

/** Deterministically selects a hero class based on model tier, role hints and agent id. */
export function resolveHeroClass(event: AgentEvent): HeroClass {
  const lowered = `${event.agentName} ${event.agentId}`.toLowerCase()
  if (lowered.includes('security') || lowered.includes('paladin') || lowered.includes('guard')) {
    return 'paladin'
  }
  if (lowered.includes('test') || lowered.includes('qa') || lowered.includes('ranger')) {
    return 'ranger'
  }
  if (lowered.includes('scout') || lowered.includes('research') || event.modelTier === 'fast') {
    return 'rogue'
  }
  if (lowered.includes('architect') || lowered.includes('review') || event.modelTier === 'deep') {
    return 'mage'
  }
  if (event.source === 'claude-code') return 'mage'
  if (event.source === 'antigravity') return 'knight'

  const classes: readonly HeroClass[] = ['knight', 'mage', 'rogue', 'ranger', 'paladin']
  let hash = 0
  for (let i = 0; i < event.agentId.length; i++) {
    hash = (hash * 31 + event.agentId.charCodeAt(i)) >>> 0
  }
  return classes[hash % classes.length]!
}

/** The zone a tool sends a hero to. Same rules as the combat mapping, for UI legends and labels. */
export function zoneForTool(toolName: string): ZoneId {
  return mapEventToAction({
    id: 'zone-probe',
    source: 'simulator',
    agentId: 'zone-probe',
    agentName: 'zone-probe',
    kind: 'tool_call',
    toolName,
    timestamp: '',
  }).zone
}
