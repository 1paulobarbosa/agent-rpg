import { ACHIEVEMENTS, ALL_RELICS, type GameSnapshot } from '@agent-rpg/game-core'
import { useCopy } from '../shared/i18n/locale-store.js'

interface TrophiesPanelProps {
  snapshot: GameSnapshot
}

/** Relics owned (kept across ascensions) and the achievement checklist. */
export function TrophiesPanel({ snapshot }: TrophiesPanelProps) {
  const copy = useCopy()
  const { relics, achievements } = snapshot.meta

  return (
    <section className="rpg-panel trophies-panel">
      <h2 className="panel-title">{copy.ui.trophiesTitle}</h2>

      <h3 className="quest-group-title">{copy.ui.relicsTitle(relics.length, ALL_RELICS.length)}</h3>
      <ul className="relic-grid">
        {ALL_RELICS.map((id) => {
          const owned = relics.includes(id)
          const relic = copy.relics[id]
          return (
            <li key={id} className={`relic-chip ${owned ? 'owned' : ''}`} title={owned ? relic.effect : copy.ui.unknownRelic}>
              <strong>{owned ? relic.name : '???'}</strong>
              {owned && <span>{relic.effect}</span>}
            </li>
          )
        })}
      </ul>

      <h3 className="quest-group-title">
        {copy.ui.achievementsTitle(achievements.length, ACHIEVEMENTS.length)}
      </h3>
      <ul className="achievement-list">
        {ACHIEVEMENTS.map(({ id, runes }) => {
          const unlocked = achievements.includes(id)
          const text = copy.achievements[id]
          return (
            <li key={id} className={`achievement ${unlocked ? 'unlocked' : ''}`}>
              <span className="achievement-mark" aria-hidden="true">{unlocked ? '★' : '☆'}</span>
              <span>
                <strong>{text?.name ?? id}</strong> · {text?.goal ?? ''}
              </span>
              <span className="quest-reward">✦{runes}</span>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
