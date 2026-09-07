import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from './locales/en.json'
import es from './locales/es.json'

export const LOCALES = [
  { code: 'en', nameKey: 'language.en' },
  { code: 'es', nameKey: 'language.es' },
]

const STORAGE_KEY = 'flashcards.locale'

export function normalizeLocale(value) {
  if (!value) {
    return 'en'
  }
  const normalized = String(value).trim().toLowerCase()
  if (normalized === 'es' || normalized.startsWith('es-')) {
    return 'es'
  }
  return 'en'
}

export function detectLocale() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      return normalizeLocale(saved)
    }
  } catch {
    // localStorage can be unavailable in some WebViews
  }
  const nav = typeof navigator !== 'undefined' ? navigator.language : ''
  return normalizeLocale(nav)
}

export function persistLocale(code) {
  const locale = normalizeLocale(code)
  try {
    localStorage.setItem(STORAGE_KEY, locale)
  } catch {
    // ignore
  }
  if (typeof document !== 'undefined') {
    document.documentElement.lang = locale
  }
}

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    es: { translation: es },
  },
  lng: detectLocale(),
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
})

persistLocale(i18n.language)

i18n.on('languageChanged', persistLocale)

export function applyLocale(code) {
  const locale = normalizeLocale(code)
  persistLocale(locale)
  if (i18n.resolvedLanguage !== locale) {
    return i18n.changeLanguage(locale)
  }
  return Promise.resolve()
}

export default i18n
