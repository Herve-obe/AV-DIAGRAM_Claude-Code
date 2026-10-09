// Store du projet : état courant + historique d'annulation (Ctrl+Z / Ctrl+Maj+Z).
// Toute modification passe par commit() qui empile l'état précédent.
import { create } from 'zustand'
import * as groups from '../model/groups'
import * as ops from '../model/project'
import * as racks from '../model/racks'
import * as zones from '../model/zones'
import * as series from '../model/series'
import type { Annotation, Equipment, EquipmentTemplate, Link, Multicore, PortDef, Rack, RackFace, Project, ProjectInfo, ProjectSettings, Zone } from '../model/types'
import i18n from '../i18n'

const HISTORY_LIMIT = 200

/**
 * Historique de remplacement pendant une session de collaboration : l'annulation ne doit défaire que
 * ses propres modifications, pas celles des autres participants (voir collab/session.ts).
 */
export interface HistoryDriver {
  undo: () => void
  redo: () => void
  /** Début d'un geste (déplacement) : nouveau pas d'annulation */
  gesture: () => void
}
let driver: HistoryDriver | null = null
export function setHistoryDriver(d: HistoryDriver | null) {
  driver = d
  // Les instantanés locaux mêlent les modifications de chacun : on les oublie à l'entrée et à la sortie
  useProject.setState({ past: [], future: [] })
}

interface ProjectState {
  project: Project
  past: Project[]
  future: Project[]
  /** Faux dès qu'une modification n'a pas encore été enregistrée localement */
  saved: boolean

  load: (p: Project) => void
  newProject: (name: string) => void
  /** Remplace le projet en gardant l'historique : Annuler revient au projet précédent */
  replaceProject: (p: Project) => void
  undo: () => void
  redo: () => void
  /** Ouvre une transaction (ex. déplacement à la souris) : un seul pas d'annulation */
  beginGesture: () => void

  rename: (name: string) => void
  addEquipment: (tpl: EquipmentTemplate, pos: { x: number; y: number }, sheetId?: string) => string
  updateEquipment: (id: string, patch: Partial<Omit<Equipment, 'id'>>) => void
  moveEquipment: (id: string, pos: { x: number; y: number }) => void
  rotateEquipment: (ids: string[], step: 1 | -1) => void
  setHintDismissed: (id: string, key: string, dismissed: boolean) => void
  connect: (a: { equipmentId: string; portId: string }, b: { equipmentId: string; portId: string }) => string | null
  updateLink: (id: string, patch: Partial<Omit<Link, 'id' | 'source' | 'target'>>) => void
  /** Déplacement du segment vertical d'une liaison pendant un geste (pas de pas d'annulation supplémentaire) */
  bendLink: (id: string, x: number) => void
  /** Crée les liaisons d'un plan en série (un seul pas d'annulation) ; multipaire : voir applySeries */
  connectSeries: (plan: series.SeriesPlan, multicore?: string | null) => string[]
  /** Supprime des éléments du canevas : équipements et annotations (nodeIds) et liaisons */
  remove: (nodeIds: string[], linkIds: string[]) => void
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

  addSheet: (name: string) => string
  renameSheet: (id: string, name: string) => void
  removeSheet: (id: string) => void
  moveToSheet: (equipmentIds: string[], sheetId: string) => void
  addAnnotation: (a: Omit<Annotation, 'id'>) => string
  updateAnnotation: (id: string, patch: Partial<Omit<Annotation, 'id'>>) => void
  /** Déplacement ou redimensionnement pendant un geste (pas de pas d'annulation supplémentaire) */
  moveAnnotation: (id: string, patch: Partial<Pick<Annotation, 'position' | 'size'>>) => void
  addMulticore: (init?: Partial<Omit<Multicore, 'id'>>) => string
  updateMulticore: (id: string, patch: Partial<Omit<Multicore, 'id'>>) => void
  removeMulticore: (id: string) => void
  addRack: (init?: Partial<Omit<Rack, 'id'>>) => string
  updateRack: (id: string, patch: Partial<Omit<Rack, 'id'>>) => void
  removeRack: (id: string) => void
  /** Monte (ou déplace) un équipement dans une baie ; renvoie le motif du refus, ou null */
  mountEquipment: (eqId: string, rackId: string, u: number, face?: RackFace) => racks.MountError | null
  unmountEquipment: (eqId: string) => void
  /** Regroupe des équipements (et annotations) de la feuille dans un sous-schéma ; renvoie son id */
  groupSelection: (sheetId: string, nodeIds: string[], name: string) => string | null
  ungroup: (groupId: string) => void
  /** Déplacement du bloc replié pendant un geste (pas de pas d'annulation supplémentaire) */
  moveGroup: (groupId: string, position: { x: number; y: number }) => void
  /** Nouvelles positions de plusieurs blocs (alignement, répartition) : un seul pas d'annulation */
  placeNodes: (positions: Map<string, { x: number; y: number }>) => void
  /** n exemplaires rangés en colonne sous l'original : un seul pas d'annulation */
  addCopies: (id: string, n: number, stepY: number) => string[]
  /** Fin d'un déplacement : les équipements prennent la zone du cadre où ils sont posés (même pas d'annulation) */
  settleZones: () => void
  /** Pose un cadre de zone lié à une nouvelle zone ; renvoie l'id du cadre */
  addZoneFrame: (frame: Pick<Annotation, 'sheetId' | 'position' | 'size' | 'color'>) => string
  /** Crée une zone à partir d'un cadre et l'y associe ; renvoie l'id de la zone */
  zoneFromFrame: (frameId: string) => string | null
  /** Fait passer des liaisons dans un multipaire (nouveau si mcId est null) ; renvoie son id */
  assignToMulticore: (linkIds: string[], mcId: string | null) => string | null
}

export const useProject = create<ProjectState>((set, get) => {
  /** Applique une nouvelle version du projet en empilant l'ancienne. */
  const commit = (next: Project) => {
    const { project, past } = get()
    if (next === project) return
    if (driver) return set({ project: next, saved: false })
    set({ project: next, past: [...past, project].slice(-HISTORY_LIMIT), future: [], saved: false })
  }

  return {
    // Démarrage sur un projet vide ; l'exemple reste proposé dans « Nouveau projet » (modèle Concert)
    project: ops.createProject(i18n.t('menu.newProjectName')),
    past: [],
    future: [],
    saved: true,

    load: (p) => set({ project: ops.normalizeProject(p), past: [], future: [], saved: true }),
    newProject: (name) => commit(ops.createProject(name)),
    replaceProject: (p) => commit(ops.normalizeProject(p)),

    undo: () => {
      if (driver) return driver.undo()
      const { past, project, future } = get()
      const prev = past[past.length - 1]
      if (!prev) return
      set({ project: prev, past: past.slice(0, -1), future: [project, ...future], saved: false })
    },
    redo: () => {
      if (driver) return driver.redo()
      const { past, project, future } = get()
      const next = future[0]
      if (!next) return
      set({ project: next, past: [...past, project], future: future.slice(1), saved: false })
    },
    beginGesture: () => {
      if (driver) return driver.gesture()
      const { project, past } = get()
      set({ past: [...past, project].slice(-HISTORY_LIMIT), future: [] })
    },

    rename: (name) => commit({ ...get().project, name }),
    addEquipment: (tpl, pos, sheetId) => {
      const r = ops.addEquipment(get().project, tpl, pos, { sheetId })
      commit(zones.applyFrameZones(r.project))
      return r.id
    },
    updateEquipment: (id, patch) => commit(ops.updateEquipment(get().project, id, patch)),
    // Pas de commit : le pas d'annulation a été ouvert par beginGesture()
    rotateEquipment: (ids, step) => commit(ops.rotateEquipment(get().project, ids, step)),
    setHintDismissed: (id, key, dismissed) => commit(ops.setHintDismissed(get().project, id, key, dismissed)),
    moveEquipment: (id, pos) => set({ project: ops.moveEquipment(get().project, id, pos), saved: false }),
    connect: (a, b) => {
      const r = ops.connect(get().project, a, b)
      if (r.id) commit(r.project)
      return r.id
    },
    updateLink: (id, patch) => commit(ops.updateLink(get().project, id, patch)),
    connectSeries: (plan, multicore) => {
      const r = series.applySeries(get().project, plan, multicore)
      if (r.linkIds.length) commit(r.project)
      return r.linkIds
    },
    bendLink: (id, x) => set({ project: ops.updateLink(get().project, id, { bendX: x }), saved: false }),
    remove: (nodeIds, lkIds) => {
      if (!nodeIds.length && !lkIds.length) return
      const p = get().project
      const annIds = nodeIds.filter((id) => p.annotations?.[id])
      const eqIds = nodeIds.filter((id) => p.equipment[id])
      // Supprimer le bloc d'un groupe le dissout : son contenu remonte, rien n'est perdu
      let next = ops.removeAnnotations(ops.removeElements(p, eqIds, lkIds), annIds)
      for (const id of nodeIds.filter(groups.isGroupNodeId)) next = groups.ungroup(next, groups.sheetIdOfGroupNode(id))
      // Effacer le cadre d'une zone efface la zone (Ctrl+Z la rétablit)
      commit(zones.removeOrphanZones(next, p))
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
    updateZone: (id, patch) => commit(zones.syncFrameNames(ops.updateZone(get().project, id, patch), id)),
    removeZone: (id) => commit(ops.removeZone(get().project, id)),
    updateSettings: (patch) => commit(ops.updateSettings(get().project, patch)),
    updateInfo: (patch) => commit(ops.updateInfo(get().project, patch)),

    addSheet: (name) => {
      const r = ops.addSheet(get().project, name)
      commit(r.project)
      return r.id
    },
    renameSheet: (id, name) => commit(ops.renameSheet(get().project, id, name)),
    removeSheet: (id) => commit(ops.removeSheet(get().project, id)),
    moveToSheet: (ids, sheetId) => {
      let p = get().project
      for (const id of ids) p = ops.updateEquipment(p, id, { sheetId })
      commit(p)
    },
    addAnnotation: (a) => {
      const r = ops.addAnnotation(get().project, a)
      commit(r.project)
      return r.id
    },
    updateAnnotation: (id, patch) => commit(zones.updateFrame(get().project, id, patch)),
    addZoneFrame: (frame) => {
      const r = zones.addZoneFrame(get().project, frame)
      commit(r.project)
      return r.frameId
    },
    settleZones: () => {
      const p = get().project
      const next = zones.applyFrameZones(p)
      if (next !== p) set({ project: next, saved: false })
    },
    zoneFromFrame: (frameId) => {
      const r = zones.zoneFromFrame(get().project, frameId)
      if (r.id) commit(r.project)
      return r.id
    },
    assignToMulticore: (linkIds, mcId) => {
      const r = ops.assignToMulticore(get().project, linkIds, mcId)
      if (r.id) commit(r.project)
      return r.id
    },
    moveAnnotation: (id, patch) => set({ project: ops.updateAnnotation(get().project, id, patch), saved: false }),
    addMulticore: (init) => {
      const r = ops.addMulticore(get().project, init)
      commit(r.project)
      return r.id
    },
    updateMulticore: (id, patch) => commit(ops.updateMulticore(get().project, id, patch)),
    removeMulticore: (id) => commit(ops.removeMulticore(get().project, id)),
    addRack: (init) => {
      const r = racks.addRack(get().project, init)
      commit(r.project)
      return r.id
    },
    updateRack: (id, patch) => commit(racks.updateRack(get().project, id, patch)),
    removeRack: (id) => commit(racks.removeRack(get().project, id)),
    mountEquipment: (eqId, rackId, u, face) => {
      const r = racks.mountEquipment(get().project, eqId, rackId, u, face)
      if (!r.error) commit(r.project)
      return r.error
    },
    unmountEquipment: (eqId) => commit(racks.unmountEquipment(get().project, eqId)),
    groupSelection: (sheetId, nodeIds, name) => {
      const p = get().project
      const eqIds = nodeIds.filter((id) => p.equipment[id])
      const annIds = nodeIds.filter((id) => p.annotations?.[id])
      const r = groups.groupSelection(p, sheetId, eqIds, name, annIds)
      if (r.id) commit(r.project)
      return r.id
    },
    ungroup: (groupId) => commit(groups.ungroup(get().project, groupId)),
    moveGroup: (groupId, position) => set({ project: groups.moveGroup(get().project, groupId, position), saved: false }),
    addCopies: (id, n, stepY) => {
      const r = ops.addCopies(get().project, id, n, stepY)
      if (r.ids.length) commit(zones.applyFrameZones(r.project))
      return r.ids
    },
    placeNodes: (positions) => {
      let p = get().project
      for (const [id, pos] of positions) {
        if (p.equipment[id]) p = ops.moveEquipment(p, id, pos)
        else if (p.annotations?.[id]) p = ops.updateAnnotation(p, id, { position: pos })
        else if (groups.isGroupNodeId(id)) p = groups.moveGroup(p, groups.sheetIdOfGroupNode(id), pos)
      }
      commit(zones.applyFrameZones(p))
    },
  }
})
