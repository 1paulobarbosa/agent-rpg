/** Copies the install command of every [data-copy] button and shows a short confirmation. */
const RESET_MS = 1800

for (const button of document.querySelectorAll<HTMLButtonElement>('[data-copy]')) {
  const idleLabel = button.textContent ?? 'Copy'
  button.hidden = false

  button.addEventListener('click', async () => {
    const text = button.dataset.copy ?? ''
    try {
      await navigator.clipboard.writeText(text)
      button.textContent = 'Copied!'
    } catch {
      button.textContent = 'Select & copy'
    }
    const status = document.getElementById(button.getAttribute('aria-controls') ?? '')
    if (status) status.textContent = button.textContent ?? ''
    window.setTimeout(() => {
      button.textContent = idleLabel
    }, RESET_MS)
  })
}
