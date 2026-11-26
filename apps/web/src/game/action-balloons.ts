import type { HeroAction } from './hero-actions.js'
import { actionBalloonText } from './hero-actions.js'

interface Balloon {
  text: string
  failed: boolean
  age: number
}

const BALLOON_FRAMES = 150
const HIGHLIGHT_FRAMES = 36

/** Speech balloons over heroes saying what their agent just did ("✎ Edit auth.ts"). */
export class ActionBalloons {
  private readonly balloons = new Map<string, Balloon>()

  push(actions: readonly HeroAction[]): void {
    for (const action of actions) {
      this.balloons.set(action.heroId, { text: actionBalloonText(action), failed: action.failed, age: 0 })
    }
  }

  step(): void {
    for (const [heroId, balloon] of this.balloons) {
      balloon.age += 1
      if (balloon.age >= BALLOON_FRAMES) this.balloons.delete(heroId)
    }
  }

  render(ctx: CanvasRenderingContext2D, positions: ReadonlyMap<string, { x: number; y: number }>): void {
    ctx.save()
    ctx.font = 'bold 8px monospace'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    for (const [heroId, balloon] of this.balloons) {
      const pos = positions.get(heroId)
      if (!pos) continue
      const fade = Math.min(1, (BALLOON_FRAMES - balloon.age) / 20)
      ctx.globalAlpha = fade

      // Fresh actions get a ring at the hero's feet so the eye finds who acted.
      if (balloon.age < HIGHLIGHT_FRAMES) {
        ctx.strokeStyle = balloon.failed ? '#ef4444' : '#facc15'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.ellipse(pos.x, pos.y + 13, 10 + balloon.age / 3, 4 + balloon.age / 8, 0, 0, Math.PI * 2)
        ctx.stroke()
      }

      const width = Math.ceil(ctx.measureText(balloon.text).width) + 10
      const x = Math.round(pos.x - width / 2)
      const y = Math.round(pos.y - 46)
      ctx.fillStyle = balloon.failed ? '#7f1d1d' : '#f8fafc'
      ctx.fillRect(x, y, width, 13)
      ctx.fillRect(Math.round(pos.x) - 2, y + 13, 4, 3)
      ctx.strokeStyle = balloon.failed ? '#ef4444' : '#0b0e17'
      ctx.lineWidth = 1
      ctx.strokeRect(x + 0.5, y + 0.5, width - 1, 12)
      ctx.fillStyle = balloon.failed ? '#fecaca' : '#0b0e17'
      ctx.fillText(balloon.text, pos.x, y + 7)
    }
    ctx.restore()
  }
}
