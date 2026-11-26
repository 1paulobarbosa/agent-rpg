import type { AgentEvent } from '../contracts/agent-event.js'
import type {
  BattleLogEntry,
  FloatingText,
  GameSnapshot,
  Hero,
  Monster,
  SkillEffect,
  ZoneId,
} from '../contracts/game-snapshot.js'
import { ZONE_MONSTERS, rollAffix, spawnMonsterFromTemplate } from './campaign.js'
import { getModifiers } from './modifiers.js'
import { getHeroZoneSlot } from './world-map.js'

const MAX_FLOATING_TEXTS = 24
const MAX_EFFECTS = 18
const MAX_BATTLE_LOG = 35
const BASE_HERO_HP = 100

export interface CombatContext {
  state: GameSnapshot
  event: AgentEvent
  heroes: Hero[]
  heroIndex: number
  eventSerial: number
  battleLog: BattleLogEntry[]
  rng: () => number
}

export function xpRequiredForLevel(level: number): number {
  return Math.round(90 * Math.pow(1.28, Math.max(0, level - 1)))
}

export function getHeroMaxHp(partyLevel: number, hearthLevel: number, hpMultiplier = 1): number {
  return Math.round((BASE_HERO_HP + (partyLevel - 1) * 14 + hearthLevel * 30) * hpMultiplier)
}

export function pushLog(log: BattleLogEntry[], entry: BattleLogEntry): BattleLogEntry[] {
  return [entry, ...log].slice(0, MAX_BATTLE_LOG)
}

export function pushFloat(list: FloatingText[], item: FloatingText): FloatingText[] {
  return [...list, item].slice(-MAX_FLOATING_TEXTS)
}

export function pushEffect(list: SkillEffect[], item: SkillEffect): SkillEffect[] {
  return [...list, item].slice(-MAX_EFFECTS)
}

export function selectTargetMonster(
  monsters: Monster[],
  preferredZone: ZoneId,
  bossActive: boolean,
): Monster | undefined {
  if (bossActive) {
    const boss = monsters.find((m) => m.kind === 'boss')
    if (boss) return boss
  }
  return monsters.find((m) => m.zone === preferredZone) ?? monsters[0]
}

export function respawnZoneMonster(
  zone: Exclude<ZoneId, 'tavern'>,
  act: number,
  serial: number,
  rng: () => number,
): Monster {
  const pool = ZONE_MONSTERS[zone]
  const pickIndex = pool.length > 1 && rng() > 0.65 ? 1 : 0
  return spawnMonsterFromTemplate({
    template: pool[pickIndex]!,
    act,
    serial,
    affix: rollAffix(act, rng),
    offsetX: Math.round((rng() - 0.5) * 20),
    offsetY: Math.round((rng() - 0.5) * 14),
  })
}

export function awardPartyXp(
  party: GameSnapshot['party'],
  heroes: Hero[],
  xpGained: number,
  hearthLevel: number,
  hpMultiplier = 1,
): { party: GameSnapshot['party']; heroes: Hero[] } {
  let level = party.level
  let xp = party.xp + xpGained
  let xpToNext = party.xpToNextLevel

  while (xp >= xpToNext) {
    xp -= xpToNext
    level += 1
    xpToNext = xpRequiredForLevel(level)
  }

  const nextMaxHp = getHeroMaxHp(level, hearthLevel, hpMultiplier)
  const updatedHeroes =
    level > party.level
      ? heroes.map((h) => ({ ...h, level, maxHp: nextMaxHp, hp: Math.min(nextMaxHp, h.hp + 20) }))
      : heroes

  return {
    party: { ...party, level, xp, xpToNextLevel: xpToNext },
    heroes: updatedHeroes,
  }
}

/** Resolves a monster counter-attack when an agent tool or command reports an error. */
export function resolveCounterAttack(ctx: CombatContext): GameSnapshot {
  const { state, event, heroes, heroIndex, eventSerial } = ctx
  const hero = heroes[heroIndex]!
  const attacker = selectTargetMonster(
    state.monsters,
    hero.zone === 'tavern' ? 'arena' : hero.zone,
    state.campaign.bossActive,
  )
  const incomingDamage = Math.max(1, Math.round((attacker ? attacker.attack : 14) * getModifiers(state.meta).errorDamage))
  const nextHp = Math.max(0, hero.hp - incomingDamage)
  const knockedOut = nextHp === 0
  const tavernSlot = getHeroZoneSlot('tavern', heroIndex)

  heroes[heroIndex] = {
    ...hero,
    hp: nextHp,
    zone: knockedOut ? 'tavern' : hero.zone,
    targetX: knockedOut ? tavernSlot.x : hero.targetX,
    targetY: knockedOut ? tavernSlot.y : hero.targetY,
    state: knockedOut ? 'resting' : 'attacking',
    lastActiveAt: event.timestamp,
    actionTicks: 8,
  }

  return {
    ...state,
    updatedAt: event.timestamp,
    campaign: { ...state.campaign, totalEventsProcessed: eventSerial },
    heroes,
    floatingTexts: pushFloat(state.floatingTexts, {
      id: `ft-err-${eventSerial}`,
      x: hero.x,
      y: hero.y - 14,
      text: `-${incomingDamage}`,
      tone: 'enemy',
      ttlTicks: 18,
    }),
    battleLog: pushLog(ctx.battleLog, {
      id: `log-err-${eventSerial}`,
      timestamp: event.timestamp,
      code: knockedOut ? 'hero_knocked_out' : 'hero_hit',
      actor: hero.name,
      target: attacker?.templateId,
      amount: incomingDamage,
    }),
  }
}
