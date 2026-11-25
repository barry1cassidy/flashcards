import { Capacitor, registerPlugin } from '@capacitor/core'

const ListenPlayback = registerPlugin('ListenPlayback')

function nativePlayback() {
  return Capacitor.isNativePlatform()
}

export function listenPlaybackSupported() {
  return nativePlayback()
}

export function startListenPlayback(payload) {
  if (!nativePlayback()) {
    return Promise.resolve()
  }
  return ListenPlayback.start(payload).catch(() => {})
}

export function updateListenPlayback(payload) {
  if (!nativePlayback()) {
    return Promise.resolve()
  }
  return ListenPlayback.update(payload).catch(() => {})
}

export function stopListenPlayback() {
  if (!nativePlayback()) {
    return Promise.resolve()
  }
  return ListenPlayback.stop().catch(() => {})
}

export function bindListenPlayback(onAction) {
  if (!nativePlayback()) {
    return Promise.resolve(() => {})
  }
  return ListenPlayback.addListener('action', (event) => {
    if (event?.action) {
      onAction(event.action)
    }
  }).then((handle) => () => handle.remove())
}
