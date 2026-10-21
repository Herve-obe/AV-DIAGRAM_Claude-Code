import type { EquipmentTemplate, PortDef } from './types'

/** Plateau SDI avec mix programme stéréo XLR ; aucune prise ni conversion n'est inventée. */
export function videoStudioPlan(camera: EquipmentTemplate, count: number, video: EquipmentTemplate, audio: EquipmentTemplate) {
  if (!Number.isInteger(count) || count < 1 || count > 48) return { error: 'Le nombre de caméras doit être un entier de 1 à 48.' }
  if (camera.family !== 'camera' || video.family !== 'videoSwitcher' || audio.family !== 'console') return { error: 'Choisir une caméra, un mélangeur vidéo et une console audio.' }
  const sdi = (p: PortDef) => p.signal === 'video' && p.connector === 'bnc' && /SDI/i.test(p.name + ' ' + (p.format ?? ''))
  const line = (p: PortDef) => p.signal === 'audioAnalog' && p.connector === 'xlr3'
    && (p.level === 'line+4' || p.level === 'line-10' || /ligne|line/i.test(p.format ?? ''))
  const output = camera.ports.find(p => p.direction === 'out' && sdi(p))
  const inputs = video.ports.filter(p => p.direction === 'in' && sdi(p))
  const audioOut = audio.ports.filter(p => p.direction === 'out' && line(p))
  const audioIn = video.ports.filter(p => p.direction === 'in' && line(p))
  if (!output || inputs.length < count) return { error: 'Il faut une sortie SDI documentée sur la caméra et une entrée SDI distincte par caméra sur le mélangeur.' }
  if (audioOut.length < 2 || audioIn.length < 2) return { error: 'Il faut deux sorties ligne XLR documentées sur la console et deux entrées ligne XLR sur le mélangeur. Aucun adaptateur implicite.' }
  return {
    equipment: [{ ref: 'cam', template_id: camera.id, count }, { ref: 'video', template_id: video.id }, { ref: 'audio', template_id: audio.id }],
    connections: [
      ...Array.from({ length: count }, (_, i) => ({ from: `cam${count > 1 ? i + 1 : ''}`, from_port: output.id, to: 'video', to_port: inputs[i].id })),
      ...audioOut.slice(0, 2).map((p, i) => ({ from: 'audio', from_port: p.id, to: 'video', to_port: audioIn[i].id })),
    ],
  }
}
