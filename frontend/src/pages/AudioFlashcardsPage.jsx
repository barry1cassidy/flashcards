import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { clearPageMeta, setPageMeta } from '../seo'
import AudioTrack from './AudioTrack'

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
        <h2 id="listen-controls">Buttons you can use without looking</h2>
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

function UseScene({ scene }) {
  return (
    <svg viewBox="0 0 240 150" aria-hidden="true">
      <path className="listen-ground" d="M20 128h200" />
      {scene === 'walk' ? <WalkFigure /> : null}
      {scene === 'run' ? <RunFigure /> : null}
      {scene === 'workout' ? <WorkoutFigure /> : null}
      {scene === 'chores' ? <ChoresFigure /> : null}
    </svg>
  )
}

function Headphones({ x, y }) {
  return (
    <g className="listen-phones" transform={`translate(${x} ${y})`}>
      <path d="M-14 4a14 14 0 0 1 28 0" />
      <rect x="-16" y="2" width="6" height="12" rx="2" />
      <rect x="10" y="2" width="6" height="12" rx="2" />
    </g>
  )
}

function WalkFigure() {
  return (
    <g className="listen-figure">
      <circle cx="108" cy="46" r="14" />
      <Headphones x={108} y={40} />
      <path d="M108 62v28M108 74l-18 12M108 74l16 8M108 90l-16 30M108 90l18 24" />
      <g className="listen-bars" transform="translate(150 78)">
        <rect x="0" y="10" width="4" height="14" rx="2" />
        <rect x="8" y="4" width="4" height="20" rx="2" />
        <rect x="16" y="8" width="4" height="16" rx="2" />
        <rect x="24" y="2" width="4" height="22" rx="2" />
        <rect x="32" y="12" width="4" height="12" rx="2" />
      </g>
    </g>
  )
}

function RunFigure() {
  return (
    <g className="listen-figure">
      <path className="listen-motion" d="M36 70h28M28 86h24M40 102h20" />
      <circle cx="118" cy="42" r="14" />
      <Headphones x={118} y={36} />
      <path d="M118 58l16 26M134 84l-22 10M134 84l20 6M134 84l-8 34M134 84l18 28" />
    </g>
  )
}

function WorkoutFigure() {
  return (
    <g className="listen-figure">
      <circle cx="120" cy="40" r="14" />
      <Headphones x={120} y={34} />
      <path d="M120 56v30M120 86l-16 32M120 86l16 32M120 70l-28-8M120 70l28-8" />
      <g className="listen-phones">
        <rect x="78" y="56" width="16" height="6" rx="2" />
        <rect x="146" y="56" width="16" height="6" rx="2" />
      </g>
    </g>
  )
}

function ChoresFigure() {
  return (
    <g className="listen-figure">
      <path d="M48 96h70v32H48z" />
      <circle cx="150" cy="44" r="14" />
      <Headphones x={150} y={38} />
      <path d="M150 60v28M150 72l-22 16M150 88l-12 30M150 88l14 28" />
      <g className="listen-phones">
        <circle cx="68" cy="86" r="8" />
        <circle cx="90" cy="84" r="7" />
      </g>
    </g>
  )
}
