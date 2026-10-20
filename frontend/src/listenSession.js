import { bindListenPlayback, startListenPlayback, stopListenPlayback, updateListenPlayback } from './listenPlayback'
import { listenBed, speakCue, stopCue, waitCue } from './listenSpeech'

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
  let shownLine = ''
  let shownPrompt = ''
  let sleepTimer = 0
  let sleepDeadline = 0
  const sleepMs = Number(options.sleepMs) > 0 ? Number(options.sleepMs) : 0
  const bed = listenBed()
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

  let playbackKey = ''
  let detachPlayback = () => {}
  let playbackClosed = false

  function playbackLabel() {
    const card = cardAt()
    return {
      title: (shownLine || card?.deckName || 'Zipdeck').slice(0, 80),
      artist: (card?.deckName || 'Zipdeck').slice(0, 80),
    }
  }

  function syncPlayback(phase) {
    if (playbackClosed) {
      return
    }
    if (phase === 'done' || phase === 'error') {
      playbackKey = phase
      stopListenPlayback()
      return
    }
    const resting = paused || phase === 'paused' || phase === 'blocked'
    const key = `${phase}|${shownLine}|${resting}`
    if (key === playbackKey) {
      return
    }
    playbackKey = key
    updateListenPlayback({ ...playbackLabel(), paused: resting, sleepAt: sleepDeadline })
  }

  function publish(extra) {
    if (Object.hasOwn(extra, 'line')) {
      shownLine = extra.line
    }
    if (Object.hasOwn(extra, 'prompt')) {
      shownPrompt = extra.prompt
    }
    onChange({
      index,
      total: cards.length,
      card: cardAt(),
      paused,
      multi,
      line: shownLine,
      prompt: shownPrompt,
      sleepDeadline,
      ...extra,
    })
    if (extra.phase) {
      syncPlayback(extra.phase)
    }
  }

  function disarmSleep() {
    window.clearTimeout(sleepTimer)
    sleepTimer = 0
  }

  function endForSleep() {
    if (stopped) {
      return
    }
    stopped = true
    disarmSleep()
    sleepDeadline = 0
    playbackClosed = true
    detachPlayback()
    detachPlayback = () => {}
    stopListenPlayback()
    const wake = resumeResolve
    resumeResolve = null
    wake?.()
    interrupt()
    bed.stop()
    stopCue()
    publish({ phase: 'slept', line: '', prompt: '', progress: 0 })
  }

  function armSleep(push) {
    disarmSleep()
    if (sleepMs > 0) {
      sleepDeadline = Date.now() + sleepMs
      const delay = Math.max(0, sleepDeadline - Date.now())
      sleepTimer = window.setTimeout(endForSleep, delay)
    } else {
      sleepDeadline = 0
    }
    if (push) {
      updateListenPlayback({ ...playbackLabel(), paused, sleepAt: sleepDeadline })
    }
  }

  function sleepDue() {
    return sleepDeadline > 0 && Date.now() >= sleepDeadline
  }

  const controls = {}
  bindListenPlayback((action) => {
    if (playbackClosed) {
      return
    }
    if (action === 'sleep') {
      endForSleep()
      return
    }
    const name = action === 'play' ? 'resume' : action
    controls[name]?.()
  }).then((detach) => {
    if (playbackClosed) {
      detach()
      return
    }
    detachPlayback = detach
  })

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
    const keepGoing = () => !stopped && !sleepDue()
    if (multi && card.deckId !== lastDeck) {
      await say(card.deckName, card.frontLanguage, 'announce', card.deckName, '')
      if (!keepGoing()) {
        return false
      }
      lastDeck = card.deckId
    }
    const question = sideText(card, firstSide)
    const answer = sideText(card, secondSide)
    if (question) {
      await say(question, sideLang(card, firstSide), 'question', question, '')
      if (!keepGoing()) {
        return false
      }
    }
    if (answer && answer !== question) {
      if (question) {
        publish({ phase: 'gap', line: question, prompt: '', progress: 1 })
        await waitCue(options.waitMs, signal)
        if (!keepGoing()) {
          return false
        }
      }
      await say(answer, sideLang(card, secondSide), 'answer', answer, question)
      if (!keepGoing()) {
        return false
      }
    }
    await waitCue(450, signal)
    if (!keepGoing()) {
      return false
    }
    return startedGeneration === generation
  }

  async function loop(immediate) {
    if (running || stopped) {
      return
    }
    running = true
    armSleep(false)
    bed.start()
    startListenPlayback({ ...playbackLabel(), sleepAt: sleepDeadline }).then(() => bed.kick())
    try {
      let first = immediate
      while (!stopped) {
        if (sleepDue()) {
          endForSleep()
          return
        }
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
          disarmSleep()
          sleepDeadline = 0
          publish({ phase: 'done', line: '', prompt: '', progress: 0 })
          return
        }
        try {
          const finished = await playCard(first)
          first = false
          if (sleepDue()) {
            endForSleep()
            return
          }
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
          if (sleepDue()) {
            endForSleep()
            return
          }
          publish({ phase: 'error', error: error?.message || 'speech', progress: 0 })
          return
        }
      }
    } finally {
      running = false
      if (!paused) {
        bed.stop()
      }
    }
  }

  const session = {
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
      stopped = false
      const wake = resumeResolve
      resumeResolve = null
      wake?.()
      interrupt()
      if (!running) {
        loop(true)
      } else {
        armSleep(true)
      }
    },
    stop() {
      stopped = true
      paused = false
      disarmSleep()
      sleepDeadline = 0
      playbackClosed = true
      detachPlayback()
      detachPlayback = () => {}
      stopListenPlayback()
      const wake = resumeResolve
      resumeResolve = null
      wake?.()
      interrupt()
      bed.stop()
      stopCue()
    },
  }
  Object.assign(controls, session)
  return session
}
