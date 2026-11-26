import fs from 'node:fs'
import path from 'node:path'
import type { ServerResponse } from 'node:http'

const CONTENT_TYPES: Readonly<Record<string, string>> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.txt': 'text/plain; charset=utf-8',
}

/**
 * Maps a URL pathname to a file inside rootDir. Returns null when the path escapes the root
 * or contains a null byte. Paths without an extension fall back to index.html (single page app).
 */
export function resolveStaticPath(rootDir: string, pathname: string): string | null {
  let decoded: string
  try {
    decoded = decodeURIComponent(pathname)
  } catch {
    return null
  }
  if (decoded.includes('\0')) return null

  const root = path.resolve(rootDir)
  const candidate = path.resolve(root, `.${path.posix.normalize(`/${decoded}`)}`)
  if (candidate !== root && !candidate.startsWith(`${root}${path.sep}`)) return null

  if (candidate === root || !path.extname(candidate)) {
    return path.join(root, 'index.html')
  }
  return candidate
}

/** Streams one static file. Returns false when it does not exist, so the caller can 404. */
export function serveStaticFile(rootDir: string, pathname: string, res: ServerResponse): boolean {
  const filePath = resolveStaticPath(rootDir, pathname)
  if (!filePath) return false

  let stat: fs.Stats
  try {
    stat = fs.statSync(filePath)
  } catch {
    return false
  }
  if (!stat.isFile()) return false

  const isHashedAsset = filePath.includes(`${path.sep}assets${path.sep}`)
  res.writeHead(200, {
    'Content-Type': CONTENT_TYPES[path.extname(filePath).toLowerCase()] ?? 'application/octet-stream',
    'Content-Length': stat.size,
    'Cache-Control': isHashedAsset ? 'public, max-age=31536000, immutable' : 'no-cache',
  })
  fs.createReadStream(filePath).pipe(res)
  return true
}
