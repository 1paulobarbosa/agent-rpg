import type { SpriteId } from './sprites'

export interface Feature {
  readonly sprite: SpriteId
  readonly title: string
  readonly body: string
}

export const FEATURES: readonly Feature[] = [
  {
    sprite: 'sword',
    title: 'Your tools become attacks',
    body: 'Every Read scouts the forest, every Edit swings a hammer at the forge, every test run fires arrows in the arena. Skills, subagents and MCP cast spells at the citadel. Errors hit back.',
  },
  {
    sprite: 'mage',
    title: 'See what each agent is doing',
    body: 'A balloon over every hero shows the real tool and file, like ✎ Edit auth.ts. A live feed says who hit what, and a failed command shows up in red.',
  },
  {
    sprite: 'shield',
    title: '100% local',
    body: 'It binds to 127.0.0.1 and reads only metadata: tool name, file basename, ok or error. No prompts, no code, no output. Nothing leaves your machine.',
  },
  {
    sprite: 'portal',
    title: 'Claude Code + Antigravity',
    body: 'Each session joins the party as a hero. Run several agents at once and watch them raid together. No agents yet? A demo party plays for you.',
  },
]
