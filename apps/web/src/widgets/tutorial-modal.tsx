import { useState } from 'react'
import { useCopy } from '../shared/i18n/locale-store.js'

interface TutorialModalProps {
  open: boolean
  onClose: () => void
}

/** Four short screens explaining what drives the game. Shown on first visit and from the ? button. */
export function TutorialModal({ open, onClose }: TutorialModalProps) {
  const copy = useCopy()
  const [step, setStep] = useState(0)
  if (!open) return null

  const steps = copy.tutorial
  const current = steps[Math.min(step, steps.length - 1)]!
  const isLast = step >= steps.length - 1

  function close(): void {
    setStep(0)
    onClose()
  }

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="tutorial-title">
      <div className="rpg-panel tutorial-modal">
        <div className="tutorial-step">{copy.ui.tutorialStep(step + 1, steps.length)}</div>
        <h2 id="tutorial-title" className="tutorial-title">
          {current.title}
        </h2>
        <ul className="tutorial-lines">
          {current.lines.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
        <div className="tutorial-actions">
          <button type="button" className="pixel-btn" onClick={close}>
            {copy.ui.tutorialSkip}
          </button>
          <span className="tutorial-spacer" />
          {step > 0 && (
            <button type="button" className="pixel-btn" onClick={() => setStep(step - 1)}>
              {copy.ui.tutorialBack}
            </button>
          )}
          <button
            type="button"
            className="pixel-btn active-green"
            onClick={() => (isLast ? close() : setStep(step + 1))}
          >
            {isLast ? copy.ui.tutorialDone : copy.ui.tutorialNext}
          </button>
        </div>
      </div>
    </div>
  )
}
