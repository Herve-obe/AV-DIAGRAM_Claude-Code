// Modèle de cartouche propre à ce poste : société, logo, auteur, approbateur, type de document,
// classification. Il pré-remplit le cartouche de chaque export ; la date d'émission est celle du
// poste au moment de l'export. Enregistré sur le poste (pas dans le projet).
import { create } from 'zustand'

export interface TitleBlockTemplate {
  /** Propriétaire légal : société qui édite le document */
  owner: string
  /** Adresse ou mention sous le nom de la société (facultatif) */
  ownerDetail: string
  /** Logo en image (data URL PNG ou JPEG), réduit à 600 px au plus */
  logo: string | null
  author: string
  approver: string
  docType: string
  classification: string
  language: string
  /** Préfixe des numéros de document (ex. SYN-) */
  numberPrefix: string
}

const KEY = 'avd.titleblock'

export const EMPTY_TEMPLATE: TitleBlockTemplate = {
  owner: '',
  ownerDetail: '',
  logo: null,
  author: '',
  approver: '',
  docType: 'Synoptique',
  classification: '',
  language: 'fr',
  numberPrefix: 'SYN-',
}

function read(): TitleBlockTemplate {
  try {
    return { ...EMPTY_TEMPLATE, ...JSON.parse(localStorage.getItem(KEY) ?? '{}') }
  } catch {
    return EMPTY_TEMPLATE
  }
}

interface State {
  template: TitleBlockTemplate
  update: (patch: Partial<TitleBlockTemplate>) => boolean
}

export const useTitleBlock = create<State>((set, get) => ({
  template: read(),
  /** Renvoie false si le stockage du poste est plein (logo trop lourd) */
  update: (patch) => {
    const template = { ...get().template, ...patch }
    set({ template })
    try {
      localStorage.setItem(KEY, JSON.stringify(template))
      return true
    } catch {
      return false
    }
  },
}))

/** Réduit une image (fichier choisi) en PNG de 600 px au plus de côté. */
export async function logoFromFile(file: File): Promise<string> {
  const url = URL.createObjectURL(file)
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image()
      i.onload = () => resolve(i)
      i.onerror = reject
      i.src = url
    })
    const k = Math.min(1, 600 / Math.max(img.naturalWidth, img.naturalHeight))
    const c = document.createElement('canvas')
    c.width = Math.max(1, Math.round(img.naturalWidth * k))
    c.height = Math.max(1, Math.round(img.naturalHeight * k))
    c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height)
    return c.toDataURL('image/png')
  } finally {
    URL.revokeObjectURL(url)
  }
}
