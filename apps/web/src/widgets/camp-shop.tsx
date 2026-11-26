import {
  UPGRADE_CATALOG,
  getUpgradeCost,
  type GameSnapshot,
  type UpgradeId,
} from '@agent-rpg/game-core'
import { getMonsterLabel, useCopy } from '../shared/i18n/locale-store.js'

interface CampShopProps {
  snapshot: GameSnapshot
  busy: boolean
  onBuyUpgrade: (upgradeId: UpgradeId) => void
}

const UPGRADE_ORDER: readonly UpgradeId[] = [
  'runic_anvil',
  'tavern_hearth',
  'arcane_tome',
  'party_potion',
]

/** Bottom camp upgrades shop and compact bestiary summary. */
export function CampShop({ snapshot, busy, onBuyUpgrade }: CampShopProps) {
  const copy = useCopy()
  const bestiaryEntries = Object.entries(snapshot.bestiary).sort((a, b) => b[1] - a[1])

  return (
    <section className="bottom-strip">
      <div className="rpg-panel shop-panel">
        <div className="shop-header">
          <h2 className="panel-title">{copy.ui.shopTitle}</h2>
          <span className="hint-copy">{copy.ui.shopHint}</span>
        </div>

        <div className="shop-grid">
          {UPGRADE_ORDER.map((id) => {
            const def = UPGRADE_CATALOG[id]
            const level = snapshot.upgrades[id]
            const cost = getUpgradeCost(id, level)
            const isMax = def.maxLevel !== null && level >= def.maxLevel
            const canAfford = snapshot.party.gold >= cost && !isMax
            const upgrade = copy.upgrades[id]

            return (
              <button
                key={id}
                type="button"
                className={`shop-card ${canAfford ? 'affordable' : ''}`}
                disabled={!canAfford || busy}
                onClick={() => onBuyUpgrade(id)}
              >
                <div className="shop-card-top">
                  <strong>{upgrade.name}</strong>
                  <span className="shop-level">
                    {def.repeatableConsumable ? `${copy.ui.uses}: ${level}` : `${copy.ui.levelShort}${level}/${def.maxLevel}`}
                  </span>
                </div>
                <p className="shop-desc">{upgrade.effect}</p>
                <span className="shop-cost">{isMax ? copy.ui.max : `${cost}g`}</span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="rpg-panel bestiary-panel">
        <h2 className="panel-title">{copy.ui.bestiary} ({bestiaryEntries.length})</h2>
        {bestiaryEntries.length === 0 ? (
          <p className="empty-copy">{copy.ui.bestiaryEmpty}</p>
        ) : (
          <ul className="bestiary-list">
            {bestiaryEntries.slice(0, 8).map(([templateId, count]) => (
              <li key={templateId} className="bestiary-item">
                <span>{getMonsterLabel(copy, templateId)}</span>
                <strong>x{count}</strong>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
