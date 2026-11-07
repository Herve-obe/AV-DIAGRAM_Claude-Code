// Fenêtre « Infos » du double écran : inspecteur et listes (câblage, multipaires, nomenclature,
// alertes) du projet ouvert dans la fenêtre principale, synchronisés avec elle.
import { useTranslation } from 'react-i18next'
import { ReactFlowProvider } from '@xyflow/react'
import { Shortcuts } from './App'
import { closePanelsWindow } from './store/windowSync'
import { useProject } from './store/projectStore'
import { useUi } from './store/uiStore'
import { Dock } from './ui/Dock'
import { Icon } from './ui/Icon'
import { Inspector } from './ui/Inspector'
import { LinkCheckDialog } from './ui/LinkCheckDialog'
import { SeriesDialog } from './ui/SeriesDialog'
import { Splitter } from './ui/Splitter'

export default function PanelsApp() {
  const { t } = useTranslation()
  const name = useProject((s) => s.project.name)
  const mode = useUi((s) => s.mode)
  const panels = useUi((s) => s.panels)
  return (
    <ReactFlowProvider>
      <Shortcuts />
      <div className={`app panels-app mode-${mode}`} style={{ '--insp-w': `${panels.inspector}px` } as React.CSSProperties}>
        <header className="panels-bar">
          <span className="brand-mini">AV Diagram</span>
          <span className="panels-title">{name} · {t('dual.panelsTitle')}</span>
          <span className="spacer" />
          <button className="btn" onClick={() => void closePanelsWindow()}><Icon name="close" size={14} />{t('dual.close')}</button>
        </header>
        <div className="panels-body">
          <Inspector />
          <div className="panels-dock"><Dock /></div>
          <Splitter panel="inspector" />
        </div>
      </div>
      <SeriesDialog />
      <LinkCheckDialog />
    </ReactFlowProvider>
  )
}
