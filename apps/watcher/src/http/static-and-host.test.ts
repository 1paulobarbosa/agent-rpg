import fs from 'node:fs'
import http from 'node:http'
import os from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type { GameSnapshot } from '@agent-rpg/game-core'
import { SessionHub, type SaveStorePort } from '../application/session-hub.js'
import { createHttpServer } from './server.js'
import { resolveStaticPath } from './static-files.js'

class MemoryStore implements SaveStorePort {
  load(): GameSnapshot | null {
    return null
  }
  save(): void {}
}

interface RawResponse {
  status: number
  headers: http.IncomingHttpHeaders
  body: string
}

function rawGet(port: number, pathname: string, host?: string): Promise<RawResponse> {
  return new Promise((resolve, reject) => {
    const req = http.request(
      { host: '127.0.0.1', port, path: pathname, method: 'GET', headers: host ? { host } : {} },
      (res) => {
        const chunks: Buffer[] = []
        res.on('data', (c: Buffer) => chunks.push(c))
        res.on('end', () =>
          resolve({ status: res.statusCode ?? 0, headers: res.headers, body: Buffer.concat(chunks).toString() }),
        )
      },
    )
    req.on('error', reject)
    req.end()
  })
}

describe('resolveStaticPath', () => {
  const root = path.resolve('/srv/web')

  it('maps files inside the root and falls back to index.html for routes', () => {
    expect(resolveStaticPath(root, '/assets/app.js')).toBe(path.join(root, 'assets', 'app.js'))
    expect(resolveStaticPath(root, '/')).toBe(path.join(root, 'index.html'))
    expect(resolveStaticPath(root, '/some/route')).toBe(path.join(root, 'index.html'))
  })

  it('never escapes the root, even with encoded traversal or null bytes', () => {
    for (const evil of ['/../secret.txt', '/%2e%2e/%2e%2e/etc/passwd.txt', '/a/../../b.js']) {
      const resolved = resolveStaticPath(root, evil)
      expect(resolved === null || resolved.startsWith(root)).toBe(true)
    }
    expect(resolveStaticPath(root, '/file%00.js')).toBeNull()
    expect(resolveStaticPath(root, '/%E0%A4%A')).toBeNull()
  })
})

describe('HTTP server with a static web client', () => {
  let staticDir = ''
  let server: http.Server | null = null
  let port = 0

  beforeEach(async () => {
    staticDir = fs.mkdtempSync(path.join(os.tmpdir(), 'agent-rpg-static-'))
    fs.mkdirSync(path.join(staticDir, 'assets'))
    fs.writeFileSync(path.join(staticDir, 'index.html'), '<!doctype html><title>Agent RPG</title>')
    fs.writeFileSync(path.join(staticDir, 'assets', 'app.js'), 'console.info("hi")')

    const hub = new SessionHub({ store: new MemoryStore(), initialSimulatorEnabled: false })
    server = createHttpServer(hub, { staticDir })
    await new Promise<void>((resolve) => server!.listen(0, '127.0.0.1', () => resolve()))
    const address = server.address()
    if (!address || typeof address === 'string') throw new Error('Expected numeric port')
    port = address.port
  })

  afterEach(async () => {
    await new Promise<void>((resolve) => server!.close(() => resolve()))
    fs.rmSync(staticDir, { recursive: true, force: true })
  })

  it('serves index.html, hashed assets and keeps the API on the same port', async () => {
    const index = await rawGet(port, '/')
    expect(index.status).toBe(200)
    expect(index.headers['content-type']).toContain('text/html')
    expect(index.body).toContain('Agent RPG')

    const asset = await rawGet(port, '/assets/app.js')
    expect(asset.status).toBe(200)
    expect(asset.headers['content-type']).toContain('text/javascript')
    expect(asset.headers['cache-control']).toContain('immutable')
    expect(asset.headers['x-content-type-options']).toBe('nosniff')

    const health = await rawGet(port, '/api/health')
    expect(health.status).toBe(200)
    expect(JSON.parse(health.body)).toMatchObject({ status: 'ok' })

    expect((await rawGet(port, '/api/missing')).status).toBe(404)
    expect((await rawGet(port, '/missing.js')).status).toBe(404)
  })

  it('rejects requests whose Host header is not local (DNS rebinding)', async () => {
    const rebound = await rawGet(port, '/api/state', 'evil.example.com')
    expect(rebound.status).toBe(403)
    expect(JSON.parse(rebound.body)).toMatchObject({ code: 'FORBIDDEN_HOST' })

    expect((await rawGet(port, '/api/health', `localhost:${port}`)).status).toBe(200)
  })
})
