import { api } from './api'

const SILENT_WAV = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA'

let generation = 0
let audio = null
let objectUrl = ''

export function isIrish(lang) {
  const value = String(lang || '').trim().toLowerCase().replaceAll('_', '-')
  return value === 'ga' || value === 'ga-ie'
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

export function stopHostedSpeech() {
  generation += 1
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

// Call this inside the tap, before any await, so iOS will allow the real clip.
export function unlockHostedAudio() {
  const player = ensureAudio()
  player.src = SILENT_WAV
  const pending = player.play()
  pending?.catch(() => {})
}

function abortError() {
  return new DOMException('Aborted', 'AbortError')
}

export async function playHostedSpeech(text, { signal, rate = 1, wait = false, onProgress } = {}) {
  const mine = ++generation
  if (signal?.aborted) {
    throw abortError()
  }
  let blob
  try {
    blob = await api('/api/speech', {
      method: 'POST',
      body: JSON.stringify({ text, lang: 'ga-IE' }),
      signal,
      skipSaving: true,
      redirectOn401: false,
    })
  } catch (error) {
    if (error?.name === 'AbortError' || signal?.aborted || mine !== generation) {
      throw abortError()
    }
    return 'unsupported'
  }
  if (mine !== generation || signal?.aborted) {
    throw abortError()
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
  } catch (error) {
    if (mine !== generation || signal?.aborted) {
      throw abortError()
    }
    if (error?.name === 'NotAllowedError' && wait) {
      throw new Error('not-allowed')
    }
    return 'unsupported'
  }
  if (mine !== generation) {
    throw abortError()
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
  await new Promise((resolve, reject) => {
    let settled = false
    const finish = (error) => {
      if (settled) {
        return
      }
      settled = true
      window.clearInterval(timer)
      player.removeEventListener('ended', onEnd)
      player.removeEventListener('error', onFail)
      if (error) {
        reject(error)
      } else {
        onProgress?.(1)
        resolve()
      }
    }
    const onEnd = () => finish(null)
    const onFail = () => finish(new Error('speech'))
    const timer = window.setInterval(() => {
      if (mine !== generation || signal?.aborted) {
        finish(abortError())
        return
      }
      if (player.duration && Number.isFinite(player.duration) && player.duration > 0) {
        onProgress?.(Math.min(0.97, player.currentTime / player.duration))
      }
    }, 80)
    player.addEventListener('ended', onEnd)
    player.addEventListener('error', onFail)
    signal?.addEventListener('abort', () => finish(abortError()), { once: true })
  })
  return 'ok'
}
