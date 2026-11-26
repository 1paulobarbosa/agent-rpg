import type { UpgradeId } from '../contracts/client-command.js'
import type { GameSnapshot } from '../contracts/game-snapshot.js'
import { getHeroMaxHp, pushFloat, pushLog } from './combat-helpers.js'
import {
  InsufficientGoldError,
  LootNotFoundError,
  UnknownUpgradeError,
  UpgradeMaxLevelError,
} from './errors.js'
import { getModifiers } from './modifiers.js'
import { settleProgress } from './progress.js'
import { UPGRADE_CATALOG, getUpgradeCost } from './shop.js'
import { WORLD_ZONES } from './world-map.js'

/** Purchases a camp upgrade or consumable party potion using accumulated gold. */
export function buyUpgrade(
  state: GameSnapshot,
  upgradeId: UpgradeId,
  nowIso = new Date().toISOString(),
): GameSnapshot {
  const def = UPGRADE_CATALOG[upgradeId]
  if (!def) throw new UnknownUpgradeError(upgradeId)

  const currentLevel = state.upgrades[upgradeId]
  if (def.maxLevel !== null && currentLevel >= def.maxLevel) {
    throw new UpgradeMaxLevelError(upgradeId)
  }

  const mods = getModifiers(state.meta)
  const cost = getUpgradeCost(upgradeId, currentLevel, mods.upgradeCost)
  if (state.party.gold < cost) throw new InsufficientGoldError(cost, state.party.gold)

  const nextUpgrades = { ...state.upgrades, [upgradeId]: currentLevel + 1 }
  const nextMaxHp = getHeroMaxHp(state.party.level, nextUpgrades.tavern_hearth, mods.maxHp)
  const heroes = state.heroes.map((h) => {
    if (upgradeId === 'party_potion') {
      return { ...h, hp: nextMaxHp, maxHp: nextMaxHp, state: h.state === 'resting' ? ('idle' as const) : h.state }
    }
    if (upgradeId === 'tavern_hearth') {
      return { ...h, maxHp: nextMaxHp, hp: Math.min(nextMaxHp, h.hp + 30) }
    }
    return h
  })

  const tavern = WORLD_ZONES.tavern
  return {
    ...state,
    updatedAt: nowIso,
    party: { ...state.party, gold: state.party.gold - cost },
    upgrades: nextUpgrades,
    heroes,
    floatingTexts: pushFloat(state.floatingTexts, {
      id: `ft-up-${nowIso}-${currentLevel}`,
      x: tavern.centerX,
      y: tavern.centerY - 24,
      text: upgradeId === 'party_potion' ? 'FULL HEAL!' : 'UPGRADE!',
      tone: 'heal',
      ttlTicks: 22,
    }),
    battleLog: pushLog(state.battleLog, {
      id: `log-up-${nowIso}-${currentLevel}`,
      timestamp: nowIso,
      code: 'upgrade_bought',
      actor: upgradeId,
      amount: cost,
    }),
  }
}

/** Collects a ground loot coin or chest for full value. */
export function collectLoot(
  state: GameSnapshot,
  lootId: string,
  nowIso = new Date().toISOString(),
): GameSnapshot {
  const drop = state.loot.find((l) => l.id === lootId)
  if (!drop) throw new LootNotFoundError(lootId)

  const { stats } = state.meta
  const collected: GameSnapshot = {
    ...state,
    updatedAt: nowIso,
    meta: { ...state.meta, stats: { ...stats, lootCollected: stats.lootCollected + 1 } },
    party: {
      ...state.party,
      gold: state.party.gold + drop.gold,
      totalGoldEarned: state.party.totalGoldEarned + drop.gold,
    },
    loot: state.loot.filter((l) => l.id !== lootId),
    floatingTexts: pushFloat(state.floatingTexts, {
      id: `ft-loot-${lootId}`,
      x: drop.x,
      y: drop.y - 12,
      text: `+${drop.gold}g`,
      tone: 'gold',
      ttlTicks: 20,
    }),
    battleLog: pushLog(state.battleLog, {
      id: `log-loot-${lootId}`,
      timestamp: nowIso,
      code: 'loot_collected',
      actor: drop.kind,
      amount: drop.gold,
    }),
  }
  return settleProgress(collected, nowIso)
}
