// Traductions : français par défaut, anglais prévu dès le départ.
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import fr from './fr.json'
import en from './en.json'
import { useUi } from '../store/uiStore'

i18n.use(initReactI18next).init({
  resources: { fr: { translation: fr }, en: { translation: en } },
  lng: useUi.getState().lang,
  fallbackLng: 'fr',
  interpolation: { escapeValue: false },
})

useUi.subscribe((s, prev) => {
  if (s.lang !== prev.lang) {
    i18n.changeLanguage(s.lang)
    document.documentElement.lang = s.lang
  }
})

export default i18n
