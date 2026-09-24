import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import '@xyflow/react/dist/style.css'
import './styles/tokens.css'
import './styles/app.css'
import './i18n'
import App from './App'
import { restoreProject, startAutosave } from './store/persistence'

// Service worker : met l'application en cache pour un usage hors ligne
registerSW({ immediate: true })

restoreProject().finally(() => {
  startAutosave()
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
})
