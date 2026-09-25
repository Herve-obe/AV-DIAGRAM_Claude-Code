// Fichiers : enregistrement et ouverture du format natif .avd (JSON), exports image et CSV.
// Dans l'application bureau (Tauri), on utilise les fenêtres natives du système ;
// dans un navigateur (développement), on retombe sur le téléchargement classique.
import { isTauri } from '@tauri-apps/api/core'
import { toPng, toSvg } from 'html-to-image'
import { getCable } from '../model/cables'
import { connectorLabel } from '../model/connectors'
import { findPort } from '../model/rules'
import { isProject } from '../model/project'
import type { Project } from '../model/types'

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
    const path = await save({ defaultPath: filename, filters: FILTERS[ext] ? [FILTERS[ext]] : [] })
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

export function saveProjectFile(project: Project): Promise<boolean> {
  return saveContent(`${slug(project.name)}.avd`, JSON.stringify(project, null, 2), 'application/json')
}

function parseProject(text: string): Project {
  const data: unknown = JSON.parse(text)
  if (!isProject(data)) throw new Error('invalid')
  return data
}

/** Ouvre un fichier .avd. Renvoie null si l'utilisateur annule, lève une erreur si le fichier est invalide. */
export async function openProjectFile(): Promise<Project | null> {
  if (isTauri()) {
    const { open } = await import('@tauri-apps/plugin-dialog')
    const { readTextFile } = await import('@tauri-apps/plugin-fs')
    const path = await open({ multiple: false, directory: false, filters: [FILTERS.avd] })
    if (!path) return null
    return parseProject(await readTextFile(path))
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
        cableName(l.cableTypeId),
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
  const el = document.querySelector<HTMLElement>('.react-flow')
  if (!el) return
  const bg = getComputedStyle(document.documentElement).getPropertyValue('--canvas').trim()
  const filter = (node: HTMLElement) =>
    !node.classList?.contains('react-flow__minimap') && !node.classList?.contains('react-flow__controls') && !node.classList?.contains('react-flow__attribution')
  const opts = { backgroundColor: bg, filter, pixelRatio: 2 }
  const name = `${slug(project.name)}.${format}`
  if (format === 'png') return saveContent(name, dataUrlToBytes(await toPng(el, opts)), 'image/png')
  const svg = decodeURIComponent((await toSvg(el, opts)).split(',')[1] ?? '')
  return saveContent(name, svg, 'image/svg+xml')
}
