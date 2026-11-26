import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { TutorialModal } from './tutorial-modal.js'
import { setLocale } from '../shared/i18n/locale-store.js'

describe('TutorialModal', () => {
  it('walks through the steps and closes on the last one', () => {
    setLocale('en')
    const onClose = vi.fn()
    render(<TutorialModal open onClose={onClose} />)
    expect(screen.getByText('Your agents are the heroes')).toBeTruthy()
    fireEvent.click(screen.getByText('Next'))
    expect(screen.getByText('Edit, Write → Code Forge')).toBeTruthy()
    fireEvent.click(screen.getByText('Next'))
    fireEvent.click(screen.getByText('Next'))
    fireEvent.click(screen.getByText('Got it!'))
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('can be skipped from the first screen', () => {
    setLocale('en')
    const onClose = vi.fn()
    render(<TutorialModal open onClose={onClose} />)
    fireEvent.click(screen.getByText('Skip'))
    expect(onClose).toHaveBeenCalledOnce()
  })
})
