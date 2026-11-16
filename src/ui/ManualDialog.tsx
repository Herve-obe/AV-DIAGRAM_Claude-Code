import { useTranslation } from 'react-i18next'
import { notifyError, saveContent } from '../io/files'
import { Icon } from './Icon'
import { useDialog } from './useDialog'
import { version } from '../../package.json'

/** anchor : chapitre à afficher à l'ouverture (ex. « chapitre-21 ») */
export function ManualDialog({ onClose, anchor }: { onClose: () => void; anchor?: string }) {
  const { t } = useTranslation()
  const dialogRef = useDialog<HTMLElement>(true, onClose, { capture: true })
  const download = async () => {
    try { const response=await fetch(new URL('manuel.pdf',document.baseURI));if(!response.ok)throw new Error('manual');await saveContent(`AV-Diagram_Manuel_${version}.pdf`,new Uint8Array(await response.arrayBuffer()),'application/pdf') }
    catch { await notifyError(t('manual.error')) }
  }
  return <div className="overlay" onMouseDown={e=>{if(e.target===e.currentTarget)onClose()}}><section className="dialog manual-dialog" ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="manual-title" onKeyDown={e=>e.stopPropagation()}>
    <header className="dialog-head"><h2 id="manual-title">{t('manual.title')}</h2><button className="icon-btn" autoFocus onClick={onClose} aria-label={t('settings.close')}><Icon name="close" /></button></header>
    <iframe title={t('manual.title')} src={anchor ? `manuel.html#${anchor}` : 'manuel.html'} onLoad={e=>e.currentTarget.contentWindow?.addEventListener('keydown',key=>{if(key.key==='Escape'){key.preventDefault();onClose()}})} />
    <footer className="dialog-foot"><span className="dialog-hint">{t('manual.offline')}</span><button className="btn" onClick={download}>{t('manual.download')}</button><button className="btn" onClick={onClose}>{t('settings.close')}</button></footer>
  </section></div>
}
