import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { App } from '@capacitor/app'
import { Capacitor } from '@capacitor/core'
import { invitePathFromUrl } from './authRedirect'

export function IncomingLinks() {
  const navigate = useNavigate()

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) {
      return undefined
    }
    let removed = false
    const open = (url) => {
      const path = invitePathFromUrl(url)
      if (path) {
        navigate(path, { replace: true })
      }
    }
    const pending = App.addListener('appUrlOpen', (event) => {
      if (event?.url) {
        open(event.url)
      }
    })
    App.getLaunchUrl()
      .then((result) => {
        if (!removed && result?.url) {
          open(result.url)
        }
      })
      .catch(() => {})
    return () => {
      removed = true
      pending.then((handle) => handle.remove()).catch(() => {})
    }
  }, [navigate])

  return null
}
