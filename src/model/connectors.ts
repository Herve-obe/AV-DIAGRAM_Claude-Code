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
  { id: 'dsub15', label: 'D-Sub 15', mate: 'dsub15' },
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
  { id: 'usb-mini', label: 'Mini-USB', mate: 'usb' },
  { id: 'multipin', label: 'Multipaire (Harting, Socapex, CPC)', mate: 'multipin' },
  { id: 'powercon', label: 'powerCON', mate: 'powercon' },
  { id: 'powercon-true1', label: 'powerCON TRUE1', mate: 'powercon-true1' },
  { id: 'powerkon-ip65', label: 'Seetronic Powerkon IP65', mate: 'powerkon-ip65' },
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
  { id: 'ta4', label: 'Mini XLR 4 (TA4)', mate: 'ta4' },
  { id: 'lemo3', label: 'LEMO 3 points', mate: 'lemo3' },
  { id: 'sma', label: 'SMA', mate: 'sma' },
  { id: 'microdot', label: 'MicroDot (DPA)', mate: 'microdot' },
  // DPA : MicroLock reste compatible avec les accessoires MicroDot (documentation DPA 4099 CORE+)
  { id: 'microlock', label: 'MicroLock (DPA)', mate: 'microlock', alsoMates: ['microdot'] },
  { id: 'ta3', label: 'TA3 (mini-XLR 3)', mate: 'ta3' },
  { id: 'hirose4', label: 'Hirose 4 broches', mate: 'hirose4' },
  { id: 'lemo5', label: 'LEMO 5 broches', mate: 'lemo5' },
  { id: 'rj12', label: 'RJ-12 / RJ-11', mate: 'rj12' },
  { id: 'tnc', label: 'TNC (antenne)', mate: 'tnc' },
  { id: 'sony-ccz', label: 'Sony CCZ (multiconducteur caméra)', mate: 'sony-ccz' },
  { id: 'sony-remote8', label: 'Sony 8 broches (CCA-5)', mate: 'sony-remote8' },
  { id: 'ieee1394', label: 'IEEE 1394 (FireWire, DV)', mate: 'ieee1394' },
  { id: 'triax', label: 'Triax (Fischer ou LEMO)', mate: 'triax' },
  { id: 'smpte-fiber', label: 'Fibre hybride SMPTE 311M (LEMO 3K.93C)', mate: 'smpte-fiber' },
  { id: 'hdmi-micro', label: 'Micro HDMI (type D)', mate: 'hdmi-micro' },
  { id: 'dvi', label: 'DVI', mate: 'dvi' },
  { id: 'vga', label: 'VGA (HD-15)', mate: 'vga' },
  { id: 'rj10', label: 'RJ-10', mate: 'rj10' },
  { id: 'rf', label: 'Liaison radio (HF)', mate: 'rf' },
  { id: 'ca-com', label: 'CA-COM 8 points (L-Acoustics)', mate: 'ca-com' },
  { id: 'pa-com', label: 'PA-COM 8 points (L-Acoustics)', mate: 'pa-com' },
  { id: 'sc32', label: 'SC32 (L-Acoustics, 32 points)', mate: 'sc32' },
  { id: 'multipin-37', label: 'Multipoint 37 points', mate: 'multipin-37' },
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
