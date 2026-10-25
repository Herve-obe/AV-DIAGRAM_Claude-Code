// Fichiers : enregistrement et ouverture du format natif .avd (JSON), exports image et CSV.
// Dans l'application bureau (Tauri), on utilise les fenêtres natives du système ;
// dans un navigateur (développement), on retombe sur le téléchargement classique.
import { isTauri } from '@tauri-apps/api/core'
import i18n from '../i18n'
import { toPng, toSvg } from 'html-to-image'
import { getCable } from '../model/cables'
import { connectorLabel } from '../model/connectors'
import { findPort } from '../model/rules'
import { isProject } from '../model/project'
import { exportSettingsOf, watermarkLayout, watermarkText } from './exportOptions'
import { BACKUP_DIR } from './backups'
import type { Project, WatermarkSettings } from '../model/types'
import { useProject } from '../store/projectStore'
import { useUi } from '../store/uiStore'
import { useSaveFolder } from '../store/saveFolderStore'

function browserDownload(filename: string, href: string) {
  const a = document.createElement('a')
  a.href = href
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
}

/** Extension et libellé du filtre proposé dans la fenêtre d'enregistrement. */
const FILTERS: Record<string, { name: string; extensions: string[] }> = {
  avd: { name: 'Projet AV Diagram', extensions: ['avd'] },
  csv: { name: 'CSV', extensions: ['csv'] },
  png: { name: 'Image PNG', extensions: ['png'] },
  svg: { name: 'Image SVG', extensions: ['svg'] },
  pdf: { name: 'PDF', extensions: ['pdf'] },
  dxf: { name: 'DXF', extensions: ['dxf'] },
  xlsx: { name: 'Excel', extensions: ['xlsx'] },
  drawio: { name: 'draw.io', extensions: ['drawio'] },
}

/** Les fichiers générés sont proposés à côté du .avd ; le réglage global sert aux projets sans fichier. */
async function projectDirectory(): Promise<string | null> {
  const st = useSaveFolder.getState()
  const file = st.projectFiles[useProject.getState().project.id]
  if (!file) return st.dir
  const { dirname } = await import('@tauri-apps/api/path')
  return dirname(file)
}

async function inSaveFolder(filename: string): Promise<string> {
  const dir = await projectDirectory()
  if (!dir) return filename
  const { join } = await import('@tauri-apps/api/path')
  return join(dir, filename)
}

/** Choisit le dossier d'enregistrement (application de bureau) ; null si l'utilisateur annule. */
export async function pickSaveFolder(): Promise<string | null> {
  if (!isTauri()) return null
  const { open } = await import('@tauri-apps/plugin-dialog')
  // recursive : l'autorisation d'écrire couvre le dossier et ses sous-dossiers (gardée au redémarrage)
  const dir = await open({ directory: true, multiple: false, recursive: true, defaultPath: useSaveFolder.getState().dir ?? undefined })
  return typeof dir === 'string' ? dir : null
}

/**
 * Enregistre un contenu : fenêtre "Enregistrer sous" native dans l'application bureau.
 * Renvoie false si l'utilisateur annule.
 */
export async function saveContent(filename: string, content: string | Uint8Array, mime: string): Promise<boolean> {
  const ext = filename.split('.').pop() ?? ''
  if (isTauri()) {
    const { save } = await import('@tauri-apps/plugin-dialog')
    const { writeFile, writeTextFile } = await import('@tauri-apps/plugin-fs')
    const path = await save({ defaultPath: await inSaveFolder(filename), filters: FILTERS[ext] ? [FILTERS[ext]] : [] })
    if (!path) return false
    if (typeof content === 'string') await writeTextFile(path, content)
    else await writeFile(path, content)
    return true
  }
  const blob = new Blob([content as BlobPart], { type: mime })
  const url = URL.createObjectURL(blob)
  browserDownload(filename, url)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
  return true
}

/**
 * Enregistre plusieurs fichiers d'un coup (ex. un PDF par destinataire) : dans l'application de bureau,
 * l'utilisateur choisit un dossier une fois ; ailleurs, chaque fichier est téléchargé.
 * Renvoie le nombre de fichiers écrits (0 si l'utilisateur annule).
 */
export async function saveMany(files: { name: string; content: Uint8Array; mime: string }[]): Promise<number> {
  if (isTauri()) {
    const { open } = await import('@tauri-apps/plugin-dialog')
    const { writeFile } = await import('@tauri-apps/plugin-fs')
    const { join } = await import('@tauri-apps/api/path')
    const dir = await open({ directory: true, multiple: false, defaultPath: (await projectDirectory()) ?? undefined })
    if (!dir) return 0
    for (const f of files) await writeFile(await join(dir, f.name), f.content)
    return files.length
  }
  for (const f of files) {
    const url = URL.createObjectURL(new Blob([f.content as BlobPart], { type: f.mime }))
    browserDownload(f.name, url)
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
  return files.length
}

/** Message d'erreur : boîte de dialogue native dans l'application bureau. */
export async function notifyError(message: string) {
  if (isTauri()) {
    const { message: show } = await import('@tauri-apps/plugin-dialog')
    await show(message, { title: 'AV Diagram', kind: 'error' })
  } else {
    window.alert(message)
  }
}

function dataUrlToBytes(dataUrl: string): Uint8Array {
  const bin = atob(dataUrl.split(',')[1] ?? '')
  return Uint8Array.from(bin, (c) => c.charCodeAt(0))
}

/** Nom de fichier sûr à partir du nom de projet. */
export function slug(name: string): string {
  return name.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '').toLowerCase() || 'projet'
}

/** Garde un nom lisible, utilisable comme dossier sous Windows et macOS. */
export function projectFolderName(name: string): string {
  const clean = Array.from(name.normalize('NFC').replace(/[<>:"/\\|?*\p{Cc}]/gu, '-').trim()).slice(0, 80).join('').replace(/[. ]+$/, '') || 'Projet'
  return /^(con|prn|aux|nul|com[1-9¹²³]|lpt[1-9¹²³])(?:\.|$)/i.test(clean) ? `_${clean}` : clean
}

/**
 * Enregistre le projet. Application de bureau : dans son fichier .avd s'il en a un (créé avec le projet,
 * ouvert, ou déjà enregistré), sans fenêtre ; sinon, ou avec as = true (Enregistrer sous), la fenêtre
 * d'enregistrement propose le dossier choisi et le fichier devient celui du projet.
 */
// Les enregistrements manuels sont ordonnés : une écriture lente ne peut pas écraser une plus récente.
let saving: Promise<unknown> = Promise.resolve()
export function saveProjectFile(project: Project, opts: { as?: boolean } = {}): Promise<boolean> {
  const result = saving.catch(() => {}).then(() => writeProjectFile(project, opts))
  saving = result
  return result
}

async function writeProjectFile(project: Project, opts: { as?: boolean }): Promise<boolean> {
  const content = JSON.stringify(project, null, 2)
  const known = useSaveFolder.getState().projectFiles[project.id]
  if (isTauri()) {
    const { save } = await import('@tauri-apps/plugin-dialog')
    const { writeTextFile } = await import('@tauri-apps/plugin-fs')
    let path: string | null = !opts.as && known ? known : null
    if (!path) path = await save({ defaultPath: known ?? (await inSaveFolder(`${slug(project.name)}.avd`)), filters: [FILTERS.avd] })
    if (!path) return false
    try {
      await writeTextFile(path, content)
    } catch (e) {
      // Fichier déplacé ou disque retiré : on redemande l'emplacement
      if (opts.as || path !== known) throw e
      return writeProjectFile(project, { as: true })
    }
    useSaveFolder.getState().setProjectFile(project.id, path)
    useSaveFolder.getState().markSavedToFile(project.id)
    useProject.getState().markSaved(project)
    return true
  }
  const ok = await saveContent(`${slug(project.name)}.avd`, content, 'application/json')
  if (ok) {
    useSaveFolder.getState().markSavedToFile(project.id)
    useProject.getState().markSaved(project)
  }
  return ok
}

/**
 * Nouveau projet : <dossier choisi>/<nom du projet>/<nom-du-projet>.avd et Save Back Up/.
 * Un suffixe réserve un nouveau dossier si le nom existe déjà ; aucun contenu existant n'est réutilisé.
 * Renvoie le chemin du fichier, ou null hors de l'application de bureau.
 */
export async function createProjectFile(project: Project, folder: string): Promise<string | null> {
  if (!isTauri()) return null
  const { join } = await import('@tauri-apps/api/path')
  const { exists, mkdir, writeTextFile } = await import('@tauri-apps/plugin-fs')
  const base = projectFolderName(project.name)
  let dir: string
  let suffix: number
  for (let n = 1; ; n++) {
    dir = await join(folder, n === 1 ? base : `${base} (${n})`)
    if (await exists(dir)) continue
    try {
      // mkdir non récursif réserve le nom, même si un autre poste le crée entre-temps.
      await mkdir(dir)
      suffix = n
      break
    } catch (e) {
      if (await exists(dir)) continue
      throw e
    }
  }
  await mkdir(await join(dir, BACKUP_DIR))
  const path = await join(dir, `${slug(base)}.avd`)
  await writeTextFile(path, JSON.stringify(project, null, 2))
  const st = useSaveFolder.getState()
  st.setProjectFile(project.id, path)
  st.markSavedToFile(project.id)
  if (!st.dir) st.setDir(folder)
  if (suffix > 1) {
    const { message } = await import('@tauri-apps/plugin-dialog')
    await message(i18n.t('newProject.duplicateFolder', { folder: dir }), { title: 'AV Diagram', kind: 'info' }).catch(console.error)
  }
  return path
}

function parseProject(text: string): Project {
  const data: unknown = JSON.parse(text)
  if (!isProject(data)) throw new Error('invalid')
  return data
}

const xmlEscape = (s: string) => s.replace(/[<>&"']/g, (c) => `&#${c.charCodeAt(0)};`)

/** Ajoute au SVG le filigrane (mêmes réglages que le PDF), au-dessus du schéma. */
export function svgWatermark(svg: string, text: string, ws: WatermarkSettings, width: number, height: number): string {
  const anchor = { center: 'middle', left: 'start', right: 'end' } as const
  const items = watermarkLayout(width, height, text, ws.placement, ws.size).map(
    (it) =>
      `<text x="${it.x.toFixed(1)}" y="${it.y.toFixed(1)}" font-size="${it.size.toFixed(1)}" text-anchor="${anchor[it.align]}"` +
      (it.angle ? ` transform="rotate(${-it.angle} ${it.x.toFixed(1)} ${it.y.toFixed(1)})"` : '') +
      `>${xmlEscape(text)}</text>`,
  )
  const layer =
    `<g fill="${xmlEscape(ws.color)}" fill-opacity="${ws.opacity}" font-family="Helvetica, Arial, sans-serif" ` +
    `font-weight="600" pointer-events="none">${items.join('')}</g>`
  const end = svg.lastIndexOf('</svg>')
  return end < 0 ? svg : svg.slice(0, end) + layer + svg.slice(end)
}

/** Ouvre un fichier .avd. Renvoie null si l'utilisateur annule, lève une erreur si le fichier est invalide. */
export async function openProjectFile(rememberPath = true): Promise<Project | null> {
  if (isTauri()) {
    const { open } = await import('@tauri-apps/plugin-dialog')
    const path = await open({ multiple: false, directory: false, filters: [FILTERS.avd], defaultPath: useSaveFolder.getState().dir ?? undefined })
    if (!path) return null
    const p = await readProjectFile(path)
    // Ctrl+S enregistrera ensuite dans ce fichier
    if (rememberPath) useSaveFolder.getState().setProjectFile(p.id, path)
    return p
  }
  return new Promise((resolve, reject) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.avd,application/json'
    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file) return resolve(null)
      try {
        resolve(parseProject(await file.text()))
      } catch {
        reject(new Error('invalid'))
      }
    }
    input.click()
  })
}

const cableName = (id?: string) => {
  const c = getCable(id)
  return c ? (c.reference ? `${c.label} (${c.reference})` : c.label) : ''
}

/** Échappe une valeur CSV (séparateur point-virgule, lisible par Excel en français). */
const csvCell = (v: string | number | undefined) => `"${String(v ?? '').replace(/"/g, '""')}"`

export function cableListCsv(project: Project, headers: string[]): string {
  const rows = Object.values(project.links)
    .sort((a, b) => a.label.localeCompare(b.label))
    .map((l) => {
      const se = project.equipment[l.source.equipmentId]
      const te = project.equipment[l.target.equipmentId]
      const sp = findPort(project, l.source)
      const tp = findPort(project, l.target)
      return [
        l.label,
        sp?.signal,
        `${se?.name} / ${sp?.name}`,
        `${te?.name} / ${tp?.name}`,
        `${sp ? connectorLabel(sp.connector) : ''} > ${tp ? connectorLabel(tp.connector) : ''}`,
        l.multicoreId && project.multicores?.[l.multicoreId] ? `${project.multicores[l.multicoreId].label} / ${l.pair ?? '?'}` : cableName(l.cableTypeId),
        l.lengthM,
      ]
    })
  // BOM UTF-8 pour que les accents s'affichent correctement dans Excel
  return '﻿' + [headers, ...rows].map((r) => r.map(csvCell).join(';')).join('\r\n')
}

export function exportCableCsv(project: Project, headers: string[]) {
  return saveContent(`${slug(project.name)}-cablage.csv`, cableListCsv(project, headers), 'text/csv')
}

/** Exporte la vue du canevas (sans les contrôles) en PNG ou SVG. */
export async function exportCanvasImage(project: Project, format: 'png' | 'svg') {
  if (useUi.getState().view === 'plan') {
    const { planSvg } = await import('./planExport')
    const { default: i18n } = await import('../i18n')
    let svg = planSvg(project, useUi.getState().currentSheetId, i18n.t('plan.unknownSize'))
    const ex = exportSettingsOf(project)
    const width = Number(/width="([\d.]+)"/.exec(svg)?.[1])
    const height = Number(/height="([\d.]+)"/.exec(svg)?.[1])
    if (ex.watermark.enabled && ex.watermark.images) svg = svgWatermark(svg, watermarkText(ex.watermark.text, project), ex.watermark, width, height)
    const name = `${slug(project.name)}-plan.${format}`
    if (format === 'svg') return saveContent(name, svg, 'image/svg+xml')
    const image = new Image()
    const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }))
    try {
      await new Promise<void>((resolve, reject) => { image.onload = () => resolve(); image.onerror = () => reject(new Error(i18n.t('pdf.error'))); image.src = url })
      const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height
      const ctx = canvas.getContext('2d'); if (!ctx) throw new Error(i18n.t('pdf.error'))
      ctx.drawImage(image, 0, 0)
      return saveContent(name, dataUrlToBytes(canvas.toDataURL('image/png')), 'image/png')
    } finally { URL.revokeObjectURL(url) }
  }
  const el = document.querySelector<HTMLElement>('.react-flow')
  if (!el) return
  const bg = getComputedStyle(document.documentElement).getPropertyValue('--canvas').trim()
  const filter = (node: HTMLElement) =>
    !['react-flow__minimap', 'react-flow__controls', 'react-flow__attribution', 'react-flow__background', 'page-grid', 'eq-port-tools'].some(c => node.classList?.contains(c))
  const opts = { backgroundColor: bg, filter, pixelRatio: 2 }
  const name = `${slug(project.name)}.${format}`
  // Filigrane de l'export PDF, appliqué aussi aux images
  const ex = exportSettingsOf(project)
  const mark = ex.watermark.enabled && ex.watermark.images ? watermarkText(ex.watermark.text, project) : ''
  if (format === 'png') {
    const png = await toPng(el, opts)
    const { burnWatermark } = await import('./pdf')
    return saveContent(name, dataUrlToBytes(mark ? await burnWatermark(png, mark, ex.watermark, 'image/png') : png), 'image/png')
  }
  const svg = decodeURIComponent((await toSvg(el, opts)).split(',')[1] ?? '')
  return saveContent(name, mark ? svgWatermark(svg, mark, ex.watermark, el.clientWidth, el.clientHeight) : svg, 'image/svg+xml')
}

/** Lit le fichier principal d'un raccourci récent, sans le remplacer par la récupération locale. */
export async function readProjectFile(path: string): Promise<Project> {
  const { readTextFile } = await import('@tauri-apps/plugin-fs')
  return parseProject(await readTextFile(path))
}
