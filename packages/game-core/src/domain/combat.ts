import type {
  GameSnapshot,
  Hero,
  LootDrop,
  ZoneId,
} from '../contracts/game-snapshot.js'
import {
  STORY_ACTS,
  createInitialZoneMonsters,
  getActDefinition,
  rollAffix,
  spawnMonsterFromTemplate,
} from './campaign.js'
import {
  awardPartyXp,
  pushEffect,
  pushFloat,
  pushLog,
  resolveCounterAttack,
  respawnZoneMonster,
  selectTargetMonster,
  type CombatContext,
} from './combat-helpers.js'
import { getModifiers } from './modifiers.js'
import { DUPLICATE_RELIC_RUNES, rollRelicDrop } from './relics.js'
import { mapEventToAction } from './skill-mapper.js'
import { clamp, getHeroZoneSlot } from './world-map.js'

export { resolveCounterAttack, type CombatContext }

const MAX_LOOT_DROPS = 14
const SKILL_BUFF_MULTIPLIER = 1.75
const CRIT_MULTIPLIER = 1.55
const LOOT_TTL_TICKS = 160

/** Resolves a hero strike, monster defeat, loot drop, boss summon and act progression. */
export function resolveCombatStrike(ctx: CombatContext): GameSnapshot {
  const { state, event, heroes, heroIndex, eventSerial, rng } = ctx
  const hero = heroes[heroIndex]!
  const action = mapEventToAction(event)
  const targetZone: ZoneId = state.campaign.bossActive ? 'citadel' : action.zone
  const slot = getHeroZoneSlot(targetZone, heroIndex)
  const monsters = state.monsters.map((m) => ({ ...m }))
  const targetMonster = selectTargetMonster(monsters, targetZone, state.campaign.bossActive)

  let battleLog = ctx.battleLog
  let floatingTexts = state.floatingTexts
  let effects = state.effects
  let loot = [...state.loot]
  let campaign = { ...state.campaign, totalEventsProcessed: eventSerial }
  let party = { ...state.party }
  let meta = state.meta
  const bestiary = { ...state.bestiary }
  const mods = getModifiers(meta)

  const awakenedHp =
    hero.state === 'resting' && hero.hp < Math.ceil(hero.maxHp * 0.4)
      ? Math.ceil(hero.maxHp * 0.45)
      : hero.hp

  const anvilBonus = 1 + state.upgrades.runic_anvil * 0.25
  const levelBonus = 1 + (party.level - 1) * 0.12
  const buffActive = hero.buffCharges > 0
  const isCrit = rng() < mods.critChance
  const bossBonus = targetMonster?.kind === 'boss' ? mods.bossDamage : 1
  const damage = Math.max(
    8,
    Math.round(
      action.basePower *
        anvilBonus *
        levelBonus *
        mods.damage *
        mods.zoneDamage[action.zone] *
        bossBonus *
        (buffActive ? SKILL_BUFF_MULTIPLIER : 1) *
        (isCrit ? CRIT_MULTIPLIER : 1),
    ),
  )
  const nextBuffCharges = buffActive ? hero.buffCharges - 1 : 0

  let updatedHero: Hero = {
    ...hero,
    hp: awakenedHp,
    zone: targetZone,
    targetX: slot.x,
    targetY: slot.y,
    state: action.effectKind === 'bolt' || action.effectKind === 'aura' ? 'casting' : 'attacking',
    activeSkill: action.skillKey,
    buffSkill: nextBuffCharges > 0 ? hero.buffSkill : null,
    buffCharges: nextBuffCharges,
    lastTool: event.toolName ?? hero.lastTool,
    lastFile: event.targetFile ?? hero.lastFile,
    damageDealt: hero.damageDealt + damage,
    lastActiveAt: event.timestamp,
    actionTicks: 10,
  }

  if (!targetMonster) {
    heroes[heroIndex] = updatedHero
    return { ...state, updatedAt: event.timestamp, campaign, heroes, battleLog }
  }

  const monsterIdx = monsters.findIndex((m) => m.id === targetMonster.id)
  const remainingHp = Math.max(0, targetMonster.hp - damage)
  effects = pushEffect(effects, {
    id: `fx-${eventSerial}`,
    fromX: updatedHero.x,
    fromY: updatedHero.y,
    toX: targetMonster.x,
    toY: targetMonster.y,
    color: buffActive ? '#e879f9' : action.effectColor,
    kind: action.effectKind,
    ttlTicks: 9,
  })
  floatingTexts = pushFloat(floatingTexts, {
    id: `ft-dmg-${eventSerial}`,
    x: targetMonster.x,
    y: targetMonster.y - 16,
    text: isCrit ? `CRIT -${damage}!` : `-${damage}`,
    tone: isCrit ? 'crit' : 'damage',
    ttlTicks: 16,
  })

  if (remainingHp > 0) {
    monsters[monsterIdx] = { ...targetMonster, hp: remainingHp, hitFlashTicks: 5 }
    heroes[heroIndex] = updatedHero
    return {
      ...state,
      updatedAt: event.timestamp,
      campaign,
      heroes,
      monsters,
      floatingTexts,
      effects,
      battleLog,
    }
  }

  monsters.splice(monsterIdx, 1)
  updatedHero = { ...updatedHero, kills: updatedHero.kills + 1, xp: updatedHero.xp + targetMonster.xpReward }
  bestiary[targetMonster.templateId] = (bestiary[targetMonster.templateId] ?? 0) + 1

  const tomeMultiplier = 1 + state.upgrades.arcane_tome * 0.25
  const xpReward = Math.round(targetMonster.xpReward * tomeMultiplier * mods.xp)
  const goldReward = Math.round(targetMonster.goldReward * tomeMultiplier * mods.gold)
  party = { ...party, gold: party.gold + goldReward, totalGoldEarned: party.totalGoldEarned + goldReward }

  const drop: LootDrop = {
    id: `loot-${eventSerial}`,
    x: clamp(targetMonster.x + Math.round((rng() - 0.5) * 28), 36, 604),
    y: clamp(targetMonster.y + Math.round((rng() - 0.5) * 20), 42, 344),
    gold: Math.max(5, Math.round(goldReward * 0.6)),
    kind: targetMonster.kind === 'minion' ? 'coin' : 'chest',
    createdAt: event.timestamp,
    ttlTicks: LOOT_TTL_TICKS,
  }
  loot = [...loot, drop].slice(-MAX_LOOT_DROPS)
  floatingTexts = pushFloat(floatingTexts, {
    id: `ft-xp-${eventSerial}`,
    x: targetMonster.x + 12,
    y: targetMonster.y - 26,
    text: `+${xpReward} XP +${goldReward}g`,
    tone: 'xp',
    ttlTicks: 22,
  })
  campaign.totalKills += 1

  if (targetMonster.kind === 'boss') {
    campaign.totalBossesDefeated += 1
    campaign.bossActive = false
    battleLog = pushLog(battleLog, {
      id: `log-boss-kill-${eventSerial}`,
      timestamp: event.timestamp,
      code: 'boss_slain',
      actor: updatedHero.name,
      target: targetMonster.templateId,
      amount: goldReward,
    })

    const relic = rollRelicDrop(meta, campaign.act, rng)
    if (relic.kind === 'new') {
      meta = { ...meta, relics: [...meta.relics, relic.relic] }
      battleLog = pushLog(battleLog, {
        id: `log-relic-${eventSerial}`,
        timestamp: event.timestamp,
        code: 'relic_found',
        actor: updatedHero.name,
        detail: relic.relic,
      })
    } else if (relic.kind === 'duplicate') {
      meta = {
        ...meta,
        runes: meta.runes + DUPLICATE_RELIC_RUNES,
        totalRunesEarned: meta.totalRunesEarned + DUPLICATE_RELIC_RUNES,
      }
      battleLog = pushLog(battleLog, {
        id: `log-relic-dup-${eventSerial}`,
        timestamp: event.timestamp,
        code: 'relic_duplicate',
        actor: updatedHero.name,
        amount: DUPLICATE_RELIC_RUNES,
      })
    }

    if (campaign.act === STORY_ACTS) {
      battleLog = pushLog(battleLog, {
        id: `log-victory-${eventSerial}`,
        timestamp: event.timestamp,
        code: 'campaign_victory',
        actor: updatedHero.name,
        amount: meta.ascensions,
      })
    }

    const nextAct = campaign.act + 1
    const nextActDef = getActDefinition(nextAct)
    campaign = {
      ...campaign,
      act: nextAct,
      actId: nextActDef.id,
      killsInAct: 0,
      killsToBoss: nextActDef.killsToBoss,
      bossActive: false,
      highestActThisRun: Math.max(campaign.highestActThisRun, nextAct),
    }
    meta = { ...meta, highestActEver: Math.max(meta.highestActEver, nextAct) }
    monsters.splice(0, monsters.length, ...createInitialZoneMonsters(nextAct))
  } else {
    campaign.killsInAct += 1
    battleLog = pushLog(battleLog, {
      id: `log-kill-${eventSerial}`,
      timestamp: event.timestamp,
      code: 'monster_slain',
      actor: updatedHero.name,
      target: targetMonster.templateId,
      amount: goldReward,
    })

    if (targetMonster.zone !== 'tavern') {
      monsters.push(respawnZoneMonster(targetMonster.zone, campaign.act, eventSerial, rng))
    }

    if (!campaign.bossActive && campaign.killsInAct >= campaign.killsToBoss) {
      const actDef = getActDefinition(campaign.act)
      const boss = spawnMonsterFromTemplate({
        template: actDef.boss,
        act: campaign.act,
        serial: eventSerial,
        affix: rollAffix(campaign.act, rng, true),
      })
      const nonCitadel = monsters.filter((m) => m.zone !== 'citadel')
      monsters.splice(0, monsters.length, ...nonCitadel, boss)
      campaign.bossActive = true
      battleLog = pushLog(battleLog, {
        id: `log-boss-spawn-${eventSerial}`,
        timestamp: event.timestamp,
        code: 'boss_spawned',
        actor: actDef.boss.id,
        amount: campaign.act,
      })
    }
  }

  heroes[heroIndex] = updatedHero
  const leveled = awardPartyXp(party, heroes, xpReward, state.upgrades.tavern_hearth, mods.maxHp)
  return {
    ...state,
    updatedAt: event.timestamp,
    campaign,
    party: leveled.party,
    heroes: leveled.heroes,
    monsters,
    loot,
    floatingTexts,
    effects,
    battleLog,
    bestiary,
    meta,
  }
}
