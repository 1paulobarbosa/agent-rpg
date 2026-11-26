import type { GameSnapshot } from '@agent-rpg/game-core'
import { getMonsterLabel, getSkillLabel, useCopy } from '../shared/i18n/locale-store.js'

interface HeroInspectorProps {
  snapshot: GameSnapshot
  selectedHeroId: string | null
  onSelectHero: (heroId: string) => void
}

/** Right sidebar with live hero telemetry inspector, clickable party roster and battle log. */
export function HeroInspector({ snapshot, selectedHeroId, onSelectHero }: HeroInspectorProps) {
  const copy = useCopy()
  const selected =
    snapshot.heroes.find((h) => h.id === selectedHeroId) ?? snapshot.heroes[0] ?? null

  return (
    <aside className="sidebar-column">
      <section className="rpg-panel">
        <h2 className="panel-title">{copy.ui.heroInspector}</h2>
        {selected ? (
          <div className="inspector-body">
            <div className="inspector-head">
              <div>
                <div className="hero-title">{selected.name}</div>
                <div className="hero-sub">
                  {copy.heroClasses[selected.heroClass]} · {copy.ui.levelShort}
                  {selected.level} · {copy.sources[selected.source]}
                </div>
              </div>
              <span className={`state-chip ${selected.state}`}>
                {copy.heroStates[selected.state]}
              </span>
            </div>

            <div className="hp-row">
              <span>
                HP {selected.hp}/{selected.maxHp}
              </span>
              <div className="progress-track">
                <div
                  className="progress-fill hp-fill"
                  style={{ width: `${Math.round((selected.hp / selected.maxHp) * 100)}%` }}
                />
              </div>
            </div>

            <dl className="hero-meta">
              <div>
                <dt>{copy.ui.zone}</dt>
                <dd>{copy.zones[selected.zone]}</dd>
              </div>
              <div>
                <dt>{copy.ui.skill}</dt>
                <dd>{getSkillLabel(copy, selected.activeSkill)}</dd>
              </div>
              <div>
                <dt>{copy.ui.activeBuff}</dt>
                <dd className="purple-text">
                  {selected.buffSkill ? `${selected.buffSkill} (${selected.buffCharges}x)` : '—'}
                </dd>
              </div>
              <div>
                <dt>{copy.ui.tool}</dt>
                <dd>{selected.lastTool ?? '—'}</dd>
              </div>
              <div>
                <dt>{copy.ui.file}</dt>
                <dd>{selected.lastFile ?? '—'}</dd>
              </div>
              <div>
                <dt>{copy.ui.killsDamage}</dt>
                <dd>
                  {selected.kills} / {selected.damageDealt}
                </dd>
              </div>
            </dl>
          </div>
        ) : (
          <p className="empty-copy">{copy.ui.noHeroYet}</p>
        )}
      </section>

      <section className="rpg-panel">
        <h2 className="panel-title">{copy.ui.party} ({snapshot.heroes.length})</h2>
        {snapshot.heroes.length === 0 ? (
          <p className="empty-copy">{copy.ui.tavernWaiting}</p>
        ) : (
          <ul className="roster-list">
            {snapshot.heroes.map((hero) => (
              <li key={hero.id}>
                <button
                  type="button"
                  className={`roster-item ${selected?.id === hero.id ? 'selected' : ''}`}
                  onClick={() => onSelectHero(hero.id)}
                >
                  <span className={`src-badge ${hero.source}`} />
                  <span className="roster-name">{hero.name}</span>
                  <span className="roster-zone">{copy.zones[hero.zone].split(' ')[0]}</span>
                  <span className="roster-hp">
                    {hero.hp}/{hero.maxHp}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rpg-panel log-panel">
        <h2 className="panel-title">{copy.ui.battleLogTitle}</h2>
        {snapshot.battleLog.length === 0 ? (
          <p className="empty-copy">{copy.ui.battleLogEmpty}</p>
        ) : (
          <ul className="battle-log">
            {snapshot.battleLog.slice(0, 14).map((entry) => (
              <li key={entry.id} className={`log-line ${entry.code}`}>
                {copy.battleLog(entry, (id) => getMonsterLabel(copy, id))}
              </li>
            ))}
          </ul>
        )}
      </section>
    </aside>
  )
}
