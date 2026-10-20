import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { clearPageMeta, setPageMeta } from '../seo'
import AudioTrack from './AudioTrack'
import { UseScene } from './ListenScenes'

const USES = [
  {
    title: 'A walk',
    body: 'The phone stays in a pocket. You hear the question, then the answer.',
    scene: 'walk',
  },
  {
    title: 'A run',
    body: 'No tapping. The next card starts when the pause ends.',
    scene: 'run',
  },
  {
    title: 'A workout',
    body: 'A few cards fit in the rest between sets.',
    scene: 'workout',
  },
  {
    title: 'Chores',
    body: 'Dishes, laundry, or tidying, and the deck keeps moving.',
    scene: 'chores',
  },
]

export default function AudioFlashcardsPage() {
  useEffect(() => {
    const description =
      'Audio Flashcards play a deck, a set, or a study mix out loud. Hear the question, a pause, then the answer while you walk, run, work out, or do chores.'
    setPageMeta({
      title: 'Audio Flashcards for Walking and Workouts — Zipdeck',
      description,
      path: '/audio-flashcards',
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: 'Audio Flashcards',
        headline: 'Audio Flashcards for when your hands are busy',
        description,
        url: 'https://zipdeck.app/audio-flashcards',
        inLanguage: 'en',
        isPartOf: { '@id': 'https://zipdeck.app/#website' },
        about: { '@id': 'https://zipdeck.app/#app' },
      },
    })
    return () => clearPageMeta()
  }, [])

  return (
    <article className="listen-article">
      <header className="listen-article-hero">
        <h1>Audio Flashcards for when your hands are busy</h1>
        <p>
          Audio Flashcards speak the front, wait while you answer, then speak the answer. A deck, a set, or a study
          mix can play as one session, and it says the deck name when the deck changes.
        </p>
      </header>

      <section aria-labelledby="listen-uses">
        <h2 id="listen-uses">Where it fits</h2>
        <div className="listen-uses">
          {USES.map((item) => (
            <figure className="listen-use" key={item.scene}>
              <UseScene scene={item.scene} />
              <figcaption>
                <strong>{item.title}</strong>
                <span>{item.body}</span>
              </figcaption>
            </figure>
          ))}
        </div>
        <p className="listen-article-note">
          This is for time on your feet. Listening does not change your study schedule.
        </p>
      </section>

      <section aria-labelledby="listen-controls">
        <h2 id="listen-controls">Hear the question, then the answer</h2>
        <div className="listen-board">
          <div className="listen-promo-card">
            <p className="eyebrow">Question</p>
            <AudioTrack text="Who painted The Persistence of Memory?" progress={0.46} active />
            <h3>Who painted The Persistence of Memory?</h3>
          </div>
          <div className="listen-board-transport">
            <Control icon="previous" label="Previous" />
            <Control icon="replay" label="Replay" />
            <Control icon="pause" label="Pause" primary />
            <Control icon="next" label="Next" />
          </div>
          <p className="listen-board-caption">The same four actions are on your headphones and the lock screen.</p>
          <ul className="listen-facts">
            <li>Pause after the question</li>
            <li>Front or answer first</li>
            <li>Start over at the end</li>
          </ul>
        </div>
      </section>

      <section className="listen-article-end">
        <h2>Make a deck, then press play.</h2>
        <Link className="btn primary" to="/register">
          Create your first deck
        </Link>
      </section>
    </article>
  )
}

function Control({ icon, label, primary = false }) {
  return (
    <div className={primary ? 'is-play' : undefined}>
      <ControlIcon name={icon} />
      <span>{label}</span>
    </div>
  )
}

function ControlIcon({ name }) {
  if (name === 'previous') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M6 6v12M18 6l-8 6 8 6z" />
      </svg>
    )
  }
  if (name === 'next') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M6 6l8 6-8 6zM18 6v12" />
      </svg>
    )
  }
  if (name === 'replay') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M8 8H4V4" />
        <path d="M4.5 8a8 8 0 1 1-1 4" />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="7" y="5" width="3.5" height="14" rx="1" />
      <rect x="13.5" y="5" width="3.5" height="14" rx="1" />
    </svg>
  )
}

