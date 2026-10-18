// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { ReactFlowInstance } from '@xyflow/react'
import type { TFunction } from 'i18next'
import { createProject } from '../model/project'
import { addRack } from '../model/racks'
import { useProject } from '../store/projectStore'
import { useUi } from '../store/uiStore'
import { drawingBounds, useRoutes } from '../editor/EdgeRouter'
import { exportSettingsOf } from './exportOptions'
import { exportPdfWithLabels } from './exportPdfUi'
import { captureCanvasLight, exportPdf } from './pdf'

vi.mock('./pdf', () => ({ captureCanvasLight: vi.fn(async () => ({ dataUrl: 'test', width: 1600, height: 900 })), exportPdf: vi.fn(async () => 1) }))
vi.mock('./files', () => ({ notifyError: vi.fn() }))

describe('export : découpage visible et choix sur une page', () => {
  const nodes = [{ id: 'bloc', position: { x: 1550, y: 10 }, measured: { width: 120, height: 80 }, data: {} }]
  beforeEach(() => {
    vi.useFakeTimers(); vi.clearAllMocks()
    const p = createProject('A3')
    useProject.setState({ project: { ...p, settings: { ...p.settings, export: exportSettingsOf(p) } } })
    useUi.setState({ view: 'diagram', currentSheetId: p.sheets![0].id, selectedEquipment: ['bloc'], selectedLinks: [] })
    useRoutes.setState({ routes: new Map(), labels: new Map() })
  })
  afterEach(() => vi.useRealTimers())

  it('exporte deux pages fixes, puis restaure la vue et la sélection', async () => {
    const project = useProject.getState().project
    const viewport = { x: 30, y: 50, zoom: 0.5 }
    const setViewport = vi.fn<ReactFlowInstance['setViewport']>(async () => true)
    const rf = { getNodes: () => nodes, getEdges: () => [], getViewport: () => viewport, setViewport } as unknown as ReactFlowInstance
    const pending = exportPdfWithLabels(rf, ((key: string) => key) as TFunction, {})
    await vi.runAllTimersAsync(); expect(await pending).toBe(1)
    expect(captureCanvasLight).toHaveBeenCalledTimes(2)
    expect(vi.mocked(exportPdf).mock.calls[0][1].map(s => s.tile)).toEqual(['A1', 'B1'])
    expect(setViewport.mock.calls.slice(0, 2).map(c => c[0].x)).toEqual([-0, -1600])
    expect(setViewport).toHaveBeenLastCalledWith(viewport)
    expect(useUi.getState().selectedEquipment).toEqual(['bloc'])
    expect(useProject.getState().project).toBe(project)
  })
  it('le choix une page utilise une capture sans déplacer le projet', async () => {
    const p = useProject.getState().project
    const project = { ...p, settings: { ...p.settings, export: { ...exportSettingsOf(p), scaleMode: 'fit' as const } } }
    const original = useProject.getState().project
    const edge = { id: 'detour', source: 'a', target: 'b', data: {} }
    useRoutes.setState({ routes: new Map([['detour', [{ x: 1600, y: 20 }, { x: 5000, y: 20 }]]]) })
    const fitView = vi.fn(async () => true)
    const setViewport = vi.fn<ReactFlowInstance['setViewport']>(async () => true)
    const rf = { getNodes: () => nodes, getEdges: () => [edge], getViewport: () => ({ x: 0, y: 0, zoom: 1 }), setViewport, fitView } as unknown as ReactFlowInstance
    const pending = exportPdfWithLabels(rf, ((key: string) => key) as TFunction, {}, undefined, project.settings.export)
    await vi.runAllTimersAsync(); await pending
    expect(captureCanvasLight).toHaveBeenCalledTimes(1)
    expect(setViewport.mock.calls[0][0].zoom).toBeLessThan(0.5)
    expect(useProject.getState().project).toBe(original)
  })
  it('un détour de câble et son étiquette étendent aussi les pages', () => {
    const edge = { id: 'cable', source: 'a', target: 'b', data: { label: 'AUD-001', showLabel: true } }
    const bounds = drawingBounds(nodes, [edge], { routes: new Map([['cable', [{ x: 1680, y: 940 }]]]), labels: new Map([['cable', { x: 1720, y: 950 }]]) })
    expect(bounds!.x + bounds!.w).toBeGreaterThan(1720)
    expect(bounds!.y + bounds!.h).toBeGreaterThan(950)
  })
  it('exporte la vue Baies sans capturer ni modifier le canevas', async () => {
    const r = addRack(useProject.getState().project)
    useProject.setState({ project: r.project })
    useUi.setState({ view: 'racks' })
    const before = useUi.getState()
    expect(await exportPdfWithLabels({} as ReactFlowInstance, ((key: string) => key) as TFunction, {})).toBe(1)
    expect(captureCanvasLight).not.toHaveBeenCalled()
    expect(vi.mocked(exportPdf).mock.calls[0][1].every(s => s.draw)).toBe(true)
    expect(useUi.getState()).toBe(before)
    expect(useProject.getState().project).toBe(r.project)
  })
})
