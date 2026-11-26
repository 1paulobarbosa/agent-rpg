import { parseArgs } from 'node:util'

export interface CliOptions {
  readonly port: number | null
  readonly demo: boolean
  readonly open: boolean
  readonly help: boolean
  readonly version: boolean
}

export type ParsedArgs = { ok: true; options: CliOptions } | { ok: false; error: string }

export const USAGE = `Usage: agent-rpg [options]

Watch your AI coding agents play a pixel-art RPG, live, on your machine.

Options:
  -p, --port <n>   Port to listen on (default: 4310, or AGENT_RPG_PORT)
  -d, --demo       Start with the demo party, even when agent logs exist
      --no-open    Do not open the browser
  -h, --help       Show this help
  -v, --version    Show the version

Reads Claude Code logs from $CLAUDE_CONFIG_DIR/projects (or ~/.claude/projects)
and Antigravity logs from ~/.gemini/antigravity-cli/brain. Binds to 127.0.0.1 only.
`

/** Parses CLI flags into options, returning an error message instead of throwing. */
export function parseCliArgs(argv: readonly string[]): ParsedArgs {
  let values
  try {
    values = parseArgs({
      args: [...argv],
      allowPositionals: false,
      allowNegative: true,
      options: {
        port: { type: 'string', short: 'p' },
        demo: { type: 'boolean', short: 'd', default: false },
        open: { type: 'boolean', default: true },
        help: { type: 'boolean', short: 'h', default: false },
        version: { type: 'boolean', short: 'v', default: false },
      },
    }).values
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) }
  }

  let port: number | null = null
  if (values.port !== undefined) {
    const parsed = Number(values.port)
    if (!Number.isInteger(parsed) || parsed < 1 || parsed > 65535) {
      return { ok: false, error: `Invalid port "${values.port}". Use a number from 1 to 65535.` }
    }
    port = parsed
  }

  return {
    ok: true,
    options: {
      port,
      demo: values.demo,
      open: values.open,
      help: values.help,
      version: values.version,
    },
  }
}
