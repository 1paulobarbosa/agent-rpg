type SoundKind = 'hit' | 'coin' | 'skill' | 'levelUp' | 'boss' | 'error' | 'victory'

/** Zero-dependency 8-bit chiptune sound synthesizer using WebAudio oscillators. */
export class ChiptuneAudio {
  private ctx: AudioContext | null = null
  private enabled = false

  setEnabled(next: boolean): void {
    this.enabled = next
    if (next && !this.ctx && typeof window !== 'undefined' && 'AudioContext' in window) {
      this.ctx = new AudioContext()
    }
    if (next && this.ctx?.state === 'suspended') {
      void this.ctx.resume()
    }
  }

  play(kind: SoundKind): void {
    if (!this.enabled || !this.ctx) return
    const now = this.ctx.currentTime

    switch (kind) {
      case 'hit':
        this.tone(240, 110, 0.07, 'square', 0.06, now)
        break
      case 'coin':
        this.tone(880, 880, 0.06, 'square', 0.05, now)
        this.tone(1320, 1320, 0.11, 'square', 0.05, now + 0.06)
        break
      case 'skill':
        this.tone(440, 880, 0.14, 'triangle', 0.07, now)
        break
      case 'error':
        this.tone(180, 95, 0.16, 'sawtooth', 0.06, now)
        break
      case 'levelUp':
        this.tone(523, 523, 0.08, 'square', 0.05, now)
        this.tone(659, 659, 0.08, 'square', 0.05, now + 0.08)
        this.tone(784, 784, 0.08, 'square', 0.05, now + 0.16)
        this.tone(1046, 1046, 0.18, 'square', 0.06, now + 0.24)
        break
      case 'boss':
        this.tone(146, 130, 0.18, 'sawtooth', 0.07, now)
        this.tone(130, 110, 0.25, 'sawtooth', 0.07, now + 0.19)
        break
      case 'victory':
        this.tone(523, 523, 0.1, 'square', 0.06, now)
        this.tone(659, 659, 0.1, 'square', 0.06, now + 0.1)
        this.tone(784, 784, 0.1, 'square', 0.06, now + 0.2)
        this.tone(1046, 1046, 0.3, 'triangle', 0.08, now + 0.3)
        break
    }
  }

  private tone(
    startFreq: number,
    endFreq: number,
    duration: number,
    type: OscillatorType,
    volume: number,
    startTime: number,
  ): void {
    if (!this.ctx) return
    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()
    osc.type = type
    osc.frequency.setValueAtTime(startFreq, startTime)
    osc.frequency.exponentialRampToValueAtTime(Math.max(40, endFreq), startTime + duration)
    gain.gain.setValueAtTime(volume, startTime)
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration)
    osc.connect(gain)
    gain.connect(this.ctx.destination)
    osc.start(startTime)
    osc.stop(startTime + duration + 0.02)
  }
}
