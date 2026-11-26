import { useEffect, useRef } from 'react'
import { WORLD_HEIGHT, WORLD_WIDTH, type GameSnapshot } from '@agent-rpg/game-core'
import { getCopy, useCopy } from '../shared/i18n/locale-store.js'
import { ActionBalloons } from './action-balloons.js'
import { renderEntities } from './entity-renderer.js'
import { detectHeroActions } from './hero-actions.js'
import { findHitTarget } from './hit-test.js'
import { JuiceDirector } from './juice.js'
import { detectJuiceEvents } from './juice-events.js'
import { renderRiftTint, renderWorldMap } from './map-renderer.js'

interface GameCanvasProps {
  snapshot: GameSnapshot
  selectedHeroId: string | null
  onSelectHero: (heroId: string | null) => void
  onCollectLoot: (lootId: string) => void
}

function prefersReducedMotion(): boolean {
  try {
    return globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
  } catch {
    return false
  }
}

/** 60fps interpolated pixel-art canvas rendering the RPG world and forwarding click events. */
export function GameCanvas({
  snapshot,
  selectedHeroId,
  onSelectHero,
  onCollectLoot,
}: GameCanvasProps) {
  const copy = useCopy()
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const snapshotRef = useRef(snapshot)
  const selectedRef = useRef(selectedHeroId)
  const positionsRef = useRef(new Map<string, { x: number; y: number }>())
  const juiceRef = useRef<JuiceDirector | null>(null)
  const prevSnapshotRef = useRef<GameSnapshot | null>(null)
  const balloonsRef = useRef(new ActionBalloons())

  if (!juiceRef.current) juiceRef.current = new JuiceDirector(prefersReducedMotion())
  snapshotRef.current = snapshot
  selectedRef.current = selectedHeroId

  useEffect(() => {
    const prev = prevSnapshotRef.current
    if (prev && prev !== snapshot) {
      juiceRef.current?.apply(detectJuiceEvents(prev, snapshot))
      balloonsRef.current.push(detectHeroActions(prev, snapshot))
    }
    prevSnapshotRef.current = snapshot
  }, [snapshot])

  useEffect(() => {
    let rafId = 0
    let animFrame = 0

    const loop = () => {
      const canvas = canvasRef.current
      const ctx = canvas?.getContext('2d')
      const juice = juiceRef.current
      if (canvas && ctx && juice) {
        ctx.imageSmoothingEnabled = false
        const current = snapshotRef.current
        const posMap = positionsRef.current

        // Hit-stop: the world holds still for a few frames while effects keep playing.
        if (!juice.frozen) {
          animFrame += 1
          for (const hero of current.heroes) {
            const prev = posMap.get(hero.id)
            if (!prev) {
              posMap.set(hero.id, { x: hero.x, y: hero.y })
            } else {
              prev.x += (hero.x - prev.x) * 0.22
              prev.y += (hero.y - prev.y) * 0.22
            }
          }
        }
        juice.step()
        balloonsRef.current.step()

        const offset = juice.shakeOffset()
        ctx.fillStyle = '#05070d'
        ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT)
        ctx.save()
        ctx.translate(offset.x, offset.y)
        renderWorldMap(ctx, animFrame, current.campaign.bossActive)
        renderRiftTint(ctx, current.campaign.act, animFrame)
        renderEntities({
          ctx,
          snapshot: current,
          interpolatedPositions: posMap,
          selectedHeroId: selectedRef.current,
          animFrame,
        })
        balloonsRef.current.render(ctx, posMap)
        ctx.restore()
        juice.render(ctx, getCopy())
      }
      rafId = requestAnimationFrame(loop)
    }

    rafId = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(rafId)
  }, [])

  function handleClick(event: React.MouseEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const worldX = ((event.clientX - rect.left) / rect.width) * WORLD_WIDTH
    const worldY = ((event.clientY - rect.top) / rect.height) * WORLD_HEIGHT
    const hit = findHitTarget(snapshot, worldX, worldY)
    if (!hit) {
      onSelectHero(null)
      return
    }
    if (hit.kind === 'loot') {
      onCollectLoot(hit.id)
      return
    }
    onSelectHero(hit.id)
  }

  return (
    <div className="canvas-frame">
      <canvas
        ref={canvasRef}
        width={WORLD_WIDTH}
        height={WORLD_HEIGHT}
        onClick={handleClick}
        className="rpg-canvas"
        aria-label={copy.ui.canvasLabel}
      />
      {snapshot.heroes.length === 0 && <div className="canvas-empty-banner">{copy.ui.canvasEmpty}</div>}
    </div>
  )
}
