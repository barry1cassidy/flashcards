import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../AuthContext'
import { clearPageMeta, setPageMeta } from '../seo'
import MenuIcon from './MenuIcon'

const PATH = '/teachers'

const DESCRIPTION =
  'Zipdeck Teacher mode lets you create a class, share a 6-character code, and assign decks. Students get their own copies, so ratings stay private.'

const STEPS = [
  {
    icon: 'teacher',
    title: 'Turn on Teacher mode and name the class',
    body: 'The switch is on Classes. You can still join someone else’s class as a student.',
  },
  {
    icon: 'joinCode',
    title: 'Share the 6-character code',
    body: 'Students join with the code or the link. There is no class to hunt for.',
  },
  {
    icon: 'deckCopy',
    title: 'Everyone gets their own copy',
    body: 'Assigned decks land in My Decks. Ratings and due dates stay on that copy.',
  },
]

const FAQS = [
  {
    q: 'What is Zipdeck Teacher mode?',
    a: 'Teacher mode is the switch on Classes that lets you create a class, assign decks, and see who joined. A free account is enough. Students join with a code whether or not they turn Teacher mode on.',
  },
  {
    q: 'How does a student join a class?',
    a: 'The student creates a free account and enters the 6-character code, or opens the join link. The assigned decks are copied into their account.',
  },
  {
    q: 'Do ratings stay private?',
    a: 'Yes. Each student studies their own copy of an assigned deck. Their ratings stay on that copy, not on the teacher’s deck.',
  },
]

export default function TeachersPage() {
  const { user } = useAuth()
  const next = user ? '/classes' : '/register'
  const cta = user ? 'Open Classes' : 'Create a free account'

  useEffect(() => {
    setPageMeta({
      title: 'Teacher Mode for Classes — Zipdeck',
      description: DESCRIPTION,
      path: PATH,
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        name: 'Teacher mode for classes',
        headline: 'Share a deck with a whole class',
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
    <article className="studio-article teachers-article">
      <header className="studio-article-hero">
        <div>
          <p className="kicker">Teacher mode</p>
          <h1>Share a deck with a whole class.</h1>
          <p className="studio-article-lede">
            Create a class, assign the decks, and see who joined. Students use a 6-character code.
            Each person studies their own copy, so ratings stay private.
          </p>
          <div className="studio-intro-cta">
            <Link className="btn primary" to={next}>
              {cta}
            </Link>
          </div>
        </div>
        <aside className="teachers-code-card" aria-hidden="true">
          <p className="eyebrow">Join code</p>
          <p className="teachers-code">K7M2QX</p>
          <p>Six characters. Anyone with the code or the link can join.</p>
        </aside>
      </header>

      <section aria-labelledby="teachers-how">
        <h2 id="teachers-how">How a class works</h2>
        <ol className="class-how-strip">
          {STEPS.map((step) => (
            <li className="class-how-step" key={step.icon}>
              <span className="class-how-icon" aria-hidden="true">
                <MenuIcon name={step.icon} />
              </span>
              <span className="class-how-copy">
                <strong>{step.title}</strong>
                <span className="muted">{step.body}</span>
              </span>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="teachers-paths">
        <h2 id="teachers-paths">Teachers assign. Students join.</h2>
        <div className="class-paths">
          <article className="class-path class-path-teacher">
            <div className="class-path-head">
              <span className="class-path-icon" aria-hidden="true">
                <MenuIcon name="teacher" />
              </span>
              <div>
                <h3 className="section-heading">I’m a teacher</h3>
                <p className="muted">Create the class, assign decks, and see who joined.</p>
              </div>
            </div>
            <p>
              After you sign up, open Classes and switch to Teacher. Name the class, then share the
              code. You can turn Teacher mode off later and still join a class as a student.
            </p>
          </article>
          <article className="class-path class-path-student">
            <div className="class-path-head">
              <span className="class-path-icon" aria-hidden="true">
                <MenuIcon name="student" />
              </span>
              <div>
                <h3 className="section-heading">I’m a student</h3>
                <p className="muted">Enter the code your teacher shared.</p>
              </div>
            </div>
            <p>
              Create a free account, open Classes, and enter the code. You do not need Teacher mode
              to join. The assigned decks are copied into your account.
            </p>
          </article>
        </div>
      </section>

      <section className="guide-section" aria-labelledby="teachers-faq">
        <h2 id="teachers-faq">Questions people ask</h2>
        <div className="compare-faq">
          {FAQS.map((item) => (
            <div key={item.q}>
              <h3>{item.q}</h3>
              <p>{item.a}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="guide-cta">
        <h2>Create the class after you sign up.</h2>
        <p>Open Classes and switch to Teacher. Then name the class and share the code.</p>
        <div className="guide-cta-actions">
          <Link className="btn primary" to={next}>
            {cta}
          </Link>
        </div>
      </section>
    </article>
  )
}
