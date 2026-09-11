import { beginSaving, endSaving, isWriteRequest } from './saving'

const TOKEN_KEY = 'flashcards.token'
const API_BASE = String(import.meta.env.VITE_API_BASE || '').replace(/\/$/, '')

function apiUrl(path) {
  return `${API_BASE}${path}`
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token)
  } else {
    localStorage.removeItem(TOKEN_KEY)
  }
}

export async function api(path, options = {}) {
  const { skipSaving, ...request } = options
  const headers = { ...(request.headers || {}) }
  const token = getToken()
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }
  if (request.body && !(request.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json'
  }

  const track = isWriteRequest(request.method) && !skipSaving
  if (track) {
    beginSaving()
  }
  try {
    return await send(path, { ...request, headers })
  } finally {
    if (track) {
      endSaving()
    }
  }
}

async function send(path, options) {
  const response = await fetch(apiUrl(path), options)
  if (response.status === 401) {
    setToken(null)
    const publicApi = path.startsWith('/api/auth/') || /^\/api\/join\/[^/?]+/.test(path)
    if (!publicApi) {
      window.location.assign('/login')
    }
    const error = await readError(response)
    throw new Error(error)
  }
  if (!response.ok) {
    throw new Error(await readError(response))
  }
  if (response.status === 204) {
    return null
  }
  const contentType = response.headers.get('content-type') || ''
  if (contentType.includes('text/csv')) {
    return response.blob()
  }
  if (contentType.includes('application/json')) {
    return response.json()
  }
  return response.text()
}

async function readError(response) {
  try {
    const body = await response.json()
    return body.message || response.statusText
  } catch {
    return response.statusText || 'Request failed'
  }
}
