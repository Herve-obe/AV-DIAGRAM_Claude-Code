// Bibliothèque générique : blocs de principe SANS caractéristiques constructeur.
// Les nombres de ports sont des valeurs d'exemple modifiables dans l'inspecteur.
// Les modèles réels (statut "verified") seront ajoutés avec leur source constructeur (cahier des charges, 4.2).
import type { EquipmentTemplate, PortDef } from '../model/types'

type P = Omit<PortDef, 'id'>

/** Génère n ports numérotés : range('In', 4, {...}) -> In 1..In 4 */
function range(prefix: string, n: number, def: Omit<P, 'name'>): P[] {
  return Array.from({ length: n }, (_, i) => ({ ...def, name: `${prefix} ${i + 1}` }))
}

function tpl(t: Omit<EquipmentTemplate, 'ports' | 'status'> & { ports: P[] }): EquipmentTemplate {
  return { ...t, status: 'generic', ports: t.ports.map((p, i) => ({ ...p, id: `p${i + 1}` })) }
}

export const GENERIC_LIBRARY: EquipmentTemplate[] = [
  // Captation
  tpl({ id: 'gen-mic-dyn', family: 'capture', model: 'Micro dynamique', pictogram: 'mic',
    ports: [{ name: 'Sortie', direction: 'out', signal: 'audioAnalog', connector: 'xlr3', level: 'mic' }] }),
  tpl({ id: 'gen-mic-cond', family: 'capture', model: 'Micro statique (48 V)', pictogram: 'mic',
    ports: [{ name: 'Sortie', direction: 'out', signal: 'audioAnalog', connector: 'xlr3', level: 'mic', phantom: 'required' }] }),
  tpl({ id: 'gen-di', family: 'capture', model: 'Boîte de direct (DI)', pictogram: 'di',
    ports: [
      { name: 'Entrée', direction: 'in', signal: 'audioAnalog', connector: 'jack-ts', level: 'instrument' },
      { name: 'Link', direction: 'out', signal: 'audioAnalog', connector: 'jack-ts', level: 'instrument' },
      { name: 'Sortie', direction: 'out', signal: 'audioAnalog', connector: 'xlr3', level: 'mic' },
    ] }),
  tpl({ id: 'gen-wireless-rx', family: 'wireless', model: 'Récepteur HF', pictogram: 'wireless',
    ports: [
      { name: 'Sortie', direction: 'out', signal: 'audioAnalog', connector: 'xlr3', level: 'mic' },
      { name: 'Réseau', direction: 'bidir', signal: 'network', connector: 'rj45' },
    ] }),

  // Consoles et stageboxes
  tpl({ id: 'gen-console', family: 'console', model: 'Console numérique', pictogram: 'console',
    ports: [
      ...range('In', 8, { direction: 'in', signal: 'audioAnalog', connector: 'xlr3', level: 'mic', phantom: 'supplied' }),
      ...range('Out', 4, { direction: 'out', signal: 'audioAnalog', connector: 'xlr3', level: 'line+4' }),
      { name: 'AES out', direction: 'out', signal: 'audioDigital', connector: 'xlr3', format: 'AES3' },
      { name: 'Dante pri.', direction: 'bidir', signal: 'audioIp', connector: 'ethercon', format: 'Dante' },
      { name: 'Word clock in', direction: 'in', signal: 'sync', connector: 'bnc', format: 'Word clock' },
    ] }),
  tpl({ id: 'gen-stagebox-ip', family: 'stagebox', model: 'Stagebox audio sur IP', pictogram: 'stagebox',
    ports: [
      ...range('In', 8, { direction: 'in', signal: 'audioAnalog', connector: 'xlr3', level: 'mic', phantom: 'supplied' }),
      ...range('Out', 4, { direction: 'out', signal: 'audioAnalog', connector: 'xlr3', level: 'line+4' }),
      { name: 'Réseau pri.', direction: 'bidir', signal: 'audioIp', connector: 'ethercon', format: 'Dante' },
    ] }),
  tpl({ id: 'gen-stagebox-madi', family: 'stagebox', model: 'Stagebox MADI', pictogram: 'stagebox',
    ports: [
      ...range('In', 8, { direction: 'in', signal: 'audioAnalog', connector: 'xlr3', level: 'mic', phantom: 'supplied' }),
      { name: 'MADI out', direction: 'out', signal: 'audioDigital', connector: 'bnc', format: 'MADI coax' },
      { name: 'MADI in', direction: 'in', signal: 'audioDigital', connector: 'bnc', format: 'MADI coax' },
    ] }),

  // Traitement et diffusion
  tpl({ id: 'gen-processor', family: 'processing', model: 'Processeur système', pictogram: 'processor',
    ports: [
      ...range('In', 2, { direction: 'in', signal: 'audioAnalog', connector: 'xlr3', level: 'line+4' }),
      { name: 'AES in', direction: 'in', signal: 'audioDigital', connector: 'xlr3', format: 'AES3' },
      ...range('Out', 4, { direction: 'out', signal: 'audioAnalog', connector: 'xlr3', level: 'line+4' }),
    ] }),
  tpl({ id: 'gen-amp4', family: 'amplification', model: 'Amplificateur 4 canaux', pictogram: 'amp',
    ports: [
      ...range('In', 4, { direction: 'in', signal: 'audioAnalog', connector: 'xlr3', level: 'line+4' }),
      ...range('Out', 4, { direction: 'out', signal: 'audioAnalog', connector: 'speakon-nl4', level: 'speaker' }),
      { name: 'Secteur', direction: 'in', signal: 'power', connector: 'powercon' },
    ] }),
  tpl({ id: 'gen-speaker-passive', family: 'speaker', model: 'Enceinte passive', pictogram: 'speaker',
    ports: [
      { name: 'Entrée', direction: 'in', signal: 'audioAnalog', connector: 'speakon-nl4', level: 'speaker' },
      { name: 'Link', direction: 'out', signal: 'audioAnalog', connector: 'speakon-nl4', level: 'speaker' },
    ] }),
  tpl({ id: 'gen-speaker-active', family: 'speaker', model: 'Enceinte amplifiée', pictogram: 'speaker',
    ports: [
      { name: 'Entrée', direction: 'in', signal: 'audioAnalog', connector: 'xlr3', level: 'line+4' },
      { name: 'Link', direction: 'out', signal: 'audioAnalog', connector: 'xlr3', level: 'line+4' },
      { name: 'Secteur', direction: 'in', signal: 'power', connector: 'powercon-true1' },
    ] }),
  tpl({ id: 'gen-recorder', family: 'recording', model: 'Enregistreur multipiste', pictogram: 'recorder',
    ports: [
      ...range('In', 2, { direction: 'in', signal: 'audioAnalog', connector: 'xlr3', level: 'line+4' }),
      { name: 'Réseau', direction: 'bidir', signal: 'audioIp', connector: 'rj45', format: 'Dante' },
    ] }),

  // Vidéo
  tpl({ id: 'gen-camera', family: 'camera', model: 'Caméra', pictogram: 'camera',
    ports: [
      { name: 'SDI out', direction: 'out', signal: 'video', connector: 'bnc', format: '3G-SDI' },
      { name: 'Genlock', direction: 'in', signal: 'sync', connector: 'bnc', format: 'Tri-level' },
      { name: 'Tally / CTRL', direction: 'in', signal: 'control', connector: 'dsub9' },
    ] }),
  tpl({ id: 'gen-switcher', family: 'videoSwitcher', model: 'Mélangeur vidéo', pictogram: 'switcher',
    ports: [
      ...range('SDI in', 4, { direction: 'in', signal: 'video', connector: 'bnc', format: '3G-SDI' }),
      { name: 'PGM out', direction: 'out', signal: 'video', connector: 'bnc', format: '3G-SDI' },
      { name: 'Multiview', direction: 'out', signal: 'video', connector: 'hdmi' },
      { name: 'Ref in', direction: 'in', signal: 'sync', connector: 'bnc', format: 'Black burst / tri-level' },
      { name: 'Réseau', direction: 'bidir', signal: 'network', connector: 'rj45' },
    ] }),
  tpl({ id: 'gen-monitor', family: 'display', model: 'Moniteur', pictogram: 'display',
    ports: [
      { name: 'SDI in', direction: 'in', signal: 'video', connector: 'bnc', format: '3G-SDI' },
      { name: 'HDMI in', direction: 'in', signal: 'video', connector: 'hdmi' },
    ] }),
  tpl({ id: 'gen-projector', family: 'display', model: 'Vidéoprojecteur', pictogram: 'projector',
    ports: [
      { name: 'HDMI in', direction: 'in', signal: 'video', connector: 'hdmi' },
      { name: 'HDBaseT in', direction: 'in', signal: 'video', connector: 'rj45', format: 'HDBaseT' },
      { name: 'Contrôle', direction: 'in', signal: 'control', connector: 'dsub9', format: 'RS-232' },
    ] }),

  // Réseau, synchro, intercom
  tpl({ id: 'gen-switch8', family: 'network', model: 'Switch réseau géré 8 ports', pictogram: 'switch',
    ports: range('Port', 8, { direction: 'bidir', signal: 'network', connector: 'rj45' }) }),
  tpl({ id: 'gen-clock', family: 'sync', model: 'Horloge maître', pictogram: 'clock',
    ports: [
      ...range('WC out', 4, { direction: 'out', signal: 'sync', connector: 'bnc', format: 'Word clock' }),
      ...range('Ref out', 2, { direction: 'out', signal: 'sync', connector: 'bnc', format: 'Black burst / tri-level' }),
      { name: 'LTC out', direction: 'out', signal: 'sync', connector: 'xlr3', format: 'LTC' },
    ] }),
  tpl({ id: 'gen-intercom-base', family: 'intercom', model: 'Base intercom', pictogram: 'intercom',
    ports: [
      ...range('Canal', 2, { direction: 'bidir', signal: 'intercom', connector: 'xlr3', format: 'Partyline 2 fils' }),
      { name: 'Réseau', direction: 'bidir', signal: 'network', connector: 'rj45' },
    ] }),
  tpl({ id: 'gen-intercom-beltpack', family: 'intercom', model: 'Boîtier ceinture', pictogram: 'intercom',
    ports: [{ name: 'Ligne', direction: 'bidir', signal: 'intercom', connector: 'xlr3', format: 'Partyline 2 fils' }] }),

  // Électrique
  tpl({ id: 'gen-power-distro', family: 'power', model: 'Distribution électrique 16 A', pictogram: 'power',
    ports: [
      { name: 'Arrivée', direction: 'in', signal: 'power', connector: 'p17-16-mono' },
      ...range('Départ', 6, { direction: 'out', signal: 'power', connector: 'schuko' }),
    ] }),
]

export const LIBRARY_BY_ID = new Map(GENERIC_LIBRARY.map((t) => [t.id, t]))
