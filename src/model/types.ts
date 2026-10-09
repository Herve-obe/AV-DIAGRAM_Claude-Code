// Modèle de données métier. Indépendant de React : testable seul et réutilisable (tablette, desktop).
import type { SignalFamily } from './signals'

/** Niveau nominal d'un port audio, utilisé par les règles de compatibilité. */
export type Level = 'mic' | 'instrument' | 'phono' | 'line+4' | 'line-10' | 'speaker' | 'none'

export type PortDirection = 'in' | 'out' | 'bidir'

export interface PortDef {
  id: string
  name: string
  direction: PortDirection
  signal: SignalFamily
  connector: string
  level?: Level
  /** Nombre de canaux transportés (ex. 64 pour un port Dante) */
  channels?: number
  /** Détail libre : format, débit, protocole (ex. "3G-SDI", "AES3", "Dante primaire") */
  format?: string
  /** Alimentation fantôme 48 V : exigée par un micro statique, fournie par une entrée micro, ou absente */
  phantom?: 'required' | 'supplied' | 'none'
}

export type LibraryStatus = 'generic' | 'verified' | 'community' | 'user'

/** Source d'une fiche : page ou PDF officiel (url) et/ou document constructeur identifié (titre, révision). */
export interface EquipmentSource {
  url?: string
  /** Ex. "SSL SB 32.24 and SB 16.12 User Guide, rev. 1.5" */
  document?: string
  /** Date de consultation, format AAAA-MM-JJ */
  accessed: string
}

/** Fiche de bibliothèque : un modèle d'équipement réutilisable. */
export interface EquipmentTemplate {
  id: string
  family: EquipmentFamily
  manufacturer?: string
  model: string
  pictogram: PictogramId
  ports: PortDef[]
  /** Puissance nominale en W, si connue */
  powerW?: number
  /** Poids en kg, si connu */
  weightKg?: number
  /** Hauteur en unités de rack (1 U = 44,45 mm) */
  rackU?: number
  status: LibraryStatus
  sources?: EquipmentSource[]
  /** Menu de la bibliothèque, quand la famille ne suffit pas (ex. enregistreur vidéo) */
  domain?: LibraryDomain
}

/** Menus de la bibliothèque : audio, image, lumière, réseau, distribution électrique, divers. */
export const LIBRARY_DOMAINS = ['sound', 'image', 'light', 'network', 'distribution', 'misc'] as const
export type LibraryDomain = (typeof LIBRARY_DOMAINS)[number]

export type EquipmentFamily =
  | 'capture'
  | 'console'
  | 'stagebox'
  | 'processing'
  | 'amplification'
  | 'speaker'
  | 'wireless'
  | 'recording'
  | 'camera'
  | 'videoSwitcher'
  | 'videoRouting'
  | 'display'
  | 'intercom'
  | 'network'
  | 'sync'
  | 'control'
  | 'power'
  | 'passive'
  | 'luminaire'
  | 'lightingControl'
  | 'dmxDistribution'

export type PictogramId =
  | 'mic'
  | 'di'
  | 'console'
  | 'stagebox'
  | 'processor'
  | 'amp'
  | 'speaker'
  | 'wireless'
  | 'recorder'
  | 'camera'
  | 'switcher'
  | 'router'
  | 'display'
  | 'projector'
  | 'intercom'
  | 'switch'
  | 'clock'
  | 'control'
  | 'power'
  | 'patch'
  | 'light'

/** Instance d'un équipement posé dans un projet. */
export interface Equipment {
  id: string
  templateId: string
  name: string
  model: string
  manufacturer?: string
  pictogram: PictogramId
  family: EquipmentFamily
  /** Menu de la bibliothèque quand la famille est partagée (ex. enregistreur vidéo) */
  domain?: LibraryDomain
  ports: PortDef[]
  powerW?: number
  weightKg?: number
  rackU?: number
  /** Position dans une baie (vue Baies) : même instance que sur le synoptique */
  mount?: RackMount
  zoneId?: string
  /** Feuille du projet sur laquelle l'équipement est dessiné */
  sheetId?: string
  notes?: string
  position: { x: number; y: number }
  /**
   * Orientation du bloc, en degrés dans le sens horaire. 0 : entrées à gauche, sorties à droite ;
   * 90 : entrées en haut, sorties en bas ; 180 : entrées à droite ; 270 : entrées en bas.
   */
  rotation?: Rotation
  /** Rappels ignorés par l'utilisateur (ex. « layer:sound » : ports audio d'une caméra) */
  dismissedHints?: string[]
}

export type Rotation = 0 | 90 | 180 | 270

/** Face d'une baie : avant ou arrière */
export type RackFace = 'front' | 'rear'

/** Montage d'un équipement dans une baie ; u = unité la plus basse occupée (1 = bas de la baie). */
export interface RackMount {
  rackId: string
  u: number
  face: RackFace
}

/** Baie 19 pouces (vue Baies). */
export interface Rack {
  id: string
  name: string
  /** Hauteur utile en unités (1 U = 44,45 mm) */
  heightU: number
  /** Profondeur utile en mm */
  depthMm?: number
  zoneId?: string
  notes?: string
}

/** Liaison entre un port de sortie et un port d'entrée. */
export interface Link {
  id: string
  /** Numéro d'ordre dans sa série zone + type, sert à générer l'étiquette */
  num: number
  /** Numéro de câble affiché (ex. FOH-AUD-012) */
  label: string
  source: { equipmentId: string; portId: string }
  target: { equipmentId: string; portId: string }
  lengthM?: number
  /** Type de câble choisi dans le catalogue (model/cables.ts) */
  cableTypeId?: string
  cableRef?: string
  /** Nombre de canaux (flux) transportés, pour un lien multicanal (Dante, MADI, ADAT...) */
  channels?: number
  /** Multipaire qui transporte cette liaison, et numéro de paire (à partir de 1) */
  multicoreId?: string
  pair?: number
  notes?: string
  /** Alertes volontairement ignorées par l'utilisateur, par code de règle */
  ignoredRules?: string[]
  /** Position du segment vertical déplacé à la main (px du schéma) ; absent : tracé automatique */
  bendX?: number
}

/** Multipaire : câble physique à N paires ; chaque liaison qui l'emprunte occupe une paire. */
export interface Multicore {
  id: string
  /** Étiquette du câble (ex. MP-01) */
  label: string
  pairs: number
  /** Type de câble du catalogue, s'il y en a un */
  cableTypeId?: string
  lengthM?: number
  /** Connecteurs d'extrémité, en texte libre (ex. Harting 16 broches, DB-25) */
  connectors?: string
  notes?: string
}

export interface Zone {
  id: string
  name: string
  /** Préfixe utilisé dans la numérotation des câbles */
  code: string
}

/** Feuille : une page de dessin du projet (ex. "Scène", "Régie vidéo"). */
export interface Sheet {
  id: string
  name: string
  /** Feuille parente : la feuille est alors un sous-schéma (groupe) replié sur sa parente */
  parentId?: string
  /** Position du bloc replié sur la feuille parente */
  groupPosition?: { x: number; y: number }
}

/** Annotation libre, sans valeur métier : note de texte ou cadre de zone coloré. */
export interface Annotation {
  id: string
  kind: 'note' | 'frame'
  sheetId: string
  position: { x: number; y: number }
  size: { w: number; h: number }
  text: string
  /** Couleur de famille de signal ou d'accent, sous forme de variable CSS */
  color?: string
  /** Cadre seulement : zone du projet qu'il délimite ; les équipements posés dedans prennent cette zone */
  zoneId?: string
}

export interface Project {
  /** Version du format de fichier .avd */
  format: 1
  id: string
  name: string
  createdAt: string
  updatedAt: string
  equipment: Record<string, Equipment>
  links: Record<string, Link>
  zones: Zone[]
  settings: ProjectSettings
  info?: ProjectInfo
  sheets?: Sheet[]
  annotations?: Record<string, Annotation>
  multicores?: Record<string, Multicore>
  racks?: Record<string, Rack>
}

/** Informations reportées dans le cartouche d'impression. */
/** Statut du document (cartouche) */
export const DOCUMENT_STATUSES = ['draft', 'review', 'approved', 'asBuilt', 'void'] as const
export type DocumentStatus = (typeof DOCUMENT_STATUSES)[number]

/** Ligne de l'historique des indices (tableau au-dessus du cartouche) */
export interface RevisionEntry {
  index: string
  date: string
  description: string
  author?: string
}

/**
 * Champs du cartouche, inspirés de l'ISO 7200:2004 (champs de données des cartouches) ; la date
 * d'émission et le numéro de feuille sont remplis à l'export.
 */
export interface ProjectInfo {
  client?: string
  venue?: string
  /** Établi par (créateur) */
  author?: string
  /** Indice de révision (ex. "A", "B", "1.2") */
  revision?: string
  /** Propriétaire légal du document (société) */
  owner?: string
  /** Numéro d'identification du document (ex. SYN-2026-014) */
  docNumber?: string
  /** Titre complémentaire (ex. nom de l'événement) */
  subtitle?: string
  /** Type de document (ex. Synoptique) */
  docType?: string
  status?: DocumentStatus
  /** Approuvé par */
  approver?: string
  /** Référence technique (ex. numéro d'affaire) */
  techRef?: string
  /** Classification / diffusion (ex. Diffusion restreinte) */
  classification?: string
  /** Code de langue (ex. fr) */
  language?: string
  /** Date de la prestation ou de l'événement (texte libre) */
  eventDate?: string
  revisions?: RevisionEntry[]
}

export interface ProjectSettings {
  /** Format de numérotation : {ZONE}, {TYPE}, {NUM:000} */
  cableFormat: string
  /** Code de zone utilisé quand l'équipement source n'a pas de zone */
  defaultZoneCode: string
  /** Tension d'alimentation pour le calcul du courant (V) */
  mainsVoltage: number
  /** Codes {TYPE} personnalisés par famille de signal (sinon AUD, AES, VID...) */
  typeCodes?: Partial<Record<SignalFamily, string>>
  /** Réglages de l'export PDF (format, filigrane, protection), gardés avec le projet */
  export?: ExportSettings
  /** Contrôles désactivés pour tout le schéma (codes de règles) : ni fenêtre ni alerte */
  mutedRules?: string[]
}

/** Formats ISO 216 de la série A */
export const PAPER_SIZES = ['A4', 'A3', 'A2', 'A1', 'A0'] as const
export type PaperSize = (typeof PAPER_SIZES)[number]

export type WatermarkPlacement = 'tiled' | 'diagonal' | 'top' | 'bottom' | 'corner'

export interface WatermarkSettings {
  enabled: boolean
  /** Texte ; {client}, {project}, {date}, {revision}, {number}, {recipient} sont remplacés à l'export */
  text: string
  /** Mosaïque en diagonale, grande diagonale, bandeau haut ou bas, coin bas droit */
  placement: WatermarkPlacement
  /** schéma : incrusté dans l'image du schéma (impossible à effacer) ; planche : toute la page, cartouche compris */
  zone: 'diagram' | 'sheet'
  size: 'small' | 'medium' | 'large'
  color: string
  /** Opacité, de 0,05 à 0,6 */
  opacity: number
  /** Appliqué aussi aux exports PNG et SVG */
  images: boolean
  /**
   * Filigrane nominatif : un PDF par destinataire, son nom remplace {recipient} (ajouté au texte s'il
   * n'y figure pas). Vide : un seul export.
   */
  recipients?: string[]
}

export interface ProtectionSettings {
  enabled: boolean
  allowPrint: boolean
  allowCopy: boolean
  allowModify: boolean
}

export interface ExportSettings {
  paper: PaperSize
  orientation: 'landscape' | 'portrait'
  /**
   * fit : chaque feuille est mise à l'échelle pour tenir sur une page ;
   * tile : taille fixe (échelle d'impression), le schéma s'étend sur plusieurs pages si besoin
   */
  scaleMode: 'fit' | 'tile'
  /** Échelle d'impression en mode tile, en % (100 % : 1 unité du schéma = 0,25 mm) */
  printScale: number
  watermark: WatermarkSettings
  protection: ProtectionSettings
}
