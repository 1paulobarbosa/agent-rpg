/** Facts about the project. Every page and meta tag reads them from here. */
export const SITE = {
  name: 'Agent RPG',
  url: 'https://agent-rpg.paulobarbosa.dev',
  title: 'Agent RPG · Your AI agents, playing an RPG while they code',
  description:
    'A tiny open-source pixel-art RPG that turns your Claude Code and Antigravity sessions into a live adventure. One command, 100% local.',
  tagline: 'Your AI agents, playing an RPG while they code.',
  installCommand: 'npx agent-rpg',
  altCommand: 'pnpm dlx agent-rpg',
  repoUrl: 'https://github.com/1paulobarbosa/agent-rpg',
  npmUrl: 'https://www.npmjs.com/package/agent-rpg',
  license: 'MIT',
  localUrl: 'http://127.0.0.1:4310',
} as const
