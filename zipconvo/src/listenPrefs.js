export const LISTEN_PAUSE_MIN = 0
export const LISTEN_PAUSE_MAX = 60
export const LISTEN_PAUSE_DEFAULT = 4
export const LISTEN_SLEEP_CHOICES = [0, 5, 10, 15, 30, 45, 60]
export const LISTEN_RATE_STEPS = [0.5, 0.6, 0.7, 0.8, 0.9, 1, 1.1, 1.2, 1.25]

export function defaultListenPrefs() {
  return {
    pauseSeconds: LISTEN_PAUSE_DEFAULT,
    side: 'front',
    loop: false,
    sleepMinutes: 0,
    rate: 1,
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
    return 1
  }
  let best = 1
  let bestDelta = Number.POSITIVE_INFINITY
  for (const step of LISTEN_RATE_STEPS) {
    const delta = Math.abs(step - parsed)
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

export function listenPrefsFromUser(user) {
  const base = defaultListenPrefs()
  if (!user) {
    return base
  }
  const side = user.listenSideFirst === 'BACK' ? 'back' : 'front'
  return {
    pauseSeconds: clampListenPause(user.listenPauseSeconds ?? base.pauseSeconds),
    side,
    loop: Boolean(user.listenRepeat),
    sleepMinutes: clampListenSleep(user.listenSleepMinutes ?? 0),
    rate: clampListenRate(user.listenSpeechRate ?? base.rate),
    questionTwice: user.listenQuestionTwice === true,
    answerTwice: user.listenAnswerTwice === true,
  }
}

export function formatSleepLeft(ms) {
  const total = Math.max(0, Math.ceil(ms / 1000))
  const minutes = Math.floor(total / 60)
  const seconds = total % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

export function listenPrefsToApi(prefs) {
  return {
    listenPauseSeconds: clampListenPause(prefs.pauseSeconds),
    listenSideFirst: prefs.side === 'back' ? 'BACK' : 'FRONT',
    listenRepeat: Boolean(prefs.loop),
    listenSleepMinutes: clampListenSleep(prefs.sleepMinutes),
    listenSpeechRate: clampListenRate(prefs.rate),
    listenQuestionTwice: Boolean(prefs.questionTwice),
    listenAnswerTwice: Boolean(prefs.answerTwice),
  }
}
