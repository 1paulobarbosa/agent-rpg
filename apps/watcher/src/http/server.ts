import http, { type IncomingMessage, type ServerResponse } from 'node:http'
import { ClientCommandSchema, DomainError } from '@agent-rpg/game-core'
import type { SessionHub } from '../application/session-hub.js'
import { serveStaticFile } from './static-files.js'

const MAX_BODY_BYTES = 16_384
const LOCAL_ORIGIN_PATTERN = /^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/
const LOCAL_HOST_PATTERN = /^(127\.0\.0\.1|localhost|\[::1\])(:\d+)?$/

export interface HttpServerOptions {
  /** Built web client served for every non-API GET. Omit to expose the API only. */
  readonly staticDir?: string | null
}

/** Rejects requests whose Host header is not local, which blocks DNS rebinding attacks. */
function isLocalHost(req: IncomingMessage): boolean {
  const host = req.headers.host
  return host === undefined || LOCAL_HOST_PATTERN.test(host)
}

function applyLocalCors(req: IncomingMessage, res: ServerResponse): void {
  const origin = req.headers.origin
  if (origin && LOCAL_ORIGIN_PATTERN.test(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin)
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  }
}

function sendJson(res: ServerResponse, statusCode: number, payload: unknown): void {
  res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' })
  res.end(JSON.stringify(payload))
}

function readJsonBody(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    let totalBytes = 0

    req.on('data', (chunk: Buffer) => {
      totalBytes += chunk.length
      if (totalBytes > MAX_BODY_BYTES) {
        reject(new Error('PAYLOAD_TOO_LARGE'))
        req.destroy()
        return
      }
      chunks.push(chunk)
    })

    req.on('end', () => {
      try {
        const text = Buffer.concat(chunks).toString('utf8')
        resolve(text ? JSON.parse(text) : {})
      } catch {
        reject(new Error('INVALID_JSON'))
      }
    })

    req.on('error', reject)
  })
}

/** Creates the localhost HTTP + SSE server exposing RPG state and validated client commands. */
export function createHttpServer(hub: SessionHub, options: HttpServerOptions = {}): http.Server {
  const staticDir = options.staticDir ?? null
  return http.createServer(async (req, res) => {
    res.setHeader('X-Content-Type-Options', 'nosniff')
    if (!isLocalHost(req)) {
      sendJson(res, 403, { error: 'Forbidden host', code: 'FORBIDDEN_HOST' })
      return
    }
    applyLocalCors(req, res)
    const method = req.method ?? 'GET'
    const url = new URL(req.url ?? '/', 'http://127.0.0.1')

    if (method === 'OPTIONS') {
      res.writeHead(204)
      res.end()
      return
    }

    if (method === 'GET' && url.pathname === '/api/health') {
      sendJson(res, 200, { status: 'ok', sources: hub.getSnapshot().sources })
      return
    }

    if (method === 'GET' && url.pathname === '/api/state') {
      sendJson(res, 200, hub.getSnapshot())
      return
    }

    if (method === 'GET' && url.pathname === '/api/events') {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
      })

      const writeSnapshot = (snapshot: unknown) => {
        res.write(`event: snapshot\ndata: ${JSON.stringify(snapshot)}\n\n`)
      }

      writeSnapshot(hub.getSnapshot())
      const unsubscribe = hub.subscribe(writeSnapshot)
      const heartbeat = setInterval(() => res.write(': keepalive\n\n'), 15_000)

      req.on('close', () => {
        clearInterval(heartbeat)
        unsubscribe()
      })
      return
    }

    if (method === 'POST' && url.pathname === '/api/commands') {
      let body: unknown
      try {
        body = await readJsonBody(req)
      } catch (err) {
        const code = err instanceof Error ? err.message : 'INVALID_BODY'
        sendJson(res, 400, { error: 'Invalid request body', code })
        return
      }

      const parsed = ClientCommandSchema.safeParse(body)
      if (!parsed.success) {
        sendJson(res, 400, { error: 'Invalid command payload', code: 'VALIDATION_ERROR' })
        return
      }

      try {
        const state = hub.executeCommand(parsed.data)
        sendJson(res, 200, { ok: true, state })
      } catch (err) {
        if (err instanceof DomainError) {
          sendJson(res, 400, { error: err.message, code: err.code })
          return
        }
        sendJson(res, 500, { error: 'Internal server error', code: 'INTERNAL_ERROR' })
      }
      return
    }

    const isPageRequest = method === 'GET' || method === 'HEAD'
    if (staticDir && isPageRequest && !url.pathname.startsWith('/api/')) {
      if (serveStaticFile(staticDir, url.pathname, res)) return
    }

    sendJson(res, 404, { error: 'Not found', code: 'NOT_FOUND' })
  })
}
