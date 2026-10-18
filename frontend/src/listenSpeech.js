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

export function silentAudio() {
  const sampleRate = 8000
  const samples = 800
  const dataSize = samples * 2
  const buffer = new ArrayBuffer(44 + dataSize)
  const view = new DataView(buffer)
  const write = (offset, value) => {
    for (let i = 0; i < value.length; i += 1) {
      view.setUint8(offset + i, value.charCodeAt(i))
    }
  }
  write(0, 'RIFF')
  view.setUint32(4, 36 + dataSize, true)
  write(8, 'WAVE')
  write(12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)
  view.setUint16(22, 1, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * 2, true)
  view.setUint16(32, 2, true)
  view.setUint16(34, 16, true)
  write(36, 'data')
  view.setUint32(40, dataSize, true)
  const audio = new Audio(URL.createObjectURL(new Blob([buffer], { type: 'audio/wav' })))
  audio.loop = true
  audio.volume = 0.01
  return audio
}
