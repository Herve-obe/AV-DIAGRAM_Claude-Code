// État de l'assistant IA : réglages (mémorisés sur l'ordinateur, sans la clé), conversation et proposition
// en attente. La proposition est un brouillon du projet : l'appliquer passe par replaceProject,
// ce qui en fait une seule étape d'annulation.
import { create } from 'zustand'
import i18n from '../i18n'
import { AiError, buildSystemPrompt, runTurn } from '../ai/agent'
import { providerInfo, type ChatMessage, type ProviderId } from '../ai/providers'
import { ensureServer, type ManagedServer } from '../ai/local'
import { createDraft, hasChanges, type Draft } from '../ai/tools'
import { nativeTransport } from '../ai/transport'
import { LIBRARY } from '../library'
import { sheetName } from '../model/project'
import { useLibrary } from './libraryStore'
import { useProject } from './projectStore'
import { useUi } from './uiStore'

export interface AiSettings {
  enabled: boolean
  provider?: ProviderId
  baseUrl?: string
  model?: string
  /** Accord explicite pour l'envoi du schéma à un fournisseur en ligne (section 12.1) */
  consent: boolean
  /** llama-server lancé par AV Diagram (option A), avec les fichiers choisis par l'utilisateur */
  managed?: ManagedServer
}

export type Bubble =
  | { kind: 'user' | 'assistant'; text: string }
  | { kind: 'error'; text: string }
  | { kind: 'note'; text: string }

const KEY = 'avd.ai'
// Notes destinées au modèle (pas à l'utilisateur) : elles restent en français, comme le prompt système
const DISCARD_NOTE = "L'utilisateur a refusé la proposition précédente : ces équipements et liaisons ne sont pas dans le schéma."
const STALE_NOTE = "Le schéma a changé depuis la proposition précédente, qui n'a pas été appliquée : relire le schéma avec get_project."

function readSettings(): AiSettings {
  const fallback: AiSettings = { enabled: false, consent: false }
  try {
    return { ...fallback, ...JSON.parse(localStorage.getItem(KEY) ?? '{}') }
  } catch {
    return fallback
  }
}

/** Vrai si l'assistant peut envoyer une question : option choisie, modèle choisi, accord donné si en ligne. */
export function isReady(s: AiSettings): boolean {
  if (!s.enabled || !s.provider || !s.model) return false
  return providerInfo(s.provider).kind === 'local' || s.consent
}

interface AiState {
  settings: AiSettings
  panelOpen: boolean
  setupOpen: boolean
  bubbles: Bubble[]
  history: ChatMessage[]
  busy: boolean
  /** Outil en cours d'exécution, pour l'indicateur d'activité */
  activeTool: string | null
  proposal: Draft | null
  /** Précision ajoutée au prochain message (ex. proposition refusée), pour que le modèle ne s'y fie plus */
  contextNote: string | null

  saveSettings: (s: AiSettings) => void
  setPanelOpen: (open: boolean) => void
  setSetupOpen: (open: boolean) => void
  send: (text: string) => Promise<void>
  applyProposal: () => void
  discardProposal: () => void
  clear: () => void
}

export const useAi = create<AiState>((set, get) => ({
  settings: readSettings(),
  panelOpen: false,
  setupOpen: false,
  bubbles: [],
  history: [],
  busy: false,
  activeTool: null,
  proposal: null,
  contextNote: null,

  saveSettings: (settings) => {
    try {
      localStorage.setItem(KEY, JSON.stringify(settings))
    } catch {
      // stockage indisponible : réglage gardé pour la session
    }
    set({ settings })
  },
  setPanelOpen: (panelOpen) => set({ panelOpen }),
  setSetupOpen: (setupOpen) => set({ setupOpen }),

  send: async (text) => {
    const { settings, busy, history, contextNote } = get()
    const question = text.trim()
    if (busy || !question) return
    if (!isReady(settings) || !settings.provider || !settings.model) {
      set({ setupOpen: true })
      return
    }
    const project = useProject.getState().project
    const ui = useUi.getState()
    // Une proposition en attente se complète tant que le schéma n'a pas changé entre-temps
    let draft = get().proposal
    const bubbles: Bubble[] = [...get().bubbles]
    let note = contextNote
    if (draft && draft.base !== project) {
      bubbles.push({ kind: 'note', text: i18n.t('ai.proposalStale') })
      note = STALE_NOTE
      draft = null
    }
    draft ??= createDraft(project, ui.currentSheetId)
    set({ busy: true, activeTool: null, contextNote: null, bubbles: [...bubbles, { kind: 'user', text: question }] })
    try {
      if (settings.provider === 'llamacpp' && settings.managed) {
        set({ activeTool: 'start_local' })
        await ensureServer(settings.managed, settings.baseUrl)
        set({ activeTool: null })
      }
      const res = await runTurn({
        transport: nativeTransport,
        connection: { provider: settings.provider, baseUrl: settings.baseUrl, model: settings.model },
        system: buildSystemPrompt({ lang: ui.lang, mode: ui.mode, projectName: project.name, sheetName: sheetName(project, ui.currentSheetId) }),
        history,
        userText: note ? `[${note}]\n${question}` : question,
        draft,
        ctx: {
          library: [...useLibrary.getState().userTemplates, ...LIBRARY],
          describe: (i) => i18n.t(`rules.${i.code}`, i.params),
        },
        onTool: (name) => set({ activeTool: name }),
      })
      set((s) => ({
        history: res.history,
        proposal: hasChanges(res.draft) ? res.draft : null,
        bubbles: [...s.bubbles, { kind: 'assistant', text: res.reply || i18n.t('ai.emptyReply') }],
      }))
    } catch (e) {
      const kind = e instanceof AiError ? e.kind : 'network'
      const detail = e instanceof Error ? e.message : String(e)
      set((s) => ({ bubbles: [...s.bubbles, { kind: 'error', text: `${i18n.t(`ai.error.${kind}`)}${detail ? ` (${detail})` : ''}` }] }))
    } finally {
      set({ busy: false, activeTool: null })
    }
  },

  applyProposal: () => {
    const p = get().proposal
    if (!p) return
    const store = useProject.getState()
    if (p.base !== store.project) {
      set((s) => ({ proposal: null, contextNote: STALE_NOTE, bubbles: [...s.bubbles, { kind: 'note', text: i18n.t('ai.proposalStale') }] }))
      return
    }
    store.replaceProject(p.project)
    // Équipements seulement : sélectionner en même temps blocs et liaisons par programme fait boucler
    // la synchronisation de sélection avec React Flow (erreur React #185)
    useUi.getState().select(p.addedEquipment, [])
    set((s) => ({ proposal: null, bubbles: [...s.bubbles, { kind: 'note', text: i18n.t('ai.applied') }] }))
  },
  discardProposal: () => set((s) => ({ proposal: null, contextNote: DISCARD_NOTE, bubbles: [...s.bubbles, { kind: 'note', text: i18n.t('ai.discarded') }] })),
  clear: () => set({ bubbles: [], history: [], proposal: null, contextNote: null }),
}))
