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
}

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
  cableRef?: string
  notes?: string
  /** Alertes volontairement ignorées par l'utilisateur, par code de règle */
  ignoredRules?: string[]
}

export interface Zone {
  id: string
  name: string
  /** Préfixe utilisé dans la numérotation des câbles */
  code: string
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
}
