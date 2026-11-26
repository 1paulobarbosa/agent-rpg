// Bundles the CLI (watcher + game-core + zod) into one ESM file and copies the built web client.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { build } from 'esbuild'

const cliDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const repoRoot = path.resolve(cliDir, '../..')
const distDir = path.join(cliDir, 'dist')
const webDist = path.join(repoRoot, 'apps/web/dist')
const pkg = JSON.parse(fs.readFileSync(path.join(cliDir, 'package.json'), 'utf8'))

if (!fs.existsSync(path.join(webDist, 'index.html'))) {
  console.error('apps/web/dist is missing. Run `pnpm --filter @agent-rpg/web build` first.')
  process.exit(1)
}

fs.rmSync(distDir, { recursive: true, force: true })

await build({
  entryPoints: [path.join(cliDir, 'src/cli.ts')],
  outfile: path.join(distDir, 'cli.js'),
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node20',
  legalComments: 'none',
  alias: {
    '@agent-rpg/watcher': path.join(repoRoot, 'apps/watcher/src/index.ts'),
    '@agent-rpg/game-core': path.join(repoRoot, 'packages/game-core/src/index.ts'),
  },
  define: { __AGENT_RPG_VERSION__: JSON.stringify(pkg.version) },
  banner: { js: '#!/usr/bin/env node' },
  logLevel: 'warning',
})
fs.chmodSync(path.join(distDir, 'cli.js'), 0o755)

fs.cpSync(webDist, path.join(distDir, 'web'), { recursive: true })
for (const file of ['README.md', 'LICENSE']) {
  const source = path.join(repoRoot, file)
  if (fs.existsSync(source)) fs.copyFileSync(source, path.join(cliDir, file))
}

console.info(`agent-rpg ${pkg.version} bundled to ${path.relative(repoRoot, distDir)}`)
