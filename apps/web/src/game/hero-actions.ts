import { zoneForTool, type GameSnapshot, type ZoneId } from '@agent-rpg/game-core'

/** One thing an agent just did, as seen through the hero that represents it. */
export interface HeroAction {
  readonly id: string
  readonly heroId: string
  readonly heroName: string
  readonly tool: string | null
  readonly file: string | null
  readonly zone: ZoneId
  readonly damage: number
  readonly targetTemplateId: string | null
  /** The command failed: the monster hit back and the hero lost HP. */
  readonly failed: boolean
}

/**
 * Compares two snapshots and returns what each hero did in between. Several events between two
 * snapshots collapse into one action with the summed damage.
 */
export function detectHeroActions(prev: GameSnapshot, next: GameSnapshot): HeroAction[] {
  const actions: HeroAction[] = []
  for (const hero of next.heroes) {
    const before = prev.heroes.find((h) => h.id === hero.id)
    if (before && before.lastActiveAt === hero.lastActiveAt) continue
    const damage = hero.damageDealt - (before?.damageDealt ?? 0)
    if (!before && damage <= 0) continue
    const target = next.campaign.bossActive
      ? next.monsters.find((m) => m.kind === 'boss')
      : next.monsters.find((m) => m.zone === hero.zone)
    actions.push({
      id: `${hero.id}@${hero.lastActiveAt}`,
      heroId: hero.id,
      heroName: hero.name,
      tool: hero.lastTool,
      file: hero.lastFile,
      zone: hero.zone,
      damage: Math.max(0, damage),
      targetTemplateId: target?.templateId ?? null,
      failed: before !== undefined && hero.hp < before.hp,
    })
  }
  return actions
}

const ZONE_ICONS: Readonly<Record<ZoneId, string>> = {
  research: '?',
  forge: '✎',
  arena: '▶',
  citadel: '✦',
  tavern: '☕',
}

/** Short label for the speech balloon: icon, tool and file, cut to fit over a sprite. */
export function actionBalloonText(action: Pick<HeroAction, 'tool' | 'file' | 'zone'>, maxLength = 24): string {
  // The icon follows the tool, not the hero's position: during a boss fight everyone is at the Citadel.
  const icon = ZONE_ICONS[action.tool ? zoneForTool(action.tool) : action.zone]
  const parts = [icon, action.tool ?? '…']
  if (action.file) parts.push(action.file)
  const text = parts.join(' ')
  return text.length > maxLength ? `${text.slice(0, maxLength - 1)}…` : text
}
