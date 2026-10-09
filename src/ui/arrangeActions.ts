// Alignement et répartition de la sélection, partagés par le menu clic droit et l'inspecteur.
import type { ReactFlowInstance } from '@xyflow/react'
import { arrange, type ArrangeAction, type Box } from '../editor/arrange'
import { useProject } from '../store/projectStore'
import { useUi } from '../store/uiStore'

/** Blocs sélectionnés mesurés par React Flow (les cadres de zone ne bougent pas avec eux). */
export function selectedBoxes(rf: Pick<ReactFlowInstance, 'getNodes'>): Box[] {
  const sel = new Set(useUi.getState().selectedEquipment)
  return rf.getNodes()
    .filter((n) => sel.has(n.id) && !n.hidden && n.measured?.width && n.measured.height && !n.className?.includes('is-frame'))
    .map((n) => ({ id: n.id, x: n.position.x, y: n.position.y, w: n.measured!.width!, h: n.measured!.height! }))
}

export function arrangeSelection(rf: Pick<ReactFlowInstance, 'getNodes'>, action: ArrangeAction) {
  const positions = arrange(selectedBoxes(rf), action)
  if (positions.size) useProject.getState().placeNodes(positions)
}

export const ALIGN_ACTIONS: ArrangeAction[] = ['left', 'centerX', 'right', 'top', 'centerY', 'bottom']
export const SPREAD_ACTIONS: ArrangeAction[] = ['distributeX', 'distributeY', 'column', 'row']
