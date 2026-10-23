import type { IconName } from './Icon'

/** Les menus et les préférences partagent les mêmes commandes. */
export const TOP_ACTIONS = [
  { id: 'new', label: 'menu.new', icon: 'file', menu: 'file', section: 'document' },
  { id: 'open', label: 'menu.open', icon: 'folder', menu: 'file', section: 'document', hint: 'Ctrl/Cmd+O' },
  { id: 'save', label: 'menu.save', icon: 'save', menu: 'file', section: 'document', hint: 'Ctrl/Cmd+S' },
  { id: 'saveAs', label: 'menu.saveAs', icon: 'save', menu: 'file', section: 'document', hint: 'Ctrl/Cmd+⇧+S' },
  { id: 'merge', label: 'merge.menu', icon: 'copy', menu: 'file', section: 'import' },
  { id: 'importPdf', label: 'pdfImport.menu', icon: 'pdf', menu: 'file', section: 'import' },
  { id: 'importCad', label: 'cad.menu', icon: 'plan', menu: 'file', section: 'import' },
  { id: 'importDiagram', label: 'diagramExchange.menu', icon: 'layers', menu: 'file', section: 'import' },
  { id: 'importPatch', label: 'xlsx.importMenu', icon: 'lists', menu: 'file', section: 'import' },
  { id: 'importCatalogue', label: 'catalogue.title', icon: 'lists', menu: 'file', section: 'import' },
  { id: 'exportPdf', label: 'menu.exportPdf', icon: 'pdf', menu: 'file', section: 'export' },
  { id: 'exportPng', label: 'menu.exportPng', icon: 'download', menu: 'file', section: 'export' },
  { id: 'exportSvg', label: 'menu.exportSvg', icon: 'download', menu: 'file', section: 'export' },
  { id: 'exportCsv', label: 'menu.exportCsv', icon: 'lists', menu: 'file', section: 'export' },
  { id: 'exportCad', label: 'cad.export', icon: 'plan', menu: 'file', section: 'export' },
  { id: 'exportXlsx', label: 'xlsx.export', icon: 'lists', menu: 'file', section: 'export' },
  { id: 'exportDiagram', label: 'diagramExchange.export', icon: 'layers', menu: 'file', section: 'export' },
  { id: 'undo', label: 'menu.undo', icon: 'undo', menu: 'edit' },
  { id: 'redo', label: 'menu.redo', icon: 'redo', menu: 'edit' },
  { id: 'group', label: 'groups.group', icon: 'layers', menu: 'edit' },
  { id: 'ungroup', label: 'groups.ungroup', icon: 'layers', menu: 'edit' },
  { id: 'fit', label: 'palette.fit', icon: 'search', menu: 'view', hint: 'F' },
  { id: 'dual', label: 'dual.open', icon: 'screens', menu: 'view' },
  { id: 'present', label: 'presentation.enter', icon: 'present', menu: 'view', hint: 'F5' },
  { id: 'mode', label: 'palette.toggleMode', icon: 'settings', menu: 'view' },
  { id: 'theme', label: 'palette.toggleTheme', icon: 'monitor', menu: 'view' },
  { id: 'lang', label: 'palette.toggleLang', icon: 'monitor', menu: 'view' },
  { id: 'collab', label: 'collab.title', icon: 'users', menu: 'tools' },
  { id: 'chat', label: 'collab.chat.title', icon: 'chat', menu: 'tools' },
  { id: 'aiSetup', label: 'ai.configure', icon: 'assistant', menu: 'tools' },
  { id: 'settings', label: 'settings.title', icon: 'settings', menu: 'tools' },
  { id: 'toolbar', label: 'toolbar.customize', icon: 'settings', menu: 'tools' },
  { id: 'manual', label: 'manual.title', icon: 'bookmark', menu: 'help' },
] as const satisfies readonly { id: string; label: string; icon: IconName; menu: string; section?: string; hint?: string }[]

export type TopActionId = typeof TOP_ACTIONS[number]['id']
export const DEFAULT_TOOLBAR: TopActionId[] = ['open', 'save', 'undo', 'redo', 'exportPdf']

export function toolbarPreference(value: unknown): TopActionId[] {
  if (!Array.isArray(value)) return [...DEFAULT_TOOLBAR]
  return [...new Set(value.filter((id): id is TopActionId => TOP_ACTIONS.some(a => a.id === id)))]
}
