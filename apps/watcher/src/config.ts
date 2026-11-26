import os from 'node:os'
import path from 'node:path'

export interface WatcherConfig {
  readonly host: string
  readonly port: number
  readonly savePath: string
  readonly antigravityDir: string
  readonly claudeDir: string
  readonly simulatorDefault: boolean
  /** Directory with the built web client to serve on the same port, or null for API only. */
  readonly staticDir: string | null
}

type Env = Readonly<Record<string, string | undefined>>

const DEFAULT_HOST = '127.0.0.1'
const DEFAULT_PORT = 4310

function readText(env: Env, key: string): string {
  return (env[key] ?? '').trim()
}

/** Parses a TCP port, returning null when the value is not a valid port number. */
export function parsePort(raw: string | undefined): number | null {
  if (raw === undefined || raw.trim() === '') return null
  const port = Number(raw)
  return Number.isInteger(port) && port > 0 && port < 65536 ? port : null
}

/**
 * Resolves the Claude Code projects directory. Claude Code honours CLAUDE_CONFIG_DIR,
 * so a custom profile keeps its transcripts under `$CLAUDE_CONFIG_DIR/projects`.
 */
export function resolveClaudeDir(env: Env, home: string): string {
  const explicit = readText(env, 'AGENT_RPG_CLAUDE_DIR')
  if (explicit) return explicit
  const configDir = readText(env, 'CLAUDE_CONFIG_DIR')
  if (configDir) return path.join(configDir, 'projects')
  return path.join(home, '.claude', 'projects')
}

/** Reads watcher runtime configuration from environment variables in one place. */
export function loadConfig(env: Env = process.env, home: string = os.homedir()): WatcherConfig {
  return {
    host: readText(env, 'AGENT_RPG_HOST') || DEFAULT_HOST,
    port: parsePort(env.AGENT_RPG_PORT) ?? DEFAULT_PORT,
    savePath: readText(env, 'AGENT_RPG_SAVE_PATH') || path.join(home, '.agent-rpg', 'save.json'),
    antigravityDir:
      readText(env, 'AGENT_RPG_AGY_DIR') || path.join(home, '.gemini', 'antigravity-cli', 'brain'),
    claudeDir: resolveClaudeDir(env, home),
    simulatorDefault: env.AGENT_RPG_SIMULATOR_DEFAULT === 'true',
    staticDir: readText(env, 'AGENT_RPG_STATIC_DIR') || null,
  }
}
