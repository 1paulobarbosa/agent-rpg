import {
  STORY_ACTS,
  TILE_SIZE,
  WORLD_HEIGHT,
  WORLD_WIDTH,
  WORLD_ZONES,
  type ZoneId,
} from '@agent-rpg/game-core'
import { getCopy } from '../shared/i18n/locale-store.js'
import { ZONE_THEMES } from './palette.js'

function drawPineTree(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  ctx.fillStyle = '#5c2808'
  ctx.fillRect(x + 5, y + 12, 4, 6)
  ctx.fillStyle = '#14532d'
  ctx.fillRect(x + 1, y + 7, 12, 6)
  ctx.fillStyle = '#166534'
  ctx.fillRect(x + 3, y + 3, 8, 5)
  ctx.fillStyle = '#22c55e'
  ctx.fillRect(x + 5, y, 4, 4)
}

function drawAnvilProp(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  ctx.fillStyle = '#ea580c'
  ctx.fillRect(x - 2, y + 10, 18, 4)
  ctx.fillStyle = '#475569'
  ctx.fillRect(x + 2, y + 6, 10, 6)
  ctx.fillStyle = '#94a3b8'
  ctx.fillRect(x, y + 2, 14, 4)
}

function drawCampfire(ctx: CanvasRenderingContext2D, x: number, y: number, frame: number): void {
  ctx.fillStyle = '#78350f'
  ctx.fillRect(x - 6, y + 4, 12, 3)
  ctx.fillRect(x - 4, y + 6, 8, 3)
  const flicker = frame % 2 === 0 ? 0 : 2
  ctx.fillStyle = '#ea580c'
  ctx.fillRect(x - 4, y - 2 - flicker, 8, 6 + flicker)
  ctx.fillStyle = '#facc15'
  ctx.fillRect(x - 2, y - flicker, 4, 4)
  // Warm radial glow
  ctx.fillStyle = 'rgba(251, 146, 60, 0.14)'
  ctx.fillRect(x - 18, y - 14, 36, 28)
}

function drawTavernRoof(ctx: CanvasRenderingContext2D, cx: number, cy: number): void {
  const x = cx - 34
  const y = cy - 48
  ctx.fillStyle = '#7c2d12'
  ctx.fillRect(x, y + 8, 68, 12)
  ctx.fillStyle = '#9a3412'
  ctx.fillRect(x + 6, y + 2, 56, 8)
  ctx.fillStyle = '#5c2808'
  ctx.fillRect(x + 6, y + 20, 56, 16)
  ctx.fillStyle = '#fbbf24'
  ctx.fillRect(x + 14, y + 24, 8, 8)
  ctx.fillRect(x + 46, y + 24, 8, 8)
  ctx.fillStyle = '#451a03'
  ctx.fillRect(x + 28, y + 22, 12, 14)
}

function drawZonePlate(ctx: CanvasRenderingContext2D, zoneId: ZoneId, cx: number, cy: number): void {
  const theme = ZONE_THEMES[zoneId]
  const label = getCopy().zones[zoneId]
  ctx.font = 'bold 9px monospace'
  const textWidth = ctx.measureText(label).width
  const boxW = Math.ceil(textWidth) + 12
  const boxX = Math.round(cx - boxW / 2)
  const boxY = Math.round(cy)

  ctx.fillStyle = 'rgba(11, 14, 23, 0.85)'
  ctx.fillRect(boxX, boxY, boxW, 15)
  ctx.strokeStyle = theme.border
  ctx.lineWidth = 1
  ctx.strokeRect(boxX + 0.5, boxY + 0.5, boxW - 1, 14)
  ctx.fillStyle = theme.accent
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(label, cx, boxY + 8)

  // What sends a hero here: the legend that makes the map readable.
  const hint = getCopy().zoneHints[zoneId]
  const hintY = cy > WORLD_HEIGHT / 2 && zoneId !== 'tavern' ? boxY - 8 : boxY + 23
  ctx.font = '8px monospace'
  const hintW = Math.ceil(ctx.measureText(hint).width) + 8
  ctx.fillStyle = 'rgba(11, 14, 23, 0.7)'
  ctx.fillRect(Math.round(cx - hintW / 2), hintY - 6, hintW, 12)
  ctx.fillStyle = '#cbd5e1'
  ctx.fillText(hint, cx, hintY)
}

/** Draws the 5-biome pixel-art world tilemap, connecting roads, props and biome signs. */
export function renderWorldMap(
  ctx: CanvasRenderingContext2D,
  animFrame: number,
  bossActive: boolean,
): void {
  // Base background tiles divided into the 4 quadrant biomes
  for (let ty = 0; ty < WORLD_HEIGHT / TILE_SIZE; ty++) {
    for (let tx = 0; tx < WORLD_WIDTH / TILE_SIZE; tx++) {
      const px = tx * TILE_SIZE
      const py = ty * TILE_SIZE
      const isLeft = px < WORLD_WIDTH / 2
      const isTop = py < WORLD_HEIGHT / 2
      const zoneId: ZoneId = isTop ? (isLeft ? 'research' : 'forge') : isLeft ? 'arena' : 'citadel'
      const theme = ZONE_THEMES[zoneId]
      const checker = (tx + ty) % 2 === 0
      ctx.fillStyle = checker ? theme.ground : theme.tileAlt
      ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE)
    }
  }

  // Connecting cobblestone paths from Tavern to each biome
  const tavern = WORLD_ZONES.tavern
  const roadZones: ZoneId[] = ['research', 'forge', 'arena', 'citadel']
  ctx.strokeStyle = '#474154'
  ctx.lineWidth = 14
  for (const id of roadZones) {
    const z = WORLD_ZONES[id]
    ctx.beginPath()
    ctx.moveTo(tavern.centerX, tavern.centerY)
    ctx.lineTo(z.centerX, z.centerY)
    ctx.stroke()
  }
  ctx.strokeStyle = '#635b73'
  ctx.lineWidth = 8
  for (const id of roadZones) {
    const z = WORLD_ZONES[id]
    ctx.beginPath()
    ctx.moveTo(tavern.centerX, tavern.centerY)
    ctx.lineTo(z.centerX, z.centerY)
    ctx.stroke()
  }

  // Central Tavern plaza
  ctx.fillStyle = ZONE_THEMES.tavern.ground
  ctx.fillRect(tavern.centerX - 66, tavern.centerY - 56, 132, 110)
  ctx.strokeStyle = ZONE_THEMES.tavern.border
  ctx.lineWidth = 2
  ctx.strokeRect(tavern.centerX - 66, tavern.centerY - 56, 132, 110)
  drawTavernRoof(ctx, tavern.centerX, tavern.centerY)
  drawCampfire(ctx, tavern.centerX, tavern.centerY + 12, Math.floor(animFrame / 8))

  // Biome props: Research trees
  drawPineTree(ctx, 22, 22)
  drawPineTree(ctx, 44, 34)
  drawPineTree(ctx, 232, 24)
  drawPineTree(ctx, 26, 146)

  // Forge lava pools & anvil
  ctx.fillStyle = animFrame % 20 < 10 ? '#f97316' : '#ea580c'
  ctx.fillRect(584, 28, 34, 14)
  ctx.fillRect(592, 146, 26, 12)
  drawAnvilProp(ctx, 566, 86)

  // Arena wooden fence posts
  ctx.fillStyle = '#92400e'
  for (let x = 28; x <= 216; x += 28) {
    ctx.fillRect(x, 352, 6, 14)
    ctx.fillRect(x, 356, 24, 3)
  }

  // Citadel rune circle (pulses crimson during Boss fights!)
  const cit = WORLD_ZONES.citadel
  ctx.strokeStyle = bossActive
    ? animFrame % 16 < 8
      ? '#ef4444'
      : '#facc15'
    : 'rgba(192, 132, 252, 0.45)'
  ctx.lineWidth = bossActive ? 3 : 2
  ctx.beginPath()
  ctx.arc(cit.monsterAnchorX, cit.monsterAnchorY + 4, 36, 0, Math.PI * 2)
  ctx.stroke()

  // Zone plaques
  drawZonePlate(ctx, 'research', WORLD_ZONES.research.centerX, 10)
  drawZonePlate(ctx, 'forge', WORLD_ZONES.forge.centerX, 10)
  drawZonePlate(ctx, 'arena', WORLD_ZONES.arena.centerX, WORLD_HEIGHT - 22)
  drawZonePlate(ctx, 'citadel', WORLD_ZONES.citadel.centerX, WORLD_HEIGHT - 22)
  drawZonePlate(ctx, 'tavern', tavern.centerX, tavern.centerY + 42)
}

const RIFT_TINTS = ['#7c3aed', '#0ea5e9', '#dc2626', '#16a34a', '#f59e0b'] as const

/** In the endless rift, each depth gets its own colour cast and a pulsing dark edge. */
export function renderRiftTint(ctx: CanvasRenderingContext2D, act: number, animFrame: number): void {
  if (act <= STORY_ACTS) return
  const depth = act - STORY_ACTS
  ctx.save()
  ctx.globalAlpha = 0.14
  ctx.fillStyle = RIFT_TINTS[(depth - 1) % RIFT_TINTS.length]!
  ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT)
  ctx.globalAlpha = 0.3 + Math.sin(animFrame * 0.05) * 0.1
  ctx.fillStyle = '#05070d'
  const edge = 8
  ctx.fillRect(0, 0, WORLD_WIDTH, edge)
  ctx.fillRect(0, WORLD_HEIGHT - edge, WORLD_WIDTH, edge)
  ctx.fillRect(0, 0, edge, WORLD_HEIGHT)
  ctx.fillRect(WORLD_WIDTH - edge, 0, edge, WORLD_HEIGHT)
  ctx.restore()
}
