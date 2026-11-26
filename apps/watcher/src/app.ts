import type http from 'node:http'
import { JsonlTailer } from './adapters/jsonl-tailer.js'
import { FileSaveStore } from './adapters/save-store.js'
import { SessionHub } from './application/session-hub.js'
import type { WatcherConfig } from './config.js'
import { createHttpServer } from './http/server.js'

const WORLD_TICK_MS = 150
const SIMULATOR_TICK_MS = 1100
const LOG_POLL_MS = 900

export interface StartWatcherOptions {
  /** Turns the demo simulator on when no Claude Code or Antigravity log folder exists. */
  readonly autoDemo?: boolean
}

export interface RunningWatcher {
  readonly url: string
  readonly port: number
  /** True when the demo simulator was switched on because no agent logs were found. */
  readonly autoDemoEnabled: boolean
  close(): Promise<void>
}

/** Boots the hub, log tailer, timers and HTTP server, resolving once the port is bound. */
export async function startWatcher(
  config: WatcherConfig,
  options: StartWatcherOptions = {},
): Promise<RunningWatcher> {
  const hub = new SessionHub({
    store: new FileSaveStore(config.savePath),
    initialSimulatorEnabled: config.simulatorDefault,
  })

  const tailer = new JsonlTailer(
    { antigravityDir: config.antigravityDir, claudeDir: config.claudeDir },
    {
      onEvent: (event) => hub.ingestEvent(event),
      onSourcesChanged: (sources) => hub.updateSources(sources),
    },
  )

  tailer.start(LOG_POLL_MS)
  const { antigravity, claudeCode } = hub.getSnapshot().sources
  const autoDemoEnabled = Boolean(options.autoDemo) && !antigravity && !claudeCode
  if (autoDemoEnabled) {
    hub.executeCommand({ type: 'toggle_simulator', enabled: true })
  }

  const server = createHttpServer(hub, { staticDir: config.staticDir })
  try {
    await listen(server, config.port, config.host)
  } catch (err) {
    tailer.stop()
    throw err
  }

  const worldTickTimer = setInterval(() => hub.tick(), WORLD_TICK_MS)
  const simulatorTimer = setInterval(() => hub.tickSimulator(), SIMULATOR_TICK_MS)
  const address = server.address()
  const port = address && typeof address !== 'string' ? address.port : config.port

  return {
    url: `http://${config.host}:${port}`,
    port,
    autoDemoEnabled,
    close: () =>
      new Promise<void>((resolve) => {
        clearInterval(worldTickTimer)
        clearInterval(simulatorTimer)
        tailer.stop()
        hub.flushSave()
        server.closeAllConnections()
        server.close(() => resolve())
      }),
  }
}

function listen(server: http.Server, port: number, host: string): Promise<void> {
  return new Promise((resolve, reject) => {
    server.once('error', reject)
    server.listen(port, host, () => {
      server.off('error', reject)
      resolve()
    })
  })
}
