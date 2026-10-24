import { defaultSpeechLanguage, languageName, normalizeSpeechLanguage } from './speechLanguages'

export const STUDIO_SCENARIOS = ['cafe', 'airport', 'doctor', 'hotel', 'pharmacy', 'interview']
export const STUDIO_SAMPLE_SCENARIOS = [
  'pharmacy',
  'cafe',
  'airport',
  'doctor',
  'hotel',
  'interview',
  'restaurant',
  'taxi',
  'supermarket',
  'directions',
]
export const STUDIO_SAMPLE_LANGUAGES = [
  'en-US',
  'zh-CN',
  'zh-HK',
  'hi-IN',
  'es-ES',
  'ar-SA',
  'fr-FR',
  'bn-IN',
  'pt-BR',
  'ru-RU',
  'id-ID',
  'de-DE',
  'ja-JP',
  'tr-TR',
  'vi-VN',
  'ko-KR',
  'it-IT',
  'th-TH',
  'pl-PL',
  'nl-NL',
  'ga-IE',
]
export const STUDIO_LOCATIONS = [...STUDIO_SCENARIOS, 'custom']
export const STUDIO_LOCATION_ICONS = {
  cafe: 'cafe',
  airport: 'airport',
  doctor: 'doctor',
  hotel: 'hotel',
  pharmacy: 'pharmacy',
  interview: 'interview',
  restaurant: 'restaurant',
  taxi: 'taxi',
  supermarket: 'supermarket',
  directions: 'directions',
  custom: 'custom',
}
export const STUDIO_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1']
export const STUDIO_STATUSES = ['LEARNING', 'GETTING', 'READY', 'LEARNED']

export function defaultStudioLanguages(uiLocale) {
  const native = defaultSpeechLanguage(uiLocale)
  const target = native === 'en-US' ? 'es-ES' : 'en-US'
  return { nativeLanguage: native, targetLanguage: target }
}

export function defaultStudioSamplePair(uiLocale) {
  const native = defaultSpeechLanguage(uiLocale)
  if (native !== 'en-US' && STUDIO_SAMPLE_LANGUAGES.includes(native)) {
    return { nativeLanguage: native, targetLanguage: 'en-US' }
  }
  return { nativeLanguage: 'en-US', targetLanguage: 'es-ES' }
}

export function sampleToConversation(sample) {
  return {
    id: sample.copiedId || null,
    title: sample.title,
    scenario: sample.scenario,
    level: sample.level,
    nativeLanguage: sample.nativeLanguage,
    targetLanguage: sample.targetLanguage,
    yourRole: sample.yourRole,
    theirRole: sample.theirRole,
    status: 'LEARNING',
    sample: true,
    sampleSlug: sample.slug,
    turnCount: sample.turnCount,
    turns: sample.turns || [],
  }
}

export function studioPairKey(nativeLanguage, targetLanguage) {
  return `${nativeLanguage || ''}::${targetLanguage || ''}`
}

export function studioPairLabel(conversation, t) {
  if (!conversation) {
    return ''
  }
  return t('studio.pair', {
    native: languageName(conversation.nativeLanguage),
    target: languageName(conversation.targetLanguage),
  })
}

export function findStudioPair(pairs, nativeLanguage, targetLanguage) {
  return (pairs || []).find(
    (pair) => pair.nativeLanguage === nativeLanguage && pair.targetLanguage === targetLanguage,
  )
}

export function studioLibraryPath(pair) {
  if (!pair?.nativeLanguage || !pair?.targetLanguage) {
    return '/language-studio'
  }
  return `/language-studio?native=${encodeURIComponent(pair.nativeLanguage)}&target=${encodeURIComponent(pair.targetLanguage)}`
}

export function studioSamplesPath(nativeLanguage, targetLanguage) {
  if (!nativeLanguage || !targetLanguage) {
    return '/language-studio/samples'
  }
  return `/language-studio/samples?native=${encodeURIComponent(nativeLanguage)}&target=${encodeURIComponent(targetLanguage)}`
}

export function studioListenReturnPath(path) {
  if (typeof path !== 'string' || !path.startsWith('/language-studio') || path.startsWith('//') || path.includes('://')) {
    return ''
  }
  return path
}

export const STUDIO_RATE_KINDS = {
  LEARNING: 'again',
  GETTING: 'hard',
  READY: 'good',
  LEARNED: 'easy',
}

export function conversationIsGraded(conversation) {
  if (!conversation || !Object.prototype.hasOwnProperty.call(conversation, 'ratedAt')) {
    return true
  }
  return Boolean(conversation.ratedAt)
}

export function studioGradeKind(conversation) {
  if (!conversationIsGraded(conversation)) {
    return ''
  }
  return STUDIO_RATE_KINDS[conversation.status] || ''
}

export function studioStatusLabel(status, t, graded = true) {
  if (!graded) {
    return t('studio.statusUngraded')
  }
  const key = {
    LEARNING: 'studio.statusLearning',
    GETTING: 'studio.statusGetting',
    READY: 'studio.statusReady',
    LEARNED: 'studio.statusLearned',
  }[status]
  return key ? t(key) : status
}

export function conversationToListenQueue(conversation) {
  const native = normalizeSpeechLanguage(conversation.nativeLanguage, 'en-US')
  const target = normalizeSpeechLanguage(conversation.targetLanguage, 'en-US')
  const cards = (conversation.turns || []).map((turn, index) => ({
    id: `${conversation.id}-${index}`,
    front: String(turn.nativeText || '').trim(),
    back: String(turn.targetText || '').trim(),
    position: index,
  }))
  return {
    title: conversation.title || '',
    nativeLanguage: native,
    targetLanguage: target,
    decks: [
      {
        id: conversation.id,
        name: conversation.title || '',
        frontLanguage: native,
        backLanguage: target,
        cards,
      },
    ],
  }
}
