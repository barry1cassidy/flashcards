import { canListenSpeak, silentAudio, speakCue, stopCue, waitCue } from './listenSpeech'

function sideText(card, side) {
  return side === 'back' ? card.back : card.front
}

function sideLang(card, side) {
  return side === 'back' ? card.backLanguage : card.frontLanguage
}

export function createListenSession({ cards, options, onChange }) {
  let index = 0
  let lastDeck = null
  let paused = false
  let stopped = false
  let running = false
  let abort = new AbortController()
  let generation = 0
  let resumeResolve = null
  const bed = silentAudio()
  const deckIds = new Set(cards.map((card) => card.deckId))
  const multi = deckIds.size > 1 && options.announce
  const firstSide = options.side === 'back' ? 'back' : 'front'
  const secondSide = firstSide === 'front' ? 'back' : 'front'

  function cardAt() {
    if (index < 0 || index >= cards.length) {
      return null
    }
    return cards[index]
  }

  function publish(extra) {
    onChange({
      index,
      total: cards.length,
      card: cardAt(),
      paused,
      multi,
      ...extra,
    })
  }

  function interrupt() {
    generation += 1
    const current = abort
    abort = new AbortController()
    current.abort()
    stopCue()
  }

  async function waitIfPaused() {
    if (!paused || stopped) {
      return
    }
    publish({ phase: 'paused', progress: 0 })
    await new Promise((resolve) => {
      resumeResolve = resolve
    })
    resumeResolve = null
  }

  async function playCard(immediate) {
    const signal = abort.signal
    const startedGeneration = generation
    const card = cards[index]
    let now = immediate
    const say = (text, lang, phase, line, prompt) => {
      const useNow = now
      now = false
      publish({ phase, line, prompt, progress: 0 })
      return speakCue(text, lang, {
        signal,
        immediate: useNow,
        onProgress: (progress) => publish({ phase, line, prompt, progress }),
      })
    }
    if (multi && card.deckId !== lastDeck) {
      await say(card.deckName, card.frontLanguage, 'announce', card.deckName, '')
      lastDeck = card.deckId
    }
    const question = sideText(card, firstSide)
    const answer = sideText(card, secondSide)
    if (question) {
      await say(question, sideLang(card, firstSide), 'question', question, '')
    }
    if (answer && answer !== question) {
      if (question) {
        publish({ phase: 'gap', line: question, prompt: '', progress: 1 })
        await waitCue(options.waitMs, signal)
      }
      await say(answer, sideLang(card, secondSide), 'answer', answer, question)
    }
    await waitCue(450, signal)
    return startedGeneration === generation
  }

  async function loop(immediate) {
    if (running || stopped) {
      return
    }
    running = true
    bed.play().catch(() => {})
    try {
      let first = immediate
      while (!stopped) {
        if (paused) {
          await waitIfPaused()
        }
        if (stopped) {
          return
        }
        if (index >= cards.length) {
          if (options.loop && cards.length > 0) {
            index = 0
            lastDeck = null
            continue
          }
          publish({ phase: 'done', line: '', prompt: '', progress: 0 })
          bed.pause()
          return
        }
        try {
          const finished = await playCard(first)
          first = false
          if (finished && !stopped && !paused) {
            index += 1
          }
        } catch (error) {
          first = false
          if (error?.name === 'AbortError') {
            continue
          }
          if (error?.message === 'not-allowed') {
            paused = true
            publish({ phase: 'blocked', progress: 0 })
            return
          }
          publish({ phase: 'error', error: error?.message || 'speech', progress: 0 })
          return
        }
      }
    } finally {
      running = false
    }
  }

  return {
    start() {
      stopped = false
      paused = false
      if (index >= cards.length) {
        index = 0
        lastDeck = null
      }
      loop(true)
    },
    pause() {
      paused = true
      interrupt()
      bed.pause()
    },
    resume() {
      paused = false
      const wake = resumeResolve
      resumeResolve = null
      wake?.()
      if (!running) {
        loop(true)
      }
    },
    next() {
      index = Math.min(cards.length, index + 1)
      paused = false
      const wake = resumeResolve
      resumeResolve = null
      wake?.()
      interrupt()
      if (!running) {
        loop(true)
      }
    },
    previous() {
      index = Math.max(0, index - 1)
      paused = false
      const wake = resumeResolve
      resumeResolve = null
      wake?.()
      interrupt()
      if (!running) {
        loop(true)
      }
    },
    replay() {
      paused = false
      const wake = resumeResolve
      resumeResolve = null
      wake?.()
      interrupt()
      if (!running) {
        loop(true)
      }
    },
    restart() {
      index = 0
      lastDeck = null
      paused = false
      const wake = resumeResolve
      resumeResolve = null
      wake?.()
      interrupt()
      if (!running) {
        loop(true)
      }
    },
    stop() {
      stopped = true
      paused = false
      const wake = resumeResolve
      resumeResolve = null
      wake?.()
      interrupt()
      bed.pause()
      stopCue()
    },
    get speaking() {
      return canListenSpeak()
    },
  }
}

export function voiceCommand(transcript) {
  const words = String(transcript || '')
    .toLowerCase()
    .replace(/[^a-z\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
  if (words.length === 0 || words.length > 3) {
    return null
  }
  if (words.includes('next') || words.includes('skip') || words.includes('forward')) {
    return 'next'
  }
  if (words.includes('previous') || words.includes('back')) {
    return 'previous'
  }
  if (words.includes('repeat') || words.includes('replay')) {
    return 'replay'
  }
  if (words.includes('pause') || words.includes('stop')) {
    return 'pause'
  }
  if (words.includes('play') || words.includes('resume')) {
    return 'resume'
  }
  return null
}

export function canHearCommands() {
  return typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition)
}
