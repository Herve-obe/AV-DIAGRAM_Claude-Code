import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@xyflow/react/dist/style.css'
import './styles/tokens.css'
import './styles/app.css'
import './i18n'
import App from './App'
import { restoreUserLibrary } from './store/libraryStore'
import { restoreProject, startAutosave } from './store/persistence'
import { startWindowSync, WINDOW_ROLE } from './store/windowSync'
import PanelsApp from './PanelsApp'
import { startBackups } from './io/backups'
import { useProject } from './store/projectStore'

// Fenêtre Infos (double écran) : le projet vient de la fenêtre principale, qui seule l'enregistre
const main = WINDOW_ROLE === 'main'
Promise.all([main ? restoreProject() : Promise.resolve(), restoreUserLibrary()]).finally(() => {
  if (main) {
    startAutosave()
    // Sauvegardes de sécurité tournantes dans le dossier choisi (Paramètres > Enregistrement)
    startBackups(() => useProject.getState().project)
  }
  void startWindowSync()
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      {main ? <App /> : <PanelsApp />}
    </StrictMode>,
  )
})
