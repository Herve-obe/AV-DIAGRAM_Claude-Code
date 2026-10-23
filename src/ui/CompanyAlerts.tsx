import { useTranslation } from 'react-i18next'
import { companyAlerts } from '../model/company'
import type { Project } from '../model/types'
import { useLibrary } from '../store/libraryStore'

export function CompanyAlerts({ project }: { project: Project }) {
  const { t } = useTranslation()
  const company = useLibrary(s => s.userTemplates)
  const alerts = companyAlerts(project, company)
  if (!alerts.length) return null
  return <section className="company-alerts" aria-label={t('company.alerts')} aria-live="polite">
    <h3 className="group-title">{t('company.alerts')}</h3>
    <ul>{alerts.map((a, i) => <li key={i}><strong>{a.name}{a.name && ' : '}{t(`company.${a.code}`, { required: a.required, quantity: a.quantity })}</strong><p className="field-hint">{t(`company.${a.code}Fix`)}</p></li>)}</ul>
  </section>
}
