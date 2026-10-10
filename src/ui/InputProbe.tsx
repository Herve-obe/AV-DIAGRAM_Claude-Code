// Diagnostic des entrées (Ctrl+Alt+D) : affiche en direct ce que l'application reçoit de la souris, du
// pavé tactile et de l'écran tactile (molette, Ctrl, gestes de pincement, contacts), pour savoir si un
// geste arrive jusqu'au logiciel ou s'il est arrêté avant (pilote, système).
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

interface Entry { at: number; text: string }

export function InputProbe() {
  const { t } = useTranslation()
  const [on, setOn] = useState(false)
  const [log, setLog] = useState<Entry[]>([])
  const [zoom, setZoom] = useState(1)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.altKey && e.key.toLowerCase() === 'd') { e.preventDefault(); setOn((v) => !v) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    if (!on) return
    const push = (text: string) => setLog((l) => [{ at: Date.now(), text }, ...l].slice(0, 12))
    const wheel = (e: WheelEvent) => push(`molette  Ctrl=${e.ctrlKey ? 'oui' : 'non'}  Maj=${e.shiftKey ? 'oui' : 'non'}  dx=${e.deltaX.toFixed(1)}  dy=${e.deltaY.toFixed(1)}  mode=${e.deltaMode}`)
    const gesture = (e: Event) => push(`${e.type}  échelle=${((e as Event & { scale?: number }).scale ?? 0).toFixed(3)}`)
    const touch = (e: TouchEvent) => push(`${e.type}  contacts=${e.touches.length}`)
    const pointer = (e: PointerEvent) => push(`${e.type}  type=${e.pointerType}`)
    const viewport = () => setZoom(window.visualViewport?.scale ?? 1)
    const opts = { capture: true, passive: true }
    window.addEventListener('wheel', wheel, opts)
    for (const g of ['gesturestart', 'gesturechange', 'gestureend']) window.addEventListener(g, gesture, opts)
    window.addEventListener('touchstart', touch, opts)
    window.addEventListener('pointerdown', pointer, opts)
    window.visualViewport?.addEventListener('resize', viewport)
    return () => {
      window.removeEventListener('wheel', wheel, opts)
      for (const g of ['gesturestart', 'gesturechange', 'gestureend']) window.removeEventListener(g, gesture, opts)
      window.removeEventListener('touchstart', touch, opts)
      window.removeEventListener('pointerdown', pointer, opts)
      window.visualViewport?.removeEventListener('resize', viewport)
    }
  }, [on])

  if (!on) return null
  return (
    <div className="input-probe" role="status">
      <div className="input-probe-head">
        <strong>{t('probe.title')}</strong>
        <span className="dim">{t('probe.hint')}</span>
        <button className="icon-btn small" onClick={() => setOn(false)} aria-label={t('settings.close')}>×</button>
      </div>
      <div className="mono small">{t('probe.pageZoom')} : {zoom.toFixed(2)}</div>
      <ol className="mono small">{log.map((e) => <li key={e.at + e.text}>{e.text}</li>)}</ol>
      {!log.length && <p className="dim small">{t('probe.empty')}</p>}
    </div>
  )
}
