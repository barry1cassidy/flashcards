export const LISTEN_PAUSE_MIN = 0
export const LISTEN_PAUSE_MAX = 60
export const LISTEN_PAUSE_DEFAULT = 4
export const LISTEN_SLEEP_CHOICES = [0, 5, 10, 15, 30, 45, 60]
export const LISTEN_SLEEP_EXTEND_MS = 5 * 60 * 1000
export const LISTEN_RATE_MIN = 0.5
export const LISTEN_RATE_MAX = 1.25
export const LISTEN_RATE_DEFAULT = 1
export const LISTEN_RATE_STEPS = [0.5, 0.6, 0.7, 0.8, 0.9, 1, 1.1, 1.2, 1.25]

const STORAGE_KEY = 'zipdeck.listenPrefs'

export function defaultListenPrefs() {
  return {
    pauseSeconds: LISTEN_PAUSE_DEFAULT,
    side: 'front',
    loop: false,
    announce: true,
    sleepMinutes: 0,
    rate: LISTEN_RATE_DEFAULT,
    questionTwice: false,
    answerTwice: false,
  }
}

export function clampListenPause(value) {
  const parsed = Math.round(Number(value))
  if (!Number.isFinite(parsed)) {
    return LISTEN_PAUSE_DEFAULT
  }
  return Math.min(LISTEN_PAUSE_MAX, Math.max(LISTEN_PAUSE_MIN, parsed))
}

export function clampListenSleep(value) {
  const parsed = Math.round(Number(value))
  return LISTEN_SLEEP_CHOICES.includes(parsed) ? parsed : 0
}

export function clampListenRate(value) {
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) {
    return LISTEN_RATE_DEFAULT
  }
  const clamped = Math.min(LISTEN_RATE_MAX, Math.max(LISTEN_RATE_MIN, parsed))
  let best = LISTEN_RATE_DEFAULT
  let bestDelta = Number.POSITIVE_INFINITY
  for (const step of LISTEN_RATE_STEPS) {
    const delta = Math.abs(step - clamped)
    if (delta < bestDelta) {
      best = step
      bestDelta = delta
    }
  }
  return best
}

export function stepListenRate(current, direction) {
  const value = clampListenRate(current)
  const index = LISTEN_RATE_STEPS.findIndex((step) => Math.abs(step - value) < 0.001)
  const at = index < 0 ? LISTEN_RATE_STEPS.indexOf(1) : index
  return LISTEN_RATE_STEPS[Math.min(LISTEN_RATE_STEPS.length - 1, Math.max(0, at + direction))]
}

export function formatListenRate(rate) {
  const value = clampListenRate(rate)
  return value === 1.25 ? '1.25' : value.toFixed(1)
}

export function normalizeListenPrefs(source) {
  const base = defaultListenPrefs()
  if (!source || typeof source !== 'object') {
    return base
  }
  const side = source.side === 'back' || source.listenSideFirst === 'BACK' ? 'back' : 'front'
  const pause = source.pauseSeconds ?? source.listenPauseSeconds
  const loop = source.loop ?? source.listenRepeat
  const announce = source.announce ?? source.listenAnnounce
  const sleep = source.sleepMinutes ?? source.listenSleepMinutes
  const rate = source.rate ?? source.listenSpeechRate
  const twice = source.questionTwice ?? source.listenQuestionTwice
  const backTwice = source.answerTwice ?? source.listenAnswerTwice
  return {
    pauseSeconds: clampListenPause(pause ?? base.pauseSeconds),
    side,
    loop: Boolean(loop),
    announce: announce !== false && announce !== 0,
    sleepMinutes: clampListenSleep(sleep ?? 0),
    rate: clampListenRate(rate ?? base.rate),
    questionTwice: twice === true || twice === 1,
    answerTwice: backTwice === true || backTwice === 1,
  }
}

export function listenPrefsFromUser(user) {
  if (user && Number.isFinite(Number(user.listenPauseSeconds))) {
    const fromUser = normalizeListenPrefs(user)
    const stored = readStoredListenPrefs()
    if (stored) {
      if (!Number.isFinite(Number(user.listenSpeechRate))) {
        fromUser.rate = stored.rate
      }
      if (user.listenQuestionTwice == null) {
        fromUser.questionTwice = stored.questionTwice
      }
      if (user.listenAnswerTwice == null) {
        fromUser.answerTwice = stored.answerTwice
      }
    }
    return fromUser
  }
  return readStoredListenPrefs() || defaultListenPrefs()
}

export function listenPrefsToApi(prefs) {
  const normalized = normalizeListenPrefs(prefs)
  return {
    listenPauseSeconds: normalized.pauseSeconds,
    listenSideFirst: normalized.side === 'back' ? 'BACK' : 'FRONT',
    listenRepeat: normalized.loop,
    listenAnnounce: normalized.announce,
    listenSleepMinutes: normalized.sleepMinutes,
    listenSpeechRate: normalized.rate,
    listenQuestionTwice: normalized.questionTwice,
    listenAnswerTwice: normalized.answerTwice,
  }
}

export function mergeListenResponse(updated, sent) {
  if (!updated || !Number.isFinite(Number(updated.listenPauseSeconds))) {
    return { ...updated, ...sent }
  }
  const merged = { ...updated }
  if (!Number.isFinite(Number(updated.listenSpeechRate)) && Number.isFinite(Number(sent?.listenSpeechRate))) {
    merged.listenSpeechRate = sent.listenSpeechRate
  }
  if (updated.listenQuestionTwice == null && typeof sent?.listenQuestionTwice === 'boolean') {
    merged.listenQuestionTwice = sent.listenQuestionTwice
  }
  if (updated.listenAnswerTwice == null && typeof sent?.listenAnswerTwice === 'boolean') {
    merged.listenAnswerTwice = sent.listenAnswerTwice
  }
  return merged
}

export function readStoredListenPrefs() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return null
    }
    return normalizeListenPrefs(JSON.parse(raw))
  } catch {
    return null
  }
}

export function writeStoredListenPrefs(prefs) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizeListenPrefs(prefs)))
  } catch {
    // localStorage can be unavailable in some WebViews.
  }
}

export function formatSleepLeft(ms) {
  const total = Math.max(0, Math.ceil(ms / 1000))
  const minutes = Math.floor(total / 60)
  const seconds = total % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}
