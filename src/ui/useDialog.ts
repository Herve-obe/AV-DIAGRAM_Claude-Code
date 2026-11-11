// Comportement commun des dialogues modaux : Échap ferme, Tab et Maj+Tab restent dans le dialogue,
// le premier contrôle reçoit le focus à l'ouverture et l'élément qui l'avait le retrouve à la fermeture.
import { useEffect, useRef } from 'react'

const FOCUSABLE = 'button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), a[href], iframe, [tabindex]:not([tabindex="-1"])'

export interface DialogOptions {
  /**
   * Écoute en phase de capture et arrête Échap : le dialogue passe avant les raccourcis du canevas
   * et des autres dialogues (manuel ouvert par-dessus un autre dialogue).
   */
  capture?: boolean
}

/**
 * À appeler dans chaque dialogue, ouvert ou non ; poser la référence renvoyée sur l'élément
 * `role="dialog"`. `onClose` peut refuser de fermer (opération en cours) : il est lu à chaque touche.
 */
export function useDialog<T extends HTMLElement = HTMLDivElement>(open: boolean, onClose: () => void, options: DialogOptions = {}) {
  const ref = useRef<T>(null)
  const closeRef = useRef(onClose)
  closeRef.current = onClose
  const { capture = false } = options

  useEffect(() => {
    if (!open) return
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const controls = () => Array.from(ref.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? [])
    // Un champ avec autoFocus a déjà le focus : on ne le lui prend pas
    if (ref.current && !ref.current.contains(document.activeElement)) controls()[0]?.focus()

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (capture) e.stopPropagation()
        closeRef.current()
        return
      }
      if (e.key !== 'Tab' || !ref.current) return
      const list = controls(), first = list[0], last = list.at(-1)
      if (!first || !last) return
      const active = document.activeElement
      // Focus hors de tout dialogue (clic sur le fond) : on le ramène dans celui-ci
      if (!(active instanceof Element) || !active.closest('[aria-modal="true"]')) { e.preventDefault(); first.focus(); return }
      if (e.shiftKey && active === first) { e.preventDefault(); last.focus() }
      else if (!e.shiftKey && active === last) { e.preventDefault(); first.focus() }
    }
    window.addEventListener('keydown', onKey, capture)
    return () => {
      window.removeEventListener('keydown', onKey, capture)
      if (previous?.isConnected) previous.focus()
    }
  }, [open, capture])

  return ref
}
