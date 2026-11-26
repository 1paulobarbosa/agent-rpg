import type { AgentEvent } from '../contracts/agent-event.js'
import { SNAPSHOT_VERSION, type GameSnapshot, type Hero, type SourcesStatus } from '../contracts/game-snapshot.js'
import { createInitialZoneMonsters, getActDefinition } from './campaign.js'
import {
  getHeroMaxHp,
  pushEffect,
  pushFloat,
  pushLog,
  xpRequiredForLevel,
} from './combat-helpers.js'
import { resolveCombatStrike, resolveCounterAttack } from './combat.js'
import { emptyLifetimeStats, recordAgentEvent } from './lifetime.js'
import { getModifiers } from './modifiers.js'
import { settleProgress } from './progress.js'
import { resolveHeroClass } from './skill-mapper.js'
import { getHeroZoneSlot } from './world-map.js'

export { ascend, ASCENSION_MIN_ACT, runesForAct } from './ascension.js'
export { buyUpgrade, collectLoot } from './camp-actions.js'
export { buyTalent } from './talents.js'
export { tickWorld } from './world-tick.js'

export interface EngineOptions {
  rng?: () => number
}

const MAX_HEROES = 12
const SKILL_BUFF_CHARGES = 3

/** Creates a brand new save: Act 1, no meta progress, today's quests drawn. */
export function createInitialState(nowIso = new Date().toISOString()): GameSnapshot {
  const actDef = getActDefinition(1)
  const fresh: GameSnapshot = {
    version: SNAPSHOT_VERSION,
    updatedAt: nowIso,
    campaign: {
      act: 1,
      actId: actDef.id,
      killsInAct: 0,
      killsToBoss: actDef.killsToBoss,
      bossActive: false,
      highestActThisRun: 1,
      totalKills: 0,
      totalBossesDefeated: 0,
      totalEventsProcessed: 0,
    },
    party: {
      level: 1,
      xp: 0,
      xpToNextLevel: xpRequiredForLevel(1),
      gold: 0,
      totalGoldEarned: 0,
    },
    upgrades: {
      runic_anvil: 0,
      tavern_hearth: 0,
      arcane_tome: 0,
      party_potion: 0,
    },
    heroes: [],
    monsters: createInitialZoneMonsters(1),
    loot: [],
    floatingTexts: [],
    effects: [],
    battleLog: [],
    sources: {
      antigravity: false,
      claudeCode: false,
      simulator: false,
    },
    bestiary: {},
    meta: {
      ascensions: 0,
      runes: 0,
      totalRunesEarned: 0,
      highestActEver: 1,
      talents: {
        sharpened_steel: 0,
        golden_touch: 0,
        scholar: 0,
        iron_will: 0,
        quick_start: 0,
        lucky_star: 0,
      },
      relics: [],
      achievements: [],
      stats: emptyLifetimeStats(),
    },
    quests: { dailyKey: '', weeklyKey: '', active: [] },
  }
  return settleProgress(fresh, nowIso)
}

export function setSourceStatus(state: GameSnapshot, sources: Partial<SourcesStatus>): GameSnapshot {
  return { ...state, sources: { ...state.sources, ...sources } }
}

/** Hard reset: wipes the run and all meta progress. Only source status flags survive. */
export function resetCampaign(state: GameSnapshot, nowIso = new Date().toISOString()): GameSnapshot {
  const fresh = createInitialState(nowIso)
  return { ...fresh, sources: { ...state.sources } }
}

function ensureHero(
  state: GameSnapshot,
  event: AgentEvent,
): { heroes: Hero[]; heroIndex: number; joined: boolean } {
  const existingIdx = state.heroes.findIndex((h) => h.id === event.agentId)
  if (existingIdx !== -1) {
    return { heroes: [...state.heroes], heroIndex: existingIdx, joined: false }
  }

  const maxHp = getHeroMaxHp(state.party.level, state.upgrades.tavern_hearth, getModifiers(state.meta).maxHp)
  const spawn = getHeroZoneSlot('tavern', state.heroes.length)
  const newHero: Hero = {
    id: event.agentId,
    name: event.agentName,
    source: event.source,
    heroClass: resolveHeroClass(event),
    level: state.party.level,
    hp: maxHp,
    maxHp,
    xp: 0,
    zone: 'tavern',
    x: spawn.x,
    y: spawn.y,
    targetX: spawn.x,
    targetY: spawn.y,
    state: 'idle',
    activeSkill: null,
    buffSkill: null,
    buffCharges: 0,
    lastTool: null,
    lastFile: null,
    kills: 0,
    damageDealt: 0,
    lastActiveAt: event.timestamp,
    actionTicks: 0,
  }

  let nextHeroes = [...state.heroes, newHero]
  if (nextHeroes.length > MAX_HEROES) {
    nextHeroes = nextHeroes
      .slice()
      .sort((a, b) => Date.parse(b.lastActiveAt) - Date.parse(a.lastActiveAt))
      .slice(0, MAX_HEROES)
  }
  return { heroes: nextHeroes, heroIndex: nextHeroes.findIndex((h) => h.id === newHero.id), joined: true }
}

/** Applies one real or simulated agent event to the RPG world state. */
export function applyAgentEvent(
  state: GameSnapshot,
  event: AgentEvent,
  options: EngineOptions = {},
): GameSnapshot {
  const recorded: GameSnapshot = {
    ...state,
    meta: { ...state.meta, stats: recordAgentEvent(state.meta.stats, event) },
  }
  return settleProgress(resolveAgentEvent(recorded, event, options), event.timestamp)
}

function resolveAgentEvent(state: GameSnapshot, event: AgentEvent, options: EngineOptions): GameSnapshot {
  const rng = options.rng ?? Math.random
  const eventSerial = state.campaign.totalEventsProcessed + 1
  const ensured = ensureHero(state, event)
  const heroes = ensured.heroes
  const hero = heroes[ensured.heroIndex]!

  let battleLog = state.battleLog
  if (ensured.joined) {
    battleLog = pushLog(battleLog, {
      id: `log-join-${eventSerial}`,
      timestamp: event.timestamp,
      code: 'hero_joined',
      actor: hero.name,
      detail: hero.heroClass,
    })
  }

  if (event.kind === 'tool_result' && event.status === 'error') {
    return resolveCounterAttack({
      state,
      event,
      heroes,
      heroIndex: ensured.heroIndex,
      eventSerial,
      battleLog,
      rng,
    })
  }

  if (event.kind === 'skill_used') {
    const skillName = event.skillName ?? 'skill'
    const citadelSlot = getHeroZoneSlot('citadel', ensured.heroIndex)
    const awakenedHp =
      hero.state === 'resting' && hero.hp < Math.ceil(hero.maxHp * 0.4)
        ? Math.ceil(hero.maxHp * 0.45)
        : hero.hp

    heroes[ensured.heroIndex] = {
      ...hero,
      hp: awakenedHp,
      zone: hero.zone === 'tavern' ? 'citadel' : hero.zone,
      targetX: hero.zone === 'tavern' ? citadelSlot.x : hero.targetX,
      targetY: hero.zone === 'tavern' ? citadelSlot.y : hero.targetY,
      state: 'casting',
      activeSkill: skillName,
      buffSkill: skillName,
      buffCharges: SKILL_BUFF_CHARGES + getModifiers(state.meta).extraBuffCharges,
      lastActiveAt: event.timestamp,
      actionTicks: 12,
    }

    return {
      ...state,
      updatedAt: event.timestamp,
      campaign: { ...state.campaign, totalEventsProcessed: eventSerial },
      heroes,
      floatingTexts: pushFloat(state.floatingTexts, {
        id: `ft-skill-${eventSerial}`,
        x: hero.x,
        y: hero.y - 18,
        text: skillName,
        tone: 'skill',
        ttlTicks: 24,
      }),
      effects: pushEffect(state.effects, {
        id: `fx-aura-${eventSerial}`,
        fromX: hero.x,
        fromY: hero.y,
        toX: hero.x,
        toY: hero.y,
        color: '#c084fc',
        kind: 'aura',
        ttlTicks: 14,
      }),
      battleLog: pushLog(battleLog, {
        id: `log-skill-${eventSerial}`,
        timestamp: event.timestamp,
        code: 'skill_buff',
        actor: hero.name,
        detail: skillName,
      }),
    }
  }

  return resolveCombatStrike({
    state,
    event,
    heroes,
    heroIndex: ensured.heroIndex,
    eventSerial,
    battleLog,
    rng,
  })
}
