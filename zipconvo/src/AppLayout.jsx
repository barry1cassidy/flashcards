import { Link, Outlet } from 'react-router-dom'
import TabBar from './TabBar'

export default function AppLayout() {
  return (
    <div className="app-shell">
      <header className="app-bar">
        <Link to="/conversations" className="brand brand-link">
          <img src="/mark.png?v=7" alt="" width="36" height="36" />
          <p className="wordmark">
            <span>Zip</span>CONVO
          </p>
        </Link>
      </header>
      <div className="app-main">
        <Outlet />
      </div>
      <TabBar />
    </div>
  )
}
