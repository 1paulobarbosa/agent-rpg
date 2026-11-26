import { WORLD_HEIGHT, WORLD_WIDTH, type MonsterAffix } from '@agent-rpg/game-core'
import { getMonsterLabel } from '../shared/i18n/locale-store.js'
import type { Copy } from '../shared/i18n/types.js'
import type { JuiceEvent } from './juice-events.js'

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  color: string
  size: number
}

type Banner =
  | { kind: 'bossIntro'; templateId: string; affix: MonsterAffix | null; frames: number }
  | { kind: 'bossDefeat'; templateId: string; frames: number }
  | { kind: 'relic'; relicId: string; frames: number }

const BANNER_FRAMES = 160
const MAX_PARTICLES = 220
const MAX_QUEUED_BANNERS = 3
const GOLD = ['#facc15', '#fde047', '#ca8a04']
const SPARK = ['#ffffff', '#fde68a', '#f472b6']

/**
 * Screen shake, hit-stop, particles, flashes and boss banners. Purely cosmetic: it never touches
 * game state. With reduced motion only the banners remain, without movement.
 */
export class JuiceDirector {
  private shake = 0
  private hitStop = 0
  private flash = 0
  private flashColor = '#ffffff'
  private particles: Particle[] = []
  private banners: Banner[] = []

  constructor(
    private readonly reducedMotion: boolean,
    private readonly random: () => number = Math.random,
  ) {}

  /** True while the world should freeze for impact. */
  get frozen(): boolean {
    return this.hitStop > 0
  }

  apply(events: readonly JuiceEvent[]): void {
    for (const event of events) {
      switch (event.kind) {
        case 'crit':
          this.kick(3, 2)
          this.burst(event.x, event.y, 8, SPARK, 2.2)
          break
        case 'heroHit':
          this.kick(2, 0)
          this.flashOnce('#ef4444', 6)
          break
        case 'goldBurst':
          this.burst(event.x, event.y, event.big ? 40 : 8, GOLD, event.big ? 3.4 : 1.8)
          break
        case 'bossIntro':
          this.kick(5, 0)
          this.queueBanner({ kind: 'bossIntro', templateId: event.templateId, affix: event.affix, frames: BANNER_FRAMES })
          break
        case 'bossDefeat':
          this.kick(8, 14)
          this.flashOnce('#ffffff', 10)
          this.burst(WORLD_WIDTH / 2, WORLD_HEIGHT / 2, 60, GOLD, 4)
          this.queueBanner({ kind: 'bossDefeat', templateId: event.templateId, frames: BANNER_FRAMES })
          break
        case 'relic':
          this.burst(WORLD_WIDTH / 2, WORLD_HEIGHT / 2, 30, SPARK, 3)
          this.queueBanner({ kind: 'relic', relicId: event.relicId, frames: BANNER_FRAMES })
          break
        case 'ascended':
          this.flashOnce('#c084fc', 24)
          break
      }
    }
  }

  /** Advances one frame of every effect. */
  step(): void {
    if (this.hitStop > 0) this.hitStop -= 1
    this.shake = Math.max(0, this.shake - 0.35)
    this.flash = Math.max(0, this.flash - 1)
    const current = this.banners[0]
    if (current) {
      current.frames -= 1
      if (current.frames <= 0) this.banners.shift()
    }
    for (const p of this.particles) {
      p.x += p.vx
      p.y += p.vy
      p.vy += 0.12
      p.life -= 1
    }
    this.particles = this.particles.filter((p) => p.life > 0)
  }

  /** Offset to translate the world by this frame. */
  shakeOffset(): { x: number; y: number } {
    if (this.shake <= 0) return { x: 0, y: 0 }
    return {
      x: Math.round((this.random() - 0.5) * 2 * this.shake),
      y: Math.round((this.random() - 0.5) * 2 * this.shake),
    }
  }

  /** Draws particles, the screen flash and the active banner, on top of the world. */
  render(ctx: CanvasRenderingContext2D, copy: Copy): void {
    for (const p of this.particles) {
      ctx.fillStyle = p.color
      ctx.fillRect(Math.round(p.x), Math.round(p.y), p.size, p.size)
    }
    if (this.flash > 0) {
      ctx.save()
      ctx.globalAlpha = Math.min(0.35, this.flash / 30)
      ctx.fillStyle = this.flashColor
      ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT)
      ctx.restore()
    }
    const banner = this.banners[0]
    if (banner) this.renderBanner(ctx, copy, banner)
  }

  private renderBanner(ctx: CanvasRenderingContext2D, copy: Copy, banner: Banner): void {
    const elapsed = BANNER_FRAMES - banner.frames
    const fade = Math.min(1, elapsed / 12, banner.frames / 20)
    const bandH = 92
    const bandY = WORLD_HEIGHT / 2 - bandH / 2
    const slide = this.reducedMotion ? 0 : Math.round((1 - Math.min(1, elapsed / 14)) * WORLD_WIDTH * 0.4)

    ctx.save()
    ctx.globalAlpha = fade
    if (banner.kind === 'bossIntro') {
      ctx.fillStyle = 'rgba(5, 7, 13, 0.55)'
      ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT)
    }
    ctx.fillStyle = banner.kind === 'bossIntro' ? 'rgba(69, 10, 10, 0.92)' : 'rgba(23, 17, 46, 0.92)'
    ctx.fillRect(0, bandY, WORLD_WIDTH, bandH)
    ctx.fillStyle = banner.kind === 'bossIntro' ? '#ef4444' : '#facc15'
    ctx.fillRect(0, bandY, WORLD_WIDTH, 3)
    ctx.fillRect(0, bandY + bandH - 3, WORLD_WIDTH, 3)

    const { label, title, line } = this.bannerText(copy, banner)
    ctx.textAlign = 'center'
    ctx.fillStyle = banner.kind === 'bossIntro' ? '#fca5a5' : '#fde68a'
    ctx.font = '8px "Press Start 2P", monospace'
    ctx.fillText(label, WORLD_WIDTH / 2 - slide, bandY + 20)
    ctx.fillStyle = '#ffffff'
    ctx.font = '14px "Press Start 2P", monospace'
    ctx.fillText(title, WORLD_WIDTH / 2 + slide, bandY + 46)
    ctx.fillStyle = '#e2e8f0'
    ctx.font = '18px "VT323", monospace'
    ctx.fillText(line, WORLD_WIDTH / 2, bandY + 74)
    ctx.restore()
  }

  private bannerText(copy: Copy, banner: Banner): { label: string; title: string; line: string } {
    if (banner.kind === 'relic') {
      const relic = copy.relics[banner.relicId as keyof Copy['relics']]
      return { label: copy.ui.relicFound, title: relic?.name ?? banner.relicId, line: relic?.effect ?? '' }
    }
    const lines = copy.bossLines[banner.templateId]
    if (banner.kind === 'bossIntro') {
      return {
        label: copy.ui.bossIncoming,
        title: getMonsterLabel(copy, banner.templateId, banner.affix),
        line: lines ? `“${lines.taunt}”` : '',
      }
    }
    return {
      label: copy.ui.bossDefeated,
      title: getMonsterLabel(copy, banner.templateId),
      line: lines ? `“${lines.defeat}”` : '',
    }
  }

  /** Kind of the banner on screen, if any. */
  get activeBanner(): Banner['kind'] | null {
    return this.banners[0]?.kind ?? null
  }

  private queueBanner(banner: Banner): void {
    if (this.banners.length < MAX_QUEUED_BANNERS) this.banners.push(banner)
  }

  private kick(shake: number, hitStop: number): void {
    if (this.reducedMotion) return
    this.shake = Math.max(this.shake, shake)
    this.hitStop = Math.max(this.hitStop, hitStop)
  }

  private flashOnce(color: string, frames: number): void {
    if (this.reducedMotion) return
    this.flashColor = color
    this.flash = Math.max(this.flash, frames)
  }

  private burst(x: number, y: number, count: number, colors: readonly string[], speed: number): void {
    if (this.reducedMotion) return
    for (let i = 0; i < count; i++) {
      const angle = this.random() * Math.PI * 2
      const velocity = speed * (0.4 + this.random() * 0.8)
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * velocity,
        vy: Math.sin(angle) * velocity - speed * 0.6,
        life: 24 + Math.floor(this.random() * 20),
        color: colors[i % colors.length]!,
        size: this.random() > 0.7 ? 3 : 2,
      })
    }
    if (this.particles.length > MAX_PARTICLES) this.particles.splice(0, this.particles.length - MAX_PARTICLES)
  }
}
