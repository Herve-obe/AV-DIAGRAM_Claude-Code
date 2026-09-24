// Store du projet : état courant + historique d'annulation (Ctrl+Z / Ctrl+Maj+Z).
// Toute modification passe par commit() qui empile l'état précédent.
import { create } from 'zustand'
import * as ops from '../model/project'
import type { Equipment, EquipmentTemplate, Link, PortDef, Project, ProjectInfo, ProjectSettings, Zone } from '../model/types'
import { buildSampleProject } from '../library/sample'

const HISTORY_LIMIT = 200

interface ProjectState {
  project: Project
  past: Project[]
  future: Project[]
  /** Faux dès qu'une modification n'a pas encore été enregistrée localement */
  saved: boolean

  load: (p: Project) => void
  newProject: (name: string) => void
  undo: () => void
  redo: () => void
  /** Ouvre une transaction (ex. déplacement à la souris) : un seul pas d'annulation */
  beginGesture: () => void

  rename: (name: string) => void
  addEquipment: (tpl: EquipmentTemplate, pos: { x: number; y: number }) => string
  updateEquipment: (id: string, patch: Partial<Omit<Equipment, 'id'>>) => void
  moveEquipment: (id: string, pos: { x: number; y: number }) => void
  connect: (a: { equipmentId: string; portId: string }, b: { equipmentId: string; portId: string }) => string | null
  updateLink: (id: string, patch: Partial<Omit<Link, 'id' | 'source' | 'target'>>) => void
  remove: (equipmentIds: string[], linkIds: string[]) => void
  duplicate: (ids: string[]) => string[]
  renumber: () => void
  markSaved: () => void

  addPort: (equipmentId: string, port: Omit<PortDef, 'id'>) => string | null
  updatePort: (equipmentId: string, portId: string, patch: Partial<Omit<PortDef, 'id'>>) => void
  removePort: (equipmentId: string, portId: string) => void
  addZone: (name: string, code: string) => string
  updateZone: (id: string, patch: Partial<Omit<Zone, 'id'>>) => void
  removeZone: (id: string) => void
  updateSettings: (patch: Partial<ProjectSettings>) => void
  updateInfo: (patch: Partial<ProjectInfo>) => void
}

export const useProject = create<ProjectState>((set, get) => {
  /** Applique une nouvelle version du projet en empilant l'ancienne. */
  const commit = (next: Project) => {
    const { project, past } = get()
    if (next === project) return
    set({ project: next, past: [...past, project].slice(-HISTORY_LIMIT), future: [], saved: false })
  }

  return {
    project: buildSampleProject(),
    past: [],
    future: [],
    saved: true,

    load: (p) => set({ project: p, past: [], future: [], saved: true }),
    newProject: (name) => commit(ops.createProject(name)),

    undo: () => {
      const { past, project, future } = get()
      const prev = past.at(-1)
      if (!prev) return
      set({ project: prev, past: past.slice(0, -1), future: [project, ...future], saved: false })
    },
    redo: () => {
      const { past, project, future } = get()
      const next = future[0]
      if (!next) return
      set({ project: next, past: [...past, project], future: future.slice(1), saved: false })
    },
    beginGesture: () => {
      const { project, past } = get()
      set({ past: [...past, project].slice(-HISTORY_LIMIT), future: [] })
    },

    rename: (name) => commit({ ...get().project, name }),
    addEquipment: (tpl, pos) => {
      const r = ops.addEquipment(get().project, tpl, pos)
      commit(r.project)
      return r.id
    },
    updateEquipment: (id, patch) => commit(ops.updateEquipment(get().project, id, patch)),
    // Pas de commit : le pas d'annulation a été ouvert par beginGesture()
    moveEquipment: (id, pos) => set({ project: ops.moveEquipment(get().project, id, pos), saved: false }),
    connect: (a, b) => {
      const r = ops.connect(get().project, a, b)
      if (r.id) commit(r.project)
      return r.id
    },
    updateLink: (id, patch) => commit(ops.updateLink(get().project, id, patch)),
    remove: (eqIds, lkIds) => {
      if (eqIds.length || lkIds.length) commit(ops.removeElements(get().project, eqIds, lkIds))
    },
    duplicate: (ids) => {
      const r = ops.duplicateEquipment(get().project, ids)
      if (r.ids.length) commit(r.project)
      return r.ids
    },
    renumber: () => commit(ops.renumberLinks(get().project)),
    markSaved: () => set({ saved: true }),

    addPort: (eqId, port) => {
      const r = ops.addPort(get().project, eqId, port)
      commit(r.project)
      return r.id
    },
    updatePort: (eqId, portId, patch) => commit(ops.updatePort(get().project, eqId, portId, patch)),
    removePort: (eqId, portId) => commit(ops.removePort(get().project, eqId, portId)),
    addZone: (name, code) => {
      const r = ops.addZone(get().project, name, code)
      commit(r.project)
      return r.id
    },
    updateZone: (id, patch) => commit(ops.updateZone(get().project, id, patch)),
    removeZone: (id) => commit(ops.removeZone(get().project, id)),
    updateSettings: (patch) => commit(ops.updateSettings(get().project, patch)),
    updateInfo: (patch) => commit(ops.updateInfo(get().project, patch)),
  }
})
