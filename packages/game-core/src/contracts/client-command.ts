import { z } from 'zod'

export const UpgradeIdSchema = z.enum([
  'runic_anvil',
  'tavern_hearth',
  'arcane_tome',
  'party_potion',
])
export type UpgradeId = z.infer<typeof UpgradeIdSchema>

export const TalentIdSchema = z.enum([
  'sharpened_steel',
  'golden_touch',
  'scholar',
  'iron_will',
  'quick_start',
  'lucky_star',
])
export type TalentId = z.infer<typeof TalentIdSchema>

export const ClientCommandSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('buy_upgrade'),
    upgradeId: UpgradeIdSchema,
  }),
  z.object({
    type: z.literal('collect_loot'),
    lootId: z.string().min(1).max(80),
  }),
  z.object({
    type: z.literal('toggle_simulator'),
    enabled: z.boolean(),
  }),
  z.object({
    type: z.literal('trigger_raid'),
  }),
  z.object({
    type: z.literal('buy_talent'),
    talentId: TalentIdSchema,
    /** Buy as many levels as the runes allow. */
    max: z.boolean().optional(),
  }),
  z.object({
    type: z.literal('ascend'),
  }),
  z.object({
    type: z.literal('reset_campaign'),
  }),
])

export type ClientCommand = z.infer<typeof ClientCommandSchema>
