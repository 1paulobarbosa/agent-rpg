import type { Monster, MonsterAffix, ZoneId } from '../contracts/game-snapshot.js'
import { WORLD_ZONES } from './world-map.js'

export interface MonsterTemplate {
  readonly id: string
  readonly name: string
  readonly kind: 'minion' | 'elite' | 'boss'
  readonly zone: ZoneId
  readonly baseHp: number
  readonly baseAttack: number
  readonly baseXp: number
  readonly baseGold: number
}

export interface ActDefinition {
  readonly act: number
  readonly id: string
  readonly killsToBoss: number
  readonly hpScale: number
  /** Multiplies the boss template HP. 1 for the five story acts. */
  readonly bossHpScale: number
  readonly boss: MonsterTemplate
}

/** Acts after the story campaign are generated forever under this id. */
export const ENDLESS_ACT_ID = 'endless_rift'
export const STORY_ACTS = 5

export const ZONE_MONSTERS: Record<Exclude<ZoneId, 'tavern'>, readonly MonsterTemplate[]> = {
  research: [
    {
      id: 'context_slime',
      name: 'Context Slime',
      kind: 'minion',
      zone: 'research',
      baseHp: 46,
      baseAttack: 10,
      baseXp: 24,
      baseGold: 12,
    },
    {
      id: 'doc_owl',
      name: 'Stale Doc Imp',
      kind: 'elite',
      zone: 'research',
      baseHp: 74,
      baseAttack: 14,
      baseXp: 36,
      baseGold: 18,
    },
  ],
  forge: [
    {
      id: 'diff_gremlin',
      name: 'Diff Gremlin',
      kind: 'minion',
      zone: 'forge',
      baseHp: 56,
      baseAttack: 12,
      baseXp: 28,
      baseGold: 14,
    },
    {
      id: 'refactor_golem',
      name: 'Spaghetti Golem',
      kind: 'elite',
      zone: 'forge',
      baseHp: 88,
      baseAttack: 16,
      baseXp: 42,
      baseGold: 22,
    },
  ],
  arena: [
    {
      id: 'lint_goblin',
      name: 'Lint Goblin',
      kind: 'minion',
      zone: 'arena',
      baseHp: 54,
      baseAttack: 14,
      baseXp: 28,
      baseGold: 15,
    },
    {
      id: 'bug_wraith',
      name: 'Mutant Bug',
      kind: 'elite',
      zone: 'arena',
      baseHp: 90,
      baseAttack: 18,
      baseXp: 46,
      baseGold: 24,
    },
  ],
  citadel: [
    {
      id: 'gate_sentinel',
      name: 'Gate Sentinel',
      kind: 'elite',
      zone: 'citadel',
      baseHp: 96,
      baseAttack: 18,
      baseXp: 48,
      baseGold: 26,
    },
  ],
}

export const ACTS: readonly ActDefinition[] = [
  {
    act: 1,
    id: 'setup_glade',
    killsToBoss: 5,
    hpScale: 1.0,
    bossHpScale: 1,
    boss: {
      id: 'backlog_slime_king',
      name: 'Backlog Slime King',
      kind: 'boss',
      zone: 'citadel',
      baseHp: 165,
      baseAttack: 20,
      baseXp: 110,
      baseGold: 70,
    },
  },
  {
    act: 2,
    id: 'spec_woods',
    killsToBoss: 6,
    hpScale: 1.3,
    bossHpScale: 1,
    boss: {
      id: 'vague_spec_wraith',
      name: 'Vague Spec Wraith',
      kind: 'boss',
      zone: 'citadel',
      baseHp: 240,
      baseAttack: 24,
      baseXp: 160,
      baseGold: 105,
    },
  },
  {
    act: 3,
    id: 'deep_forge',
    killsToBoss: 7,
    hpScale: 1.65,
    bossHpScale: 1,
    boss: {
      id: 'tech_debt_golem',
      name: 'Tech Debt Golem',
      kind: 'boss',
      zone: 'citadel',
      baseHp: 330,
      baseAttack: 28,
      baseXp: 220,
      baseGold: 145,
    },
  },
  {
    act: 4,
    id: 'test_colosseum',
    killsToBoss: 8,
    hpScale: 2.05,
    bossHpScale: 1,
    boss: {
      id: 'flaky_hydra',
      name: 'Flaky Test Hydra',
      kind: 'boss',
      zone: 'citadel',
      baseHp: 440,
      baseAttack: 32,
      baseXp: 300,
      baseGold: 195,
    },
  },
  {
    act: 5,
    id: 'prod_citadel',
    killsToBoss: 9,
    hpScale: 2.5,
    bossHpScale: 1,
    boss: {
      id: 'regression_dragon',
      name: 'Regression Dragon',
      kind: 'boss',
      zone: 'citadel',
      baseHp: 600,
      baseAttack: 38,
      baseXp: 460,
      baseGold: 320,
    },
  },
]

/** Ceiling for any generated number, far below Infinity, so a save always stays valid JSON. */
export const MAX_GAME_VALUE = 1e300

function capped(value: number): number {
  return Math.max(1, Math.round(Math.min(MAX_GAME_VALUE, value)))
}

const ENDLESS_GROWTH = 1.2
const ENDLESS_ATTACK_GROWTH = 1.08
const ENDLESS_REWARD_GROWTH = 1.06
const AFFIXES: readonly MonsterAffix[] = ['armored', 'swift', 'golden', 'ancient']

/** Returns a story act, or generates an endless rift act for any act beyond the story. */
export function getActDefinition(act: number): ActDefinition {
  const safeAct = Math.max(1, Math.floor(act))
  if (safeAct <= STORY_ACTS) return ACTS[safeAct - 1]!

  const depth = safeAct - STORY_ACTS
  const finale = ACTS[STORY_ACTS - 1]!
  const boss = ACTS[(depth - 1) % ACTS.length]!.boss
  const growth = Math.pow(ENDLESS_GROWTH, depth)
  return {
    act: safeAct,
    id: ENDLESS_ACT_ID,
    killsToBoss: Math.min(15, finale.killsToBoss + Math.floor(depth / 3)),
    hpScale: finale.hpScale * growth,
    bossHpScale: (finale.boss.baseHp / boss.baseHp) * growth,
    boss,
  }
}

export function isEndlessAct(act: number): boolean {
  return act > STORY_ACTS
}

/** Endless monsters may carry an affix; the chance grows with depth. Bosses always get one. */
export function rollAffix(act: number, rng: () => number, isBoss = false): MonsterAffix | null {
  if (!isEndlessAct(act)) return null
  const chance = isBoss ? 1 : Math.min(0.5, 0.15 + (act - STORY_ACTS - 1) * 0.01)
  if (rng() >= chance) return null
  return AFFIXES[Math.floor(rng() * AFFIXES.length) % AFFIXES.length]!
}

const AFFIX_EFFECTS: Readonly<Record<MonsterAffix, { hp: number; attack: number; xp: number; gold: number }>> = {
  armored: { hp: 1.6, attack: 1, xp: 1.2, gold: 1.2 },
  swift: { hp: 1, attack: 1.4, xp: 1.2, gold: 1.2 },
  golden: { hp: 1.1, attack: 1, xp: 1, gold: 2.5 },
  ancient: { hp: 1.4, attack: 1.1, xp: 2, gold: 1.2 },
}

/** Instantiates a combat monster scaled to its act, with an optional affix. */
export function spawnMonsterFromTemplate(params: {
  template: MonsterTemplate
  act: number
  serial: number
  affix?: MonsterAffix | null
  offsetX?: number
  offsetY?: number
}): Monster {
  const actDef = getActDefinition(params.act)
  const affix = params.affix ?? null
  const fx = affix ? AFFIX_EFFECTS[affix] : { hp: 1, attack: 1, xp: 1, gold: 1 }
  const hpScale = params.template.kind === 'boss' ? actDef.bossHpScale : actDef.hpScale
  const zoneLayout = WORLD_ZONES[params.template.zone]
  const maxHp = capped(params.template.baseHp * hpScale * fx.hp)
  const storyStep = Math.min(params.act, STORY_ACTS) - 1
  const depth = Math.max(0, params.act - STORY_ACTS)
  const rewardScale = (1 + (params.act - 1) * 0.25) * Math.pow(ENDLESS_REWARD_GROWTH, depth)

  return {
    id: `${params.template.id}-${params.serial}`,
    templateId: params.template.id,
    name: params.template.name,
    kind: params.template.kind,
    zone: params.template.zone,
    x: zoneLayout.monsterAnchorX + (params.offsetX ?? 0),
    y: zoneLayout.monsterAnchorY + (params.offsetY ?? 0),
    hp: maxHp,
    maxHp,
    attack: capped(
      params.template.baseAttack * Math.pow(1.18, storyStep) * Math.pow(ENDLESS_ATTACK_GROWTH, depth) * fx.attack,
    ),
    xpReward: capped(params.template.baseXp * rewardScale * fx.xp),
    goldReward: capped(params.template.baseGold * rewardScale * fx.gold),
    hitFlashTicks: 0,
    affix,
  }
}

export function createInitialZoneMonsters(act: number): Monster[] {
  const zones: Array<Exclude<ZoneId, 'tavern'>> = ['research', 'forge', 'arena', 'citadel']
  return zones.map((zone, idx) =>
    spawnMonsterFromTemplate({
      template: ZONE_MONSTERS[zone][0]!,
      act,
      serial: idx + 1,
    }),
  )
}
