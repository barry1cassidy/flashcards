import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { getToken } from '../api'

export const LOCALES = [
  { code: 'en', bcp47: 'en-US', nativeName: 'English' },
  { code: 'zh', bcp47: 'zh-CN', nativeName: '中文' },
  { code: 'hi', bcp47: 'hi-IN', nativeName: 'हिन्दी' },
  { code: 'es', bcp47: 'es-ES', nativeName: 'Español' },
  { code: 'ar', bcp47: 'ar-SA', nativeName: 'العربية' },
  { code: 'fr', bcp47: 'fr-FR', nativeName: 'Français' },
  { code: 'bn', bcp47: 'bn-IN', nativeName: 'বাংলা' },
  { code: 'pt', bcp47: 'pt-BR', nativeName: 'Português' },
  { code: 'ru', bcp47: 'ru-RU', nativeName: 'Русский' },
  { code: 'id', bcp47: 'id-ID', nativeName: 'Bahasa Indonesia' },
  { code: 'de', bcp47: 'de-DE', nativeName: 'Deutsch' },
  { code: 'ja', bcp47: 'ja-JP', nativeName: '日本語' },
  { code: 'tr', bcp47: 'tr-TR', nativeName: 'Türkçe' },
  { code: 'vi', bcp47: 'vi-VN', nativeName: 'Tiếng Việt' },
  { code: 'ko', bcp47: 'ko-KR', nativeName: '한국어' },
  { code: 'it', bcp47: 'it-IT', nativeName: 'Italiano' },
  { code: 'th', bcp47: 'th-TH', nativeName: 'ไทย' },
  { code: 'pl', bcp47: 'pl-PL', nativeName: 'Polski' },
  { code: 'nl', bcp47: 'nl-NL', nativeName: 'Nederlands' },
  { code: 'uk', bcp47: 'uk-UA', nativeName: 'Українська' },
]

const LOCALE_CODES = new Set(LOCALES.map((locale) => locale.code))
const STORAGE_KEY = 'flashcards.locale'
const localeModules = import.meta.glob('./locales/*.json', { eager: true, import: 'default' })

const resources = Object.fromEntries(
  LOCALES.map((locale) => {
    const translation = localeModules[`./locales/${locale.code}.json`] || localeModules['./locales/en.json']
    return [locale.code, { translation }]
  }),
)

export function normalizeLocale(value, fallback = 'en') {
  if (!value) {
    return fallback
  }
  const normalized = String(value).trim().toLowerCase().replaceAll('_', '-')
  if (LOCALE_CODES.has(normalized)) {
    return normalized
  }
  const prefix = normalized.split('-')[0]
  if (LOCALE_CODES.has(prefix)) {
    return prefix
  }
  return fallback
}

export function deviceLocale() {
  const candidates = []
  if (typeof navigator !== 'undefined') {
    if (Array.isArray(navigator.languages)) {
      candidates.push(...navigator.languages)
    }
    if (navigator.language) {
      candidates.push(navigator.language)
    }
  }
  for (const candidate of candidates) {
    const match = normalizeLocale(candidate, '')
    if (match) {
      return match
    }
  }
  return 'en'
}

export function detectLocale() {
  if (getToken()) {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        return normalizeLocale(saved)
      }
    } catch {
      // localStorage can be unavailable in some WebViews
    }
  }
  return deviceLocale()
}

export function localeBcp47(code = detectLocale()) {
  const locale = LOCALES.find((item) => item.code === normalizeLocale(code))
  return locale?.bcp47 || 'en-US'
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
    document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr'
  }
}

i18n.use(initReactI18next).init({
  resources,
  lng: detectLocale(),
  fallbackLng: 'en',
  supportedLngs: LOCALES.map((locale) => locale.code),
  interpolation: { escapeValue: false },
})

persistLocale(i18n.language)

i18n.on('languageChanged', persistLocale)

export function currentLocale() {
  return normalizeLocale(i18n.resolvedLanguage || i18n.language)
}

export function applyLocale(code) {
  const locale = normalizeLocale(code)
  persistLocale(locale)
  if (currentLocale() !== locale) {
    return i18n.changeLanguage(locale)
  }
  return Promise.resolve()
}

export default i18n
