const STORAGE_KEY = 'agent-rpg.tutorial-seen'

/** True when this browser already went through the tutorial. Blocked storage counts as unseen. */
export function hasSeenTutorial(): boolean {
  try {
    return globalThis.localStorage?.getItem(STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

export function markTutorialSeen(): void {
  try {
    globalThis.localStorage?.setItem(STORAGE_KEY, '1')
  } catch {
    // Storage blocked: the tutorial shows again next visit, which is harmless.
  }
}
