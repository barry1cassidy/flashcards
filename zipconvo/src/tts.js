import { Capacitor } from '@capacitor/core'
import { TextToSpeech } from '@capacitor-community/text-to-speech'
import { isIrish, playHostedSpeech, stopHostedSpeech, unlockHostedAudio } from './hostedSpeech'
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
  stopHostedSpeech()
  stopDeviceSpeech()
}

export function stopDeviceSpeech() {
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

export function waitForDeviceVoice(lang) {
  if (!webSpeechOk() || Capacitor.isNativePlatform()) {
    return Promise.resolve(null)
  }
  const known = deviceVoiceAvailable(lang)
  if (known !== null) {
    return Promise.resolve(known)
  }
  return whenVoices().then(() => deviceVoiceAvailable(lang))
}

export function speak(text, lang = 'en-US') {
  if (!canSpeak() || !text) {
    return Promise.resolve('unavailable')
  }
  const spoken = String(text)
  const locale = lang || 'en-US'
  if (isIrish(locale) && deviceVoiceAvailable(locale) !== true) {
    unlockHostedAudio()
  }
  if (Capacitor.isNativePlatform()) {
    return nativeVoiceAvailable(locale).then((supported) => speakNative(spoken, locale, supported))
  }
  const known = deviceVoiceAvailable(locale)
  if (known === true) {
    startWebSpeech(spoken, locale, false)
    return Promise.resolve('ok')
  }
  if (known === false) {
    return playWebOrHosted(spoken, locale)
  }
  return whenVoices().then(() => {
    if (deviceVoiceAvailable(locale) === true) {
      startWebSpeech(spoken, locale, false)
      return 'ok'
    }
    return playWebOrHosted(spoken, locale)
  })
}

async function speakNative(spoken, locale, supported) {
  if (supported) {
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
  }
  if (isIrish(locale)) {
    stopDeviceSpeech()
    const played = await playHostedSpeech(spoken)
    if (played === 'ok') {
      return 'ok'
    }
  }
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

function playWebOrHosted(spoken, locale) {
  if (isIrish(locale) && deviceVoiceAvailable(locale) !== true) {
    return playHostedSpeech(spoken).then((result) => {
      if (result === 'ok') {
        return 'ok'
      }
      return deviceOrRefuse(spoken, locale)
    })
  }
  return Promise.resolve(deviceOrRefuse(spoken, locale))
}

function deviceOrRefuse(spoken, locale) {
  if (deviceVoiceAvailable(locale) === false && !speakMissingLanguages()) {
    stopSpeaking()
    return 'unsupported'
  }
  startWebSpeech(spoken, locale, deviceVoiceAvailable(locale) === false)
  return 'ok'
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
