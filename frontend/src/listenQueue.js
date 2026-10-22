import { api } from './api'
import { conversationToListenQueue } from './languageStudio'
import { listOfflinePacks } from './offlinePacks'
import { normalizeSpeechLanguage } from './speechLanguages'

function cardText(value) {
  return String(value || '').trim()
}

function deckFromPack(pack) {
  return {
    id: pack.id,
    name: pack.name,
    frontLanguage: normalizeSpeechLanguage(pack.frontLanguage, 'en-US'),
    backLanguage: normalizeSpeechLanguage(pack.backLanguage, 'en-US'),
    cards: [...(pack.cards || [])].sort((a, b) => (a.position ?? 0) - (b.position ?? 0)),
  }
}

async function loadDeck(id) {
  const [deck, cards] = await Promise.all([api(`/api/decks/${id}`), api(`/api/decks/${id}/cards`)])
  return {
    id: deck.id,
    name: deck.name,
    frontLanguage: normalizeSpeechLanguage(deck.frontLanguage, 'en-US'),
    backLanguage: normalizeSpeechLanguage(deck.backLanguage, 'en-US'),
    cards: [...(cards || [])].sort((a, b) => (a.position ?? 0) - (b.position ?? 0)),
  }
}

export async function loadListenQueue({ source, id, ids, nativeLanguage, targetLanguage }) {
  if (source === 'deck') {
    const deck = await loadDeck(id)
    return { title: deck.name, decks: [deck] }
  }
  if (source === 'set') {
    const detail = await api(`/api/groups/${id}`)
    const decks = []
    for (const deck of detail.decks || []) {
      decks.push(await loadDeck(deck.id))
    }
    return { title: detail.group?.name || '', decks }
  }
  if (source === 'mix') {
    const mix = await api(`/api/mixes/${id}`)
    const decks = []
    for (const deckId of mix.deckIds || []) {
      decks.push(await loadDeck(deckId))
    }
    return { title: mix.name, decks }
  }
  if (source === 'studio') {
    const conversation = await api(`/api/language-studio/conversations/${id}`)
    return conversationToListenQueue(conversation)
  }
  if (source === 'studio-sample') {
    const sample = await api(
      `/api/language-studio/samples/${encodeURIComponent(id)}?nativeLanguage=${encodeURIComponent(nativeLanguage)}&targetLanguage=${encodeURIComponent(targetLanguage)}`,
    )
    return conversationToListenQueue({
      id: sample.slug,
      title: sample.title,
      nativeLanguage: sample.nativeLanguage,
      targetLanguage: sample.targetLanguage,
      turns: sample.turns || [],
    })
  }
  if (source === 'offline') {
    const wanted = new Set(ids || [])
    const packs = (await listOfflinePacks()).filter((pack) => wanted.has(pack.id))
    const decks = packs.map(deckFromPack)
    const title = decks.length === 1 ? decks[0].name : ''
    return { title, decks }
  }
  return { title: '', decks: [] }
}

export function flattenListenCards(decks) {
  const cards = []
  for (const deck of decks || []) {
    for (const card of deck.cards || []) {
      const front = cardText(card.front)
      const back = cardText(card.back)
      if (!front && !back) {
        continue
      }
      cards.push({
        id: card.id,
        deckId: deck.id,
        deckName: deck.name,
        front,
        back,
        frontLanguage: deck.frontLanguage,
        backLanguage: deck.backLanguage,
      })
    }
  }
  return cards
}
