import { Navigate, Outlet, Route, Routes } from 'react-router-dom'
import AppLayout from './AppLayout'
import { useAuth } from './auth'
import ConversationsPage from './pages/ConversationsPage'
import ListenPage from './pages/ListenPage'
import LoginPage from './pages/LoginPage'
import MePage from './pages/MePage'
import PracticePage from './pages/PracticePage'
import RegisterPage from './pages/RegisterPage'
import ScenesPage from './pages/ScenesPage'
import VerifyPage from './pages/VerifyPage'
import WelcomePage from './pages/WelcomePage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<WelcomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/verify" element={<VerifyPage />} />
      <Route element={<RequireAuth />}>
        <Route element={<AppLayout />}>
          <Route path="/conversations" element={<ConversationsPage />} />
          <Route path="/conversations/:id" element={<PracticePage />} />
          <Route path="/scenes" element={<ScenesPage />} />
          <Route path="/listen" element={<ListenPage />} />
          <Route path="/listen/:id" element={<ListenPage />} />
          <Route path="/me" element={<MePage />} />
        </Route>
      </Route>
    </Routes>
  )
}

function RequireAuth() {
  const { user, ready } = useAuth()
  if (!ready) {
    return <main className="welcome" />
  }
  if (!user) {
    return <Navigate to="/" replace />
  }
  if (!user.emailVerified) {
    return <Navigate to="/verify" replace />
  }
  return <Outlet />
}
