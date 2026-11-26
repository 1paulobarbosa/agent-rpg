import { useCallback, useEffect, useRef, useState } from 'react'
import type { ClientCommand, GameSnapshot, UpgradeId } from '@agent-rpg/game-core'
import { ChiptuneAudio } from './audio/chiptune.js'
import { GameCanvas } from './game/game-canvas.js'
import {
  ApiClientError,
  fetchGameState,
  sendClientCommand,
  subscribeToGameEvents,
} from './shared/api/client.js'
import { getCopy, useCopy } from './shared/i18n/locale-store.js'
import { formatCompact } from './shared/format.js'
import { runesForAct, type TalentId } from '@agent-rpg/game-core'
import { AscensionPanel } from './widgets/ascension-panel.js'
import { QuestsPanel } from './widgets/quests-panel.js'
import { TrophiesPanel } from './widgets/trophies-panel.js'
import { CampShop } from './widgets/camp-shop.js'
import { CampaignBar } from './widgets/campaign-bar.js'
import { HeroInspector } from './widgets/hero-inspector.js'
import { ActivityFeed } from './widgets/activity-feed.js'
import { TutorialModal } from './widgets/tutorial-modal.js'
import { detectHeroActions, type HeroAction } from './game/hero-actions.js'
import { hasSeenTutorial, markTutorialSeen } from './shared/tutorial-seen.js'
import { VictoryModal } from './widgets/victory-modal.js'

const ACTIVITY_LIMIT = 8

/** Root Agent RPG application wiring live SSE telemetry, audio feedback and interactive pixel-art views. */
export function App() {
  const [snapshot, setSnapshot] = useState<GameSnapshot | null>(null)
  const [connected, setConnected] = useState(false)
  const [selectedHeroId, setSelectedHeroId] = useState<string | null>(null)
  const [soundEnabled, setSoundEnabled] = useState(false)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [victoryOpen, setVictoryOpen] = useState(false)
  const [tutorialOpen, setTutorialOpen] = useState(() => !hasSeenTutorial())
  const [activity, setActivity] = useState<readonly HeroAction[]>([])

  const copy = useCopy()
  const audioRef = useRef<ChiptuneAudio | null>(null)
  const prevSnapshotRef = useRef<GameSnapshot | null>(null)

  if (!audioRef.current) {
    audioRef.current = new ChiptuneAudio()
  }

  const handleIncomingSnapshot = useCallback((next: GameSnapshot) => {
    const prev = prevSnapshotRef.current
    const audio = audioRef.current
    if (prev) {
      const actions = detectHeroActions(prev, next)
      if (actions.length > 0) setActivity((list) => [...actions, ...list].slice(0, ACTIVITY_LIMIT))
    }
    if (prev && audio) {
      const newestLog = next.battleLog[0]
      const isNewLog = newestLog !== undefined && newestLog.id !== prev.battleLog[0]?.id
      if (isNewLog && next.battleLog.some((e) => e.code === 'campaign_victory' && !prev.battleLog.some((p) => p.id === e.id))) {
        audio.play('victory')
        setVictoryOpen(true)
      } else if (isNewLog && (newestLog.code === 'relic_found' || newestLog.code === 'achievement_unlocked' || newestLog.code === 'quest_completed')) {
        audio.play('levelUp')
      } else if (next.campaign.bossActive && !prev.campaign.bossActive) {
        audio.play('boss')
      } else if (next.party.level > prev.party.level) {
        audio.play('levelUp')
      } else if (next.campaign.totalKills > prev.campaign.totalKills) {
        audio.play('coin')
      } else if (next.battleLog[0]?.code === 'skill_buff' && next.battleLog[0]?.id !== prev.battleLog[0]?.id) {
        audio.play('skill')
      } else if (next.battleLog[0]?.code === 'hero_hit' && next.battleLog[0]?.id !== prev.battleLog[0]?.id) {
        audio.play('error')
      } else if (next.campaign.totalEventsProcessed > prev.campaign.totalEventsProcessed) {
        audio.play('hit')
      }
    }
    prevSnapshotRef.current = next
    setSnapshot(next)
    setLoadError(null)
  }, [])

  useEffect(() => {
    let active = true
    fetchGameState()
      .then((initial) => {
        if (active) handleIncomingSnapshot(initial)
      })
      .catch(() => {
        if (active) setLoadError('OFFLINE')
      })

    const unsubscribe = subscribeToGameEvents(handleIncomingSnapshot, (isUp) => {
      if (active) setConnected(isUp)
    })

    return () => {
      active = false
      unsubscribe()
    }
  }, [handleIncomingSnapshot])

  useEffect(() => {
    if (!notice) return
    const timer = setTimeout(() => setNotice(null), 3500)
    return () => clearTimeout(timer)
  }, [notice])

  async function runCommand(command: ClientCommand): Promise<void> {
    setBusy(true)
    try {
      const updated = await sendClientCommand(command)
      handleIncomingSnapshot(updated)
      if (command.type === 'collect_loot' || command.type === 'buy_upgrade') {
        audioRef.current?.play('coin')
      }
    } catch (err) {
      const code = err instanceof ApiClientError ? err.code : 'OFFLINE'
      const errors = getCopy().errors
      setNotice(errors[code] ?? (err instanceof Error ? err.message : errors.OFFLINE))
    } finally {
      setBusy(false)
    }
  }

  function handleAscend(): void {
    if (!snapshot) return
    const runes = formatCompact(runesForAct(snapshot.campaign.highestActThisRun))
    if (!window.confirm(getCopy().ui.ascendConfirm(runes))) return
    setVictoryOpen(false)
    void runCommand({ type: 'ascend' })
  }

  function handleHardReset(): void {
    if (!window.confirm(getCopy().ui.resetConfirm)) return
    void runCommand({ type: 'reset_campaign' })
  }

  function handleToggleSound(): void {
    const next = !soundEnabled
    setSoundEnabled(next)
    audioRef.current?.setEnabled(next)
    if (next) audioRef.current?.play('coin')
  }

  if (!snapshot) {
    return (
      <main className="loading-screen">
        <div className="rpg-panel loading-card">
          <h1>AGENT RPG</h1>
          <p>{loadError ? copy.errors.OFFLINE : copy.ui.connecting}</p>
          {loadError && (
            <button
              type="button"
              className="pixel-btn accent"
              onClick={() => void fetchGameState().then(handleIncomingSnapshot).catch(() => {})}
            >
              {copy.ui.retry}
            </button>
          )}
        </div>
      </main>
    )
  }

  return (
    <div className="app-shell">
      <CampaignBar
        snapshot={snapshot}
        connected={connected}
        soundEnabled={soundEnabled}
        busy={busy}
        onToggleSimulator={() =>
          void runCommand({ type: 'toggle_simulator', enabled: !snapshot.sources.simulator })
        }
        onTriggerRaid={() => void runCommand({ type: 'trigger_raid' })}
        onToggleSound={handleToggleSound}
        onReset={handleHardReset}
        onHelp={() => setTutorialOpen(true)}
      />

      {notice && (
        <div className="toast-banner" role="status">
          {notice}
        </div>
      )}

      <main className="main-grid">
        <div className="stage-column">
          <GameCanvas
            snapshot={snapshot}
            selectedHeroId={selectedHeroId}
            onSelectHero={setSelectedHeroId}
            onCollectLoot={(lootId) => void runCommand({ type: 'collect_loot', lootId })}
          />
          <CampShop
            snapshot={snapshot}
            busy={busy}
            onBuyUpgrade={(upgradeId: UpgradeId) =>
              void runCommand({ type: 'buy_upgrade', upgradeId })
            }
          />
          <div className="progression-strip">
            <AscensionPanel
              snapshot={snapshot}
              busy={busy}
              onAscend={handleAscend}
              onBuyTalent={(talentId: TalentId, max: boolean) =>
                void runCommand({ type: 'buy_talent', talentId, max })
              }
            />
            <TrophiesPanel snapshot={snapshot} />
          </div>
        </div>

        <div className="sidebar-stack">
        <ActivityFeed actions={activity} />
        <QuestsPanel snapshot={snapshot} />
        <HeroInspector
          snapshot={snapshot}
          selectedHeroId={selectedHeroId}
          onSelectHero={setSelectedHeroId}
        />
        </div>
      </main>

      <VictoryModal
        snapshot={snapshot}
        open={victoryOpen}
        onKeepGoing={() => setVictoryOpen(false)}
        onAscend={handleAscend}
      />

      <TutorialModal
        open={tutorialOpen}
        onClose={() => {
          markTutorialSeen()
          setTutorialOpen(false)
        }}
      />
    </div>
  )
}
