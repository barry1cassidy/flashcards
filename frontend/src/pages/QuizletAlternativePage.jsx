import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { clearPageMeta, setPageMeta } from '../seo'

const CHECKED = 'October 12, 2026'

const QUIZLET_STUDY = 'https://help.quizlet.com/hc/en-us/articles/360030841732-Studying-on-Quizlet'
const QUIZLET_TEST = 'https://help.quizlet.com/hc/en-us/articles/360030642972-Studying-with-Test'
const QUIZLET_EXPORT = 'https://help.quizlet.com/hc/en-us/articles/360034345672-Exporting-your-sets'
const PCMAG = 'https://au.pcmag.com/language-learning/41677/quizlet'

function Source({ href, children }) {
  return (
    <a className="compare-source" href={href} target="_blank" rel="noreferrer">
      {children}
    </a>
  )
}

const ROWS = [
  {
    name: 'Flashcards',
    zipdeck: 'Flip for as long as you want.',
    quizlet: 'Free.',
  },
  {
    name: 'Quiz',
    zipdeck: 'Unlimited. There is no round limit.',
    quizlet: (
      <>
        Limited free rounds per set. More rounds are Plus.{' '}
        <Source href={QUIZLET_STUDY}>Source: Quizlet Help</Source>
      </>
    ),
  },
  {
    name: 'Write',
    zipdeck: 'Write Answer is its own free mode. Keep going.',
    quizlet: (
      <>
        Part of Learn, so the same round limit applies.{' '}
        <Source href={QUIZLET_STUDY}>Source: Quizlet Help</Source>
      </>
    ),
  },
  {
    name: 'Match and audio',
    zipdeck: 'Match and Audio Review are free, with no round cap.',
    quizlet: 'Match is free.',
  },
  {
    name: 'Spaced repetition',
    zipdeck: 'Included. A card comes back when you are about to forget it.',
    quizlet: (
      <>
        Paid. Spaced repetition is for subscribers.{' '}
        <Source href={PCMAG}>Source: PCMag 2026</Source>
      </>
    ),
  },
  {
    name: 'Ads',
    zipdeck: 'None. Not on the website, and not in the apps.',
    quizlet: (
      <>
        Free plan includes ads. <Source href={PCMAG}>Source: PCMag 2026</Source>
      </>
    ),
  },
  {
    name: 'Your cards',
    zipdeck: 'Import a CSV, and export your own decks, free.',
    quizlet: (
      <>
        Copy the text of a set you created. Images, and sets copied from someone else, cannot be exported.{' '}
        <Source href={QUIZLET_EXPORT}>Source: Quizlet Help</Source>
      </>
    ),
  },
]

const PRO = [
  {
    title: 'Create the deck with AI',
    body: 'Describe a topic, or drop in notes, a speech, or a script. Zipdeck drafts the deck, including presets for a toast and for learning lines. You edit it, then study it.',
    accent: '#4c6fff',
  },
  {
    title: 'Rehearse it in order',
    body: 'Walk the deck from the first card to the last. Built for a speech, a talk, or a scene. Your spaced-repetition schedule stays as it is.',
    accent: '#ff6b57',
  },
  {
    title: 'Mix old material back in',
    body: 'New cards are easy to over-practice. Older ones fade. A Study Mix pulls several decks into one session so last month’s material stays in the rotation.',
    accent: '#f2b84b',
  },
  {
    title: 'Put a picture on the card',
    body: 'A photo on the front or the back. Useful for vocabulary, anatomy, maps, and anything you remember better as an image.',
    accent: '#3fcf8e',
  },
  {
    title: 'Flip it on the plane',
    body: 'Download a text copy and flip through it with no connection. Pictures stay online, and that session leaves your review schedule alone.',
    accent: '#7c6cff',
  },
]

const FAQS = [
  {
    q: 'Is Zipdeck a free Quizlet alternative?',
    a: 'Yes. Flip, Quiz, Write Answer, Match, and Audio Review are free, unlimited, and ad-free, and spaced repetition is included. Pro adds AI deck creation, pictures, Study Mixes, rehearsal in order, and an offline flip copy. The study modes stay free either way.',
  },
  {
    q: 'Is Quizlet Learn mode free?',
    a: 'Quizlet’s help center says free accounts get a limited number of Learn rounds per set. Zipdeck Quiz does not have that cap.',
  },
  {
    q: 'Does Zipdeck have ads?',
    a: 'No. The website and the apps do not show ads, on the free account or on Pro.',
  },
  {
    q: 'Can I move cards from Quizlet?',
    a: 'If you created the set, copy the text, save it as a CSV, and import it. Import and export of your own decks are free. There is no one-click Quizlet import.',
  },
  {
    q: 'What does Zipdeck Pro add?',
    a: 'Create a deck from a prompt or a file, add pictures, mix older decks into one session, rehearse a speech or script in order, and download a text copy to flip offline. Unlimited study modes, spaced repetition, and no ads stay on the free account.',
  },
]

export default function QuizletAlternativePage() {
  useEffect(() => {
    setPageMeta({
      title: 'A Free Quizlet Alternative — Zipdeck',
      description:
        'Zipdeck’s free account includes unlimited Flip, Quiz, Write, Match, and Audio, with spaced repetition and no ads. Pro adds AI, pictures, Study Mixes, rehearsal, and offline flip.',
      path: '/quizlet-alternative',
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        url: 'https://zipdeck.app/quizlet-alternative',
        isPartOf: { '@id': 'https://zipdeck.app/#website' },
        mainEntity: FAQS.map((item) => ({
          '@type': 'Question',
          name: item.q,
          acceptedAnswer: { '@type': 'Answer', text: item.a },
        })),
      },
    })
    return () => clearPageMeta()
  }, [])

  return (
    <article className="remember-page compare-page">
      <p className="kicker">Comparison</p>
      <h1>A free Quizlet alternative</h1>
      <p className="remember-lede">
        Study without a round limit, and without ads. Flip, Quiz, Write Answer, Match, and Audio
        Review are free on Zipdeck, and spaced repetition is included. On Quizlet, free Learn stops
        after a limited number of rounds, and a free account gets one practice test per set.
      </p>
      <p className="compare-checked">
        Checked {CHECKED}. Quizlet’s limits change. The notes below link to their help center and to a
        2026 review.
      </p>

      <section className="guide-section" aria-labelledby="compare-heading">
        <h2 id="compare-heading">Zipdeck vs Quizlet: what stays free</h2>
        <div className="compare-table">
          <div className="compare-head" aria-hidden="true">
            <span> </span>
            <span>Zipdeck, free</span>
            <span>Quizlet, free</span>
          </div>
          {ROWS.map((row) => (
            <div key={row.name} className="compare-row">
              <h3>{row.name}</h3>
              <p>
                <span className="compare-label">Zipdeck, free</span>
                {row.zipdeck}
              </p>
              <p>
                <span className="compare-label">Quizlet, free</span>
                {row.quizlet}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="guide-section" id="learn-mode">
        <h2>Quizlet Learn mode, without the round limit</h2>
        <p>
          People hit Quizlet’s Learn limit in the middle of a set.{' '}
          <a href={QUIZLET_STUDY} target="_blank" rel="noreferrer">Their help center</a> says Learn is a
          Plus feature, with a limited number of free rounds if you are not subscribed. Write is inside
          Learn now, so the same limit covers it.
        </p>
        <p>
          On Zipdeck, Quiz and Write Answer are separate modes. Neither one stops you after a set
          number of rounds.
        </p>
      </section>

      <section className="guide-section" id="paywall">
        <h2>The Quizlet paywall</h2>
        <p>
          <a href={QUIZLET_TEST} target="_blank" rel="noreferrer">Quizlet’s Test article</a> says a free
          account gets one practice test per set. After that, more tests are for subscribers. A{' '}
          <a href={PCMAG} target="_blank" rel="noreferrer">2026 PCMag review</a> also found that Quizlet
          Plus itself is still metered, and that Plus Unlimited is the plan that removes those meters.
          Prices change, so check Quizlet before you treat a dollar figure as current.
        </p>
        <p>
          Zipdeck does not generate a mixed exam. What the free account gives you instead is unlimited
          Quiz and Write Answer, so you can keep testing yourself without buying another round.
        </p>
      </section>

      <section className="guide-section" id="no-ads">
        <h2>Studying without ads</h2>
        <p>
          The same review says Quizlet’s free plan includes ads. Zipdeck does not. No ads on the
          website, no ads in the apps, on the free account and on Pro.
        </p>
      </section>

      <section className="guide-section" id="bring-cards">
        <h2>Bring a set you already made</h2>
        <p>
          <a href={QUIZLET_EXPORT} target="_blank" rel="noreferrer">Quizlet’s export article</a> says
          the creator of a set can copy its terms and definitions as text. Images, and sets you copied
          from someone else, are not included. Save that text as a CSV and import it into a Zipdeck
          deck. Import and export of your own decks are free. There is no button that pulls a whole
          Quizlet account across.
        </p>
      </section>

      <section className="guide-section" id="pro" aria-labelledby="pro-heading">
        <h2 id="pro-heading">Free is the alternative. Pro is the head start.</h2>
        <p>
          Quizlet’s paid plans buy more Learn rounds and more tests. Those study modes are already
          free here, without ads. Pro is a different upgrade. It builds the deck, then gives you ways
          to practice that a stack of cards does not.
        </p>
        <div className="compare-pro">
          {PRO.map((item) => (
            <div key={item.title} className="compare-pro-card" style={{ '--guide-accent': item.accent }}>
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </div>
          ))}
        </div>
        <p className="compare-pro-note">
          Flip, Quiz, Write Answer, Match, and Audio Review stay unlimited on Pro too.
        </p>
      </section>

      <section className="guide-section">
        <h2>Questions people ask</h2>
        <div className="compare-faq">
          {FAQS.map((item) => (
            <div key={item.q}>
              <h3>{item.q}</h3>
              <p>{item.a}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="guide-cta">
        <h2>Start free</h2>
        <p>
          The five study modes are on the free account. You can read the sample sets before you sign
          up. Pro is there when you want the deck built for you.
        </p>
        <div className="guide-cta-actions">
          <Link className="btn primary" to="/register">
            Create a free account
          </Link>
          <Link className="btn" to="/library">
            Browse sample sets
          </Link>
        </div>
      </div>

      <section className="guide-section">
        <h2>Sources</h2>
        <ul className="guide-sources">
          <li>
            <a href={QUIZLET_STUDY} target="_blank" rel="noreferrer">
              Quizlet Help, Studying on Quizlet
            </a>
            {' '}— checked {CHECKED}
          </li>
          <li>
            <a href={QUIZLET_TEST} target="_blank" rel="noreferrer">
              Quizlet Help, Studying with Test
            </a>
            {' '}— checked {CHECKED}
          </li>
          <li>
            <a href={QUIZLET_EXPORT} target="_blank" rel="noreferrer">
              Quizlet Help, Exporting your sets
            </a>
            {' '}— checked {CHECKED}
          </li>
          <li>
            <a href={PCMAG} target="_blank" rel="noreferrer">
              PCMag, Quizlet review (2026)
            </a>
            {' '}— ads on the free plan, and paid plans that are still metered
          </li>
        </ul>
      </section>
    </article>
  )
}
