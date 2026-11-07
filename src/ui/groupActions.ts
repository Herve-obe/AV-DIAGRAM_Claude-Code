// Actions de groupe partagées par les raccourcis, la palette et l'inspecteur.
import i18n from '../i18n'
import { groupNodeId, isGroupNodeId, sheetIdOfGroupNode } from '../model/groups'
import { useProject } from '../store/projectStore'
import { useUi } from '../store/uiStore'

/** Regroupe la sélection de la feuille courante dans un sous-schéma. */
export function groupSelected(): string | null {
  const ui = useUi.getState()
  const store = useProject.getState()
  const n = (store.project.sheets ?? []).filter((s) => s.parentId).length + 1
  const id = store.groupSelection(ui.currentSheetId, ui.selectedEquipment, i18n.t('groups.newName', { n }))
  if (id) ui.select([groupNodeId(id)], [])
  return id
}

/** Dissout les groupes sélectionnés : leur contenu remonte sur la feuille courante. */
export function ungroupSelected() {
  const ui = useUi.getState()
  const ids = ui.selectedEquipment.filter(isGroupNodeId)
  for (const id of ids) useProject.getState().ungroup(sheetIdOfGroupNode(id))
  if (ids.length) ui.select([], [])
}
