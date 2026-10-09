// Dossier d'enregistrement de ce poste (application de bureau) : dossier proposé par défaut pour
// Enregistrer et Ouvrir, et, si on le souhaite, copie automatique du projet en .avd à chaque modification.
import { create } from 'zustand'

const KEY = 'avd.saveFolder'

interface SaveFolderState {
  dir: string | null
  /** Copie automatique du projet ouvert dans le dossier */
  autoCopy: boolean
  /** Fichier de chaque projet dans le dossier (deux projets du même nom ne s'écrasent pas) */
  files: Record<string, string>
  /** Dernière copie réussie (ISO) ou message d'erreur, pour l'affichage */
  lastCopy: { at: string; path: string } | null
  lastError: string | null
  setDir: (dir: string | null) => void
  setAutoCopy: (on: boolean) => void
  setFile: (projectId: string, name: string) => void
  setCopyResult: (r: { at: string; path: string } | null, error?: string | null) => void
}

type Stored = Pick<SaveFolderState, 'dir' | 'autoCopy' | 'files'>

function read(): Stored {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? 'null')
    if (v && typeof v === 'object') return { dir: typeof v.dir === 'string' ? v.dir : null, autoCopy: v.autoCopy !== false, files: v.files ?? {} }
  } catch {
    // stockage indisponible
  }
  return { dir: null, autoCopy: true, files: {} }
}

export const useSaveFolder = create<SaveFolderState>((set, get) => {
  const persist = () => {
    const { dir, autoCopy, files } = get()
    try {
      localStorage.setItem(KEY, JSON.stringify({ dir, autoCopy, files }))
    } catch {
      // stockage indisponible : le réglage vaut pour la session
    }
  }
  return {
    ...read(),
    lastCopy: null,
    lastError: null,
    // Nouveau dossier : les noms de fichiers mémorisés ne valent plus
    setDir: (dir) => { set({ dir, files: {}, lastCopy: null, lastError: null }); persist() },
    setAutoCopy: (autoCopy) => { set({ autoCopy }); persist() },
    setFile: (projectId, name) => { set({ files: { ...get().files, [projectId]: name } }); persist() },
    setCopyResult: (lastCopy, error = null) => set({ lastCopy, lastError: error }),
  }
})
