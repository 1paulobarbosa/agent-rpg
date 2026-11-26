import { spawn } from 'node:child_process'

/** Returns the command that opens a URL in the default browser on this platform. */
export function browserCommand(platform: NodeJS.Platform, url: string): { cmd: string; args: string[] } {
  if (platform === 'darwin') return { cmd: 'open', args: [url] }
  if (platform === 'win32') return { cmd: 'cmd', args: ['/c', 'start', '""', url] }
  return { cmd: 'xdg-open', args: [url] }
}

/** Opens the URL in the default browser. Failures are ignored: the URL is printed anyway. */
export function openBrowser(url: string): void {
  const { cmd, args } = browserCommand(process.platform, url)
  try {
    const child = spawn(cmd, args, { stdio: 'ignore', detached: true })
    child.on('error', () => {})
    child.unref()
  } catch {
    // No browser available (headless machine, container). The URL is already printed.
  }
}
