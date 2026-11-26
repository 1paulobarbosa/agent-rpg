import { startWatcher } from './app.js'
import { loadConfig } from './config.js'

const config = loadConfig()
const watcher = await startWatcher(config)

console.info(`[agent-rpg/watcher] listening on ${watcher.url} (save: ${config.savePath})`)

function shutdown(): void {
  void watcher.close().then(() => process.exit(0))
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
