import type { GameSnapshot, LootDrop } from '../contracts/game-snapshot.js'
import { getHeroZoneSlot } from './world-map.js'

const HERO_MOVE_SPEED = 14
const IDLE_RETURN_MS = 28_000
const AUTO_COLLECT_RATE = 0.8

/** Advances hero movement, tavern healing, animation timers and auto-collects expired loot. */
export function tickWorld(state: GameSnapshot, nowIso = new Date().toISOString()): GameSnapshot {
  const nowMs = Date.parse(nowIso)
  const regenRate = 3 + state.upgrades.tavern_hearth * 2

  const heroes = state.heroes.map((hero, idx) => {
    const dx = hero.targetX - hero.x
    const dy = hero.targetY - hero.y
    const dist = Math.hypot(dx, dy)
    let x = hero.x
    let y = hero.y
    let nextState = hero.state
    let zone = hero.zone
    let targetX = hero.targetX
    let targetY = hero.targetY

    if (dist > 2) {
      const step = Math.min(dist, HERO_MOVE_SPEED)
      x = Math.round(hero.x + (dx / dist) * step)
      y = Math.round(hero.y + (dy / dist) * step)
      if (hero.state !== 'resting') nextState = 'moving'
    } else if (hero.actionTicks > 0) {
      nextState = hero.state
    } else if (hero.state !== 'resting') {
      nextState = 'idle'
    }

    const lastActiveMs = Date.parse(hero.lastActiveAt)
    if (
      hero.state !== 'resting' &&
      zone !== 'tavern' &&
      Number.isFinite(nowMs) &&
      Number.isFinite(lastActiveMs) &&
      nowMs - lastActiveMs > IDLE_RETURN_MS
    ) {
      const tavernSlot = getHeroZoneSlot('tavern', idx)
      zone = 'tavern'
      targetX = tavernSlot.x
      targetY = tavernSlot.y
      nextState = 'moving'
    }

    let hp = hero.hp
    if (zone === 'tavern' && hp < hero.maxHp) {
      hp = Math.min(hero.maxHp, hp + regenRate)
      if (hero.state === 'resting' && hp >= Math.ceil(hero.maxHp * 0.6)) {
        nextState = 'idle'
      }
    }

    return {
      ...hero,
      x,
      y,
      zone,
      targetX,
      targetY,
      hp,
      state: nextState,
      actionTicks: Math.max(0, hero.actionTicks - 1),
    }
  })

  let autoCollectedGold = 0
  const loot: LootDrop[] = []
  for (const drop of state.loot) {
    if (drop.ttlTicks <= 1) {
      autoCollectedGold += Math.max(1, Math.round(drop.gold * AUTO_COLLECT_RATE))
    } else {
      loot.push({ ...drop, ttlTicks: drop.ttlTicks - 1 })
    }
  }

  return {
    ...state,
    updatedAt: nowIso,
    party:
      autoCollectedGold > 0
        ? {
            ...state.party,
            gold: state.party.gold + autoCollectedGold,
            totalGoldEarned: state.party.totalGoldEarned + autoCollectedGold,
          }
        : state.party,
    heroes,
    monsters: state.monsters.map((m) => ({ ...m, hitFlashTicks: Math.max(0, m.hitFlashTicks - 1) })),
    loot,
    floatingTexts: state.floatingTexts
      .map((ft) => ({ ...ft, y: ft.y - 1, ttlTicks: ft.ttlTicks - 1 }))
      .filter((ft) => ft.ttlTicks > 0),
    effects: state.effects
      .map((fx) => ({ ...fx, ttlTicks: fx.ttlTicks - 1 }))
      .filter((fx) => fx.ttlTicks > 0),
  }
}
