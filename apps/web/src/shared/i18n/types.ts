import type {
  AgentSource,
  BattleLogEntry,
  HeroClass,
  HeroState,
  MonsterAffix,
  QuestMetric,
  RelicId,
  TalentId,
  UpgradeId,
  ZoneId,
} from '@agent-rpg/game-core'

export const LOCALES = ['en', 'pt-BR'] as const
export type Locale = (typeof LOCALES)[number]

/** Every piece of player-facing text. Each locale file implements this shape in full. */
export interface Copy {
  readonly locale: Locale
  readonly languageName: string
  readonly acts: Readonly<Record<string, string>>
  readonly actFallback: (act: number) => string
  readonly endlessAct: (depth: number) => string
  readonly affixes: Readonly<Record<MonsterAffix, string>>
  readonly withAffix: (monsterName: string, affixLabel: string) => string
  readonly talents: Readonly<Record<TalentId, { name: string; effect: string }>>
  readonly relics: Readonly<Record<RelicId, { name: string; effect: string }>>
  readonly questGoal: (metric: QuestMetric, target: number) => string
  readonly achievements: Readonly<Record<string, { name: string; goal: string }>>
  readonly bossLines: Readonly<Record<string, { taunt: string; defeat: string }>>
  readonly zones: Readonly<Record<ZoneId, string>>
  /** What sends a hero to each zone, shown under its sign on the map. */
  readonly zoneHints: Readonly<Record<ZoneId, string>>
  readonly tutorial: readonly { readonly title: string; readonly lines: readonly string[] }[]
  readonly heroClasses: Readonly<Record<HeroClass, string>>
  readonly heroStates: Readonly<Record<HeroState, string>>
  readonly sources: Readonly<Record<AgentSource, string>>
  readonly skills: Readonly<Record<string, string>>
  readonly monsters: Readonly<Record<string, string>>
  readonly upgrades: Readonly<Record<UpgradeId, { name: string; effect: string }>>
  readonly errors: Readonly<Record<string, string>> & { readonly OFFLINE: string }
  readonly battleLog: (entry: BattleLogEntry, monsterLabel: (id: string | undefined) => string) => string
  readonly ui: {
    readonly connecting: string
    readonly retry: string
    readonly partyLevel: string
    readonly gold: string
    readonly kills: string
    readonly demoOn: string
    readonly demoOff: string
    readonly summonRaid: string
    readonly soundOn: string
    readonly soundOff: string
    readonly reset: string
    readonly live: string
    readonly offline: string
    readonly simulator: string
    readonly boss: string
    readonly bossProgress: string
    readonly languageToggleLabel: string
    readonly heroInspector: string
    readonly levelShort: string
    readonly zone: string
    readonly skill: string
    readonly activeBuff: string
    readonly tool: string
    readonly file: string
    readonly killsDamage: string
    readonly noHeroYet: string
    readonly party: string
    readonly tavernWaiting: string
    readonly battleLogTitle: string
    readonly battleLogEmpty: string
    readonly noSkill: string
    readonly shopTitle: string
    readonly shopHint: string
    readonly uses: string
    readonly max: string
    readonly bestiary: string
    readonly bestiaryEmpty: string
    readonly monsterFallback: string
    readonly victoryTitle: string
    readonly victoryBody: string
    readonly victoryPartyLevel: string
    readonly victoryKills: string
    readonly victoryGold: string
    readonly victoryEvents: string
    readonly keepGoing: string
    readonly runes: string
    readonly ascensionBadge: (count: number) => string
    readonly ascensionTitle: string
    readonly ascensionHint: string
    readonly ascendButton: (runes: string) => string
    readonly ascendLocked: (act: number) => string
    readonly ascendConfirm: (runes: string) => string
    readonly talentsTitle: string
    readonly buyOne: string
    readonly buyMax: string
    readonly trophiesTitle: string
    readonly relicsTitle: (owned: number, total: number) => string
    readonly unknownRelic: string
    readonly achievementsTitle: (unlocked: number, total: number) => string
    readonly questsTitle: string
    readonly daily: string
    readonly weekly: string
    readonly questReward: (runes: number) => string
    readonly questDone: string
    readonly resetConfirm: string
    readonly bossIncoming: string
    readonly bossDefeated: string
    readonly relicFound: string
    readonly canvasEmpty: string
    readonly canvasLabel: string
    readonly activityTitle: string
    readonly activityEmpty: string
    readonly activityHit: (action: string, damage: string, monster: string) => string
    readonly activityFailed: (action: string, monster: string) => string
    readonly help: string
    readonly tutorialStep: (current: number, total: number) => string
    readonly tutorialBack: string
    readonly tutorialNext: string
    readonly tutorialDone: string
    readonly tutorialSkip: string
  }
}
