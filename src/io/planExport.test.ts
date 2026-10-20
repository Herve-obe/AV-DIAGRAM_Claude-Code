import { expect, it } from 'vitest'
import { jsPDF } from 'jspdf'
import { addEquipment, createProject } from '../model/project'
import { placeOnPlan, updateFloorPlan } from '../model/floorPlan'
import { GENERIC_LIBRARY } from '../library/generic'
import { exportSettingsOf, sheetLayout } from './exportOptions'
import { planSheets, planSvg } from './planExport'
import i18n from '../i18n'

it('trace une empreinte métrique, échappe le SVG et découpe le PDF sans modifier le projet', () => {
  const r = addEquipment(createProject('Plan'), GENERIC_LIBRARY[0], { x: 7, y: 8 })
  let p = placeOnPlan(r.project, r.id, { x: 3, y: 4, width: 2, depth: 1, angle: 90 })
  p.equipment[r.id] = { ...p.equipment[r.id], name: '<script> & Test' }
  p = updateFloorPlan(p, 'sh-1', { width: 40, height: 20, scale: 50 })
  const before = JSON.stringify(p)
  const opts = { ...exportSettingsOf(p), scaleMode: 'tile' as const }
  const shots = planSheets(p, opts, {}, i18n.t)
  expect(shots.length).toBeGreaterThan(1)
  const doc = new jsPDF({ unit: 'mm', format: opts.paper, orientation: opts.orientation })
  const { area } = sheetLayout(opts.paper, opts.orientation, 0, 0)
  for (const s of shots) s.draw!(doc, area)
  expect(doc.output()).toContain('1:50')
  expect(planSheets(p, { ...opts, scaleMode: 'fit' }, {}, i18n.t)).toHaveLength(1)
  expect(planSvg(p, 'sh-1', 'Dimensions inconnues')).toContain('&lt;script&gt; &amp; Test')
  expect(planSvg(p, 'sh-1', '')).not.toContain('<script>')
  expect(JSON.stringify(p)).toBe(before)
})
