import fs from 'node:fs'
import path from 'node:path'
import type { AgentEvent } from '@agent-rpg/game-core'
import { parseAntigravityLine } from './antigravity-parser.js'
import { parseClaudeCodeLine } from './claude-parser.js'

interface TrackedFile {
  offset: number
  remainder: string
}

export interface TailerCallbacks {
  onEvent: (event: AgentEvent) => void
  onSourcesChanged: (sources: { antigravity: boolean; claudeCode: boolean }) => void
}

const ACTIVE_WINDOW_MS = 30 * 60 * 1000
const INITIAL_REPLAY_WINDOW_MS = 3 * 60 * 1000
const INITIAL_TAIL_BYTES = 16_384
const MAX_READ_BYTES = 65_536

/** Incrementally tails recent Antigravity and Claude Code JSONL files without re-reading old history. */
export class JsonlTailer {
  private readonly tracked = new Map<string, TrackedFile>()
  private timer: NodeJS.Timeout | null = null

  constructor(
    private readonly dirs: { antigravityDir: string; claudeDir: string },
    private readonly callbacks: TailerCallbacks,
  ) {}

  start(pollIntervalMs = 1000): void {
    this.poll()
    this.timer = setInterval(() => this.poll(), pollIntervalMs)
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }
  }

  poll(): void {
    const agyExists = fs.existsSync(this.dirs.antigravityDir)
    const claudeExists = fs.existsSync(this.dirs.claudeDir)
    this.callbacks.onSourcesChanged({ antigravity: agyExists, claudeCode: claudeExists })

    const nowMs = Date.now()
    if (agyExists) {
      for (const item of this.findAntigravityFiles(nowMs)) {
        this.readAppended(item.filePath, item.mtimeMs, nowMs, (line) =>
          parseAntigravityLine(line, item.sessionId),
        )
      }
    }

    if (claudeExists) {
      for (const item of this.findClaudeFiles(this.dirs.claudeDir, nowMs, 0)) {
        this.readAppended(item.filePath, item.mtimeMs, nowMs, (line) =>
          parseClaudeCodeLine(line, item.sessionId),
        )
      }
    }
  }

  private findAntigravityFiles(nowMs: number): Array<{ filePath: string; sessionId: string; mtimeMs: number }> {
    const found: Array<{ filePath: string; sessionId: string; mtimeMs: number }> = []
    let entries: fs.Dirent[]
    try {
      entries = fs.readdirSync(this.dirs.antigravityDir, { withFileTypes: true })
    } catch {
      return found
    }

    for (const entry of entries) {
      if (!entry.isDirectory()) continue
      const candidate = path.join(
        this.dirs.antigravityDir,
        entry.name,
        '.system_generated',
        'logs',
        'transcript.jsonl',
      )
      try {
        const stat = fs.statSync(candidate)
        if (nowMs - stat.mtimeMs <= ACTIVE_WINDOW_MS) {
          found.push({ filePath: candidate, sessionId: entry.name, mtimeMs: stat.mtimeMs })
        }
      } catch {
        // Ignore conversations without a transcript file.
      }
    }
    return found
  }

  private findClaudeFiles(
    dir: string,
    nowMs: number,
    depth: number,
  ): Array<{ filePath: string; sessionId: string; mtimeMs: number }> {
    if (depth > 3) return []
    const found: Array<{ filePath: string; sessionId: string; mtimeMs: number }> = []
    let entries: fs.Dirent[]
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true })
    } catch {
      return found
    }

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        found.push(...this.findClaudeFiles(fullPath, nowMs, depth + 1))
      } else if (entry.name.endsWith('.jsonl')) {
        try {
          const stat = fs.statSync(fullPath)
          if (nowMs - stat.mtimeMs <= ACTIVE_WINDOW_MS) {
            found.push({
              filePath: fullPath,
              sessionId: entry.name.replace(/\.jsonl$/, ''),
              mtimeMs: stat.mtimeMs,
            })
          }
        } catch {
          // Ignore unreadable or rotated files.
        }
      }
    }
    return found
  }

  private readAppended(
    filePath: string,
    mtimeMs: number,
    nowMs: number,
    parseLine: (line: string) => AgentEvent[],
  ): void {
    let size: number
    try {
      size = fs.statSync(filePath).size
    } catch {
      return
    }

    let tracker = this.tracked.get(filePath)
    if (!tracker) {
      const isHotSession = nowMs - mtimeMs <= INITIAL_REPLAY_WINDOW_MS
      const initialOffset = isHotSession ? Math.max(0, size - INITIAL_TAIL_BYTES) : size
      tracker = { offset: initialOffset, remainder: '' }
      this.tracked.set(filePath, tracker)
      if (!isHotSession) return
    }

    if (size < tracker.offset) {
      tracker.offset = 0
      tracker.remainder = ''
    }
    if (size === tracker.offset) return

    const bytesToRead = Math.min(MAX_READ_BYTES, size - tracker.offset)
    const buffer = Buffer.alloc(bytesToRead)
    let fd: number | null = null
    try {
      fd = fs.openSync(filePath, 'r')
      const bytesRead = fs.readSync(fd, buffer, 0, bytesToRead, tracker.offset)
      tracker.offset += bytesRead
      const chunk = tracker.remainder + buffer.subarray(0, bytesRead).toString('utf8')
      const lines = chunk.split('\n')
      tracker.remainder = lines.pop() ?? ''

      for (const line of lines) {
        const events = parseLine(line)
        for (const event of events) {
          this.callbacks.onEvent(event)
        }
      }
    } catch {
      // File may be rotated mid-read; retry cleanly on the next poll.
    } finally {
      if (fd !== null) fs.closeSync(fd)
    }
  }
}
