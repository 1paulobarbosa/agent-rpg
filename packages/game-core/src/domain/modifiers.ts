import type { MetaProgress, ZoneId } from '../contracts/game-snapshot.js'

export interface Modifiers {
  readonly damage: number
  readonly zoneDamage: Readonly<Record<ZoneId, number>>
  readonly bossDamage: number
  readonly critChance: number
  readonly gold: number
  readonly xp: number
  readonly maxHp: number
  readonly errorDamage: number
  readonly extraBuffCharges: number
  readonly upgradeCost: number
  readonly startGold: number
}

const BASE_CRIT_CHANCE = 0.16
const MAX_CRIT_CHANCE = 0.6

/** Folds talents and relics into the multipliers combat and the shop read. */
export function getModifiers(meta: MetaProgress): Modifiers {
  const { talents } = meta
  const has = (relic: MetaProgress['relics'][number]) => meta.relics.includes(relic)

  return {
    damage: Math.pow(1.25, talents.sharpened_steel),
    zoneDamage: {
      tavern: 1,
      research: has('scholars_lens') ? 1.5 : 1,
      forge: has('forge_hammer') ? 1.5 : 1,
      arena: has('test_totem') ? 1.5 : 1,
      citadel: has('arcane_focus') ? 1.5 : 1,
    },
    bossDamage: has('boss_slayer') ? 1.3 : 1,
    critChance: Math.min(
      MAX_CRIT_CHANCE,
      BASE_CRIT_CHANCE + talents.lucky_star * 0.01 + (has('crit_dice') ? 0.08 : 0),
    ),
    gold: Math.pow(1.12, talents.golden_touch) * (has('golden_idol') ? 1.25 : 1),
    xp: Math.pow(1.12, talents.scholar),
    maxHp: 1 + talents.iron_will * 0.1,
    errorDamage: has('phoenix_feather') ? 0.7 : 1,
    extraBuffCharges: has('skill_codex') ? 2 : 0,
    upgradeCost: has('merchant_coin') ? 0.85 : 1,
    startGold: talents.quick_start * 150,
  }
}
