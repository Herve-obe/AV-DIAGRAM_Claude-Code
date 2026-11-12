import { describe, expect, it } from 'vitest'
import { LIBRARY_BY_ID } from '../library/generic'
import * as ops from './project'

describe('calques et orientation', () => {
  it('range une caméra dans les calques Image et Audio, et rappelle ses entrées audio non reliées', async () => {
    const { LIBRARY } = await import('../library')
    const { crossLayerHints, equipmentInView, hintKey, layersOf, portInView } = await import('./layers')
    const cam = LIBRARY.find((t) => t.id === 'panasonic-aw-ue150')!
    let p = ops.createProject('t')
    const r = ops.addEquipment(p, cam, { x: 0, y: 0 })
    p = r.project
    const eq = p.equipment[r.id]
    const layers = layersOf(eq)
    expect(layers.has('image')).toBe(true)
    expect(layers.has('sound')).toBe(true)
    expect(equipmentInView(eq, 'sound')).toBe(true)
    expect(equipmentInView(eq, 'light')).toBe(false)
    const mic = eq.ports.find((x) => x.signal === 'audioAnalog')!
    const hdmi = eq.ports.find((x) => x.id === 'hdmi')!
    expect(portInView(mic, 'sound')).toBe(true)
    expect(portInView(hdmi, 'sound')).toBe(false)
    const hints = crossLayerHints(p)
    expect(hints).toHaveLength(1)
    expect(hints[0]).toMatchObject({ equipmentId: r.id, layer: 'sound', home: 'image', dismissed: false })
    // Ignorer le rappel : il reste listé, marqué ignoré
    p = ops.setHintDismissed(p, r.id, hintKey('sound'), true)
    expect(crossLayerHints(p)[0].dismissed).toBe(true)
    p = ops.setHintDismissed(p, r.id, hintKey('sound'), false)
    expect(crossLayerHints(p)[0].dismissed).toBe(false)
  })

  it('le rappel disparaît une fois les ports reliés', async () => {
    const { LIBRARY } = await import('../library')
    const { crossLayerHints } = await import('./layers')
    let p = ops.createProject('t')
    const cam = ops.addEquipment(p, LIBRARY.find((t) => t.id === 'panasonic-aw-ue150')!, { x: 0, y: 0 })
    p = cam.project
    const sm58 = ops.addEquipment(p, LIBRARY.find((t) => t.id === 'shure-sm58')!, { x: -300, y: 0 })
    p = sm58.project
    const micPort = p.equipment[cam.id].ports.find((x) => x.signal === 'audioAnalog')!
    const res = ops.connect(p, { equipmentId: sm58.id, portId: p.equipment[sm58.id].ports[0].id }, { equipmentId: cam.id, portId: micPort.id })
    expect(crossLayerHints(res.project)).toHaveLength(0)
  })

  it('pivote par quarts de tour dans les deux sens', () => {
    let p = ops.createProject('t')
    const r = ops.addEquipment(p, LIBRARY_BY_ID.get('gen-mic-dyn')!, { x: 0, y: 0 })
    p = ops.rotateEquipment(r.project, [r.id], 1)
    expect(p.equipment[r.id].rotation).toBe(90)
    p = ops.rotateEquipment(p, [r.id], -1)
    p = ops.rotateEquipment(p, [r.id], -1)
    expect(p.equipment[r.id].rotation).toBe(270)
  })
})
