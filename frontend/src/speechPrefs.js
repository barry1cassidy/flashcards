import { Capacitor } from '@capacitor/core'

const SPEECH_LANGUAGE_LISTS = {
  android: 'https://support.google.com/accessibility/android/answer/11101402',
  apple: 'https://support.apple.com/111748',
  windows:
    'https://support.microsoft.com/windows/appendix-a-supported-languages-and-voices-4486e345-7730-53da-fcfe-55cc64300f01',
}

export function speechLanguageListUrl() {
  const platform = Capacitor.getPlatform()
  if (platform === 'android') {
    return SPEECH_LANGUAGE_LISTS.android
  }
  if (platform === 'ios') {
    return SPEECH_LANGUAGE_LISTS.apple
  }
  const agent = typeof navigator !== 'undefined' ? navigator.userAgent : ''
  if (/Android/.test(agent)) {
    return SPEECH_LANGUAGE_LISTS.android
  }
  if (/Mac OS|iPhone|iPad/.test(agent)) {
    return SPEECH_LANGUAGE_LISTS.apple
  }
  return SPEECH_LANGUAGE_LISTS.windows
}

const KEY = 'zipdeck.speakMissingLanguages'

export function speakMissingLanguages() {
  try {
    return window.localStorage.getItem(KEY) === '1'
  } catch {
    return false
  }
}

export function setSpeakMissingLanguages(enabled) {
  try {
    window.localStorage.setItem(KEY, enabled ? '1' : '0')
  } catch {
    // Storage can be blocked. The toggle still updates for this page.
  }
}
