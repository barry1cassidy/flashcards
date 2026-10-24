import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { clearPageMeta, setPageMeta } from '../seo'
import { STUDIO_LOCATION_ICONS, STUDIO_SCENARIOS } from '../languageStudio'
import MenuIcon from './MenuIcon'

const CHECKED = 'October 21, 2026'
const PATH = '/language-conversations'

const SWAIN = 'https://doi.org/10.3138/cmlr.50.1.158'
const ACTFL = 'https://www.actfl.org/proficiency-guidelines-overview'
const SAITO = 'https://doi.org/10.1177/0267658319884981'
const DEJONG = 'https://doi.org/10.1111/j.1467-9922.2010.00620.x'
const RECALL = 'https://www.cambridge.org/core/journals/recall/article/dialoguebased-computerassisted-language-learning-systems-for-second-language-speaking-development-a-threelevel-metaanalysis/31847710516602398819C5E594038E7B'

const PLACES = [
  { id: 'cafe', label: 'Cafe' },
  { id: 'airport', label: 'Airport' },
  { id: 'doctor', label: 'Doctor' },
  { id: 'hotel', label: 'Hotel' },
  { id: 'pharmacy', label: 'Pharmacy' },
  { id: 'interview', label: 'Job interview' },
]

const STEPS = [
  {
    icon: 'custom',
    title: 'You describe the scene',
    body: 'A pharmacy, a hotel desk, a job interview, or a place you type yourself. Pick a fluency level from A1 to C1.',
  },
  {
    icon: 'studio',
    title: 'AI writes both sides',
    body: 'Language Studio drafts a short spoken dialogue. The other person speaks first. Your lines are the ones you have to say.',
  },
  {
    icon: 'practice',
    title: 'You say it before you hear it',
    body: 'The meaning is in your language. The line to say is in theirs. Reveal after you try. Then listen to the same scene out loud.',
  },
]

const FAQS = [
  {
    q: 'What is Zipdeck Language Studio?',
    a: 'Language Studio is a Pro feature that writes a spoken conversation at your fluency level. You describe a situation, AI drafts the scene, and you practice it turn by turn or listen to both sides. You grade the whole conversation, not each line.',
  },
  {
    q: 'Why practice conversations instead of only flashcards?',
    a: 'Flashcards help you remember words. Fluency is using those words in a situation you have not rehearsed. ACTFL measures speaking by what you can do in real-world conversation. Research on language production, repeated speaking tasks, and dialogue systems all point the same way: you have to say the line, not only recognize it.',
  },
  {
    q: 'How does AI generate a language conversation?',
    a: 'You choose the language you speak, the language you are learning, a location or a custom scene, and a fluency level. Optional details steer the plot. AI writes a short dialogue you can practice or listen to. Generate uses one AI credit. Sample scenes do not.',
  },
  {
    q: 'Is Language Studio free?',
    a: 'No. Language Studio is included with Zipdeck Pro. Flip, Quiz, Write Answer, Match, and Audio Review stay free. Pro adds AI-generated conversations, sample scenes inside Language Studio, Listen, and the other Pro study tools.',
  },
  {
    q: 'Can I listen to an AI conversation like audio flashcards?',
    a: 'Yes. After a scene exists, Listen plays both sides with the pause you already use for decks. When it finishes, you grade the whole scene the same way as Practice. Practice is the mode that asks you to say your line first.',
  },
]

const DESCRIPTION =
  'Zipdeck Language Studio uses AI to write a spoken conversation at your fluency level. Practice the scene turn by turn, or listen to both sides — built for speaking, not only word lists.'

export default function LanguageConversationsPage() {
  useEffect(() => {
    setPageMeta({
      title: 'AI Language Conversations for Fluency — Zipdeck',
      description: DESCRIPTION,
      path: PATH,
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        name: 'AI language conversations for fluency',
        headline: 'The path to a language is a conversation you can finish',
        description: DESCRIPTION,
        url: `https://zipdeck.app${PATH}`,
        inLanguage: 'en',
        isPartOf: { '@id': 'https://zipdeck.app/#website' },
        about: { '@id': 'https://zipdeck.app/#app' },
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
    <article className="studio-article">
      <header className="studio-article-hero">
        <div>
          <p className="kicker">Language Studio</p>
          <h1>The path to a language is a conversation you can finish.</h1>
          <p className="studio-article-lede">
            You can study lists for years and still freeze at the counter. Language Studio uses AI to
            write a spoken scene at your fluency level — a pharmacy, a cafe, a hotel desk, or a
            situation you describe. You hear the other person, try your line, then say it.
          </p>
          <div className="studio-intro-cta">
            <Link className="btn primary" to="/register">
              Create a free account
            </Link>
          </div>
        </div>
        <ConversationDemo />
      </header>

      <section aria-labelledby="studio-why">
        <h2 id="studio-why">Why conversation, not another word list</h2>
        <p>
          Knowing a word on a card is not the same as producing it when someone is waiting. That gap
          is the one Language Studio is built to close.
        </p>
        <div className="studio-article-points">
          <article>
            <h3>You have to say it</h3>
            <p>
              Merrill Swain’s output hypothesis grew out of French immersion: students could
              understand a lot, and still lagged when they had to speak. Listening is necessary.
              Producing the line is part of learning, not only proof of it.{' '}
              <a href={SWAIN} target="_blank" rel="noreferrer">
                Source: Swain, 1993
              </a>
            </p>
          </article>
          <article>
            <h3>Fluency is a real-world task</h3>
            <p>
              ACTFL’s proficiency guidelines describe speaking as what you can do in spontaneous,
              unrehearsed situations — asking for a room, handling a transaction, describing what
              happened. That is a conversation, not a matching exercise.{' '}
              <a href={ACTFL} target="_blank" rel="noreferrer">
                Source: ACTFL Proficiency Guidelines
              </a>
            </p>
          </article>
          <article>
            <h3>The same scene, again</h3>
            <p>
              Repeating one speaking task until the words come faster is how fluency proceduralizes.
              Weekly conversation also moves grammar, rate, and — for less experienced learners —
              vocabulary and pause time. Language Studio grades the whole scene so you come back to
              it.{' '}
              <a href={DEJONG} target="_blank" rel="noreferrer">
                de Jong &amp; Perfetti, 2011
              </a>
              {' · '}
              <a href={SAITO} target="_blank" rel="noreferrer">
                Saito et al., 2020
              </a>
            </p>
          </article>
        </div>
        <p className="studio-article-note">
          Open-ended “free talk” without a goal is weaker. A{' '}
          <a href={RECALL} target="_blank" rel="noreferrer">
            2025 meta-analysis of dialogue systems
          </a>{' '}
          found moderate gains in speaking, with the better results on goal-oriented, meaning-constrained
          tasks — a scene with a job to finish, not a chatbot with nowhere to go.
        </p>
      </section>

      <section aria-labelledby="studio-ai">
        <h2 id="studio-ai">AI writes a conversation you will actually say</h2>
        <p>
          You are not handed one canned script. You pick the languages, the place, and the fluency
          level. Language Studio drafts a short dialogue for that scene. Generate uses 1 credit.
          Sample scenes inside Language Studio do not.
        </p>
        <ol className="studio-article-steps">
          {STEPS.map((step, index) => (
            <li key={step.title}>
              <span className="studio-article-step-num">{index + 1}</span>
              <span className="studio-location-icon" aria-hidden="true">
                <MenuIcon name={step.icon} />
              </span>
              <div>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
        <div className="studio-article-prompt" aria-hidden="true">
          <p>
            <strong>I speak Spanish.</strong> I am learning English. A2. At the pharmacy. A sore
            throat that started yesterday.
          </p>
          <span>AI writes the scene</span>
          <p>
            Pharmacist: <em>Hello, how can I help you today?</em>
            <br />
            You: <em>I need something for a sore throat.</em>
          </p>
        </div>
      </section>

      <section aria-labelledby="studio-places">
        <h2 id="studio-places">Walk into a place. Play your part.</h2>
        <ul className="studio-intro-places">
          {PLACES.map((place) => (
            <li key={place.id} className={`studio-location studio-location-${place.id}`}>
              <span className="studio-location-icon" aria-hidden="true">
                <MenuIcon name={STUDIO_LOCATION_ICONS[place.id]} />
              </span>
              <span>{place.label}</span>
            </li>
          ))}
          <li className="studio-location studio-location-custom">
            <span className="studio-location-icon" aria-hidden="true">
              <MenuIcon name="custom" />
            </span>
            <span>Any scene you describe</span>
          </li>
        </ul>
        <p className="studio-article-note">{STUDIO_SCENARIOS.length} starter locations, or type your own.</p>
      </section>

      <section aria-labelledby="studio-modes">
        <h2 id="studio-modes">Practice the turns, then hear the whole scene</h2>
        <div className="studio-article-modes">
          <article>
            <span className="studio-location-icon" aria-hidden="true">
              <MenuIcon name="practice" />
            </span>
            <h3>Practice</h3>
            <p>
              Chat through the scene. Your language is the meaning. The language you are learning is
              the line to say. Reveal after you try, then go to the next turn.
            </p>
          </article>
          <article>
            <span className="studio-location-icon" aria-hidden="true">
              <MenuIcon name="listen" />
            </span>
            <h3>Listen</h3>
            <p>
              The same pause, repeat, and sleep timer you already use for decks. Both sides play out
              loud. When it finishes, you grade the whole scene the same way as Practice.
            </p>
          </article>
        </div>
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
        <h2>Describe a scene. Say your line.</h2>
        <p>
          Language Studio is included with Pro. The free account still has unlimited Flip, Quiz,
          Write, Match, and Audio Review.
        </p>
        <div className="guide-cta-actions">
          <Link className="btn primary" to="/register">
            Create a free account
          </Link>
          <Link className="btn" to="/pro">
            See what Pro includes
          </Link>
        </div>
      </div>

      <section className="guide-section">
        <h2>Sources</h2>
        <ul className="guide-sources">
          <li>
            <a href={SWAIN} target="_blank" rel="noreferrer">
              Merrill Swain, “The Output Hypothesis: Just Speaking and Writing Aren’t Enough” (1993)
            </a>
            {' '}— producing language is part of learning, not only a test of it. Checked {CHECKED}.
          </li>
          <li>
            <a href={ACTFL} target="_blank" rel="noreferrer">
              ACTFL Proficiency Guidelines
            </a>
            {' '}— speaking proficiency is what you can do in real-world, unrehearsed situations.
            Checked {CHECKED}.
          </li>
          <li>
            <a href={DEJONG} target="_blank" rel="noreferrer">
              de Jong &amp; Perfetti, Language Learning (2011)
            </a>
            {' '}— repeating the same speaking task produced lasting fluency through proceduralization.
          </li>
          <li>
            <a href={SAITO} target="_blank" rel="noreferrer">
              Saito, Suzuki, Oyama &amp; Akiyama, Second Language Research (2020)
            </a>
            {' '}— a semester of weekly conversation improved speech; less proficient learners gained
            across vocabulary, accuracy, and fluency.
          </li>
          <li>
            <a href={RECALL} target="_blank" rel="noreferrer">
              ReCALL meta-analysis of dialogue-based CALL (2025)
            </a>
            {' '}— moderate speaking gains (g = 0.61); stronger when the task is goal-oriented and
            meaning-constrained.
          </li>
        </ul>
      </section>
    </article>
  )
}

function ConversationDemo() {
  return (
    <figure className="studio-intro-demo" aria-label="A Language Studio conversation at a pharmacy">
      <div className="studio-intro-demo-head">
        <strong>At the pharmacy</strong>
        <span className="studio-pill">A2</span>
      </div>
      <div className="studio-chat">
        <div className="studio-bubble is-them">
          <p className="studio-speaker">Pharmacist</p>
          <p className="studio-line">Hello, how can I help you today?</p>
          <p className="muted">Hola, ¿en qué puedo ayudarle hoy?</p>
        </div>
        <div className="studio-bubble is-you">
          <p className="studio-speaker">You</p>
          <p className="studio-line">I need something for a headache.</p>
          <p className="muted">Necesito algo para un dolor de cabeza.</p>
        </div>
      </div>
      <figcaption>
        You play the customer. AI writes the scene at your level. Spanish is the meaning; English is
        the line to say.
      </figcaption>
    </figure>
  )
}
