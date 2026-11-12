// Séparateurs redimensionnables : bibliothèque, inspecteur, panneau du bas. Glisser pour régler,
// double-clic pour revenir à la taille par défaut ; tailles gardées sur ce poste.
import { useTranslation } from 'react-i18next'
import { DEFAULT_PANELS, PANEL_LIMITS, useUi, type PanelSizes } from '../store/uiStore'

const clamp = (k: keyof PanelSizes, v: number) => Math.round(Math.max(PANEL_LIMITS[k][0], Math.min(PANEL_LIMITS[k][1], v)))

/** Variable CSS posée par App.tsx sur la racine `.app`, lue par la grille et le panneau du bas. */
const CSS_VAR: Record<keyof PanelSizes, string> = { library: '--lib-w', inspector: '--insp-w', dock: '--dock-h' }

export function Splitter({ panel }: { panel: keyof PanelSizes }) {
  const { t } = useTranslation()
  const vertical = panel !== 'dock'
  const onPointerDown = (e: React.PointerEvent) => {
    e.preventDefault()
    const el = e.currentTarget as HTMLElement
    el.setPointerCapture(e.pointerId)
    const start = { x: e.clientX, y: e.clientY, size: useUi.getState().panels[panel] }
    let size = start.size
    // Pendant le glissement, seule la variable CSS change : aucun composant abonné au store ne se
    // redessine. Le store (et la préférence enregistrée) ne reçoit la taille qu'au lâcher.
    const host = el.closest<HTMLElement>('.app')
    const hadVar = !!host?.style.getPropertyValue(CSS_VAR[panel])
    document.body.classList.add(vertical ? 'is-resizing-x' : 'is-resizing-y')
    const move = (ev: PointerEvent) => {
      // Bibliothèque : vers la droite agrandit ; inspecteur : vers la gauche ; panneau du bas : vers le haut
      const delta = panel === 'library' ? ev.clientX - start.x : panel === 'inspector' ? start.x - ev.clientX : start.y - ev.clientY
      size = clamp(panel, start.size + delta)
      if (host) host.style.setProperty(CSS_VAR[panel], `${size}px`)
      else useUi.setState({ panels: { ...useUi.getState().panels, [panel]: size } })
    }
    const up = () => {
      el.removeEventListener('pointermove', move)
      el.removeEventListener('pointerup', up)
      el.removeEventListener('pointercancel', up)
      document.body.classList.remove('is-resizing-x', 'is-resizing-y')
      // Variable absente avant le geste : on la retire, le rendu suivant reprend la valeur du store
      if (host && !hadVar) host.style.removeProperty(CSS_VAR[panel])
      const ui = useUi.getState()
      ui.setPref('panels', { ...ui.panels, [panel]: size })
    }
    el.addEventListener('pointermove', move)
    el.addEventListener('pointerup', up)
    el.addEventListener('pointercancel', up)
  }
  const reset = () => {
    const ui = useUi.getState()
    ui.setPref('panels', { ...ui.panels, [panel]: DEFAULT_PANELS[panel] })
  }
  return (
    <div
      className={`splitter splitter-${panel}`}
      role="separator"
      aria-orientation={vertical ? 'vertical' : 'horizontal'}
      title={t('panels.resize')}
      onPointerDown={onPointerDown}
      onDoubleClick={reset}
    />
  )
}
