import { Capacitor } from '@capacitor/core'
import { beginSaving, endSaving, isWriteRequest } from './saving'

const TOKEN_KEY = 'flashcards.token'
const USER_KEY = 'flashcards.user'
const REFRESH_KEY = 'flashcards.refresh'
export const NO_CONNECTION = 'No connection'
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
    localStorage.removeItem(USER_KEY)
    setRefreshToken(null)
  }
}

export function getRefreshToken() {
  try {
    return localStorage.getItem(REFRESH_KEY)
  } catch {
    return null
  }
}

export function setRefreshToken(token) {
  try {
    if (token) {
      localStorage.setItem(REFRESH_KEY, token)
    } else {
      localStorage.removeItem(REFRESH_KEY)
    }
  } catch {
    // localStorage can be unavailable in some WebViews
  }
}

export function revokeRefreshToken() {
  const refreshToken = getRefreshToken()
  setRefreshToken(null)
  if (!refreshToken || !Capacitor.isNativePlatform()) {
    return
  }
  fetch(apiUrl('/api/auth/logout'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Zipdeck-Client': 'native' },
    body: JSON.stringify({ refreshToken }),
  }).catch(() => {})
}

export function getCachedUser() {
  try {
    const raw = localStorage.getItem(USER_KEY)
    if (!raw) {
      return null
    }
    const user = JSON.parse(raw)
    return user && typeof user === 'object' ? user : null
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

export function isNetworkError(error) {
  return Boolean(error?.offline) || error?.message === NO_CONNECTION
}

export async function api(path, options = {}) {
  const { skipSaving, ...request } = options
  const headers = { ...(request.headers || {}) }
  const token = getToken()
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }
  if (Capacitor.isNativePlatform()) {
    headers['X-Zipdeck-Client'] = 'native'
  }
  if (request.body && !(request.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json'
  }

  const track = isWriteRequest(request.method) && !skipSaving
  if (track) {
    beginSaving()
  }
  try {
    return await send(path, { ...request, headers }, true)
  } finally {
    if (track) {
      endSaving()
    }
  }
}

function isPublicLibraryGet(path, options) {
  const method = String(options.method || 'GET').toUpperCase()
  const pathname = path.split('?')[0]
  return method === 'GET' && (pathname === '/api/library' || pathname.startsWith('/api/library/'))
}

async function devLibrary(path, options) {
  if (!import.meta.env.DEV || !isPublicLibraryGet(path, options)) {
    return null
  }
  try {
    const response = await fetch(`http://localhost:8081${path}`)
    if (!response.ok) {
      return null
    }
    return response.json()
  } catch {
    return null
  }
}

const REFRESH_SKIP = new Set([
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/google',
  '/api/auth/apple',
  '/api/auth/refresh',
  '/api/auth/logout',
])

let refreshPromise = null

function canRefresh(path) {
  if (!Capacitor.isNativePlatform() || !getRefreshToken()) {
    return false
  }
  return !REFRESH_SKIP.has(path.split('?')[0])
}

function refreshSession() {
  if (!refreshPromise) {
    refreshPromise = performRefresh().finally(() => {
      refreshPromise = null
    })
  }
  return refreshPromise
}

async function performRefresh() {
  const refreshToken = getRefreshToken()
  if (!refreshToken) {
    return 'rejected'
  }
  try {
    const response = await fetch(apiUrl('/api/auth/refresh'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Zipdeck-Client': 'native' },
      body: JSON.stringify({ refreshToken }),
    })
    if (response.status === 401 || response.status === 400) {
      return 'rejected'
    }
    if (!response.ok) {
      return 'offline'
    }
    const body = await response.json()
    if (!body?.token || !body?.refreshToken) {
      return 'rejected'
    }
    setToken(body.token)
    setRefreshToken(body.refreshToken)
    if (body.user) {
      setCachedUser(body.user)
    }
    return 'ok'
  } catch {
    return 'offline'
  }
}

function offlineError(cause) {
  const offline = new Error(NO_CONNECTION)
  offline.offline = true
  if (cause) {
    offline.cause = cause
  }
  return offline
}

async function send(path, options, allowRefresh) {
  let response
  try {
    response = await fetch(apiUrl(path), options)
  } catch (error) {
    const fallback = await devLibrary(path, options)
    if (fallback) {
      return fallback
    }
    throw offlineError(error)
  }
  if (response.status === 401) {
    if (allowRefresh && canRefresh(path)) {
      const outcome = await refreshSession()
      if (outcome === 'ok') {
        const headers = { ...(options.headers || {}) }
        const token = getToken()
        if (token) {
          headers.Authorization = `Bearer ${token}`
        }
        return send(path, { ...options, headers }, false)
      }
      if (outcome === 'offline') {
        throw offlineError()
      }
    }
    setToken(null)
    const pathname = path.split('?')[0]
    const publicApi =
      pathname.startsWith('/api/auth/') ||
      /^\/api\/join\/[^/]+$/.test(pathname) ||
      /^\/api\/shares\/[^/]+$/.test(pathname) ||
      isPublicLibraryGet(path, options)
    if (!publicApi) {
      window.location.assign(Capacitor.isNativePlatform() ? '/' : '/login')
    }
    const fallback = await devLibrary(path, options)
    if (fallback) {
      return fallback
    }
    throw new Error(await readError(response))
  }
  if (!response.ok) {
    const fallback = await devLibrary(path, options)
    if (fallback) {
      return fallback
    }
    throw new Error(await readError(response))
  }
  if (response.status === 204) {
    return null
  }
  const contentType = response.headers.get('content-type') || ''
  if (contentType.includes('text/csv')) {
    return response.blob()
  }
  if (contentType.startsWith('image/')) {
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
