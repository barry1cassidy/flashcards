import { Link } from 'react-router-dom'

export default function AuthScreen({ title, lede, error, onSubmit, action, footer, children }) {
  return (
    <main className="welcome auth-screen">
      <header className="brand">
        <Link to="/" className="brand">
          <img src="/mark.svg?v=6" alt="" width="44" height="44" />
          <p className="wordmark">
            <span>Zip</span>CONVO
          </p>
        </Link>
      </header>
      <form className="auth-form" onSubmit={onSubmit}>
        <div className="screen-copy">
          <h1>{title}</h1>
          {lede ? <p>{lede}</p> : null}
        </div>
        {children}
        {error ? <p className="error">{error}</p> : null}
        {action}
      </form>
      <p className="signin">{footer}</p>
    </main>
  )
}
