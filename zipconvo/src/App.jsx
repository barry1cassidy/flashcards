import { Navigate, Outlet, Route, Routes } from 'react-router-dom'
import AppLayout from './AppLayout'
import { useAuth } from './auth'
import ConversationCardsPage from './pages/ConversationCardsPage'
import ConversationsPage from './pages/ConversationsPage'
import ListenPage from './pages/ListenPage'
import LoginPage from './pages/LoginPage'
import MePage from './pages/MePage'
import ProPage from './pages/ProPage'
import SettingsPage from './pages/SettingsPage'
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
          <Route path="/conversations/:id/cards" element={<ConversationCardsPage />} />
          <Route path="/conversations/:id/cards/study" element={<ConversationCardsPage />} />
          <Route path="/conversations/:id/cards/edit" element={<ConversationCardsPage />} />
          <Route path="/scenes" element={<ScenesPage />} />
          <Route path="/samples/:slug" element={<PracticePage />} />
          <Route path="/listen" element={<ListenPage />} />
          <Route path="/listen/sample/:slug" element={<ListenPage />} />
          <Route path="/listen/:id" element={<ListenPage />} />
          <Route path="/pro" element={<ProPage />} />
          <Route path="/me" element={<MePage />} />
          <Route path="/me/settings" element={<SettingsPage />} />
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
