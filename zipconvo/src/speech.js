import { Capacitor } from '@capacitor/core'
import { TextToSpeech } from '@capacitor-community/text-to-speech'
import { api } from './api'

const SILENT_WAV = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA'

let generation = 0
let audio = null
let objectUrl = ''
let playTimer = 0
let voicesWait = null
let cancelWait = null

export function isIrish(lang) {
  const value = String(lang || '').trim().toLowerCase().replaceAll('_', '-')
  return value === 'ga' || value === 'ga-ie'
}

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
  generation += 1
  cancelPending()
  stopHosted()
  stopDeviceSpeech()
}

function cancelPending() {
  if (playTimer) {
    window.clearTimeout(playTimer)
    playTimer = 0
  }
  const cancel = cancelWait
  cancelWait = null
  cancel?.()
}

function stopDeviceSpeech() {
  if (Capacitor.isNativePlatform()) {
    TextToSpeech.stop().catch(() => {})
  }
  if (webSpeechOk()) {
    window.speechSynthesis.cancel()
  }
}

export function speak(text, lang = 'en-US', { rate = 1, wait = false } = {}) {
  const spoken = String(text || '').trim()
  if (!spoken) {
    return Promise.resolve('unavailable')
  }
  const locale = lang || 'en-US'
  if (isIrish(locale) && deviceVoiceAvailable(locale) !== true) {
    unlockHostedAudio()
  }
  if (Capacitor.isNativePlatform()) {
    return nativeVoiceAvailable(locale).then((supported) => speakNative(spoken, locale, rate, wait, supported))
  }
  stopSpeaking()
  const mine = generation
  return run(spoken, locale, rate, wait, mine)
}

function nativeVoiceAvailable(lang) {
  if (typeof TextToSpeech.isLanguageSupported !== 'function') {
    return Promise.resolve(true)
  }
  return TextToSpeech.isLanguageSupported({ lang: lang || 'en-US' })
    .then((result) => result?.supported !== false)
    .catch(() => true)
}

async function speakNative(spoken, locale, rate, wait, supported) {
  if (supported) {
    stopSpeaking()
    const mine = generation
    const speed = Number(rate)
    try {
      const pending = TextToSpeech.speak({
        text: spoken,
        lang: locale,
        rate: Number.isFinite(speed) && speed > 0 ? speed : 1,
        pitch: 1,
        volume: 1,
        category: 'ambient',
      }).then(
        () => (mine === generation ? 'ok' : 'unavailable'),
        () => (mine === generation ? 'unsupported' : 'unavailable'),
      )
      if (!wait) {
        return 'ok'
      }
      return pending
    } catch {
      return mine === generation ? 'unsupported' : 'unavailable'
    }
  }
  if (isIrish(locale)) {
    stopDeviceSpeech()
    const mine = generation + 1
    generation = mine
    return playHosted(spoken, rate, wait, mine)
  }
  stopSpeaking()
  return 'unsupported'
}

async function run(spoken, locale, rate, wait, mine) {
  if (deviceVoiceAvailable(locale) === null && webSpeechOk()) {
    await whenVoices()
  }
  if (mine !== generation) {
    return 'unavailable'
  }
  if (deviceVoiceAvailable(locale) === true) {
    return speakWeb(spoken, locale, rate, wait, mine)
  }
  if (isIrish(locale)) {
    const played = await playHosted(spoken, rate, wait, mine)
    if (played === 'ok') {
      return 'ok'
    }
    if (mine !== generation) {
      return 'unavailable'
    }
  }
  if (!webSpeechOk() || deviceVoiceAvailable(locale) === false) {
    return 'unsupported'
  }
  return speakWeb(spoken, locale, rate, wait, mine)
}

function deviceVoiceAvailable(lang) {
  if (!webSpeechOk() || Capacitor.isNativePlatform()) {
    return null
  }
  const voices = window.speechSynthesis.getVoices()
  if (!voices.length) {
    return null
  }
  return Boolean(pickVoice(lang || 'en-US', voices))
}

function whenVoices() {
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

function speakWeb(spoken, locale, rate, wait, mine) {
  return new Promise((resolve) => {
    if (!webSpeechOk() || mine !== generation) {
      resolve('unsupported')
      return
    }
    const voices = window.speechSynthesis.getVoices()
    const utterance = new SpeechSynthesisUtterance(spoken)
    const voice = pickVoice(locale, voices)
    if (voice) {
      utterance.voice = voice
      utterance.lang = voice.lang || locale
    } else {
      utterance.lang = locale
    }
    const speed = Number(rate)
    utterance.rate = Number.isFinite(speed) && speed > 0 ? speed : 1
    let settled = false
    const finish = (result) => {
      if (settled) {
        return
      }
      settled = true
      resolve(result)
    }
    utterance.onend = () => finish('ok')
    utterance.onerror = () => finish(mine === generation ? 'unsupported' : 'unavailable')
    cancelWait = () => finish('unavailable')
    playTimer = window.setTimeout(() => {
      playTimer = 0
      if (mine !== generation) {
        finish('unavailable')
        return
      }
      window.speechSynthesis.speak(utterance)
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume()
      }
      if (!wait) {
        finish('ok')
      }
    }, 50)
  })
}

function ensureAudio() {
  if (!audio) {
    audio = new Audio()
    audio.setAttribute('playsinline', 'true')
    audio.preload = 'auto'
  }
  return audio
}

function releaseUrl() {
  if (!objectUrl) {
    return
  }
  URL.revokeObjectURL(objectUrl)
  objectUrl = ''
}

function stopHosted() {
  releaseUrl()
  if (!audio) {
    return
  }
  audio.pause()
  audio.removeAttribute('src')
  try {
    audio.load()
  } catch {
    // The element is already clear.
  }
}

export function unlockHostedAudio() {
  const player = ensureAudio()
  player.src = SILENT_WAV
  const pending = player.play()
  pending?.catch(() => {})
}

async function playHosted(text, rate, wait, mine) {
  let blob
  try {
    blob = await api('/api/speech', {
      method: 'POST',
      body: JSON.stringify({ text, lang: 'ga-IE' }),
    })
  } catch {
    return mine === generation ? 'unsupported' : 'unavailable'
  }
  if (mine !== generation) {
    return 'unavailable'
  }
  if (!(blob instanceof Blob) || blob.size < 32) {
    return 'unsupported'
  }
  const player = ensureAudio()
  releaseUrl()
  objectUrl = URL.createObjectURL(blob)
  player.src = objectUrl
  player.playbackRate = 1
  try {
    await player.play()
  } catch {
    return mine === generation ? 'unsupported' : 'unavailable'
  }
  if (mine !== generation) {
    player.pause()
    return 'unavailable'
  }
  const speed = Number(rate)
  if (Number.isFinite(speed) && speed > 0 && speed !== 1) {
    try {
      player.playbackRate = speed
    } catch {
      // The clip still plays at the normal speed.
    }
  }
  if (!wait) {
    player.addEventListener(
      'ended',
      () => {
        if (mine === generation) {
          releaseUrl()
        }
      },
      { once: true },
    )
    return 'ok'
  }
  let failed = false
  await new Promise((resolve) => {
    let settled = false
    const finish = () => {
      if (settled) {
        return
      }
      settled = true
      window.clearInterval(timer)
      player.removeEventListener('ended', onEnd)
      player.removeEventListener('error', onFail)
      resolve()
    }
    const onEnd = () => finish()
    const onFail = () => {
      failed = true
      finish()
    }
    const timer = window.setInterval(() => {
      if (mine !== generation) {
        player.pause()
        finish()
      }
    }, 80)
    player.addEventListener('ended', onEnd)
    player.addEventListener('error', onFail)
  })
  if (mine !== generation) {
    return 'unavailable'
  }
  return failed ? 'unsupported' : 'ok'
}

if (webSpeechOk()) {
  window.speechSynthesis.getVoices()
  window.speechSynthesis.addEventListener('voiceschanged', () => {
    window.speechSynthesis.getVoices()
  })
}
