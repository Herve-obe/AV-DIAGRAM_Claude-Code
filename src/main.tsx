import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@xyflow/react/dist/style.css'
import './styles/tokens.css'
import './styles/app.css'
import './i18n'
import App from './App'
import { restoreUserLibrary } from './store/libraryStore'
import { restoreProject, startAutosave } from './store/persistence'

Promise.all([restoreProject(), restoreUserLibrary()]).finally(() => {
  startAutosave()
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
})
