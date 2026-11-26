import { formatCompact } from '../shared/format.js'
import { getMonsterLabel, useCopy } from '../shared/i18n/locale-store.js'
import { actionBalloonText, type HeroAction } from '../game/hero-actions.js'

interface ActivityFeedProps {
  actions: readonly HeroAction[]
}

/** Cause and effect in plain words: which agent did what, and what it did to which monster. */
export function ActivityFeed({ actions }: ActivityFeedProps) {
  const copy = useCopy()
  return (
    <section className="rpg-panel" aria-live="polite">
      <h2 className="panel-title">{copy.ui.activityTitle}</h2>
      {actions.length === 0 ? (
        <p className="empty-copy">{copy.ui.activityEmpty}</p>
      ) : (
        <ul className="activity-feed">
          {actions.map((action) => {
            const what = actionBalloonText(action, 40)
            const monster = getMonsterLabel(copy, action.targetTemplateId ?? undefined)
            return (
              <li key={action.id} className={`activity-line ${action.failed ? 'failed' : ''}`}>
                <strong>{action.heroName}</strong>
                <span>
                  {action.failed
                    ? copy.ui.activityFailed(what, monster)
                    : copy.ui.activityHit(what, formatCompact(action.damage), monster)}
                </span>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
