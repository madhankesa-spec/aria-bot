import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { resources } from './translations'

const saved = typeof window !== 'undefined' ? window.localStorage.getItem('aria_lang') : null

i18n.use(initReactI18next).init({
  resources,
  lng: saved || 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
})

export default i18n
