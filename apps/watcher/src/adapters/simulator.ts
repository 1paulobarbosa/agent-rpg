import type { AgentEvent } from '@agent-rpg/game-core'

interface DemoHeroProfile {
  readonly agentId: string
  readonly agentName: string
  readonly modelTier: 'fast' | 'standard' | 'deep'
  readonly preferredTools: readonly string[]
  readonly skills: readonly string[]
  readonly files: readonly string[]
}

const DEMO_PARTY: readonly DemoHeroProfile[] = [
  {
    agentId: 'demo-architect',
    agentName: 'Opus Architect',
    modelTier: 'deep',
    preferredTools: ['read_file', 'invoke_subagent', 'call_mcp_tool'],
    skills: ['brainstorming', 'writing-plans', 'api-design'],
    files: ['engine.ts', 'schema.sql', 'contracts.ts'],
  },
  {
    agentId: 'demo-builder',
    agentName: 'Sonnet Smith',
    modelTier: 'standard',
    preferredTools: ['edit_file', 'write_file', 'read_file'],
    skills: ['frontend-design', 'test-driven-development', 'simplify'],
    files: ['combat.ts', 'game-canvas.tsx', 'server.ts'],
  },
  {
    agentId: 'demo-tester',
    agentName: 'QA Ranger',
    modelTier: 'standard',
    preferredTools: ['run_command', 'Bash', 'read_file'],
    skills: ['webapp-testing', 'verification-before-completion'],
    files: ['engine.test.ts', 'parsers.test.ts', 'server.test.ts'],
  },
  {
    agentId: 'demo-paladin',
    agentName: 'Security Paladin',
    modelTier: 'deep',
    preferredTools: ['call_mcp_tool', 'read_file', 'run_command'],
    skills: ['security-review', 'code-review'],
    files: ['antigravity-parser.ts', 'claude-parser.ts', 'config.ts'],
  },
]

/** Generates deterministic or random demo RPG events to showcase and test the game. */
export class RaidSimulator {
  private counter = 0

  constructor(
    private readonly clock: () => string,
    private readonly rng: () => number,
  ) {}

  nextEvent(): AgentEvent {
    this.counter += 1
    const hero = DEMO_PARTY[Math.floor(this.rng() * DEMO_PARTY.length) % DEMO_PARTY.length]!
    const roll = this.rng()
    const timestamp = this.clock()

    if (roll < 0.18) {
      const skillName = hero.skills[this.counter % hero.skills.length]!
      return {
        id: `sim-${this.counter}`,
        source: 'simulator',
        agentId: hero.agentId,
        agentName: hero.agentName,
        modelTier: hero.modelTier,
        kind: 'skill_used',
        skillName,
        timestamp,
      }
    }

    if (roll < 0.28) {
      return {
        id: `sim-${this.counter}`,
        source: 'simulator',
        agentId: hero.agentId,
        agentName: hero.agentName,
        modelTier: hero.modelTier,
        kind: 'tool_result',
        toolName: 'run_command',
        status: 'error',
        timestamp,
      }
    }

    const toolName = hero.preferredTools[this.counter % hero.preferredTools.length]!
    const targetFile = hero.files[this.counter % hero.files.length]!
    return {
      id: `sim-${this.counter}`,
      source: 'simulator',
      agentId: hero.agentId,
      agentName: hero.agentName,
      modelTier: hero.modelTier,
      kind: 'tool_call',
      toolName,
      targetFile,
      timestamp,
    }
  }

  /** Produces an energetic 6-event raid burst across the whole party. */
  generateRaidBurst(): AgentEvent[] {
    const events: AgentEvent[] = []
    for (let i = 0; i < 6; i++) {
      this.counter += 1
      const hero = DEMO_PARTY[i % DEMO_PARTY.length]!
      const isSkill = i === 0 || i === 3
      events.push({
        id: `sim-burst-${this.counter}`,
        source: 'simulator',
        agentId: hero.agentId,
        agentName: hero.agentName,
        modelTier: hero.modelTier,
        kind: isSkill ? 'skill_used' : 'tool_call',
        skillName: isSkill ? hero.skills[this.counter % hero.skills.length] : undefined,
        toolName: isSkill ? undefined : hero.preferredTools[this.counter % hero.preferredTools.length],
        targetFile: hero.files[this.counter % hero.files.length],
        timestamp: this.clock(),
      })
    }
    return events
  }
}
