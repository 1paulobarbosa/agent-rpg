# Agent RPG

Your AI coding agents, playing a pixel-art RPG while they code.

Every tool call from **Claude Code** or **Antigravity** becomes a hit, a spell or a boss fight on a
tiny map. Leave it open in a browser tab and watch your agents work. 100% local.

```bash
npx agent-rpg
```

That's it. It starts a small server on `http://127.0.0.1:4310` and opens the game. Needs Node 20.11+.
`pnpm dlx agent-rpg` works too.

## How it works

| Your agent does | In the game |
| --- | --- |
| `Read`, `Grep`, `WebSearch` | Scouts the Research Forest |
| `Edit`, `Write` | Strikes at the Code Forge |
| `Bash`, test runs | Fires volleys in the Test Arena |
| `Agent`, MCP tools | Casts bolts from the Gate Citadel |
| Uses any skill | Gains a 3-charge damage buff |
| A tool call fails | The monster strikes back |

Each agent session joins the party as a hero. Kill enough monsters and the act boss shows up:
Backlog Slime King, Vague Spec Wraith, Tech Debt Golem, Flaky Test Hydra and the Regression
Dragon. Click coins and chests on the map to collect gold, and spend it on camp upgrades.

### It never ends

- **Endless Rift.** After Act V the acts keep coming, deeper and harder, with Armored, Swift,
  Golden and Ancient monsters.
- **Ascension.** Once a run reaches Act V you can ascend: the run restarts at Act 1 and pays
  **runes**, more the deeper you went. Runes buy permanent **talents** (damage, gold, XP, HP,
  starting gold, crit).
- **Relics.** Rare boss drops that stay forever and reward how your agents work, like +50% damage
  from test runs or softer error hits.
- **Quests.** Three daily and two weekly quests, measured on real agent work ("run 25 tests",
  "use 3 skills"). They roll over at 00:00 UTC and pay runes and gold.
- **Achievements.** Twenty long-term goals that pay runes once.

Saves from older versions are migrated automatically. A save that can't be read is never
overwritten: it is copied to `save.json.unreadable-<date>.bak` first.

No agent running? When no log folder is found the demo party plays on its own. You can also
toggle **Demo Mode** in the game at any time.

## Options

```text
agent-rpg [options]

  -p, --port <n>   Port to listen on (default: 4310)
  -d, --demo       Start with the demo party, even when agent logs exist
      --no-open    Do not open the browser
  -h, --help       Show help
  -v, --version    Show the version
```

| Environment variable | Default |
| --- | --- |
| `AGENT_RPG_PORT` | `4310` |
| `AGENT_RPG_SAVE_PATH` | `~/.agent-rpg/save.json` |
| `AGENT_RPG_CLAUDE_DIR` | `$CLAUDE_CONFIG_DIR/projects`, else `~/.claude/projects` |
| `AGENT_RPG_AGY_DIR` | `~/.gemini/antigravity-cli/brain` |

The UI is in English and Portuguese (pt-BR). Use the `PT`/`EN` button in the top bar.

## Privacy

Agent RPG reads your agents' log files, so here is exactly what it does with them:

- **Nothing leaves your machine.** No telemetry, no analytics, no network calls. Fonts are bundled.
- **Localhost only.** The server binds to `127.0.0.1`, accepts only local `Host` headers (which
  blocks DNS rebinding) and only allows CORS from `localhost` / `127.0.0.1`.
- **Metadata only.** The parsers keep the source, a short session id, the model tier, the tool
  name, a file **basename**, the skill name and ok/error. Prompts, code, command output, full
  paths, `.env` names and secrets are dropped before anything reaches the game.
- **Read only.** It never writes to your agents' folders. Its only file is the save game.

## Development

This is a pnpm workspace:

- `packages/game-core`: the RPG rules and the wire contracts. Pure TypeScript, no I/O.
- `apps/watcher`: Node HTTP + SSE server that tails the logs and serves the game.
- `apps/web`: Vite + React + Canvas client.
- `apps/cli`: the published `agent-rpg` package. Bundles the watcher and the built client.
- `apps/site`: the landing page (Astro, static).

```bash
pnpm install
pnpm dev          # watcher on :4310 + Vite client on http://127.0.0.1:4311
pnpm dev:site     # landing page on http://127.0.0.1:4321
```

Quality gate:

```bash
pnpm typecheck && pnpm lint && pnpm test && pnpm build && pnpm smoke
```

`pnpm smoke` starts the bundled CLI on a free port with no agent logs and checks that it serves the
game, the API and the auto demo.

## Releasing

```bash
pnpm build && pnpm test && pnpm smoke
cd apps/cli
npm pack --dry-run              # check what ships
npm version patch               # bump before every release after the first
pnpm publish --access public    # pnpm rewrites workspace:* ranges; npm publish does not
```

## License

[MIT](LICENSE)
