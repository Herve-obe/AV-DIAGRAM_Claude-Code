// Champs de formulaire partagés : la valeur est validée par Entrée ou à la sortie du champ (un seul pas
// d'annulation) ; Échap abandonne la saisie.
import { useEffect, useRef, useState } from 'react'

/** Champ texte ou nombre validé à la sortie du champ (un seul pas d'annulation par saisie). */
export function Field(props: {
  id: string
  label: string
  value: string | number | undefined
  type?: 'text' | 'number'
  multiline?: boolean
  onCommit: (v: string) => void
}) {
  const { id, label, value, type = 'text', multiline, onCommit } = props
  const [draft, setDraft] = useState(String(value ?? ''))
  useEffect(() => setDraft(String(value ?? '')), [value])
  // Échap : on abandonne la saisie (la sortie du champ qui suit ne valide rien)
  const cancelled = useRef(false)
  const commit = () => {
    if (cancelled.current) { cancelled.current = false; setDraft(String(value ?? '')); return }
    if (draft !== String(value ?? '')) onCommit(draft)
  }
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {multiline ? (
        <textarea id={id} value={draft} rows={3} onChange={(e) => setDraft(e.target.value)} onBlur={commit} />
      ) : (
        <input
          id={id}
          type={type}
          value={draft}
          step="any"
          min={type === 'number' ? 0 : undefined}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Escape') { e.stopPropagation(); cancelled.current = true }
            if (e.key === 'Enter' || e.key === 'Escape') (e.target as HTMLInputElement).blur()
          }}
        />
      )}
    </div>
  )
}

export const toNumber = (v: string) => (v.trim() === '' ? undefined : Math.max(0, Number(v.replace(',', '.'))) || 0)

