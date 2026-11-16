// Aides de test pour monter un composant React dans jsdom (sans testing-library) et simuler
// les gestes de l'utilisateur. À importer uniquement depuis des fichiers `*.test.tsx`.
import { act, type ReactNode } from 'react'
import { createRoot, type Root } from 'react-dom/client'

export interface Mounted {
  element: HTMLElement
  render: (node: ReactNode) => void
  unmount: () => void
}

/** Monte un composant dans le document ; `unmount()` retire tout. */
export function mount(node?: ReactNode): Mounted {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
  const element = document.createElement('div')
  document.body.append(element)
  const root: Root = createRoot(element)
  const render = (n: ReactNode) => act(() => root.render(n))
  if (node !== undefined) render(node)
  return { element, render, unmount: () => { act(() => root.unmount()); element.remove() } }
}

export const click = (el: Element) => act(() => (el as HTMLElement).click())

/** Saisit une valeur dans un champ React contrôlé (input, textarea ou select). */
export function typeInto(el: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement, value: string) {
  const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : el instanceof HTMLSelectElement ? HTMLSelectElement.prototype : HTMLInputElement.prototype
  act(() => {
    el.focus()
    Object.getOwnPropertyDescriptor(proto, 'value')!.set!.call(el, value)
    el.dispatchEvent(new Event(el instanceof HTMLSelectElement ? 'change' : 'input', { bubbles: true }))
  })
}

/** Quitte le champ (validation d'une saisie à la sortie) : le champ doit avoir le focus. */
export const blur = (el: Element) => act(() => { (el as HTMLElement).blur() })

export const press = (el: Element, key: string, init: KeyboardEventInit = {}) =>
  act(() => { el.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...init })) })

/** Premier bouton (ou élément de rôle bouton) dont le texte ou le nom accessible contient `text`. */
export function buttonByName(root: ParentNode, text: string): HTMLElement {
  const found = [...root.querySelectorAll<HTMLElement>('button, [role="button"], [role="tab"], [role="radio"], [role="menuitem"]')]
    .find(b => (b.getAttribute('aria-label') ?? b.textContent ?? '').includes(text))
  if (!found) throw new Error(`Bouton introuvable : ${text}`)
  return found
}
