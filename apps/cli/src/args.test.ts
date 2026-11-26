import { describe, expect, it } from 'vitest'
import { parseCliArgs } from './args.js'
import { browserCommand } from './open-browser.js'

describe('parseCliArgs', () => {
  it('defaults to opening the browser, no demo and the configured port', () => {
    expect(parseCliArgs([])).toEqual({
      ok: true,
      options: { port: null, demo: false, open: true, help: false, version: false },
    })
  })

  it('reads --port, --demo and --no-open', () => {
    const parsed = parseCliArgs(['--port', '5000', '--demo', '--no-open'])
    expect(parsed).toMatchObject({ ok: true, options: { port: 5000, demo: true, open: false } })
    expect(parseCliArgs(['-p', '4400', '-d'])).toMatchObject({ ok: true, options: { port: 4400, demo: true } })
  })

  it('rejects an invalid port and unknown flags with a message', () => {
    expect(parseCliArgs(['--port', 'abc'])).toMatchObject({ ok: false })
    expect(parseCliArgs(['--port', '70000'])).toMatchObject({ ok: false })
    expect(parseCliArgs(['--wat'])).toMatchObject({ ok: false })
  })
})

describe('browserCommand', () => {
  it('uses the native opener of each platform', () => {
    expect(browserCommand('darwin', 'http://x').cmd).toBe('open')
    expect(browserCommand('linux', 'http://x').cmd).toBe('xdg-open')
    expect(browserCommand('win32', 'http://x').cmd).toBe('cmd')
  })
})
