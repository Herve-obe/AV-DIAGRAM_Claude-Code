// Catalogue des connecteurs. "mate" regroupe les connecteurs qui s'enfichent l'un dans l'autre
// sans adaptateur (ex. un RJ45 entre dans une embase etherCON).

export interface ConnectorDef {
  id: string
  label: string
  mate: string
  /** Familles supplémentaires acceptées (ex. embase combo : XLR et jack) */
  alsoMates?: string[]
}

export const CONNECTORS: ConnectorDef[] = [
  { id: 'xlr3', label: 'XLR 3', mate: 'xlr3' },
  { id: 'xlr4', label: 'XLR 4', mate: 'xlr4' },
  { id: 'xlr5', label: 'XLR 5', mate: 'xlr5' },
  { id: 'jack-ts', label: 'Jack 6,35 TS', mate: 'jack635' },
  { id: 'jack-trs', label: 'Jack 6,35 TRS', mate: 'jack635' },
  { id: 'minijack', label: 'Mini-jack 3,5', mate: 'minijack' },
  { id: 'rca', label: 'RCA', mate: 'rca' },
  { id: 'combo', label: 'Combo XLR / jack 6,35', mate: 'combo', alsoMates: ['xlr3', 'jack635'] },
  { id: 'toslink', label: 'Optique TOSLINK (ADAT / S/PDIF)', mate: 'toslink' },
  { id: 'digilink-mini', label: 'DigiLink Mini (Avid)', mate: 'digilink' },
  { id: 'speakon-nl2', label: 'Speakon NL2', mate: 'speakon' },
  { id: 'speakon-nl4', label: 'Speakon NL4', mate: 'speakon' },
  { id: 'speakon-nl8', label: 'Speakon NL8', mate: 'speakon8' },
  { id: 'bnc', label: 'BNC 75 Ω', mate: 'bnc' },
  { id: 'din5', label: 'DIN 5 (MIDI)', mate: 'din5' },
  { id: 'dsub9', label: 'D-Sub 9', mate: 'dsub9' },
  { id: 'dsub25', label: 'D-Sub 25', mate: 'dsub25' },
  { id: 'rj45', label: 'RJ45', mate: 'rj45' },
  { id: 'ethercon', label: 'etherCON', mate: 'rj45' },
  { id: 'opticalcon', label: 'opticalCON', mate: 'opticalcon' },
  { id: 'lc', label: 'Fibre LC', mate: 'lc' },
  { id: 'sc', label: 'Fibre SC', mate: 'sc' },
  { id: 'st', label: 'Fibre ST', mate: 'st' },
  { id: 'sfp', label: 'SFP / SFP+', mate: 'sfp' },
  { id: 'hdmi', label: 'HDMI', mate: 'hdmi' },
  { id: 'displayport', label: 'DisplayPort', mate: 'displayport' },
  { id: 'usb-a', label: 'USB-A', mate: 'usb' },
  { id: 'usb-b', label: 'USB-B', mate: 'usb' },
  { id: 'usb-c', label: 'USB-C', mate: 'usb' },
  { id: 'multipin', label: 'Multipaire (Harting, Socapex, CPC)', mate: 'multipin' },
  { id: 'powercon', label: 'powerCON', mate: 'powercon' },
  { id: 'powercon-true1', label: 'powerCON TRUE1', mate: 'powercon-true1' },
  { id: 'iec-c13', label: 'IEC C13/C14', mate: 'iec-c13' },
  { id: 'iec-c19', label: 'IEC C19/C20', mate: 'iec-c19' },
  { id: 'schuko', label: 'Schuko CEE 7/4', mate: 'schuko' },
  { id: 'p17-16-mono', label: 'P17 16 A mono', mate: 'p17-16-mono' },
  { id: 'p17-32-tri', label: 'P17 32 A tri', mate: 'p17-32-tri' },
  { id: 'p17-63-tri', label: 'P17 63 A tri', mate: 'p17-63-tri' },
  { id: 'powerlock', label: 'Powerlock', mate: 'powerlock' },
  { id: 'terminal', label: 'Bornier Phoenix', mate: 'terminal' },
  { id: 'binding-post', label: 'Bornes haut-parleur (binding posts)', mate: 'binding-post' },
  { id: 'dc-barrel', label: 'Jack d\'alimentation DC', mate: 'dc-barrel' },
  { id: 'minidin8', label: 'Mini-DIN 8', mate: 'minidin8' },
  { id: 'rj10', label: 'RJ-10', mate: 'rj10' },
  { id: 'rf', label: 'Liaison radio (HF)', mate: 'rf' },
  { id: 'unspecified', label: 'Non précisé par le constructeur', mate: 'unspecified' },
]

const BY_ID = new Map(CONNECTORS.map((c) => [c.id, c]))

export function connectorLabel(id: string): string {
  return BY_ID.get(id)?.label ?? id
}

/** Vrai si les deux connecteurs s'accouplent sans adaptateur (un câble droit suffit). */
export function connectorsMate(a: string, b: string): boolean {
  const ca = BY_ID.get(a)
  const cb = BY_ID.get(b)
  if (!ca || !cb) return a === b
  return ca.mate === cb.mate || !!ca.alsoMates?.includes(cb.mate) || !!cb.alsoMates?.includes(ca.mate)
}
