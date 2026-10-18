import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { LIBRARY } from '../library'
import { moduleLinks } from '../model/modules'
import { uid } from '../model/project'
import type { Equipment } from '../model/types'
import { useLibrary } from '../store/libraryStore'
import { useProject } from '../store/projectStore'
import { useUi } from '../store/uiStore'
import { Field } from './Field'

export function ModuleEditor({ eq }: { eq: Equipment }) {
  const { t } = useTranslation()
  const project = useProject(s => s.project)
  const userTemplates = useLibrary(s => s.userTemplates)
  const expert = useUi(s => s.mode) === 'expert'
  const [name, setName] = useState('')
  const [type, setType] = useState('')
  const [confirm, setConfirm] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const store = useProject.getState()
  const templates = [...userTemplates, ...LIBRARY].filter(tpl => tpl.family === 'module')
  const result = (err: string | null) => setError(err ? t(`modules.error.${err}`) : null)
  if (eq.family === 'module') return <Field id="eq-module-type" label={t('modules.type')} value={eq.moduleType} onCommit={v => store.updateEquipment(eq.id, { moduleType: v.trim() || undefined })} />
  if (!expert && !eq.slots?.length && !eq.modules?.length) return null
  return (
    <details className="insp-section module-editor" open={eq.slots?.length ? true : undefined}>
      <summary>{t('modules.title')}</summary>
      <p className="dim small">{t('modules.hint')}</p>
      {(eq.slots ?? []).map(slot => {
        const module = eq.modules?.find(m => m.slotId === slot.id)
        const links = module ? moduleLinks(project, eq.id, module.id).length : 0
        const available = templates.filter(tpl => tpl.moduleType === slot.type)
        return (
          <div key={slot.id} className="module-slot">
            <strong>{slot.name}</strong> <span className="dim">{slot.type}</span>
            {module ? <>
              <div>{module.manufacturer} {module.model}</div>
              {module.type !== slot.type && <p role="alert">{t('modules.error.incompatible')}</p>}
              <button className="btn btn-danger" onClick={() => {
                if (links && confirm !== module.id) { setConfirm(module.id); return }
                result(store.removeModule(eq.id, module.id, links > 0))
                setConfirm(null)
              }}>{links && confirm === module.id ? t('modules.disconnect', { count: links }) : t('modules.remove')}</button>
              {confirm === module.id && <button className="btn btn-ghost" onClick={() => setConfirm(null)}>{t('modules.cancel')}</button>}
            </> : <>
              <select aria-label={t('modules.choose', { slot: slot.name })} value="" onChange={e => {
                const tpl = templates.find(tpl => tpl.id === e.target.value)
                if (tpl) result(store.installModule(eq.id, slot.id, tpl))
              }}>
                <option value="">{t('modules.choose', { slot: slot.name })}</option>
                {available.map(tpl => <option key={tpl.id} value={tpl.id}>{tpl.manufacturer} {tpl.model}</option>)}
              </select>
              {!available.length && <p className="dim small">{t('modules.noCompatible')}</p>}
              {expert && <button className="btn btn-ghost" onClick={() => store.updateEquipment(eq.id, { slots: eq.slots!.filter(s => s.id !== slot.id) })}>{t('modules.removeSlot')}</button>}
            </>}
          </div>
        )
      })}
      {expert && <form onSubmit={e => {
        e.preventDefault()
        if (!name.trim() || !type.trim()) return
        store.updateEquipment(eq.id, { slots: [...(eq.slots ?? []), { id: uid('slot'), name: name.trim(), type: type.trim() }] })
        setName('')
      }}>
        <label htmlFor="slot-name">{t('modules.slotName')}</label>
        <input id="slot-name" value={name} onChange={e => setName(e.target.value)} />
        <label htmlFor="slot-type">{t('modules.type')}</label>
        <input id="slot-type" value={type} onChange={e => setType(e.target.value)} />
        <button className="btn" disabled={!name.trim() || !type.trim()}>{t('modules.addSlot')}</button>
      </form>}
      {error && <p className="collab-error" role="alert">{error}</p>}
    </details>
  )
}
