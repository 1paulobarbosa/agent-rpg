import {
  applyAgentEvent,
  ascend,
  buyTalent,
  buyUpgrade,
  collectLoot,
  createInitialState,
  resetCampaign,
  setSourceStatus,
  tickWorld,
  type AgentEvent,
  type ClientCommand,
  type GameSnapshot,
  type SourcesStatus,
} from '@agent-rpg/game-core'
import { RaidSimulator } from '../adapters/simulator.js'

export interface SaveStorePort {
  load(): GameSnapshot | null
  save(snapshot: GameSnapshot): void
}

export interface SessionHubOptions {
  store: SaveStorePort
  clock?: () => string
  rng?: () => number
  initialSimulatorEnabled?: boolean
}

type Subscriber = (snapshot: GameSnapshot) => void

/** Coordinates RPG state transitions, persistence, demo raids and live SSE subscribers. */
export class SessionHub {
  private state: GameSnapshot
  private readonly store: SaveStorePort
  private readonly clock: () => string
  private readonly rng: () => number
  private readonly simulator: RaidSimulator
  private readonly subscribers = new Set<Subscriber>()
  private dirty = false
  private lastSavedAt = 0

  constructor(options: SessionHubOptions) {
    this.store = options.store
    this.clock = options.clock ?? (() => new Date().toISOString())
    this.rng = options.rng ?? Math.random
    this.simulator = new RaidSimulator(this.clock, this.rng)

    const loaded = this.store.load()
    const base = loaded ?? createInitialState(this.clock())
    this.state = setSourceStatus(base, { simulator: Boolean(options.initialSimulatorEnabled) })
  }

  getSnapshot(): GameSnapshot {
    return this.state
  }

  subscribe(listener: Subscriber): () => void {
    this.subscribers.add(listener)
    return () => {
      this.subscribers.delete(listener)
    }
  }

  updateSources(sources: Partial<SourcesStatus>): void {
    const prev = this.state.sources
    const next = { ...prev, ...sources }
    if (
      prev.antigravity === next.antigravity &&
      prev.claudeCode === next.claudeCode &&
      prev.simulator === next.simulator
    ) {
      return
    }
    this.state = setSourceStatus(this.state, next)
    this.broadcast()
  }

  ingestEvent(event: AgentEvent): GameSnapshot {
    this.state = applyAgentEvent(this.state, event, { rng: this.rng })
    this.dirty = true
    this.maybePersist(false)
    this.broadcast()
    return this.state
  }

  tick(): void {
    const before = this.state
    const hasTransientWork =
      before.heroes.length > 0 ||
      before.loot.length > 0 ||
      before.floatingTexts.length > 0 ||
      before.effects.length > 0 ||
      before.monsters.some((m) => m.hitFlashTicks > 0)

    if (!hasTransientWork) return

    this.state = tickWorld(before, this.clock())
    this.maybePersist(false)
    this.broadcast()
  }

  tickSimulator(): void {
    if (!this.state.sources.simulator) return
    this.ingestEvent(this.simulator.nextEvent())
  }

  executeCommand(command: ClientCommand): GameSnapshot {
    const now = this.clock()
    switch (command.type) {
      case 'buy_upgrade':
        this.state = buyUpgrade(this.state, command.upgradeId, now)
        break
      case 'collect_loot':
        this.state = collectLoot(this.state, command.lootId, now)
        break
      case 'toggle_simulator':
        this.state = setSourceStatus(this.state, { simulator: command.enabled })
        break
      case 'trigger_raid':
        for (const event of this.simulator.generateRaidBurst()) {
          this.state = applyAgentEvent(this.state, event, { rng: this.rng })
        }
        break
      case 'buy_talent':
        this.state = buyTalent(this.state, command.talentId, now, { max: command.max })
        break
      case 'ascend':
        this.state = ascend(this.state, now)
        break
      case 'reset_campaign':
        this.state = resetCampaign(this.state, now)
        break
    }

    this.dirty = true
    this.maybePersist(true)
    this.broadcast()
    return this.state
  }

  flushSave(): void {
    this.maybePersist(true)
  }

  private maybePersist(force: boolean): void {
    if (!this.dirty && !force) return
    const nowMs = Date.now()
    if (!force && nowMs - this.lastSavedAt < 2000) return
    this.store.save(this.state)
    this.dirty = false
    this.lastSavedAt = nowMs
  }

  private broadcast(): void {
    for (const listener of this.subscribers) {
      listener(this.state)
    }
  }
}
