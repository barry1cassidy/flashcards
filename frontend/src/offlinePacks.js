const DB_NAME = 'zipdeck-offline'
const STORE = 'packs'

function openDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id' })
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

function requestResult(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function listOfflinePacks() {
  const db = await openDb()
  try {
    const packs = await requestResult(db.transaction(STORE, 'readonly').objectStore(STORE).getAll())
    return packs.sort((a, b) => a.name.localeCompare(b.name))
  } finally {
    db.close()
  }
}

export async function getOfflinePack(id) {
  const db = await openDb()
  try {
    return (await requestResult(db.transaction(STORE, 'readonly').objectStore(STORE).get(id))) || null
  } finally {
    db.close()
  }
}

export async function saveOfflinePack(snapshot) {
  const cards = (snapshot.cards || [])
    .filter((card) => String(card.front || '').trim() || String(card.back || '').trim())
    .map((card) => ({
      id: card.id,
      front: card.front || '',
      back: card.back || '',
      hint: card.hint || '',
      position: card.position ?? 0,
    }))
  if (cards.length === 0) {
    return null
  }
  const pack = {
    id: snapshot.id,
    name: snapshot.name,
    description: snapshot.description || '',
    frontLanguage: snapshot.frontLanguage || '',
    backLanguage: snapshot.backLanguage || '',
    downloadedAt: new Date().toISOString(),
    cards,
  }
  const db = await openDb()
  try {
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).put(pack)
    await new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
      tx.onabort = () => reject(tx.error)
    })
    return pack
  } finally {
    db.close()
  }
}

export async function removeOfflinePack(id) {
  const db = await openDb()
  try {
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).delete(id)
    await new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
      tx.onabort = () => reject(tx.error)
    })
  } finally {
    db.close()
  }
}
