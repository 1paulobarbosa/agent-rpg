export interface PixelRect {
  readonly x: number
  readonly y: number
  readonly width: number
  readonly color: string
}

/** Turns a sprite grid into horizontal runs of same-colour pixels, so the SVG stays small. */
export function spriteToRects(rows: readonly string[]): PixelRect[] {
  const rects: PixelRect[] = []
  rows.forEach((row, y) => {
    let x = 0
    while (x < row.length) {
      const color = row[x]!
      let end = x + 1
      while (end < row.length && row[end] === color) end++
      if (color !== '.') rects.push({ x, y, width: end - x, color })
      x = end
    }
  })
  return rects
}

export function spriteSize(rows: readonly string[]): { width: number; height: number } {
  return { width: Math.max(...rows.map((r) => r.length)), height: rows.length }
}
