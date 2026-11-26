import type { UpgradeId } from '../contracts/client-command.js'
import { UnknownUpgradeError } from './errors.js'

export interface UpgradeDefinition {
  readonly id: UpgradeId
  readonly baseCost: number
  readonly costMultiplier: number
  readonly maxLevel: number | null
  readonly repeatableConsumable: boolean
}

export const UPGRADE_CATALOG: Record<UpgradeId, UpgradeDefinition> = {
  runic_anvil: {
    id: 'runic_anvil',
    baseCost: 40,
    costMultiplier: 1.55,
    maxLevel: 10,
    repeatableConsumable: false,
  },
  tavern_hearth: {
    id: 'tavern_hearth',
    baseCost: 35,
    costMultiplier: 1.5,
    maxLevel: 10,
    repeatableConsumable: false,
  },
  arcane_tome: {
    id: 'arcane_tome',
    baseCost: 45,
    costMultiplier: 1.6,
    maxLevel: 10,
    repeatableConsumable: false,
  },
  party_potion: {
    id: 'party_potion',
    baseCost: 25,
    costMultiplier: 1.0,
    maxLevel: null,
    repeatableConsumable: true,
  },
}

export function getUpgradeCost(upgradeId: UpgradeId, currentLevel: number, costMultiplier = 1): number {
  const def = UPGRADE_CATALOG[upgradeId]
  if (!def) throw new UnknownUpgradeError(upgradeId)
  const base = def.repeatableConsumable
    ? def.baseCost
    : def.baseCost * Math.pow(def.costMultiplier, Math.max(0, currentLevel))
  return Math.max(1, Math.round(base * costMultiplier))
}
