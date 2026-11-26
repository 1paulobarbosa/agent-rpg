// Starts the built CLI on a free port with no agent logs and checks it serves the game and the API.
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import net from 'node:net'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const cliPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../dist/cli.js')
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'agent-rpg-smoke-'))

const port = await new Promise((resolve) => {
  const probe = net.createServer().listen(0, '127.0.0.1', () => {
    const { port: free } = probe.address()
    probe.close(() => resolve(free))
  })
})

const child = spawn(process.execPath, [cliPath, '--no-open', '--port', String(port)], {
  env: {
    ...process.env,
    AGENT_RPG_SAVE_PATH: path.join(tmp, 'save.json'),
    AGENT_RPG_CLAUDE_DIR: path.join(tmp, 'none-claude'),
    AGENT_RPG_AGY_DIR: path.join(tmp, 'none-agy'),
  },
  stdio: ['ignore', 'pipe', 'inherit'],
})

let output = ''
child.stdout.on('data', (chunk) => (output += chunk))

function fail(message) {
  console.error(`smoke: FAIL ${message}\n${output}`)
  child.kill('SIGTERM')
  process.exit(1)
}

const base = `http://127.0.0.1:${port}`
let ready = false
for (let i = 0; i < 50 && !ready; i++) {
  await new Promise((r) => setTimeout(r, 100))
  ready = await fetch(`${base}/api/health`).then((r) => r.ok, () => false)
}
if (!ready) fail('server did not start within 5s')

const index = await fetch(`${base}/`)
const html = await index.text()
if (index.status !== 200 || !html.includes('<div id="root">')) fail('GET / did not return the web client')

const scriptSrc = html.match(/src="(\/assets\/[^"]+\.js)"/)?.[1]
if (!scriptSrc) fail('index.html references no bundled script')
const asset = await fetch(`${base}${scriptSrc}`)
if (asset.status !== 200) fail(`GET ${scriptSrc} returned ${asset.status}`)

const health = await (await fetch(`${base}/api/health`)).json()
if (health.status !== 'ok') fail('/api/health is not ok')
if (health.sources?.simulator !== true) fail('demo did not auto-start without agent logs')

child.kill('SIGINT')
const code = await new Promise((resolve) => child.on('exit', resolve))
fs.rmSync(tmp, { recursive: true, force: true })
if (code !== 0) fail(`CLI exited with code ${code} on SIGINT`)

console.info(`smoke: OK (port ${port}: index.html, ${scriptSrc}, /api/health, auto demo, clean exit)`)
