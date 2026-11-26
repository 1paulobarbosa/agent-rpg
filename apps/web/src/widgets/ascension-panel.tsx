import {
  ASCENSION_MIN_ACT,
  TALENT_ORDER,
  getTalentCost,
  isTalentMaxed,
  runesForAct,
  type GameSnapshot,
  type TalentId,
} from '@agent-rpg/game-core'
import { formatCompact } from '../shared/format.js'
import { useCopy } from '../shared/i18n/locale-store.js'

interface AscensionPanelProps {
  snapshot: GameSnapshot
  busy: boolean
  onAscend: () => void
  onBuyTalent: (talentId: TalentId, max: boolean) => void
}

/** Prestige loop: ascend for runes, spend runes on permanent talents. */
export function AscensionPanel({ snapshot, busy, onAscend, onBuyTalent }: AscensionPanelProps) {
  const copy = useCopy()
  const { meta, campaign } = snapshot
  const canAscend = campaign.highestActThisRun >= ASCENSION_MIN_ACT
  const runesOnAscend = runesForAct(campaign.highestActThisRun)

  return (
    <section className="rpg-panel ascension-panel">
      <div className="shop-header">
        <h2 className="panel-title">{copy.ui.ascensionTitle}</h2>
        <span className="rune-balance">✦ {formatCompact(meta.runes)}</span>
      </div>
      <p className="hint-copy">{copy.ui.ascensionHint}</p>
      <button
        type="button"
        className={`pixel-btn ascend-btn ${canAscend ? 'active-purple' : ''}`}
        disabled={!canAscend || busy}
        onClick={onAscend}
      >
        {canAscend ? copy.ui.ascendButton(formatCompact(runesOnAscend)) : copy.ui.ascendLocked(ASCENSION_MIN_ACT)}
      </button>

      <h3 className="quest-group-title">{copy.ui.talentsTitle}</h3>
      <ul className="talent-grid">
        {TALENT_ORDER.map((id) => {
          const level = meta.talents[id]
          const maxed = isTalentMaxed(id, level)
          const cost = getTalentCost(id, level)
          const affordable = !maxed && meta.runes >= cost
          const talent = copy.talents[id]
          return (
            <li key={id} className={`talent-card ${affordable ? 'affordable' : ''}`}>
              <div className="shop-card-top">
                <strong>{talent.name}</strong>
                <span className="shop-level">
                  {copy.ui.levelShort}
                  {formatCompact(level)}
                </span>
              </div>
              <p className="shop-desc">{talent.effect}</p>
              <div className="talent-actions">
                <span className="shop-cost rune-cost">{maxed ? copy.ui.max : `✦ ${formatCompact(cost)}`}</span>
                <button
                  type="button"
                  className="pixel-btn mini"
                  disabled={!affordable || busy}
                  onClick={() => onBuyTalent(id, false)}
                  aria-label={`${copy.ui.buyOne} ${talent.name}`}
                >
                  {copy.ui.buyOne}
                </button>
                <button
                  type="button"
                  className="pixel-btn mini"
                  disabled={!affordable || busy}
                  onClick={() => onBuyTalent(id, true)}
                  aria-label={`${copy.ui.buyMax} ${talent.name}`}
                >
                  {copy.ui.buyMax}
                </button>
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
