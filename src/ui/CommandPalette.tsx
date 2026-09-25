// Palette de commandes (Ctrl+K) : commandes et ajout rapide d'équipements.
import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useReactFlow } from '@xyflow/react'
import { LIBRARY } from '../library'
import { exportPdfWithLabels } from '../io/exportPdfUi'
import { groupSelected, ungroupSelected } from './groupActions'
import { startMerge } from './MergeDialog'
import { useProject } from '../store/projectStore'
import { useUi } from '../store/uiStore'

interface Command {
  id: string
  label: string
  hint?: string
  run: () => void
}

export function CommandPalette() {
  const { t } = useTranslation()
  const { paletteOpen, setPaletteOpen } = useUi()
  const rf = useReactFlow()
  const [query, setQuery] = useState('')
  const [index, setIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const commands = useMemo<Command[]>(() => {
    const ui = useUi.getState()
    const addAtCenter = (tplId: string) => {
      const tpl = LIBRARY.find((x) => x.id === tplId)
      const el = document.querySelector('.react-flow')?.getBoundingClientRect()
      if (!tpl || !el) return
      const pos = rf.screenToFlowPosition({ x: el.left + el.width / 2, y: el.top + el.height / 2 })
      ui.select([useProject.getState().addEquipment(tpl, pos, ui.currentSheetId)], [])
    }
    return [
      { id: 'all', label: t('palette.showAll'), hint: 'Alt 0', run: () => ui.showOnly(null) },
      { id: 'audio', label: t('palette.showAudio'), hint: 'Alt 1', run: () => ui.showOnly(['audioAnalog', 'audioDigital', 'audioIp']) },
      { id: 'video', label: t('palette.showVideo'), hint: 'Alt 2', run: () => ui.showOnly(['video', 'videoIp']) },
      { id: 'net', label: t('palette.showNetwork'), hint: 'Alt 3', run: () => ui.showOnly(['network', 'audioIp', 'videoIp', 'sync']) },
      { id: 'issues', label: t('palette.issues'), run: () => ui.setDockTab('issues') },
      { id: 'new', label: t('palette.newProject'), run: () => ui.setNewProjectOpen(true) },
      { id: 'merge', label: t('merge.menu'), run: () => startMerge(t) },
      { id: 'settings', label: t('palette.settings'), run: () => ui.setSettingsOpen(true) },
      { id: 'present', label: t('presentation.enter'), hint: 'F5', run: () => ui.setPresenting(true) },
      { id: 'pdf', label: t('palette.exportPdf'), run: () => exportPdfWithLabels(rf, t) },
      { id: 'group', label: t('groups.group'), hint: 'Ctrl G', run: () => groupSelected() },
      { id: 'ungroup', label: t('groups.ungroup'), hint: 'Ctrl Maj G', run: () => ungroupSelected() },
      { id: 'renumber', label: t('palette.renumber'), run: () => useProject.getState().renumber() },
      { id: 'fit', label: t('palette.fit'), hint: 'F', run: () => rf.fitView({ duration: 300, padding: 0.15 }) },
      { id: 'mode', label: t('palette.toggleMode'), run: () => ui.setPref('mode', ui.mode === 'expert' ? 'beginner' : 'expert') },
      { id: 'theme', label: t('palette.toggleTheme'), run: () => ui.setPref('theme', ui.theme === 'light' ? 'dark' : 'light') },
      { id: 'lang', label: t('palette.toggleLang'), run: () => ui.setPref('lang', ui.lang === 'fr' ? 'en' : 'fr') },
      ...LIBRARY.map((tpl) => ({ id: `add-${tpl.id}`, label: t('palette.add', { name: tpl.model }), run: () => addAtCenter(tpl.id) })),
    ]
  }, [t, rf])

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    return (q ? commands.filter((c) => c.label.toLowerCase().includes(q)) : commands).slice(0, 12)
  }, [commands, query])

  useEffect(() => {
    if (paletteOpen) {
      setQuery('')
      setIndex(0)
      requestAnimationFrame(() => inputRef.current?.focus())
    }
  }, [paletteOpen])

  if (!paletteOpen) return null
  const run = (c?: Command) => {
    if (!c) return
    setPaletteOpen(false)
    c.run()
  }

  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && setPaletteOpen(false)}>
      <div className="palette" role="dialog" aria-label={t('menu.search')}>
        <input
          ref={inputRef}
          id="palette-input"
          value={query}
          placeholder={t('palette.placeholder')}
          onChange={(e) => { setQuery(e.target.value); setIndex(0) }}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') { e.preventDefault(); setIndex((i) => Math.min(i + 1, results.length - 1)) }
            if (e.key === 'ArrowUp') { e.preventDefault(); setIndex((i) => Math.max(i - 1, 0)) }
            if (e.key === 'Enter') run(results[index])
            if (e.key === 'Escape') setPaletteOpen(false)
          }}
          aria-label={t('palette.placeholder')}
        />
        <ul role="listbox">
          {results.length === 0 && <li className="empty">{t('palette.none')}</li>}
          {results.map((c, i) => (
            <li key={c.id} role="option" aria-selected={i === index} onMouseEnter={() => setIndex(i)} onClick={() => run(c)}>
              {c.label}
              {c.hint && <kbd>{c.hint}</kbd>}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
