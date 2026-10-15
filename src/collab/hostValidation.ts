// Une mise à jour invitée est essayée sur une copie. Le document partagé n'est modifié qu'après contrôle.
import * as Y from 'yjs'
import { isProject } from '../model/project'
import type { LayerView } from '../model/layers'
import { checkGuestChange, guestLayers } from './access'
import type { Claims } from './protection'
import { readProject } from './ydoc'

const stable = (v: unknown): string => JSON.stringify(v, (_k, x) => x && typeof x === 'object' && !Array.isArray(x)
  ? Object.fromEntries(Object.entries(x).sort(([a], [b]) => a.localeCompare(b))) : x)

export class HostValidation {
  private shadow = new Y.Doc()
  private mirror = (u: Uint8Array) => Y.applyUpdate(this.shadow, u)
  constructor(private canonical: Y.Doc) {
    this.rebuild()
    canonical.on('update', this.mirror)
  }
  private rebuild() {
    this.shadow.destroy()
    this.shadow = new Y.Doc()
    // Initialise les types partagés avant de lire leur représentation JSON.
    readProject(this.shadow)
    this.shadow.getMap('claims')
    this.shadow.getArray('chat')
    Y.applyUpdate(this.shadow, Y.encodeStateAsUpdate(this.canonical))
  }
  apply(update: Uint8Array, userId: string, view: LayerView | undefined): boolean {
    try {
      const before = readProject(this.canonical)
      const claims = this.canonical.getMap('claims').toJSON() as Claims
      const chat = this.canonical.getArray('chat').toArray()
      Y.applyUpdate(this.shadow, update)
      // Aucune opération différée ne doit attendre un futur message pour contourner cette validation.
      if (this.shadow.store.pendingStructs || this.shadow.store.pendingDs) throw new Error('pending')
      const next = readProject(this.shadow)
      if (!isProject(next) || !checkGuestChange(before, next, guestLayers(claims, userId), view ?? 'all')) throw new Error('rights')
      if (stable(claims) !== stable(this.shadow.getMap('claims').toJSON())) throw new Error('claims')
      const known = new Set(['meta', 'equipment', 'links', 'annotations', 'multicores', 'racks', 'sheets', 'claims', 'chat'])
      for (const key of this.shadow.share.keys()) if (!known.has(key)) throw new Error('type')
      const afterChat = this.shadow.getArray('chat').toArray()
      // Le tchat est append-only côté invité ; seul l'hôte taille l'historique.
      if (afterChat.length < chat.length || stable(afterChat.slice(0, chat.length)) !== stable(chat)) throw new Error('chat')
      if (afterChat.length - chat.length > 1) throw new Error('chat')
      for (const item of afterChat.slice(chat.length)) {
        const m = item as { text?: unknown; userId?: unknown }
        if (!m || m.userId !== userId || typeof m.text !== 'string' || m.text.length > 2000) throw new Error('chat')
      }
      Y.applyUpdate(this.canonical, update, 'guest')
      return true
    } catch {
      this.rebuild()
      return false
    }
  }
  destroy() { this.canonical.off('update', this.mirror); this.shadow.destroy() }
}
