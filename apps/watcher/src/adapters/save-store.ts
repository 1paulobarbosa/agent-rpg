import fs from 'node:fs'
import path from 'node:path'
import { migrateSnapshot, type GameSnapshot } from '@agent-rpg/game-core'
import type { SaveStorePort } from '../application/session-hub.js'

/** Persists RPG progress atomically to a local JSON file, migrating older save versions. */
export class FileSaveStore implements SaveStorePort {
  constructor(
    private readonly filePath: string,
    private readonly clock: () => Date = () => new Date(),
  ) {}

  load(): GameSnapshot | null {
    if (!fs.existsSync(this.filePath)) return null
    let migrated: GameSnapshot | null = null
    try {
      migrated = migrateSnapshot(JSON.parse(fs.readFileSync(this.filePath, 'utf8')), this.clock().toISOString())
    } catch {
      migrated = null
    }
    if (!migrated) this.backUpUnreadableSave()
    return migrated
  }

  save(snapshot: GameSnapshot): void {
    const dir = path.dirname(this.filePath)
    fs.mkdirSync(dir, { recursive: true })
    const tempPath = `${this.filePath}.tmp`
    fs.writeFileSync(tempPath, JSON.stringify(snapshot, null, 2), 'utf8')
    fs.renameSync(tempPath, this.filePath)
  }

  /** Keeps a copy of a save this version cannot read, so a fresh game never destroys progress. */
  private backUpUnreadableSave(): void {
    const stamp = this.clock().toISOString().replace(/[:.]/g, '-')
    const backupPath = `${this.filePath}.unreadable-${stamp}.bak`
    try {
      fs.copyFileSync(this.filePath, backupPath)
      console.warn(`[agent-rpg] could not read ${this.filePath}; kept a copy at ${backupPath}`)
    } catch {
      console.warn(`[agent-rpg] could not read or back up ${this.filePath}`)
    }
  }
}
