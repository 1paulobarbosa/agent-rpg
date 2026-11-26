import { ASCENSION_MIN_ACT, runesForAct, type GameSnapshot } from '@agent-rpg/game-core'
import { formatCompact } from '../shared/format.js'
import { useCopy } from '../shared/i18n/locale-store.js'

interface VictoryModalProps {
  snapshot: GameSnapshot
  open: boolean
  onKeepGoing: () => void
  onAscend: () => void
}

/** Shown once per run when Act V falls: keep diving into the endless rift, or ascend for runes. */
export function VictoryModal({ snapshot, open, onKeepGoing, onAscend }: VictoryModalProps) {
  const copy = useCopy()
  if (!open) return null
  const runes = runesForAct(Math.max(ASCENSION_MIN_ACT, snapshot.campaign.highestActThisRun))

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="victory-title">
      <div className="rpg-panel victory-modal">
        <div className="victory-crown">★ ★ ★</div>
        <h2 id="victory-title" className="victory-title">
          {copy.ui.victoryTitle}
        </h2>
        <p className="victory-copy">{copy.ui.victoryBody}</p>

        <div className="victory-stats">
          <div>
            <span>{copy.ui.victoryPartyLevel}</span>
            <strong>{snapshot.party.level}</strong>
          </div>
          <div>
            <span>{copy.ui.victoryKills}</span>
            <strong>{formatCompact(snapshot.campaign.totalKills)}</strong>
          </div>
          <div>
            <span>{copy.ui.victoryGold}</span>
            <strong>{formatCompact(snapshot.party.totalGoldEarned)}g</strong>
          </div>
          <div>
            <span>{copy.ui.victoryEvents}</span>
            <strong>{formatCompact(snapshot.campaign.totalEventsProcessed)}</strong>
          </div>
        </div>

        <div className="victory-actions">
          <button type="button" className="pixel-btn active-green" onClick={onKeepGoing}>
            {copy.ui.keepGoing}
          </button>
          <button type="button" className="pixel-btn active-purple" onClick={onAscend}>
            {copy.ui.ascendButton(formatCompact(runes))}
          </button>
        </div>
      </div>
    </div>
  )
}
