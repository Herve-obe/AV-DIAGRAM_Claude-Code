import { useEffect, useRef, useState, type ReactNode } from 'react'

export interface MenuCommand { id: string; label: string; hint?: string; disabled?: boolean; section?: string; run: () => void }
export interface CommandMenu { id: string; label: string; commands: MenuCommand[] }

/** Navigation clavier sans sous-menus : flèches, Début/Fin, Entrée, Échap et Tab. */
export function MenuBar({ label, menus }: { label: string; menus: CommandMenu[] }) {
  const [open, setOpen] = useState<number | null>(null)
  const [active, setActive] = useState(0)
  const root = useRef<HTMLElement>(null)
  const initial = useRef<'first' | 'last'>('first')
  const trigger = (i: number) => root.current?.querySelector<HTMLButtonElement>(`#app-menu-${menus[i].id}`)
  const close = (restore = false) => { if (restore && open !== null) trigger(open)?.focus(); setOpen(null) }

  useEffect(() => {
    if (open === null) return
    const buttons = Array.from(root.current?.querySelectorAll<HTMLButtonElement>('[role="menu"] button:not(:disabled)') ?? [])
    ;(buttons[initial.current === 'last' ? buttons.length - 1 : 0] ?? root.current?.querySelector<HTMLElement>('[role="menu"]'))?.focus()
    const outside = (e: MouseEvent) => { if (!root.current?.contains(e.target as Node)) setOpen(null) }
    window.addEventListener('mousedown', outside)
    return () => window.removeEventListener('mousedown', outside)
  }, [open])

  const show = (i: number, last = false) => { initial.current = last ? 'last' : 'first'; setActive(i); setOpen(i) }
  const move = (i: number, delta: number) => (i + delta + menus.length) % menus.length
  return <nav className="app-menubar" role="menubar" aria-label={label} ref={root}
    onBlur={e => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setOpen(null) }}>
    {menus.map((menu, i) => <div className="menu" key={menu.id}>
      <button id={`app-menu-${menu.id}`} role="menuitem" className="menu-title" tabIndex={active === i ? 0 : -1}
        aria-haspopup="menu" aria-expanded={open === i} aria-controls={open === i ? `app-popup-${menu.id}` : undefined}
        onFocus={() => setActive(i)} onClick={() => open === i ? close() : show(i)}
        onKeyDown={e => {
          if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) {
            e.preventDefault(); const next = e.key === 'Home' ? 0 : e.key === 'End' ? menus.length - 1 : move(i, e.key === 'ArrowLeft' ? -1 : 1)
            setActive(next); trigger(next)?.focus(); if (open !== null) show(next)
          }
          if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); show(i, e.key === 'ArrowUp') }
          if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(true) }
        }}>{menu.label}</button>
      {open === i && <div className="menu-pop app-menu-pop" id={`app-popup-${menu.id}`} role="menu" tabIndex={-1} aria-labelledby={`app-menu-${menu.id}`}
        onKeyDown={e => {
          if (!e.ctrlKey && !e.metaKey && !e.altKey) e.stopPropagation()
          if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(true) }
          if (e.key === 'Tab') close(true)
          if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); show(move(i, e.key === 'ArrowLeft' ? -1 : 1)) }
          if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(e.key)) {
            e.preventDefault()
            const buttons = Array.from(e.currentTarget.querySelectorAll<HTMLButtonElement>('button:not(:disabled)'))
            const index = buttons.indexOf(document.activeElement as HTMLButtonElement)
            const next = e.key === 'Home' ? 0 : e.key === 'End' ? buttons.length - 1 : (index + (e.key === 'ArrowUp' ? -1 : 1) + buttons.length) % buttons.length
            buttons[next]?.focus()
          }
        }}>
        {menu.commands.flatMap((command, index) => {
          const row: ReactNode[] = []
          if (index && command.section !== menu.commands[index - 1].section) row.push(<hr role="separator" key={`sep-${command.id}`} />)
          row.push(<button key={command.id} role="menuitem" tabIndex={-1} disabled={command.disabled} onClick={() => { close(true); command.run() }}>
            <span>{command.label}</span>{command.hint && <kbd>{command.hint}</kbd>}
          </button>)
          return row
        })}
      </div>}
    </div>)}
  </nav>
}
