export const SPEECH_LANGUAGES = [
  { code: 'en-US', name: 'English' },
  { code: 'zh-CN', name: '中文（简体）' },
  { code: 'hi-IN', name: 'हिन्दी' },
  { code: 'es-ES', name: 'Español' },
  { code: 'ar-SA', name: 'العربية' },
  { code: 'fr-FR', name: 'Français' },
  { code: 'bn-IN', name: 'বাংলা' },
  { code: 'pt-BR', name: 'Português' },
  { code: 'ru-RU', name: 'Русский' },
  { code: 'id-ID', name: 'Bahasa Indonesia' },
  { code: 'de-DE', name: 'Deutsch' },
  { code: 'ja-JP', name: '日本語' },
  { code: 'tr-TR', name: 'Türkçe' },
  { code: 'vi-VN', name: 'Tiếng Việt' },
  { code: 'ko-KR', name: '한국어' },
  { code: 'it-IT', name: 'Italiano' },
  { code: 'th-TH', name: 'ไทย' },
  { code: 'pl-PL', name: 'Polski' },
  { code: 'nl-NL', name: 'Nederlands' },
  { code: 'uk-UA', name: 'Українська' },
  { code: 'sv-SE', name: 'Svenska' },
  { code: 'el-GR', name: 'Ελληνικά' },
  { code: 'he-IL', name: 'עברית' },
]

const CODES = new Set(SPEECH_LANGUAGES.map((language) => language.code))

export function defaultSpeechLanguage(uiLocale) {
  return uiLocale === 'es' ? 'es-ES' : 'en-US'
}

export function languageName(code) {
  return SPEECH_LANGUAGES.find((language) => language.code === code)?.name || code
}

export function normalizeSpeechLanguage(value, fallback = 'en-US') {
  if (value && CODES.has(value)) {
    return value
  }
  const prefix = String(value || '').split('-')[0].toLowerCase()
  const match = SPEECH_LANGUAGES.find((language) => language.code.toLowerCase().startsWith(`${prefix}-`))
  return match?.code || fallback
}
