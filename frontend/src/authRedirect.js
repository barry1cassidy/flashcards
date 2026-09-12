const JOIN_PATH = /^\/join\/[^/]+$/
const JOIN_INVITE_KEY = 'flashcards.joinInvite'
const JOIN_RESUME_KEY = 'flashcards.joinResume'

export function joinInvitePath(location) {
  const from = location?.state?.from
  const candidates = [location?.pathname, typeof from === 'string' ? from : from?.pathname]
  for (const raw of candidates) {
    const path = pathnameOnly(raw)
    if (isJoinPath(path)) {
      return path
    }
  }
  return peekJoinInvite()
}

export function pathAfterAuth(location) {
  return joinInvitePath(location) || '/'
}

export function inviteAuthState(location) {
  const invite = joinInvitePath(location)
  return invite ? { from: invite } : undefined
}

export function goAfterAuth(navigate, location) {
  const next = pathAfterAuth(location)
  if (isJoinPath(next)) {
    rememberJoinInvite(next)
  }
  if (pathnameOnly(location?.pathname) === next) {
    return
  }
  navigate(next, { replace: true })
}

export function rememberJoinInvite(path) {
  const invite = pathnameOnly(path)
  if (!isJoinPath(invite)) {
    return
  }
  try {
    sessionStorage.setItem(JOIN_INVITE_KEY, invite)
    sessionStorage.setItem(JOIN_RESUME_KEY, '1')
  } catch {
    // sessionStorage can be unavailable in some WebViews
  }
}

export function peekJoinInvite() {
  try {
    const path = pathnameOnly(sessionStorage.getItem(JOIN_INVITE_KEY) || '')
    return isJoinPath(path) ? path : null
  } catch {
    return null
  }
}

export function takeJoinInvite() {
  const path = peekJoinInvite()
  clearJoinInvite()
  return path
}

export function shouldResumeJoinInvite() {
  try {
    return sessionStorage.getItem(JOIN_RESUME_KEY) === '1' && Boolean(peekJoinInvite())
  } catch {
    return false
  }
}

export function clearJoinInvite() {
  try {
    sessionStorage.removeItem(JOIN_INVITE_KEY)
    sessionStorage.removeItem(JOIN_RESUME_KEY)
  } catch {
    // ignore
  }
}

function pathnameOnly(path) {
  if (typeof path !== 'string') {
    return ''
  }
  return path.split(/[?#]/)[0]
}

function isSafePath(path) {
  return path.startsWith('/') && !path.startsWith('//')
}

function isJoinPath(path) {
  return isSafePath(path) && JOIN_PATH.test(path)
}
