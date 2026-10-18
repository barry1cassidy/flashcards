import { useEffect, useRef } from 'react'
import { useLocation, useNavigate, useNavigationType } from 'react-router-dom'
import { App } from '@capacitor/app'
import { Capacitor } from '@capacitor/core'

let historyDepth = 0

export function BackNavigation() {
  const navigate = useNavigate()
  const location = useLocation()
  const action = useNavigationType()
  const started = useRef(false)
  const locationRef = useRef(location)
  const navigateRef = useRef(navigate)
  locationRef.current = location
  navigateRef.current = navigate

  useEffect(() => {
    if (!started.current) {
      started.current = true
      return
    }
    if (action === 'PUSH') {
      historyDepth += 1
    } else if (action === 'POP') {
      historyDepth = Math.max(0, historyDepth - 1)
    }
  }, [action, location.key])

  useEffect(() => {
    if (Capacitor.getPlatform() !== 'android') {
      return undefined
    }
    let removed = false
    let handle
    const pending = App.addListener('backButton', () => {
      onAndroidBack(navigateRef, locationRef)
    })
    pending.then((value) => {
      if (removed) {
        value.remove()
      } else {
        handle = value
      }
    })
    return () => {
      removed = true
      handle?.remove()
    }
  }, [])

  return null
}

function atRoot(pathname) {
  return pathname === '/' || pathname === '/login'
}

function onAndroidBack(navigateRef, locationRef) {
  const { pathname, search } = locationRef.current
  if (closeTransientOverlay(pathname)) {
    return
  }
  const creating = new URLSearchParams(search).get('new') === '1'
  const modals = document.querySelectorAll('.modal-backdrop')
  if (modals.length > 1 || (modals.length === 1 && !creating)) {
    const top = modals[modals.length - 1]
    const dismiss = top.querySelector('[data-modal-dismiss]:not(:disabled)')
    if (dismiss) {
      dismiss.click()
    } else if (!top.classList.contains('modal-form')) {
      top.click()
    }
    return
  }
  if (creating) {
    if (historyDepth > 0) {
      window.history.back()
    } else {
      navigateRef.current({ pathname, search: '' }, { replace: true })
    }
    return
  }
  if (historyDepth > 0) {
    window.history.back()
    return
  }
  if (!atRoot(pathname)) {
    navigateRef.current('/', { replace: true })
    return
  }
  App.exitApp()
}

function closeTransientOverlay(pathname) {
  const menu = document.querySelector('.app-frame.menu-open .menu-backdrop')
  if (menu) {
    menu.click()
    return true
  }
  if (document.querySelector('.user-menu-dropdown')) {
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    return true
  }
  if (pathname !== '/login' && document.getElementById('login-panel')) {
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    return true
  }
  return false
}
