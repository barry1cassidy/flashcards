// Keep in step with TranslationLanguages.java (Azure Translator codes).
const AZURE = {
  'en-US': 'en',
  'zh-CN': 'zh-Hans',
  'zh-HK': 'zh-Hant',
  'hi-IN': 'hi',
  'es-ES': 'es',
  'ar-SA': 'ar',
  'fr-FR': 'fr',
  'bn-IN': 'bn',
  'pt-BR': 'pt',
  'ru-RU': 'ru',
  'id-ID': 'id',
  'de-DE': 'de',
  'ja-JP': 'ja',
  'tr-TR': 'tr',
  'vi-VN': 'vi',
  'ko-KR': 'ko',
  'it-IT': 'it',
  'th-TH': 'th',
  'pl-PL': 'pl',
  'nl-NL': 'nl',
  'uk-UA': 'uk',
  'sv-SE': 'sv',
  'el-GR': 'el',
  'he-IL': 'he',
  'ga-IE': 'ga',
  'da-DK': 'da',
  'fi-FI': 'fi',
  'cs-CZ': 'cs',
  'ro-RO': 'ro',
  'tl-PH': 'fil',
  'sw-KE': 'sw',
  'cy-GB': 'cy',
  'nb-NO': 'nb',
  'hu-HU': 'hu',
}

export function canTranslate(frontLanguage, backLanguage) {
  const source = AZURE[frontLanguage]
  const target = AZURE[backLanguage]
  return Boolean(source && target && source !== target)
}
