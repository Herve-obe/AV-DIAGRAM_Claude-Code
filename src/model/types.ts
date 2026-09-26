// Modèle de données métier. Indépendant de React : testable seul et réutilisable (tablette, desktop).
import type { SignalFamily } from './signals'

/** Niveau nominal d'un port audio, utilisé par les règles de compatibilité. */
export type Level = 'mic' | 'instrument' | 'line+4' | 'line-10' | 'speaker' | 'none'

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
  ports: PortDef[]
  powerW?: number
  weightKg?: number
  rackU?: number
  zoneId?: string
  /** Feuille du projet sur laquelle l'équipement est dessiné */
  sheetId?: string
  notes?: string
  position: { x: number; y: number }
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
}

/** Informations reportées dans le cartouche d'impression. */
export interface ProjectInfo {
  client?: string
  venue?: string
  author?: string
  /** Indice de révision (ex. "A", "B", "1.2") */
  revision?: string
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
}
