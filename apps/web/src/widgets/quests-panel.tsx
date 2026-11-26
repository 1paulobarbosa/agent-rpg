import { getQuestProgress, type GameSnapshot, type Quest } from '@agent-rpg/game-core'
import { formatCompact } from '../shared/format.js'
import { useCopy } from '../shared/i18n/locale-store.js'

interface QuestsPanelProps {
  snapshot: GameSnapshot
}

/** Daily and weekly quests measured on real agent work, with live progress bars. */
export function QuestsPanel({ snapshot }: QuestsPanelProps) {
  const copy = useCopy()
  const groups: Array<{ cadence: Quest['cadence']; title: string }> = [
    { cadence: 'daily', title: copy.ui.daily },
    { cadence: 'weekly', title: copy.ui.weekly },
  ]

  return (
    <section className="rpg-panel quests-panel">
      <h2 className="panel-title">{copy.ui.questsTitle}</h2>
      {groups.map(({ cadence, title }) => (
        <div key={cadence} className="quest-group">
          <h3 className="quest-group-title">{title}</h3>
          <ul className="quest-list">
            {snapshot.quests.active
              .filter((quest) => quest.cadence === cadence)
              .map((quest) => {
                const progress = getQuestProgress(snapshot, quest)
                const pct = Math.round((progress / quest.target) * 100)
                return (
                  <li key={quest.id} className={`quest-item ${quest.completed ? 'done' : ''}`}>
                    <div className="quest-top">
                      <span>{copy.questGoal(quest.metric, quest.target)}</span>
                      <span className="quest-count">
                        {quest.completed ? copy.ui.questDone : `${formatCompact(progress)}/${formatCompact(quest.target)}`}
                      </span>
                    </div>
                    <div className="progress-track" aria-hidden="true">
                      <div className="progress-fill quest-fill" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="quest-reward">{copy.ui.questReward(quest.rewardRunes)}</span>
                  </li>
                )
              })}
          </ul>
        </div>
      ))}
    </section>
  )
}
