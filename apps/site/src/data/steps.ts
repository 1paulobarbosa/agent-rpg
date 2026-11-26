export interface Step {
  readonly label: string
  readonly title: string
  readonly body: string
}

export const STEPS: readonly Step[] = [
  { label: '1', title: 'Run one command', body: 'npx agent-rpg starts a tiny local server and opens the game.' },
  { label: '2', title: 'Code with your agents', body: 'Use Claude Code or Antigravity as usual. Their logs feed the game.' },
  { label: '3', title: 'Watch the raid', body: 'Heroes level up, bosses fall, quests pay runes. Ascend and dive deeper, forever.' },
]

export const BOSSES_TITLE = '5 story acts, each boss with its own entrance · then the Endless Rift · ascend for runes'

export const BOSSES: readonly string[] = [
  'Backlog Slime King',
  'Vague Spec Wraith',
  'Tech Debt Golem',
  'Flaky Test Hydra',
  'Regression Dragon',
]
