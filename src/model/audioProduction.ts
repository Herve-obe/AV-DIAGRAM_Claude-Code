import type { EquipmentTemplate, PortDef, Project } from './types'
import { addAnnotation, addZone, updateEquipment, updateLink } from './project'
import { diagramBlockSize, layoutDiagram } from './diagramLayout'
import { suggestZoneCode } from './zones'

export interface AudioMix {
  id: string
  inputs: string[]
  exclude: string[]
}

/** Contrôle les dépendances réelles des mixages, y compris les sources présentes dans un sous-mix. */
export function checkAudioMixes(sources: string[], mixes: AudioMix[]): string[] {
  const errors: string[] = [], known = new Set(sources), byId = new Map(mixes.map(m => [m.id, m]))
  if (known.size !== sources.length || byId.size !== mixes.length || mixes.some(m => known.has(m.id))) return ['Identifiants de sources ou de mixages en double.']
  const visit = (id: string, stack: Set<string>): Set<string> => {
    if (stack.has(id)) { errors.push(`Boucle de mixage : ${[...stack, id].join(' → ')}.`); return new Set() }
    if (known.has(id)) return new Set([id])
    const mix = byId.get(id)
    if (!mix) { errors.push(`Source de mixage inconnue : ${id}.`); return new Set() }
    return new Set([id, ...mix.inputs.flatMap(input => [...visit(input, new Set([...stack, id]))])])
  }
  for (const mix of mixes) {
    const dependencies = visit(mix.id, new Set())
    for (const excluded of mix.exclude) {
      if (!known.has(excluded) && !byId.has(excluded)) errors.push(`Exclusion inconnue : ${excluded}.`)
      if (dependencies.has(excluded)) errors.push(`${mix.id} contient la source exclue ${excluded}.`)
    }
  }
  return [...new Set(errors)]
}

type Group = 'interview' | 'control' | 'live'
export type ProductionLabels = Record<string, string>
export interface ProductionEquipment {
  ref: string
  template_id: string
  name: string
  group: Group
  port_modes: { port_id: string; mode: number }[]
  notes?: string
}
export interface ProductionConnection {
  from: string; from_port: string; to: string; to_port: string; notes?: string; cable_type_id?: string
}
export interface AudioProductionPlan {
  equipment: ProductionEquipment[]
  connections: ProductionConnection[]
  mixes: AudioMix[]
  notes: Record<Group, string>
  assumptions: string[]
}

/** shortcut: parcours interview + duo live sur M7CL-48ES/01V96 ; étendre les capacités documentées avant d'accepter d'autres consoles. */
export function audioProductionPlan(library: EquipmentTemplate[], args: Record<string, unknown>, labels: ProductionLabels): AudioProductionPlan | { error: string } {
  const say = (key: string, values: Record<string, string | number> = {}) => (labels[key] ?? key).replace(/\{\{(\w+)\}\}/g, (_, k) => String(values[k] ?? ''))
  const interviewCount = args.interview_mic_count ?? 3, loops = args.loop_channels ?? 2, boxes = args.stagebox_count ?? 1
  if (!Number.isInteger(interviewCount) || (interviewCount as number) < 1 || (interviewCount as number) > 10
    || !Number.isInteger(loops) || (loops as number) < 1 || (loops as number) > 8 || ![0, 1, 2].includes(boxes as number)) return { error: say('invalidCounts') }
  if (args.main_console_template_id !== 'yamaha-m7cl-48es' || args.live_console_template_id !== 'yamaha-01v96') return { error: say('consolesRequired') }
  const plan: AudioProductionPlan = { equipment: [], connections: [], mixes: [], notes: { interview: '', control: '', live: '' }, assumptions: [] }
  const templates = new Map<string, EquipmentTemplate>(), used = new Set<string>()
  const add = (ref: string, id: unknown, group: Group, name: string) => {
    const t = library.find(t => t.id === id)
    if (!t || t.portStatus === 'pending' || !t.ports.length) throw new Error(say('missingTemplate', { id: String(id) }))
    const mic = /^interview\d+$/.test(ref) || ['vocal', 'guitar_mic'].includes(ref)
    if ((mic && (t.family !== 'capture' || t.pictogram !== 'mic'))
      || (ref === 'vocal' && !t.ports.some(p => p.direction === 'out' && p.phantom === 'required'))
      || (ref === 'video' && t.family !== 'videoSwitcher') || (ref === 'recorder' && t.family !== 'recording')
      || (/^monitor\d+$/.test(ref) && t.family !== 'speaker')) throw new Error(say('roleMismatch', { id: String(id), role: name }))
    templates.set(ref, t)
    plan.equipment.push({ ref, template_id: t.id, name, group, port_modes: [] })
  }
  const ports = (ref: string, direction: 'in' | 'out') => templates.get(ref)!.ports.filter(p => p.direction === direction && p.signal === 'audioAnalog' && (p.channels ?? 1) === 1)
  const exact = (ref: string, id: string) => {
    const p = templates.get(ref)?.ports.find(p => p.id === id)
    if (!p) throw new Error(say('missingPort', { ref, id }))
    return p
  }
  const take = (ref: string, direction: 'in' | 'out', level: 'mic' | 'line+4', preferred?: string) => {
    const candidates = ports(ref, direction).filter(p => !used.has(ref + '/' + p.id))
    const p = preferred ? candidates.find(p => p.id === preferred) : candidates.find(p => p.level === level) ?? candidates.find(p => p.modes?.some(m => m.level === level))
    if (!p) throw new Error(say('capacity', { ref, level }))
    if (p.level !== level) {
      const mode = p.modes?.findIndex(m => m.level === level) ?? -1
      if (mode < 0) throw new Error(say('capacity', { ref, level }))
      plan.equipment.find(e => e.ref === ref)!.port_modes.push({ port_id: p.id, mode })
    }
    used.add(ref + '/' + p.id)
    return p
  }
  const wire = (from: string, output: PortDef, to: string, input: PortDef, notes?: string) => {
    const connector = (ref: string, p: PortDef) => {
      const selection = plan.equipment.find(e => e.ref === ref)!.port_modes.find(s => s.port_id === p.id)
      return selection ? p.modes![selection.mode].connector : p.connector
    }
    const a = connector(from, output), b = connector(to, input)
    const balanced = (a === 'xlr3' && b === 'jack-trs') || (b === 'xlr3' && a === 'jack-trs')
    plan.connections.push({ from, from_port: output.id, to, to_port: input.id, notes, ...(balanced ? { cable_type_id: 'mod-xlr-trs' } : {}) })
  }
  const mainPatch: string[] = [], livePatch: string[] = []
  const boxInputs = new Map<string, number>()
  const feedMain = (from: string, output: PortDef, preferredBox = 1) => {
    const box = boxes ? `box${Math.min(boxes as number, preferredBox)}` : 'main'
    const input = take(box, 'in', output.level === 'mic' ? 'mic' : 'line+4')
    const index = (boxInputs.get(box) ?? 0) + 1
    boxInputs.set(box, index)
    const channel = boxes ? (Number(box.slice(3)) - 1) * 16 + index : index
    const note = say('patch', { channel, socket: `${plan.equipment.find(e => e.ref === box)!.name} / ${input.name}`, source: plan.equipment.find(e => e.ref === from)!.name })
    mainPatch.push(note)
    wire(from, output, box, input, note)
  }
  try {
    add('main', args.main_console_template_id, 'control', say('main'))
    add('live', args.live_console_template_id, 'live', say('liveConsole'))
    for (let i = 1; i <= (boxes as number); i++) {
      add(`box${i}`, 'yamaha-sb168es', i === 1 ? 'interview' : 'control', say('box', { n: i }))
      wire(i === 1 ? 'main' : `box${i - 1}`, exact(i === 1 ? 'main' : `box${i - 1}`, 'esout'), `box${i}`, exact(`box${i}`, 'esin'), say('etherSound'))
    }
    const interview: string[] = []
    for (let i = 1; i <= (interviewCount as number); i++) {
      const ref = `interview${i}`
      add(ref, args.interview_microphone_template_id ?? 'shure-sm58', 'interview', say(i === 1 ? 'presenterMic' : 'interviewMic', { n: i - 1 }))
      feedMain(ref, take(ref, 'out', 'mic'))
      interview.push(ref)
    }
    add('vocal', args.vocal_microphone_template_id ?? 'akg-c414-xls', 'live', say('vocal'))
    add('guitar_mic', args.guitar_microphone_template_id ?? 'shure-sm57', 'live', say('guitarMic'))
    add('guitar', 'gen-electric-guitar', 'live', say('guitar'))
    add('guitar_amp', 'gen-guitar-amp', 'live', say('guitarAmp'))
    wire('guitar', exact('guitar', 'p1'), 'guitar_amp', exact('guitar_amp', 'p1'), say('acoustic'))
    add('machines', 'gen-loop-sources', 'live', say('machines'))
    const liveSources = ['vocal', 'guitar_mic']
    for (let i = 1; i <= (loops as number); i++) {
      const ref = `di${i}`
      add(ref, 'radial-prodi', 'live', say('di', { n: i }))
      wire('machines', exact('machines', `p${i}`), ref, exact(ref, 'in'), say('diSettings'))
      liveSources.push(ref)
    }
    for (const ref of liveSources) {
      const output = take(ref, 'out', 'mic'), input = take('live', 'in', 'mic')
      const note = `${input.name} ← ${plan.equipment.find(e => e.ref === ref)!.name}`
      livePatch.push(note)
      wire(ref, output, 'live', input, note)
    }
    // La paire stéréo live occupe deux entrées physiques distinctes sur la console principale.
    for (const id of ['stL', 'stR']) feedMain('live', take('live', 'out', 'line+4', id), 2)
    add('media', args.audio_interface_template_id ?? 'focusrite-scarlett-2i2-3g', 'control', say('media'))
    add('computer', 'gen-media-computer', 'control', say('computer'))
    const usb = templates.get('media')!.ports.find(p => p.signal === 'audioDigital' && p.connector.startsWith('usb-'))
    if (!usb) throw new Error(say('missingPort', { ref: 'media', id: 'USB audio' }))
    wire('computer', exact('computer', 'p1'), 'media', usb)
    for (let i = 0; i < 2; i++) feedMain('media', take('media', 'out', 'line+4'), 2)
    add('video', args.video_switcher_template_id ?? 'gen-streaming-mixer', 'control', say('video'))
    add('recorder', args.recorder_template_id ?? 'tascam-dr-40', 'control', say('recorder'))
    const outputs: string[] = []
    for (const [target, first] of [['video', 1], ['recorder', 3], ['live', 5]] as const) {
      const bus = target === 'live' ? 'MIX 3/4' : target === 'recorder' ? 'MATRIX 1/2 ← ST L/R' : 'ST L/R'
      for (let i = 0; i < 2; i++) {
        const output = take('main', 'out', 'line+4', `out${first + i}`)
        const input = take(target, 'in', 'line+4')
        wire('main', output, target, input, `${bus} → ${input.name}`)
        outputs.push(`${output.name} ← ${bus} (${plan.equipment.find(e => e.ref === target)!.name})`)
        if (target === 'live') livePatch.push(`${input.name} ← ${say('returnName')} ; ${say('auxOnly')}`)
      }
    }
    for (let i = 1; i <= 2; i++) {
      add(`monitor${i}`, args.monitor_template_id ?? 'gen-speaker-active', 'interview', say('monitor', { n: i }))
      const source = boxes ? 'box1' : 'main'
      const output = take(source, 'out', 'line+4', boxes ? `out${i}` : `out${6 + i}`)
      wire(source, output, `monitor${i}`, take(`monitor${i}`, 'in', 'line+4'), 'MIX 1/2')
      outputs.push(`${plan.equipment.find(e => e.ref === source)!.name} / ${output.name} ← MIX 1/2`)
    }
    add('headamp', 'behringer-ha8000', 'live', say('headamp'))
    for (let i = 1; i <= 2; i++) {
      add(`headphones${i}`, 'gen-headphones', 'live', say('headphones', { n: i }))
      for (let j = 0; j < 2; j++) {
        const n = (i - 1) * 2 + j + 1
        wire('live', take('live', 'out', 'line+4', `omni${n}`), 'headamp', exact('headamp', `main${i}${j ? 'R' : 'L'}`), `AUX ${n} → MAIN ${i} ${j ? 'R' : 'L'}`)
        livePatch.push(`OMNI OUT ${n} ← AUX ${n}`)
      }
      wire('headamp', exact('headamp', `hp${i}`), `headphones${i}`, exact(`headphones${i}`, 'p1'), say('headphoneSelect', { n: i }))
    }
    plan.mixes = [
      { id: 'live_pgm', inputs: liveSources, exclude: ['return_live'] },
      { id: 'programme', inputs: [...interview, 'live_pgm', 'media'], exclude: [] },
      { id: 'interview_speakers', inputs: ['live_pgm', 'media'], exclude: interview },
      { id: 'return_live', inputs: ['interview1', 'media'], exclude: ['live_pgm'] },
      ...[1, 2].map(i => ({ id: `headphones${i}`, inputs: [...liveSources, 'return_live'], exclude: [] })),
    ]
    const errors = checkAudioMixes([...interview, ...liveSources, 'media'], plan.mixes)
    if (errors.length) return { error: errors.join(' ') }
    plan.assumptions = [say('loopAssumption', { n: loops as number }), say('headphoneAssumption'), say('stageboxAssumption', { n: boxes as number }), say('genericAssumption'), say('videoBoundary')]
    plan.notes.control = [say('routingTitle'), ...mainPatch, ...outputs, say('programmeMix'), say('returnMix'), say('speakerMix'), boxes ? say('stageboxSettings', { n: boxes as number }) : say('localPatch'), say('recorderSettings'), say('manualSettings'), ...plan.assumptions].filter(Boolean).join('\n')
    plan.notes.live = [say('liveTitle'), ...livePatch, say('liveMix'), say('headphoneMix'), say('headampSettings'), say('phantomSettings'), say('acoustic'), say('diSettings'), say('phases'), say('manualSettings')].join('\n')
    plan.notes.interview = [say('interviewTitle'), say('speakerMix'), say('monitorPlacement'), say('phases')].join('\n')
    plan.equipment.find(e => e.ref === 'main')!.notes = plan.notes.control
    plan.equipment.find(e => e.ref === 'live')!.notes = plan.notes.live
    return plan
  } catch (error) { return { error: error instanceof Error ? error.message : say('invalidCounts') } }
}

/** Les affectations restent des notes de projet éditables, exportables et compatibles avec le format .avd existant. */
export function presentAudioProduction(project: Project, plan: AudioProductionPlan, refs: Map<string, string>, sheetId: string, labels: ProductionLabels): Project {
  let next = project
  for (const entry of plan.equipment) if (entry.notes) next = updateEquipment(next, refs.get(entry.ref)!, { notes: entry.notes })
  const added = new Set(refs.values())
  let x = Math.max(40, ...Object.values(project.equipment).filter(e => !added.has(e.id) && e.sheetId === sheetId).map(e => e.position.x + diagramBlockSize(project, e).w + 120))
  for (const group of ['interview', 'control', 'live'] as const) {
    const ids = plan.equipment.filter(e => e.group === group).map(e => refs.get(e.ref)!)
    const local = layoutDiagram({ ...next, equipment: Object.fromEntries(ids.map(id => [id, next.equipment[id]])) }, ids, sheetId)
    let width = 0, height = 0
    for (const id of ids) {
      const e = local.equipment[id], size = diagramBlockSize(local, e)
      width = Math.max(width, e.position.x + size.w + 40)
      height = Math.max(height, e.position.y + size.h + 40)
      next = updateEquipment(next, id, { position: { x: e.position.x + x, y: e.position.y + 80 } })
    }
    const noteWidth = Math.max(650, width)
    const noteHeight = plan.notes[group].split('\n').reduce((n, line) => n + Math.max(1, Math.ceil(line.length / Math.floor((noteWidth - 40) / 8))), 0) * 22 + 40
    next = addAnnotation(next, { kind: 'note', sheetId, text: plan.notes[group], position: { x: x + 20, y: height + 110 }, size: { w: noteWidth, h: noteHeight } }).project
    const zone = addZone(next, labels[group], suggestZoneCode(next, labels[group]))
    next = addAnnotation(zone.project, { kind: 'frame', sheetId, text: labels[group], zoneId: zone.id, position: { x, y: 40 }, size: { w: noteWidth + 40, h: height + noteHeight + 100 } }).project
    for (const id of ids) next = updateEquipment(next, id, { zoneId: zone.id })
    x += noteWidth + 120
  }
  for (const entry of plan.connections) {
    const link = Object.values(next.links).find(l => l.source.equipmentId === refs.get(entry.from) && l.source.portId === entry.from_port && l.target.equipmentId === refs.get(entry.to) && l.target.portId === entry.to_port)
    if (link && entry.notes) next = updateLink(next, link.id, { notes: entry.notes })
  }
  // Affecter les nouvelles zones renumérote les câbles ; les repères déjà présents restent inchangés.
  return { ...next, links: { ...next.links, ...Object.fromEntries(Object.entries(project.links).filter(([, l]) => !added.has(l.source.equipmentId))) } }
}
