const WRITE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])

let active = 0
const listeners = new Set()

function notify() {
  for (const listener of listeners) {
    listener(active > 0)
  }
}

export function isWriteRequest(method) {
  return WRITE_METHODS.has(String(method || 'GET').toUpperCase())
}

export function beginSaving() {
  active += 1
  notify()
}

export function endSaving() {
  active = Math.max(0, active - 1)
  notify()
}

export function subscribeSaving(listener) {
  listeners.add(listener)
  listener(active > 0)
  return () => listeners.delete(listener)
}
