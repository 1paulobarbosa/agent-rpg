import {
  GameSnapshotSchema,
  type ClientCommand,
  type GameSnapshot,
} from '@agent-rpg/game-core'
import { z } from 'zod'

export interface MinimalFetchResponse {
  ok: boolean
  status: number
  json(): Promise<unknown>
}

export type Fetcher = (input: string, init?: RequestInit) => Promise<MinimalFetchResponse>

const CommandResponseSchema = z.object({
  ok: z.literal(true),
  state: GameSnapshotSchema,
})

const ErrorResponseSchema = z.object({
  error: z.string(),
  code: z.string().optional(),
})

export class ApiClientError extends Error {
  readonly code: string

  constructor(code: string, message: string) {
    super(message)
    this.name = 'ApiClientError'
    this.code = code
  }
}

const defaultFetcher: Fetcher = (input, init) => fetch(input, init)

/** Fetches and validates the current RPG snapshot from the local watcher API. */
export async function fetchGameState(fetcher: Fetcher = defaultFetcher): Promise<GameSnapshot> {
  const res = await fetcher('/api/state')
  if (!res.ok) {
    throw new ApiClientError('HTTP_ERROR', `Failed to load state (${res.status})`)
  }
  const body = await res.json()
  return GameSnapshotSchema.parse(body)
}

/** Sends a typed client command to the watcher and validates the updated GameSnapshot. */
export async function sendClientCommand(
  command: ClientCommand,
  fetcher: Fetcher = defaultFetcher,
): Promise<GameSnapshot> {
  const res = await fetcher('/api/commands', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(command),
  })
  const body = await res.json()
  if (!res.ok) {
    const parsedErr = ErrorResponseSchema.safeParse(body)
    throw new ApiClientError(
      parsedErr.success && parsedErr.data.code ? parsedErr.data.code : 'COMMAND_FAILED',
      parsedErr.success ? parsedErr.data.error : `Command failed (${res.status})`,
    )
  }
  return CommandResponseSchema.parse(body).state
}

/** Subscribes to live SSE GameSnapshot updates from the local watcher server. */
export function subscribeToGameEvents(
  onSnapshot: (snapshot: GameSnapshot) => void,
  onStatusChange: (connected: boolean) => void,
): () => void {
  const source = new EventSource('/api/events')

  source.addEventListener('open', () => onStatusChange(true))
  source.addEventListener('error', () => onStatusChange(false))
  source.addEventListener('snapshot', (event) => {
    try {
      const parsed = GameSnapshotSchema.safeParse(JSON.parse((event as MessageEvent<string>).data))
      if (parsed.success) {
        onStatusChange(true)
        onSnapshot(parsed.data)
      }
    } catch {
      // Ignore malformed SSE frame and wait for the next valid snapshot.
    }
  })

  return () => source.close()
}
