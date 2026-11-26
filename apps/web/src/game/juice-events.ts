import type { GameSnapshot, MonsterAffix } from '@agent-rpg/game-core'

export type JuiceEvent =
  | { kind: 'crit'; x: number; y: number }
  | { kind: 'heroHit'; x: number; y: number }
  | { kind: 'goldBurst'; x: number; y: number; big: boolean }
  | { kind: 'bossIntro'; templateId: string; affix: MonsterAffix | null }
  | { kind: 'bossDefeat'; templateId: string }
  | { kind: 'relic'; relicId: string }
  | { kind: 'ascended' }

/**
 * Compares two snapshots and returns the visual moments that just happened. Pure: only reads
 * entries whose ids are new in `next`, so replaying the same snapshot yields nothing.
 */
export function detectJuiceEvents(prev: GameSnapshot, next: GameSnapshot): JuiceEvent[] {
  const events: JuiceEvent[] = []

  const seenTexts = new Set(prev.floatingTexts.map((t) => t.id))
  for (const text of next.floatingTexts) {
    if (seenTexts.has(text.id)) continue
    if (text.tone === 'crit') events.push({ kind: 'crit', x: text.x, y: text.y })
    if (text.tone === 'enemy') events.push({ kind: 'heroHit', x: text.x, y: text.y })
    if (text.tone === 'xp') events.push({ kind: 'goldBurst', x: text.x, y: text.y, big: false })
    if (text.tone === 'gold') events.push({ kind: 'goldBurst', x: text.x, y: text.y, big: false })
  }

  const seenLogs = new Set(prev.battleLog.map((e) => e.id))
  for (const entry of [...next.battleLog].reverse()) {
    if (seenLogs.has(entry.id)) continue
    switch (entry.code) {
      case 'boss_spawned': {
        const boss = next.monsters.find((m) => m.kind === 'boss' && m.templateId === entry.actor)
        events.push({ kind: 'bossIntro', templateId: entry.actor, affix: boss?.affix ?? null })
        break
      }
      case 'boss_slain':
        events.push({ kind: 'bossDefeat', templateId: entry.target ?? '' })
        break
      case 'relic_found':
        events.push({ kind: 'relic', relicId: entry.detail ?? '' })
        break
      case 'ascended':
        events.push({ kind: 'ascended' })
        break
    }
  }

  return events
}
