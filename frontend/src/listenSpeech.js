import { Capacitor } from '@capacitor/core'
import { TextToSpeech } from '@capacitor-community/text-to-speech'
import { stopSpeaking } from './tts'

function abortError() {
  return new DOMException('Aborted', 'AbortError')
}

function webSpeechOk() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}

export function canListenSpeak() {
  return Capacitor.isNativePlatform() || webSpeechOk()
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

export function speakCue(text, lang, { signal, onProgress, immediate = false } = {}) {
  const spoken = String(text || '').trim()
  if (!spoken) {
    onProgress?.(1)
    return Promise.resolve()
  }
  if (signal?.aborted) {
    return Promise.reject(abortError())
  }

  const estimate = Math.max(700, (spoken.length / 13) * 1000)
  const started = performance.now()
  let timer = 0
  let settled = false

  return new Promise((resolve, reject) => {
    const finish = (error) => {
      if (settled) {
        return
      }
      settled = true
      window.clearInterval(timer)
      signal?.removeEventListener('abort', onAbort)
      if (error) {
        reject(error)
      } else {
        onProgress?.(1)
        resolve()
      }
    }
    const onAbort = () => {
      if (Capacitor.isNativePlatform()) {
        TextToSpeech.stop().catch(() => {})
      } else if (webSpeechOk()) {
        window.speechSynthesis.cancel()
      }
      finish(abortError())
    }
    signal?.addEventListener('abort', onAbort, { once: true })
    timer = window.setInterval(() => {
      onProgress?.(Math.min(0.97, (performance.now() - started) / estimate))
    }, 80)

    if (Capacitor.isNativePlatform()) {
      TextToSpeech.stop()
        .catch(() => {})
        .finally(() => {
          if (signal?.aborted) {
            return
          }
          TextToSpeech.speak({
            text: spoken,
            lang: lang || 'en-US',
            rate: 1,
            pitch: 1,
            volume: 1,
            category: 'playback',
          })
            .then(() => finish(signal?.aborted ? abortError() : null))
            .catch((error) => finish(signal?.aborted ? abortError() : error))
        })
      return
    }

    if (!webSpeechOk()) {
      finish(new Error('speech-unavailable'))
      return
    }
    const utterance = new SpeechSynthesisUtterance(spoken)
    utterance.lang = lang || 'en-US'
    const voice = pickVoice(utterance.lang)
    if (voice) {
      utterance.voice = voice
    }
    utterance.onend = () => finish(signal?.aborted ? abortError() : null)
    utterance.onerror = (event) => {
      const reason = event?.error || 'speech'
      if (reason === 'interrupted' || reason === 'canceled') {
        finish(abortError())
        return
      }
      finish(new Error(reason))
    }
    const start = () => {
      if (signal?.aborted || settled) {
        return
      }
      window.speechSynthesis.speak(utterance)
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume()
      }
    }
    if (immediate) {
      start()
    } else {
      window.setTimeout(start, 50)
    }
  })
}

export function stopCue() {
  stopSpeaking()
  if (Capacitor.isNativePlatform()) {
    TextToSpeech.stop().catch(() => {})
  }
}

export function waitCue(ms, signal) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(abortError())
      return
    }
    const timer = window.setTimeout(() => {
      signal?.removeEventListener('abort', onAbort)
      resolve()
    }, ms)
    const onAbort = () => {
      window.clearTimeout(timer)
      reject(abortError())
    }
    signal?.addEventListener('abort', onAbort, { once: true })
  })
}

export function listenBed() {
  const AudioCtx = window.AudioContext || window.webkitAudioContext
  if (!AudioCtx) {
    return { start() {}, kick() {}, stop() {} }
  }
  let context = null
  let oscillator = null
  let gain = null
  let started = false
  const level = 10 ** (-68 / 20)
  const fadeIn = () => {
    if (!context || !gain) {
      return
    }
    const now = context.currentTime
    gain.gain.cancelScheduledValues(now)
    gain.gain.setValueAtTime(0, now)
    gain.gain.linearRampToValueAtTime(level, now + 0.12)
  }
  const wake = () => {
    if (!started || !context) {
      return
    }
    if (context.state === 'suspended' || context.state === 'interrupted') {
      context.resume().then(fadeIn).catch(() => {})
    }
  }
  return {
    start() {
      if (started) {
        wake()
        return
      }
      context = new AudioCtx()
      oscillator = context.createOscillator()
      gain = context.createGain()
      oscillator.type = 'sine'
      oscillator.frequency.value = 200
      gain.gain.setValueAtTime(0, context.currentTime)
      oscillator.connect(gain)
      gain.connect(context.destination)
      oscillator.start()
      fadeIn()
      started = true
      context.onstatechange = wake
      document.addEventListener('visibilitychange', wake)
      wake()
    },
    kick() {
      wake()
    },
    stop() {
      if (!started) {
        return
      }
      started = false
      document.removeEventListener('visibilitychange', wake)
      try {
        oscillator?.stop()
      } catch {
        // The tone already ended.
      }
      const current = context
      oscillator = null
      gain = null
      context = null
      current?.close().catch(() => {})
    },
  }
}
