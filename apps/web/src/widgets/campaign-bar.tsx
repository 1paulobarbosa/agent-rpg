import type { GameSnapshot } from '@agent-rpg/game-core'
import { formatCompact } from '../shared/format.js'
import { getActTitle, getMonsterLabel, toggleLocale, useCopy } from '../shared/i18n/locale-store.js'

interface CampaignBarProps {
  snapshot: GameSnapshot
  connected: boolean
  soundEnabled: boolean
  busy: boolean
  onToggleSimulator: () => void
  onTriggerRaid: () => void
  onToggleSound: () => void
  onReset: () => void
  onHelp: () => void
}

/** Top RPG HUD displaying act progress, active boss bar, party stats, live sources and controls. */
export function CampaignBar({
  snapshot,
  connected,
  soundEnabled,
  busy,
  onToggleSimulator,
  onTriggerRaid,
  onToggleSound,
  onReset,
  onHelp,
}: CampaignBarProps) {
  const copy = useCopy()
  const { campaign, party, sources, meta } = snapshot
  const boss = snapshot.monsters.find((m) => m.kind === 'boss')
  const actTitle = getActTitle(copy, campaign)
  const progressPct = Math.min(100, Math.round((campaign.killsInAct / campaign.killsToBoss) * 100))
  const xpPct = Math.min(100, Math.round((party.xp / party.xpToNextLevel) * 100))

  return (
    <header className="hud-header">
      <div className="hud-top-row">
        <div className="brand-block">
          <h1 className="brand-title">AGENT RPG</h1>
          <span className="act-badge">{actTitle}</span>
          {meta.ascensions > 0 && (
            <span className="act-badge ascension-badge">{copy.ui.ascensionBadge(meta.ascensions)}</span>
          )}
        </div>

        <div className="stat-pills">
          <div className="stat-pill">
            <span className="stat-label">{copy.ui.partyLevel}</span>
            <strong className="stat-value cyan">{party.level}</strong>
            <div className="mini-bar">
              <div className="mini-bar-fill cyan-bg" style={{ width: `${xpPct}%` }} />
            </div>
          </div>

          <div className="stat-pill">
            <span className="stat-label">{copy.ui.gold}</span>
            <strong className="stat-value gold">{formatCompact(party.gold)}g</strong>
          </div>

          <div className="stat-pill">
            <span className="stat-label">{copy.ui.runes}</span>
            <strong className="stat-value purple">✦ {formatCompact(meta.runes)}</strong>
          </div>

          <div className="stat-pill">
            <span className="stat-label">{copy.ui.kills}</span>
            <strong className="stat-value">{formatCompact(campaign.totalKills)}</strong>
          </div>
        </div>

        <div className="controls-group">
          <button
            type="button"
            className={`pixel-btn ${sources.simulator ? 'active-green' : ''}`}
            onClick={onToggleSimulator}
            disabled={busy}
          >
            {sources.simulator ? copy.ui.demoOn : copy.ui.demoOff}
          </button>
          <button type="button" className="pixel-btn accent" onClick={onTriggerRaid} disabled={busy}>
            {copy.ui.summonRaid}
          </button>
          <button
            type="button"
            className={`pixel-btn ${soundEnabled ? 'active-purple' : ''}`}
            onClick={onToggleSound}
          >
            {soundEnabled ? copy.ui.soundOn : copy.ui.soundOff}
          </button>
          <button type="button" className="pixel-btn" onClick={onHelp} title={copy.ui.help} aria-label={copy.ui.help}>
            ?
          </button>
          <button type="button" className="pixel-btn danger" onClick={onReset} disabled={busy}>
            {copy.ui.reset}
          </button>
          <button
            type="button"
            className="pixel-btn"
            onClick={toggleLocale}
            aria-label={copy.ui.languageToggleLabel}
            title={copy.ui.languageToggleLabel}
          >
            {copy.locale === 'en' ? 'PT' : 'EN'}
          </button>
        </div>
      </div>

      <div className="hud-bottom-row">
        <div className="sources-strip">
          <span className={`source-dot ${connected ? 'on' : 'off'}`}>
            {connected ? copy.ui.live : copy.ui.offline}
          </span>
          <span className={`source-tag ${sources.antigravity ? 'on' : ''}`}>Antigravity</span>
          <span className={`source-tag ${sources.claudeCode ? 'on' : ''}`}>Claude Code</span>
          <span className={`source-tag ${sources.simulator ? 'on' : ''}`}>{copy.ui.simulator}</span>
        </div>

        {boss ? (
          <div className="boss-bar-wrap">
            <span className="boss-label">
              {copy.ui.boss}: {getMonsterLabel(copy, boss.templateId, boss.affix)} ({formatCompact(boss.hp)}/
              {formatCompact(boss.maxHp)})
            </span>
            <div className="progress-track boss-track">
              <div
                className="progress-fill boss-fill"
                style={{ width: `${Math.round((boss.hp / boss.maxHp) * 100)}%` }}
              />
            </div>
          </div>
        ) : (
          <div className="boss-bar-wrap">
            <span className="progress-label">
              {copy.ui.bossProgress}: {campaign.killsInAct}/{campaign.killsToBoss}
            </span>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${progressPct}%` }} />
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
