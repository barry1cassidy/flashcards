import { Capacitor } from '@capacitor/core'
import { TextToSpeech } from '@capacitor-community/text-to-speech'

let playTimer = 0

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

export function speak(text, lang = 'en-US') {
  if (!canSpeak() || !text) {
    return
  }
  const spoken = String(text)
  const locale = lang || 'en-US'
  if (Capacitor.isNativePlatform()) {
    stopSpeaking()
    TextToSpeech.speak({
      text: spoken,
      lang: locale,
      rate: 1,
      pitch: 1,
      volume: 1,
      category: 'ambient',
    }).catch(() => {})
    return
  }
  const utterance = new SpeechSynthesisUtterance(spoken)
  utterance.lang = locale
  const voice = pickVoice(utterance.lang)
  if (voice) {
    utterance.voice = voice
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

function pickVoice(lang) {
  const voices = window.speechSynthesis.getVoices()
  if (!voices.length) {
    return null
  }
  const wanted = (lang || 'en-US').toLowerCase()
  return (
    voices.find((voice) => voice.lang.toLowerCase() === wanted) ||
    voices.find((voice) => voice.lang.toLowerCase().startsWith(wanted.split('-')[0])) ||
    null
  )
}

if (webSpeechOk()) {
  window.speechSynthesis.getVoices()
  window.speechSynthesis.addEventListener('voiceschanged', () => {
    window.speechSynthesis.getVoices()
  })
}
