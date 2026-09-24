// Fichiers : enregistrement et ouverture du format natif .avd (JSON), exports image et CSV.
import { toPng, toSvg } from 'html-to-image'
import { connectorLabel } from '../model/connectors'
import { findPort } from '../model/rules'
import { isProject } from '../model/project'
import type { Project } from '../model/types'

function download(filename: string, href: string) {
  const a = document.createElement('a')
  a.href = href
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
}

function downloadBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob)
  download(filename, url)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/** Nom de fichier sûr à partir du nom de projet. */
export function slug(name: string): string {
  return name.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '').toLowerCase() || 'projet'
}

export function saveProjectFile(project: Project) {
  downloadBlob(`${slug(project.name)}.avd`, new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' }))
}

export function openProjectFile(): Promise<Project | null> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.avd,application/json'
    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file) return resolve(null)
      try {
        const data: unknown = JSON.parse(await file.text())
        if (isProject(data)) resolve(data)
        else reject(new Error('invalid'))
      } catch {
        reject(new Error('invalid'))
      }
    }
    input.click()
  })
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
        l.lengthM,
      ]
    })
  // BOM UTF-8 pour que les accents s'affichent correctement dans Excel
  return '﻿' + [headers, ...rows].map((r) => r.map(csvCell).join(';')).join('\r\n')
}

export function exportCableCsv(project: Project, headers: string[]) {
  downloadBlob(`${slug(project.name)}-cablage.csv`, new Blob([cableListCsv(project, headers)], { type: 'text/csv' }))
}

/** Exporte la vue du canevas (sans les contrôles) en PNG ou SVG. */
export async function exportCanvasImage(project: Project, format: 'png' | 'svg') {
  const el = document.querySelector<HTMLElement>('.react-flow')
  if (!el) return
  const bg = getComputedStyle(document.documentElement).getPropertyValue('--canvas').trim()
  const filter = (node: HTMLElement) =>
    !node.classList?.contains('react-flow__minimap') && !node.classList?.contains('react-flow__controls') && !node.classList?.contains('react-flow__attribution')
  const opts = { backgroundColor: bg, filter, pixelRatio: 2 }
  const url = format === 'png' ? await toPng(el, opts) : await toSvg(el, opts)
  download(`${slug(project.name)}.${format}`, url)
}
