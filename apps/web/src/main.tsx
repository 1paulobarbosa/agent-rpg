import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/press-start-2p/400.css'
import '@fontsource/vt323/400.css'
import { App } from './App.js'
import { getLocale } from './shared/i18n/locale-store.js'
import './styles/theme.css'
import './styles/layout.css'
import './styles/widgets.css'

document.documentElement.lang = getLocale()
const root = document.getElementById('root')
if (root) {
  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}
