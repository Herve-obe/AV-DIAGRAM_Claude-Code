import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@xyflow/react/dist/style.css'
import './styles/tokens.css'
import './styles/app.css'
import './i18n'
import App from './App'
import { guardWindowClose } from './io/documentLifecycle'
import { restoreUserLibrary } from './store/libraryStore'
import { restoreProject, startAutosave } from './store/persistence'
import { startWindowSync, WINDOW_ROLE } from './store/windowSync'
import PanelsApp from './PanelsApp'
import { startBackups } from './io/backups'
import { useProject } from './store/projectStore'
import { restoreMainWindow } from './store/windowLayout'
import { installerSetupRequest } from './ai/local'
import { useAi } from './store/aiStore'
import { useUi } from './store/uiStore'

// Fenêtre Infos (double écran) : le projet vient de la fenêtre principale, qui seule l'enregistre
const main = WINDOW_ROLE === 'main'
Promise.all([main ? restoreProject() : Promise.resolve(), restoreUserLibrary()]).finally(async () => {
  if (main) {
    // La fenêtre part cachée : une erreur ici ne doit jamais empêcher son affichage.
    await guardWindowClose().catch(console.error)
    await restoreMainWindow().catch(console.error)
    startAutosave()
    // Sauvegardes de sécurité tournantes dans le dossier choisi (Paramètres > Enregistrement)
    startBackups(() => useProject.getState().project)
    const request = await installerSetupRequest().catch(() => null)
    if (request) {
      useUi.getState().setStartOpen(false)
      useAi.setState({ setupOpen: true, installerDirectory: request.directory, installerModel: request.model })
    }
  }
  void startWindowSync()
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      {main ? <App /> : <PanelsApp />}
    </StrictMode>,
  )
})
