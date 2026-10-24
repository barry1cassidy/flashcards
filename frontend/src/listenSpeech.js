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

// One speak at a time. Next used to stop and speak again before the engine had
// left the previous language, so a Chinese line kept the English voice.
const SETTLE_MS = 120
let chain = Promise.resolve()
let depth = 0
let turn = 0

function claimTurn() {
  turn += 1
  return turn
}

function stale(myTurn, signal) {
  return Boolean(signal?.aborted) || myTurn !== turn
}

function enqueue(task) {
  depth += 1
  const run = chain.then(task, task)
  chain = run.then(
    () => {},
    () => {},
  )
  chain.finally(() => {
    depth -= 1
  })
  return run
}

async function engineStop() {
  if (Capacitor.isNativePlatform()) {
    await TextToSpeech.stop().catch(() => {})
    return
  }
  stopSpeaking()
}

function settle(ms, signal) {
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

function speakEngine(spoken, lang, speechRate, signal, onProgress, estimate, myTurn) {
  return new Promise((resolve, reject) => {
    if (stale(myTurn, signal)) {
      reject(abortError())
      return
    }
    let settled = false
    let timer = 0
    let stopPromise = null
    const started = performance.now()
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
    // The promise is stored before stop() runs. Web cancel() can fire the
    // utterance error in that same call, and the next speak must wait for it.
    const beginStop = () => {
      if (!stopPromise) {
        let release
        stopPromise = new Promise((resolveStop) => {
          release = resolveStop
        })
        engineStop().finally(release)
      }
      return stopPromise
    }
    const onAbort = () => {
      beginStop().finally(() => finish(abortError()))
    }
    const ended = (error) => {
      if (stopPromise || stale(myTurn, signal)) {
        beginStop().finally(() => finish(abortError()))
        return
      }
      finish(error)
    }
    signal?.addEventListener('abort', onAbort, { once: true })
    timer = window.setInterval(() => {
      onProgress?.(Math.min(0.97, (performance.now() - started) / estimate))
    }, 80)

    if (Capacitor.isNativePlatform()) {
      TextToSpeech.speak({
        text: spoken,
        lang: lang || 'en-US',
        rate: speechRate,
        pitch: 1,
        volume: 1,
        category: 'playback',
      })
        .then(() => ended(null))
        .catch((error) => ended(error))
      return
    }

    if (!webSpeechOk()) {
      finish(new Error('speech-unavailable'))
      return
    }
    const utterance = new SpeechSynthesisUtterance(spoken)
    utterance.lang = lang || 'en-US'
    utterance.rate = speechRate
    const voice = pickVoice(utterance.lang)
    if (voice) {
      utterance.voice = voice
    }
    utterance.onend = () => ended(null)
    utterance.onerror = (event) => {
      const reason = event?.error || 'speech'
      if (reason === 'interrupted' || reason === 'canceled') {
        ended(abortError())
        return
      }
      ended(new Error(reason))
    }
    window.speechSynthesis.speak(utterance)
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume()
    }
  })
}

async function runCue({ myTurn, signal, spoken, lang, speechRate, onProgress, estimate }) {
  if (stale(myTurn, signal)) {
    throw abortError()
  }
  await engineStop()
  await settle(SETTLE_MS, signal)
  if (stale(myTurn, signal)) {
    throw abortError()
  }
  await speakEngine(spoken, lang, speechRate, signal, onProgress, estimate, myTurn)
}

export function speakCue(text, lang, { signal, onProgress, immediate = false, rate = 1 } = {}) {
  const spoken = String(text || '').trim()
  if (!spoken) {
    onProgress?.(1)
    return Promise.resolve()
  }
  if (signal?.aborted) {
    return Promise.reject(abortError())
  }

  const speechRate = Number.isFinite(Number(rate)) && Number(rate) > 0 ? Number(rate) : 1
  const estimate = Math.max(700, ((spoken.length / 13) * 1000) / speechRate)
  const myTurn = claimTurn()

  // The first line has to call speak() inside the tap. Later lines wait until stop has finished.
  if (immediate && depth === 0) {
    depth += 1
    const run = speakEngine(spoken, lang, speechRate, signal, onProgress, estimate, myTurn)
    chain = run.then(
      () => {},
      () => {},
    )
    chain.finally(() => {
      depth -= 1
    })
    return run
  }

  return enqueue(() => runCue({ myTurn, signal, spoken, lang, speechRate, onProgress, estimate }))
}

export function stopCue() {
  claimTurn()
  enqueue(() => engineStop())
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
