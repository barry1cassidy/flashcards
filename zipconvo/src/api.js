const TOKEN_KEY = 'zipconvo.token'
const USER_KEY = 'zipconvo.user'

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token)
  } else {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
  }
}

export function getCachedUser() {
  try {
    const raw = localStorage.getItem(USER_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function setCachedUser(user) {
  if (!user) {
    localStorage.removeItem(USER_KEY)
    return
  }
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

export async function api(path, options = {}) {
  const headers = { ...(options.headers || {}) }
  const token = getToken()
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }
  if (options.body && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json'
  }

  let response
  try {
    response = await fetch(path, { ...options, headers })
  } catch {
    throw new Error('No connection')
  }

  if (!response.ok) {
    const message = await readError(response)
    const error = new Error(message)
    error.status = response.status
    if (response.status === 401 && !path.startsWith('/api/auth/')) {
      setToken(null)
      window.dispatchEvent(new Event('zipconvo-unauthorized'))
    }
    throw error
  }
  if (response.status === 204) {
    return null
  }
  return response.json()
}

async function readError(response) {
  try {
    const body = await response.json()
    if (body?.message) {
      return body.message
    }
  } catch {
    // The body was not JSON.
  }
  return 'Something went wrong'
}
