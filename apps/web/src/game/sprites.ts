import type { HeroClass } from '@agent-rpg/game-core'
import { PIXEL_PALETTE } from './palette.js'

export type SpriteMatrix = readonly string[]

export const HERO_SPRITES: Record<HeroClass, SpriteMatrix> = {
  mage: [
    '....ppp.....',
    '...ppppp....',
    '..pppyppp...',
    '..ksssssk...',
    '..ksbsbsk..c',
    '...ksssk..cc',
    '..kpppppk.t.',
    '.kpppypppkt.',
    '.kppppppk.t.',
    '..kPPPPk..t.',
    '..kP..Pk....',
    '..kk..kk....',
  ],
  knight: [
    '....rrr.....',
    '...kmmmk....',
    '..kmwmmmk...',
    '..kmkkkmk...',
    '..ksssssk..w',
    '.cckbbbk..mw',
    '.cckbbbk.mm.',
    '.cYkbbbkmm..',
    '.cckBBBk....',
    '...kM.Mk....',
    '...kM.Mk....',
    '..kk..kk....',
  ],
  rogue: [
    '...kkkkk....',
    '..kGGGGgk...',
    '..kGsssgk...',
    '..ksbsbsk...',
    '...ksssk....',
    '.m.kGGgk.m..',
    'mmkGGYGGkmm.',
    '..kGGGGgk...',
    '...kTTTk....',
    '...kT.Tk....',
    '..kT...Tk...',
    '..kk...kk...',
  ],
  paladin: [
    '..y.yyy.y...',
    '..kyyyyk....',
    '..kmwmmmk...',
    '..ksssssk...',
    '.cckyyyk.yy.',
    '.cckywyk.yy.',
    '.cckbbbk.t..',
    '..kbbbbk.t..',
    '..kBBBBk.t..',
    '...kY.Yk....',
    '...kY.Yk....',
    '..kk..kk....',
  ],
  ranger: [
    '....ggr.....',
    '...kGGGk....',
    '..kGGGGgk...',
    '..ksssssk.t.',
    '..ksbsbskt..',
    '...ksssk.t..',
    '..kGTTTGkt..',
    '.tkGTTTGk.t.',
    '..kTTTTk..t.',
    '...kT.Tk....',
    '...kT.Tk....',
    '..kk..kk....',
  ],
}

export const MONSTER_SPRITES: Record<string, SpriteMatrix> = {
  context_slime: [
    '............',
    '....eeee....',
    '..eeeeeeee..',
    '.eeweeeeewe.',
    '.eekeeeeeke.',
    'eeeeeeeeeeee',
    'eeGeeeeeeGee',
    'eGGGeeeeGGGe',
    '.GGGGGGGGGG.',
    '..kkkkkkkk..',
  ],
  doc_owl: [
    '...pp..pp...',
    '..pppppppp..',
    '.ppwppppwpp.',
    '.ppkppppkpp.',
    '..pppyyppp..',
    '.pppppppppp.',
    'ppPPPPPPPPpp',
    '.ppPP..PPpp.',
    '..pP....Pp..',
  ],
  diff_gremlin: [
    '.g........g.',
    '.gg.gggg.gg.',
    '..gggggggg..',
    '..gryggyrg..',
    '...gwwwwg...',
    '..kttggttk..',
    '.kttGGGGttk.',
    '..kGGGGGGk..',
    '...kG..Gk...',
    '..kk....kk..',
  ],
  refactor_golem: [
    '..MMMMMMMM..',
    '.MMmmmmmmMM.',
    'MMmoM..MomMM',
    'MMmMMooMMmMM',
    'MMMMMMMMMMMM',
    'MMmMooooMmMM',
    '.MMmmmmmmMM.',
    '..MMM..MMM..',
    '..MMM..MMM..',
    '.kkkk..kkkk.',
  ],
  lint_goblin: [
    '.y........y.',
    '.yy.gggg.yy.',
    '..gggggggg..',
    '..grkggkrg..',
    '...gwwwwg...',
    '..kYYggYYk..',
    '.kYYGGGGYYk.',
    '..kGGGGGGk..',
    '...kG..Gk...',
    '..kk....kk..',
  ],
  bug_wraith: [
    '.r........r.',
    '..r.rrrr.r..',
    '.rrrrrrrrrr.',
    'rrryrrrryrrr',
    '.rrRRRRRRrr.',
    'r.rRRooRRr.r',
    '..rRRRRRRr..',
    '.r.rR..Rr.r.',
    'r...r..r...r',
  ],
  gate_sentinel: [
    '...PPPPPP...',
    '..PMMMMMMP..',
    '..PMccccMP..',
    '..PMMMMMMP..',
    '.PPMMPPMMPP.',
    '.PPMMPPMMPP.',
    '..PMMMMMMP..',
    '..PMM..MMP..',
    '..PMM..MMP..',
    '.kkkk..kkkk.',
  ],
  backlog_slime_king: [
    '...y.yy.y...',
    '...yyyyyy...',
    '..eeeeeeee..',
    '.eeweeeeewe.',
    '.eekeeeeeke.',
    'eeeeeeeeeeee',
    'eeGeeeeeGGee',
    'eGGGGeeGGGGe',
    'GGGGGGGGGGGG',
    '.kkkkkkkkkk.',
  ],
  vague_spec_wraith: [
    '...cccccc...',
    '..cPPPPPPc..',
    '.cPPwPPwPPc.',
    '.cPPcPPcPPc.',
    'cPPPPPPPPPPc',
    'cPPPccccPPPc',
    '.cPPPPPPPPc.',
    '..cPP..PPc..',
    '.cP..cc..Pc.',
    '..c......c..',
  ],
  tech_debt_golem: [
    '..oMMMMMMo..',
    '.MMmmmmmmMM.',
    'MMmoM..MomMM',
    'MMmMMooMMmMM',
    'MMmoooooOmMM',
    'MMmMooooMmMM',
    'MMmMMooMMmMM',
    '.MMmmmmmmMM.',
    '..MMM..MMM..',
    '.kkkk..kkkk.',
  ],
  flaky_hydra: [
    '.gg..gg..gg.',
    'gyg.gyg.gyg.',
    '.gg..gg..gg.',
    '..gGGGGGGg..',
    '.gGGgGGgGGg.',
    '.gGGGGGGGGg.',
    '..gGGyyGGg..',
    '..gGGGGGGg..',
    '.gGG....GGg.',
    '.kk......kk.',
  ],
  regression_dragon: [
    'r..y....y..r',
    'rr.yy..yy.rr',
    'rrrRRRRRRrrr',
    'rrRRyRRyRRrr',
    '.rrRRRRRRrr.',
    'rrRRooooRRrr',
    'rrRRoYYoRRrr',
    '.rrRRRRRRrr.',
    '..rRR..RRr..',
    '..rRR..RRr..',
    '.yyr....ryy.',
  ],
}

export const CHEST_SPRITE: SpriteMatrix = [
  '.kkkkkkkk.',
  'kTTTTTTTTk',
  'kTyyyyyyTk',
  'kTttYYttTk',
  'kTTtYYtTTk',
  'kTTTTTTTTk',
  '.kkkkkkkk.',
]

export const COIN_SPRITE: SpriteMatrix = [
  '..kkkk..',
  '.kyyyyk.',
  'kywyyyyk',
  'kywyYyyk',
  '.kyyyyk.',
  '..kkkk..',
]

export const CROWN_SPRITE: SpriteMatrix = [
  'y.y.y',
  'yyyyy',
  'yYrYy',
]

export function drawSpriteMatrix(params: {
  ctx: CanvasRenderingContext2D
  matrix: SpriteMatrix
  centerX: number
  centerY: number
  pixelSize: number
  flipX?: boolean
  flashWhite?: boolean
}): void {
  const { ctx, matrix, centerX, centerY, pixelSize, flipX = false, flashWhite = false } = params
  const rows = matrix.length
  const cols = matrix[0]?.length ?? 0
  const startX = Math.round(centerX - (cols * pixelSize) / 2)
  const startY = Math.round(centerY - (rows * pixelSize) / 2)

  for (let row = 0; row < rows; row++) {
    const line = matrix[row]!
    for (let col = 0; col < line.length; col++) {
      const ch = line[col]!
      const color = PIXEL_PALETTE[ch]
      if (!color) continue
      const drawCol = flipX ? cols - 1 - col : col
      ctx.fillStyle = flashWhite ? '#ffffff' : color
      ctx.fillRect(startX + drawCol * pixelSize, startY + row * pixelSize, pixelSize, pixelSize)
    }
  }
}
