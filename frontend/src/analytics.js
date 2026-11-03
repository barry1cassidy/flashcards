import { useEffect, useRef } from 'react'
import posthog from 'posthog-js'
import { Capacitor } from '@capacitor/core'

const KEY = String(import.meta.env.VITE_POSTHOG_KEY || '').trim()
const HOST = 'https://us.i.posthog.com'

let started = false

export function initAnalytics() {
  if (started || !KEY || typeof window === 'undefined') {
    return
  }
  posthog.init(KEY, {
    api_host: HOST,
    person_profiles: 'identified_only',
    autocapture: false,
    rageclick: false,
    capture_pageview: false,
    capture_pageleave: false,
    disable_session_recording: true,
    capture_heatmaps: false,
    capture_performance: false,
    advanced_disable_flags: true,
    persistence: 'localStorage',
  })
  started = true
}

function clientPlatform() {
  if (!Capacitor.isNativePlatform()) {
    return 'web'
  }
  const name = Capacitor.getPlatform()
  if (name === 'android' || name === 'ios') {
    return name
  }
  return 'web'
}

export function track(event, properties = {}) {
  if (!started) {
    return
  }
  posthog.capture(event, {
    platform: clientPlatform(),
    environment: import.meta.env.MODE,
    ...properties,
  })
}

export function identifyUser(user) {
  if (!started || !user?.id) {
    return
  }
  posthog.identify(String(user.id))
}

export function resetAnalytics() {
  if (!started) {
    return
  }
  posthog.reset()
}

export function trackPageView(pathname) {
  track('$pageview', {
    $current_url: `${window.location.origin}${pathname}`,
  })
}

export function trackAuth(result, method) {
  if (!result?.user) {
    return
  }
  identifyUser(result.user)
  track(result.newAccount ? 'signed_up' : 'signed_in', { method })
}

export function trackDeckCreated({ frontLanguage, backLanguage, source }) {
  track('deck_created', {
    front_language: frontLanguage || '',
    back_language: backLanguage || '',
    source,
  })
}

export function trackSampleCopied({ id, frontLanguage, backLanguage, source }) {
  const languages = {
    front_language: frontLanguage || '',
    back_language: backLanguage || '',
  }
  track('sample_copied', {
    sample_id: String(id),
    source,
    ...languages,
  })
  trackDeckCreated({ ...languages, source })
}

export function useTrackProGate(feature, blocked) {
  const sent = useRef(false)
  useEffect(() => {
    if (!blocked || sent.current) {
      return
    }
    sent.current = true
    track('pro_gate_hit', { feature })
  }, [feature, blocked])
}

initAnalytics()
