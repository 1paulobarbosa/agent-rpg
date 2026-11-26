import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { loadConfig, startWatcher } from '@agent-rpg/watcher'
import { parseCliArgs, USAGE } from './args.js'
import { openBrowser } from './open-browser.js'

declare const __AGENT_RPG_VERSION__: string

const VERSION = typeof __AGENT_RPG_VERSION__ === 'string' ? __AGENT_RPG_VERSION__ : '0.0.0-dev'

async function main(): Promise<number> {
  const parsed = parseCliArgs(process.argv.slice(2))
  if (!parsed.ok) {
    console.error(`agent-rpg: ${parsed.error}\n\n${USAGE}`)
    return 2
  }
  const { options } = parsed
  if (options.help) {
    console.info(USAGE)
    return 0
  }
  if (options.version) {
    console.info(VERSION)
    return 0
  }

  const staticDir = path.join(path.dirname(fileURLToPath(import.meta.url)), 'web')
  if (!fs.existsSync(path.join(staticDir, 'index.html'))) {
    console.error(`agent-rpg: web client not found at ${staticDir}. Reinstall the package.`)
    return 1
  }

  const base = loadConfig()
  const config = {
    ...base,
    port: options.port ?? base.port,
    simulatorDefault: options.demo || base.simulatorDefault,
    staticDir,
  }

  let watcher
  try {
    watcher = await startWatcher(config, { autoDemo: true })
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'EADDRINUSE') {
      console.error(
        `agent-rpg: port ${config.port} is already in use. Is agent-rpg already running? Try --port ${config.port + 1}.`,
      )
      return 1
    }
    throw err
  }

  console.info(`\n  ⚔  Agent RPG v${VERSION}\n`)
  console.info(`  Game:   ${watcher.url}`)
  console.info(`  Claude: ${config.claudeDir}`)
  console.info(`  Agy:    ${config.antigravityDir}`)
  console.info(`  Save:   ${config.savePath}`)
  if (watcher.autoDemoEnabled) {
    console.info('\n  No agent logs found yet, so the demo party is playing. Start an agent and it joins.')
  }
  console.info('\n  Press Ctrl+C to stop.\n')

  if (options.open) openBrowser(watcher.url)

  await new Promise<void>((resolve) => {
    const stop = () => resolve()
    process.once('SIGINT', stop)
    process.once('SIGTERM', stop)
  })
  await watcher.close()
  return 0
}

main().then(
  (code) => process.exit(code),
  (err: unknown) => {
    console.error('agent-rpg: unexpected error', err)
    process.exit(1)
  },
)
