import { Capacitor } from '@capacitor/core'
import { TextToSpeech } from '@capacitor-community/text-to-speech'
import { speakMissingLanguages } from './speechPrefs'

let playTimer = 0
let voicesWait = null

function webSpeechOk() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}

export function canSpeak() {
  if (typeof window === 'undefined') {
    return false
  }
  return Capacitor.isNativePlatform() || webSpeechOk()
}

export function stopSpeaking() {
  if (playTimer) {
    window.clearTimeout(playTimer)
    playTimer = 0
  }
  if (Capacitor.isNativePlatform()) {
    TextToSpeech.stop().catch(() => {})
    return
  }
  if (!webSpeechOk()) {
    return
  }
  window.speechSynthesis.cancel()
}

// true when a voice is installed, false when the list is loaded and none match,
// null when the list is not available yet. An empty list is not a "no".
export function deviceVoiceAvailable(lang) {
  if (!webSpeechOk() || Capacitor.isNativePlatform()) {
    return null
  }
  const voices = window.speechSynthesis.getVoices()
  if (!voices.length) {
    return null
  }
  return Boolean(pickVoice(lang || 'en-US', voices))
}

export function deviceLanguage() {
  const code = typeof navigator !== 'undefined' ? navigator.language : ''
  return code || 'en-US'
}

export function fallbackVoice(voices = webSpeechOk() ? window.speechSynthesis.getVoices() : []) {
  if (!voices?.length) {
    return null
  }
  return voices.find((voice) => voice.default) || pickVoice(deviceLanguage(), voices) || voices[0]
}

export function nativeVoiceAvailable(lang) {
  const locale = lang || 'en-US'
  if (typeof TextToSpeech.isLanguageSupported !== 'function') {
    return Promise.resolve(true)
  }
  return TextToSpeech.isLanguageSupported({ lang: locale })
    .then((result) => result?.supported !== false)
    .catch(() => true)
}

function whenVoices() {
  if (!webSpeechOk()) {
    return Promise.resolve([])
  }
  const current = window.speechSynthesis.getVoices()
  if (current.length) {
    return Promise.resolve(current)
  }
  if (!voicesWait) {
    voicesWait = new Promise((resolve) => {
      let settled = false
      const finish = () => {
        if (settled) {
          return
        }
        const voices = window.speechSynthesis.getVoices()
        if (!voices.length) {
          return
        }
        settled = true
        window.speechSynthesis.removeEventListener('voiceschanged', finish)
        resolve(voices)
      }
      window.speechSynthesis.addEventListener('voiceschanged', finish)
      window.setTimeout(() => {
        if (settled) {
          return
        }
        settled = true
        window.speechSynthesis.removeEventListener('voiceschanged', finish)
        resolve(window.speechSynthesis.getVoices())
      }, 700)
    })
  }
  return voicesWait
}

export function speak(text, lang = 'en-US') {
  if (!canSpeak() || !text) {
    return Promise.resolve('unavailable')
  }
  const spoken = String(text)
  const locale = lang || 'en-US'
  if (Capacitor.isNativePlatform()) {
    return nativeVoiceAvailable(locale).then((supported) => {
      if (!supported) {
        if (!speakMissingLanguages()) {
          stopSpeaking()
          return 'unsupported'
        }
        stopSpeaking()
        TextToSpeech.speak({
          text: spoken,
          lang: deviceLanguage(),
          rate: 1,
          pitch: 1,
          volume: 1,
          category: 'ambient',
        }).catch(() => {})
        return 'ok'
      }
      stopSpeaking()
      TextToSpeech.speak({
        text: spoken,
        lang: locale,
        rate: 1,
        pitch: 1,
        volume: 1,
        category: 'ambient',
      }).catch(() => {})
      return 'ok'
    })
  }
  const known = deviceVoiceAvailable(locale)
  if (known === false) {
    return playWebOrRefuse(spoken, locale)
  }
  if (known === true) {
    startWebSpeech(spoken, locale, false)
    return Promise.resolve('ok')
  }
  return whenVoices().then(() => playWebOrRefuse(spoken, locale))
}

function playWebOrRefuse(spoken, locale) {
  if (deviceVoiceAvailable(locale) === false && !speakMissingLanguages()) {
    stopSpeaking()
    return Promise.resolve('unsupported')
  }
  startWebSpeech(spoken, locale, deviceVoiceAvailable(locale) === false)
  return Promise.resolve('ok')
}

function startWebSpeech(spoken, locale, fallback) {
  const voices = window.speechSynthesis.getVoices()
  const utterance = new SpeechSynthesisUtterance(spoken)
  const voice = fallback ? fallbackVoice(voices) : pickVoice(locale, voices)
  if (voice) {
    utterance.voice = voice
    utterance.lang = fallback ? voice.lang || deviceLanguage() : locale
  } else {
    utterance.lang = fallback ? deviceLanguage() : locale
  }
  stopSpeaking()
  // Chromium drops speak() in the same turn as cancel(), and can stay paused.
  playTimer = window.setTimeout(() => {
    playTimer = 0
    window.speechSynthesis.speak(utterance)
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume()
    }
  }, 50)
}

function pickVoice(lang, voices) {
  if (!voices?.length) {
    return null
  }
  const wanted = (lang || 'en-US').toLowerCase()
  const base = wanted.split('-')[0]
  return (
    voices.find((voice) => voice.lang.toLowerCase() === wanted) ||
    voices.find((voice) => {
      const code = voice.lang.toLowerCase()
      return code === base || code.startsWith(`${base}-`)
    }) ||
    null
  )
}

if (webSpeechOk()) {
  window.speechSynthesis.getVoices()
  window.speechSynthesis.addEventListener('voiceschanged', () => {
    window.speechSynthesis.getVoices()
  })
}
