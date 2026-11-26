import type { GameSnapshot, Hero, Monster } from '@agent-rpg/game-core'
import { getCopy, getMonsterLabel } from '../shared/i18n/locale-store.js'
import {
  CHEST_SPRITE,
  COIN_SPRITE,
  CROWN_SPRITE,
  HERO_SPRITES,
  MONSTER_SPRITES,
  drawSpriteMatrix,
} from './sprites.js'

const TONE_COLORS: Record<string, string> = {
  damage: '#ffffff',
  crit: '#facc15',
  heal: '#4ade80',
  xp: '#38bdf8',
  gold: '#fbbf24',
  skill: '#e879f9',
  enemy: '#f87171',
}

function drawHealthBar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  ratio: number,
  fill: string,
): void {
  const left = Math.round(x - width / 2)
  ctx.fillStyle = '#0b0e17'
  ctx.fillRect(left - 1, y - 1, width + 2, 6)
  ctx.fillStyle = '#334155'
  ctx.fillRect(left, y, width, 4)
  ctx.fillStyle = fill
  ctx.fillRect(left, y, Math.max(0, Math.round(width * Math.min(1, ratio))), 4)
}

function drawMonster(ctx: CanvasRenderingContext2D, monster: Monster, animFrame: number): void {
  const matrix = MONSTER_SPRITES[monster.templateId] ?? MONSTER_SPRITES.context_slime!
  const pixelSize = monster.kind === 'boss' ? 4 : monster.kind === 'elite' ? 3 : 2
  const bob = Math.round(Math.sin(animFrame * 0.16 + monster.x) * (monster.kind === 'boss' ? 3 : 2))

  // Ground shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.35)'
  const shadowW = monster.kind === 'boss' ? 42 : 24
  ctx.fillRect(Math.round(monster.x - shadowW / 2), monster.y + (monster.kind === 'boss' ? 18 : 10), shadowW, 6)

  drawSpriteMatrix({
    ctx,
    matrix,
    centerX: monster.x,
    centerY: monster.y + bob,
    pixelSize,
    flashWhite: monster.hitFlashTicks > 0,
  })

  const barW = monster.kind === 'boss' ? 68 : 34
  const barY = monster.y - (monster.kind === 'boss' ? 34 : 20)
  drawHealthBar(
    ctx,
    monster.x,
    barY,
    barW,
    monster.hp / monster.maxHp,
    monster.kind === 'boss' ? '#ef4444' : '#f97316',
  )

  ctx.font = monster.kind === 'boss' ? 'bold 9px monospace' : '8px monospace'
  ctx.textAlign = 'center'
  ctx.fillStyle = monster.kind === 'boss' ? '#fde047' : '#e2e8f0'
  ctx.fillText(getMonsterLabel(getCopy(), monster.templateId, monster.affix), monster.x, barY - 4)
}

function drawHero(params: {
  ctx: CanvasRenderingContext2D
  hero: Hero
  drawX: number
  drawY: number
  selected: boolean
  ascended: boolean
  animFrame: number
}): void {
  const { ctx, hero, drawX, drawY, selected, ascended, animFrame } = params
  const matrix = HERO_SPRITES[hero.heroClass]
  const isMoving = hero.state === 'moving'
  const bob = isMoving ? (Math.floor(animFrame / 4) % 2 === 0 ? -2 : 1) : Math.round(Math.sin(animFrame * 0.12 + drawX) * 1)
  const attackLunge = hero.state === 'attacking' && hero.actionTicks > 5 ? 5 : 0

  if (selected) {
    ctx.strokeStyle = '#facc15'
    ctx.lineWidth = 2
    ctx.strokeRect(Math.round(drawX - 16), Math.round(drawY - 18), 32, 34)
  }

  if (hero.buffCharges > 0) {
    ctx.strokeStyle = '#e879f9'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(drawX, drawY + 6, 15 + (animFrame % 4), 0, Math.PI * 2)
    ctx.stroke()
  }

  ctx.fillStyle = 'rgba(0, 0, 0, 0.35)'
  ctx.fillRect(Math.round(drawX - 10), Math.round(drawY + 11), 20, 5)

  drawSpriteMatrix({
    ctx,
    matrix,
    centerX: drawX + attackLunge,
    centerY: drawY + bob,
    pixelSize: 2,
    flipX: hero.targetX < drawX,
  })

  if (ascended) {
    drawSpriteMatrix({
      ctx,
      matrix: CROWN_SPRITE,
      centerX: drawX + attackLunge,
      centerY: drawY - 17 + bob,
      pixelSize: 2,
    })
  }

  drawHealthBar(ctx, drawX, Math.round(drawY - 19), 26, hero.hp / hero.maxHp, hero.state === 'resting' ? '#38bdf8' : '#22c55e')

  ctx.font = 'bold 8px monospace'
  ctx.textAlign = 'center'
  ctx.fillStyle = selected ? '#fde047' : '#f8fafc'
  ctx.fillText(hero.name.slice(0, 14), drawX, Math.round(drawY + 23))

  if (hero.buffSkill) {
    ctx.font = '7px monospace'
    ctx.fillStyle = '#f0abfc'
    ctx.fillText(`★ ${hero.buffSkill}`, drawX, Math.round(drawY - 25))
  }
}

/** Draws loot drops, monsters, interpolated heroes, combat effects and floating damage numbers. */
export function renderEntities(params: {
  ctx: CanvasRenderingContext2D
  snapshot: GameSnapshot
  interpolatedPositions: Map<string, { x: number; y: number }>
  selectedHeroId: string | null
  animFrame: number
}): void {
  const { ctx, snapshot, interpolatedPositions, selectedHeroId, animFrame } = params

  // Loot coins and chests
  for (const drop of snapshot.loot) {
    const floatY = Math.round(Math.sin(animFrame * 0.2 + drop.x) * 2)
    drawSpriteMatrix({
      ctx,
      matrix: drop.kind === 'chest' ? CHEST_SPRITE : COIN_SPRITE,
      centerX: drop.x,
      centerY: drop.y + floatY,
      pixelSize: 2,
    })
  }

  // Monsters
  for (const monster of snapshot.monsters) {
    drawMonster(ctx, monster, animFrame)
  }

  // Heroes (depth-sorted by Y for clean RPG overlap)
  const sortedHeroes = [...snapshot.heroes].sort((a, b) => a.y - b.y)
  for (const hero of sortedHeroes) {
    const pos = interpolatedPositions.get(hero.id) ?? { x: hero.x, y: hero.y }
    drawHero({
      ctx,
      hero,
      drawX: pos.x,
      drawY: pos.y,
      selected: hero.id === selectedHeroId,
      ascended: snapshot.meta.ascensions > 0,
      animFrame,
    })
  }

  // Skill VFX lines/arcs/auras
  for (const fx of snapshot.effects) {
    ctx.save()
    ctx.strokeStyle = fx.color
    ctx.fillStyle = fx.color
    if (fx.kind === 'aura') {
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(fx.fromX, fx.fromY, 22 - fx.ttlTicks, 0, Math.PI * 2)
      ctx.stroke()
    } else if (fx.kind === 'slash') {
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.arc(fx.toX, fx.toY, 16, -0.8, 1.1)
      ctx.stroke()
    } else {
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(fx.fromX, fx.fromY)
      ctx.lineTo(fx.toX, fx.toY)
      ctx.stroke()
      ctx.fillRect(fx.toX - 3, fx.toY - 3, 6, 6)
    }
    ctx.restore()
  }

  // Floating combat numbers & skill labels
  ctx.textAlign = 'center'
  for (const ft of snapshot.floatingTexts) {
    ctx.font = ft.tone === 'crit' ? 'bold 11px monospace' : 'bold 9px monospace'
    ctx.fillStyle = '#0b0e17'
    ctx.fillText(ft.text, ft.x + 1, ft.y + 1)
    ctx.fillStyle = TONE_COLORS[ft.tone] ?? '#ffffff'
    ctx.fillText(ft.text, ft.x, ft.y)
  }
}
