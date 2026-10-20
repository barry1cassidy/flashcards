export const LISTEN_PAUSE_MIN = 0
export const LISTEN_PAUSE_MAX = 60
export const LISTEN_PAUSE_DEFAULT = 4
export const LISTEN_SLEEP_CHOICES = [0, 5, 10, 15, 30, 45, 60]

const STORAGE_KEY = 'zipdeck.listenPrefs'

export function defaultListenPrefs() {
  return {
    pauseSeconds: LISTEN_PAUSE_DEFAULT,
    side: 'front',
    loop: false,
    announce: true,
    sleepMinutes: 0,
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
  return {
    pauseSeconds: clampListenPause(pause ?? base.pauseSeconds),
    side,
    loop: Boolean(loop),
    announce: announce !== false && announce !== 0,
    sleepMinutes: clampListenSleep(sleep ?? 0),
  }
}

export function listenPrefsFromUser(user) {
  if (user && Number.isFinite(Number(user.listenPauseSeconds))) {
    return normalizeListenPrefs(user)
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
  }
}

export function mergeListenResponse(updated, sent) {
  if (updated && Number.isFinite(Number(updated.listenPauseSeconds))) {
    return updated
  }
  return { ...updated, ...sent }
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
