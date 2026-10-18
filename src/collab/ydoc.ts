// Correspondance entre le projet (objets immuables du store) et le document partagé Yjs.
//
// Chaque équipement, liaison, annotation, multipaire et feuille est une carte Yjs dont chaque champ
// est une valeur indépendante. Les ports ont chacun leur carte : deux personnes modifiant des ports
// audio et vidéo du même appareil ne remplacent pas la liste entière. Les modifications de champs
// différents du même élément ne s'écrasent pas ; sur un même champ, la dernière modification l'emporte.
// Les réglages du projet (nom, zones, numérotation, cartouche) sont des champs de la carte « meta ».
import * as Y from 'yjs'
import type { Project } from '../model/types'
import { sameData as same } from './compare'

export const COLLECTIONS = ['equipment', 'links', 'annotations', 'multicores', 'racks', 'sheets'] as const
export type Collection = (typeof COLLECTIONS)[number]
/** Format des listes de cartes et slots ; même valeur dans le relais natif collab.rs. */
export const COLLAB_PROTOCOL = 2
const META_FIELDS = ['format', 'id', 'name', 'createdAt', 'updatedAt', 'zones', 'settings', 'info'] as const
/** Ordre des feuilles (le projet les range dans un tableau) */
const ORDER = '_order'

type Item = Record<string, unknown> & { id: string }

/** Éléments d'une collection du projet, indexés par identifiant. */
function itemsOf(p: Project, c: Collection): Record<string, Item> {
  if (c === 'sheets') return Object.fromEntries((p.sheets ?? []).map((s, i) => [s.id, { ...s, [ORDER]: i } as Item]))
  return (p[c] ?? {}) as unknown as Record<string, Item>
}

export const collection = (doc: Y.Doc, c: Collection) => doc.getMap<Y.Map<unknown>>(c)
export const meta = (doc: Y.Doc) => doc.getMap<unknown>('meta')
// La date de modification ne fait pas partie de l'historique : une annulation concurrente ne doit pas l'effacer.
const clock = (doc: Y.Doc) => doc.getMap<unknown>('clock')

/** Écrit dans le champ seulement si la valeur a changé (undefined : champ supprimé). */
function setField(m: Y.Map<unknown>, key: string, value: unknown) {
  if (value === undefined) {
    if (m.has(key)) m.delete(key)
  } else if (!m.has(key) || !same(m.get(key), value)) m.set(key, value)
}

function writeItem(m: Y.Map<unknown>, prev: Item | undefined, next: Item) {
  // Initialiser aussi les listes vides : deux ajouts simultanés doivent partager la même carte Yjs.
  const lists = Array.isArray(next.ports) ? ['ports', 'slots', 'modules'] : []
  for (const k of lists) if (!prev || prev[k] !== next[k] || !(m.get(k) instanceof Y.Map)) {
    writeList(m, k, prev?.[k] as Item[] | undefined, (next[k] ?? []) as Item[])
  }
  for (const [k, v] of Object.entries(next)) {
    if (lists.includes(k)) continue
    if (prev && prev[k] === v) continue
    setField(m, k, v)
  }
  for (const k of m.keys()) if (!(k in next) && !lists.includes(k)) m.delete(k)
}

function writeList(item: Y.Map<unknown>, key: string, prev: Item[] | undefined, next: Item[]) {
  let ports = item.get(key) as Y.Map<Y.Map<unknown>>
  if (!(ports instanceof Y.Map)) {
    ports = new Y.Map<Y.Map<unknown>>()
    item.set(key, ports)
    prev = undefined
  }
  const before = new Map(prev?.map((p, index) => [p.id, { ...p, [ORDER]: index }]))
  const ids = new Set(next.map(p => p.id))
  for (const id of ports.keys()) if (!ids.has(id)) ports.delete(id)
  next.forEach((p, index) => {
    let port = ports.get(p.id)
    if (!port) { port = new Y.Map<unknown>(); ports.set(p.id, port) }
    writeItem(port, before.get(p.id), { ...p, [ORDER]: index })
  })
}

/**
 * Reporte dans le document les différences entre prev (dernier état synchronisé, null au départ)
 * et next. Les collections inchangées (même objet) ne sont pas parcourues.
 */
export function writeProject(doc: Y.Doc, prev: Project | null, next: Project, origin?: unknown) {
  doc.transact(() => {
    const mm = meta(doc)
    for (const k of META_FIELDS) if (k !== 'updatedAt' && (!prev || prev[k] !== next[k])) setField(mm, k, next[k])
    if (!prev || prev.updatedAt !== next.updatedAt) setField(clock(doc), 'updatedAt', next.updatedAt)
    mm.delete('updatedAt')
    for (const c of COLLECTIONS) {
      if (prev && prev[c] === next[c]) continue
      const before = prev ? itemsOf(prev, c) : {}
      const after = itemsOf(next, c)
      const ym = collection(doc, c)
      for (const id of ym.keys()) if (!(id in after)) ym.delete(id)
      for (const [id, item] of Object.entries(after)) {
        let m = ym.get(id)
        if (!m) {
          m = new Y.Map<unknown>()
          ym.set(id, m)
          writeItem(m, undefined, item)
        } else if (before[id] !== item) writeItem(m, before[id], item)
      }
    }
  }, origin)
}

function readItem(m: Y.Map<unknown>): Item {
  const item = Object.fromEntries(m.entries()) as Item
  // Les anciens instantanés Yjs contiennent encore une liste JSON ; les fichiers .avd restent identiques.
  for (const k of ['ports', 'slots', 'modules']) if (item[k] instanceof Y.Map) {
    item[k] = [...(item[k] as Y.Map<Y.Map<unknown>>).values()].map(readItem)
      .sort((a, b) => Number(a[ORDER]) - Number(b[ORDER]) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))
      .map(p => { const copy = { ...p }; delete copy[ORDER]; return copy })
    if (k !== 'ports' && !(item[k] as Item[]).length) delete item[k]
  }
  return item
}

/** Le document contient-il un projet (session rejointe et synchronisée) ? */
export const hasProject = (doc: Y.Doc) => typeof meta(doc).get('id') === 'string'

/** Identifiants modifiés par collection (null : tout relire). */
export type ChangeSet = Partial<Record<Collection | 'meta', Set<string> | null>>

/**
 * Projet lu depuis le document. Avec prev et changes, seuls les éléments modifiés sont reconstruits :
 * les autres gardent leur identité, ce qui évite de redessiner tout le schéma.
 */
export function readProject(doc: Y.Doc, prev?: Project, changes?: ChangeSet): Project {
  const mm = meta(doc)
  const base: Record<string, unknown> = prev && changes ? { ...prev } : {}
  if (!prev || !changes || 'meta' in changes) for (const k of META_FIELDS) base[k] = mm.get(k)
  if (!prev || !changes || 'meta' in changes) base.updatedAt = clock(doc).get('updatedAt') ?? mm.get('updatedAt')
  for (const c of COLLECTIONS) {
    const ym = collection(doc, c)
    const ids = changes ? changes[c] : null
    if (prev && changes && !(c in changes)) continue
    let items: Record<string, Item>
    if (prev && ids) {
      items = { ...itemsOf(prev, c) }
      for (const id of ids) {
        const m = ym.get(id)
        if (m) items[id] = readItem(m)
        else delete items[id]
      }
    } else {
      items = {}
      for (const [id, m] of ym.entries()) items[id] = readItem(m)
    }
    if (c === 'sheets') {
      base.sheets = Object.values(items)
        .sort((a, b) => Number(a[ORDER] ?? 0) - Number(b[ORDER] ?? 0))
        .map((s) => {
          const copy = { ...s }
          delete copy[ORDER]
          return copy
        })
    } else base[c] = items
  }
  return base as unknown as Project
}

/**
 * Relève les éléments modifiés par une transaction (observeDeep sur chaque collection) pour une
 * relecture partielle. Renvoie une fonction qui arrête l'observation.
 */
export function observeChanges(doc: Y.Doc, onChange: (changes: ChangeSet, origin: unknown) => void): () => void {
  let pending: ChangeSet = {}
  const add = (c: Collection | 'meta', id: string | null) => {
    if (id === null) pending[c] = null
    else if (pending[c] !== null) (pending[c] ??= new Set()).add(id)
  }
  const unobserve: (() => void)[] = []
  for (const c of COLLECTIONS) {
    const ym = collection(doc, c)
    const handler = (events: Y.YEvent<Y.Map<unknown>>[]) => {
      for (const e of events) {
        if (e.target === ym) for (const k of e.keys.keys()) add(c, k)
        else add(c, String(e.path[0]))
      }
    }
    ym.observeDeep(handler)
    unobserve.push(() => ym.unobserveDeep(handler))
  }
  const mh = () => add('meta', null)
  meta(doc).observe(mh)
  unobserve.push(() => meta(doc).unobserve(mh))
  clock(doc).observe(mh)
  unobserve.push(() => clock(doc).unobserve(mh))
  const after = (tr: Y.Transaction) => {
    if (!Object.keys(pending).length) return
    const changes = pending
    pending = {}
    onChange(changes, tr.origin)
  }
  doc.on('afterTransaction', after)
  unobserve.push(() => doc.off('afterTransaction', after))
  return () => unobserve.forEach((f) => f())
}

/** Annulation propre à chaque personne : seules ses modifications (origine locale) sont annulées. */
export function createUndoManager(doc: Y.Doc, localOrigin: unknown) {
  return new Y.UndoManager([meta(doc), ...COLLECTIONS.map((c) => collection(doc, c))], {
    trackedOrigins: new Set([localOrigin]),
    captureTimeout: 600,
  })
}
