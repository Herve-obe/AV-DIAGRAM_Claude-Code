import { describe, expect, it } from 'vitest'
import { portsToDisplay } from './portDisplay'

describe('affichage des équipements volumineux', () => {
  const ports = Array.from({ length: 56 }, (_, i) => ({ id: `p${i + 1}`, name: `Port ${i + 1}`, direction: i < 32 ? 'in' as const : 'out' as const, signal: 'audioAnalog' as const, connector: 'xlr3' }))
  it('replie une stagebox neuve sans supprimer ses ports', () => {
    expect(portsToDisplay(ports, new Set(), false)).toEqual([])
    expect(ports).toHaveLength(56)
  })
  it('garde les ports reliés et les renvois sans renumérotation', () => {
    const shown = portsToDisplay(ports, new Set(['p9', 'p1', 'p33']), false)
    expect(shown.map(p => p.id)).toEqual(['p1', 'p9', 'p33'])
    expect(shown[1]).toBe(ports[8])
    expect(portsToDisplay(ports, new Set(), true)).toBe(ports)
    expect(portsToDisplay(ports.slice(0, 4), new Set())).toHaveLength(4)
    expect(portsToDisplay(ports.slice(0, 4), new Set(['p1']), false).map(p => p.id)).toEqual(['p1'])
    expect(portsToDisplay(ports.slice(0, 16), new Set())).toHaveLength(16)
    expect(portsToDisplay(ports.slice(0, 17), new Set())).toHaveLength(0)
  })
})
