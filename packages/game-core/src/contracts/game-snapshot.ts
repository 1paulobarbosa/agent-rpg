import { z } from 'zod'
import { AgentSourceSchema } from './agent-event.js'
import { TalentIdSchema, UpgradeIdSchema } from './client-command.js'

export const ZoneIdSchema = z.enum(['tavern', 'research', 'forge', 'arena', 'citadel'])
export type ZoneId = z.infer<typeof ZoneIdSchema>

export const HeroClassSchema = z.enum(['mage', 'knight', 'rogue', 'paladin', 'ranger'])
export type HeroClass = z.infer<typeof HeroClassSchema>

export const HeroStateSchema = z.enum(['idle', 'moving', 'attacking', 'casting', 'resting'])
export type HeroState = z.infer<typeof HeroStateSchema>

export const HeroSchema = z.object({
  id: z.string(),
  name: z.string(),
  source: AgentSourceSchema,
  heroClass: HeroClassSchema,
  level: z.number().int().min(1),
  hp: z.number().int().min(0),
  maxHp: z.number().int().min(1),
  xp: z.number().int().min(0),
  zone: ZoneIdSchema,
  x: z.number(),
  y: z.number(),
  targetX: z.number(),
  targetY: z.number(),
  state: HeroStateSchema,
  activeSkill: z.string().nullable(),
  buffSkill: z.string().nullable(),
  buffCharges: z.number().int().min(0),
  lastTool: z.string().nullable(),
  lastFile: z.string().nullable(),
  kills: z.number().int().min(0),
  damageDealt: z.number().int().min(0),
  lastActiveAt: z.string(),
  actionTicks: z.number().int().min(0),
})
export type Hero = z.infer<typeof HeroSchema>

export const MonsterAffixSchema = z.enum(['armored', 'swift', 'golden', 'ancient'])
export type MonsterAffix = z.infer<typeof MonsterAffixSchema>

export const MonsterSchema = z.object({
  id: z.string(),
  templateId: z.string(),
  name: z.string(),
  kind: z.enum(['minion', 'elite', 'boss']),
  zone: ZoneIdSchema,
  x: z.number(),
  y: z.number(),
  hp: z.number().int().min(0),
  maxHp: z.number().int().min(1),
  attack: z.number().int().min(1),
  xpReward: z.number().int().min(1),
  goldReward: z.number().int().min(1),
  hitFlashTicks: z.number().int().min(0),
  affix: MonsterAffixSchema.nullable(),
})
export type Monster = z.infer<typeof MonsterSchema>

export const LootDropSchema = z.object({
  id: z.string(),
  x: z.number(),
  y: z.number(),
  gold: z.number().int().min(1),
  kind: z.enum(['coin', 'chest']),
  createdAt: z.string(),
  ttlTicks: z.number().int().min(0),
})
export type LootDrop = z.infer<typeof LootDropSchema>

export const FloatingTextSchema = z.object({
  id: z.string(),
  x: z.number(),
  y: z.number(),
  text: z.string(),
  tone: z.enum(['damage', 'crit', 'heal', 'xp', 'gold', 'skill', 'enemy']),
  ttlTicks: z.number().int().min(0),
})
export type FloatingText = z.infer<typeof FloatingTextSchema>

export const SkillEffectSchema = z.object({
  id: z.string(),
  fromX: z.number(),
  fromY: z.number(),
  toX: z.number(),
  toY: z.number(),
  color: z.string(),
  kind: z.enum(['slash', 'bolt', 'arrow', 'aura', 'shield']),
  ttlTicks: z.number().int().min(0),
})
export type SkillEffect = z.infer<typeof SkillEffectSchema>

export const BattleLogEntrySchema = z.object({
  id: z.string(),
  timestamp: z.string(),
  code: z.enum([
    'hero_joined',
    'skill_buff',
    'monster_slain',
    'boss_spawned',
    'boss_slain',
    'hero_hit',
    'hero_knocked_out',
    'upgrade_bought',
    'loot_collected',
    'campaign_victory',
    'ascended',
    'talent_bought',
    'relic_found',
    'relic_duplicate',
    'quest_completed',
    'achievement_unlocked',
  ]),
  actor: z.string(),
  target: z.string().optional(),
  detail: z.string().optional(),
  amount: z.number().optional(),
})
export type BattleLogEntry = z.infer<typeof BattleLogEntrySchema>

export const SourcesStatusSchema = z.object({
  antigravity: z.boolean(),
  claudeCode: z.boolean(),
  simulator: z.boolean(),
})
export type SourcesStatus = z.infer<typeof SourcesStatusSchema>

export const UpgradesRecordSchema = z.object({
  runic_anvil: z.number().int().min(0),
  tavern_hearth: z.number().int().min(0),
  arcane_tome: z.number().int().min(0),
  party_potion: z.number().int().min(0),
})
export type UpgradesRecord = z.infer<typeof UpgradesRecordSchema>

export const RelicIdSchema = z.enum([
  'test_totem',
  'scholars_lens',
  'forge_hammer',
  'arcane_focus',
  'phoenix_feather',
  'skill_codex',
  'crit_dice',
  'golden_idol',
  'merchant_coin',
  'boss_slayer',
])
export type RelicId = z.infer<typeof RelicIdSchema>

const count = z.number().int().min(0)

/** Lifetime counters of what the agents actually did. Kills and gold of past runs live in `archived`. */
export const LifetimeStatsSchema = z.object({
  toolCalls: count,
  reads: count,
  edits: count,
  testRuns: count,
  arcane: count,
  skillsUsed: count,
  errors: count,
  lootCollected: count,
  archivedKills: count,
  archivedBossKills: count,
  archivedGold: count,
})
export type LifetimeStats = z.infer<typeof LifetimeStatsSchema>

export const QuestMetricSchema = z.enum([
  'toolCalls',
  'reads',
  'edits',
  'testRuns',
  'skillsUsed',
  'kills',
  'bossKills',
  'lootCollected',
])
export type QuestMetric = z.infer<typeof QuestMetricSchema>

export const QuestSchema = z.object({
  id: z.string(),
  cadence: z.enum(['daily', 'weekly']),
  metric: QuestMetricSchema,
  target: z.number().int().min(1),
  baseline: count,
  rewardRunes: count,
  completed: z.boolean(),
})
export type Quest = z.infer<typeof QuestSchema>

/** Progress that survives an ascension. */
export const MetaProgressSchema = z.object({
  ascensions: count,
  runes: count,
  totalRunesEarned: count,
  highestActEver: z.number().int().min(1),
  talents: z.object({
    sharpened_steel: count,
    golden_touch: count,
    scholar: count,
    iron_will: count,
    quick_start: count,
    lucky_star: count,
  }),
  relics: z.array(RelicIdSchema),
  achievements: z.array(z.string()),
  stats: LifetimeStatsSchema,
})
export type MetaProgress = z.infer<typeof MetaProgressSchema>

export const QuestBoardSchema = z.object({
  dailyKey: z.string(),
  weeklyKey: z.string(),
  active: z.array(QuestSchema),
})
export type QuestBoard = z.infer<typeof QuestBoardSchema>

export const SNAPSHOT_VERSION = 2

export const GameSnapshotSchema = z.object({
  version: z.literal(SNAPSHOT_VERSION),
  updatedAt: z.string(),
  campaign: z.object({
    act: z.number().int().min(1),
    actId: z.string(),
    killsInAct: z.number().int().min(0),
    killsToBoss: z.number().int().min(1),
    bossActive: z.boolean(),
    highestActThisRun: z.number().int().min(1),
    totalKills: z.number().int().min(0),
    totalBossesDefeated: z.number().int().min(0),
    totalEventsProcessed: z.number().int().min(0),
  }),
  party: z.object({
    level: z.number().int().min(1),
    xp: z.number().int().min(0),
    xpToNextLevel: z.number().int().min(1),
    gold: z.number().int().min(0),
    totalGoldEarned: z.number().int().min(0),
  }),
  upgrades: UpgradesRecordSchema,
  heroes: z.array(HeroSchema),
  monsters: z.array(MonsterSchema),
  loot: z.array(LootDropSchema),
  floatingTexts: z.array(FloatingTextSchema),
  effects: z.array(SkillEffectSchema),
  battleLog: z.array(BattleLogEntrySchema),
  sources: SourcesStatusSchema,
  bestiary: z.record(z.string(), z.number().int().min(0)),
  meta: MetaProgressSchema,
  quests: QuestBoardSchema,
})

export type GameSnapshot = z.infer<typeof GameSnapshotSchema>
export type { TalentId, UpgradeId } from './client-command.js'
export { TalentIdSchema, UpgradeIdSchema }
