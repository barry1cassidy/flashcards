import { Navigate, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { AuthProvider, useAuth } from './AuthContext'
import { isAdmin } from './admin'
import { currentLocale } from './i18n'
import DeckDetailPage from './pages/DeckDetailPage'
import DecksPage from './pages/DecksPage'
import GroupDetailPage from './pages/GroupDetailPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import StudyPage from './pages/StudyPage'
import AppLayout from './pages/AppLayout'
import GroupsPage from './pages/GroupsPage'
import SettingsPage from './pages/SettingsPage'
import AgentPage from './pages/AgentPage'
import MixesPage from './pages/MixesPage'
import MixEditorPage from './pages/MixEditorPage'
import LibraryPage from './pages/LibraryPage'
import LibraryGroupPage from './pages/LibraryGroupPage'
import LibraryDeckPage from './pages/LibraryDeckPage'
import PrivacyPage from './pages/PrivacyPage'
import ClassesPage from './pages/ClassesPage'
import ClassDetailPage from './pages/ClassDetailPage'
import JoinClassPage from './pages/JoinClassPage'
import SavingIndicator from './pages/SavingIndicator'
import { pathAfterAuth, peekJoinInvite, shouldResumeJoinInvite } from './authRedirect'

function DocumentLang() {
  const { t, i18n } = useTranslation()
  const { pathname } = useLocation()
  const { user } = useAuth()
  useEffect(() => {
    const splash = !user && (pathname === '/' || pathname === '/login' || pathname === '/register')
    const privacy = pathname === '/privacy'
    const join = pathname.startsWith('/join/')
    document.title = privacy
      ? `${t('privacy.title')} — ${t('app.name')}`
      : join
        ? `${t('classes.joinTitle')} — ${t('app.name')}`
        : splash
          ? t('app.title')
          : t('app.name')
    document.documentElement.lang = currentLocale()
    document.documentElement.dir = currentLocale() === 'ar' ? 'rtl' : 'ltr'
  }, [t, i18n.resolvedLanguage, pathname, user])
  return null
}

function LoadingScreen() {
  const { t } = useTranslation()
  return <div className="page-loading">{t('app.loading')}</div>
}

function InviteResume() {
  const { user, ready } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  useEffect(() => {
    if (!ready || !user || location.pathname.startsWith('/join/')) {
      return
    }
    if (!shouldResumeJoinInvite()) {
      return
    }
    const invite = peekJoinInvite()
    if (invite) {
      navigate(invite, { replace: true })
    }
  }, [ready, user, location.pathname, navigate])
  return null
}

function ProtectedLayout() {
  const { user, ready } = useAuth()
  const location = useLocation()
  if (!ready) {
    return <LoadingScreen />
  }
  if (!user) {
    if (location.pathname === '/') {
      return <LoginPage />
    }
    return <Navigate to="/login" replace />
  }
  return <AppLayout />
}

function SetsIdRedirect() {
  const { id } = useParams()
  return <Navigate to={`/sets/${id}`} replace />
}

function GuestOnly({ children }) {
  const { user, ready } = useAuth()
  const location = useLocation()
  if (!ready) {
    return <LoadingScreen />
  }
  if (user) {
    const next = pathAfterAuth(location)
    return <Navigate to={next} replace />
  }
  return children
}

function AdminOnly({ children }) {
  const { user } = useAuth()
  if (!isAdmin(user)) {
    return <Navigate to="/" replace />
  }
  return children
}

export default function App() {
  return (
    <AuthProvider>
      <DocumentLang />
      <SavingIndicator />
      <InviteResume />
      <Routes>
        <Route
          path="/login"
          element={
            <GuestOnly>
              <LoginPage />
            </GuestOnly>
          }
        />
        <Route
          path="/register"
          element={
            <GuestOnly>
              <RegisterPage />
            </GuestOnly>
          }
        />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/join/:code" element={<JoinClassPage />} />
        <Route element={<ProtectedLayout />}>
          <Route path="/" element={<DecksPage />} />
          <Route path="/sets" element={<GroupsPage />} />
          <Route path="/sets/:id" element={<GroupDetailPage />} />
          <Route path="/groups" element={<Navigate to="/sets" replace />} />
          <Route path="/groups/:id" element={<SetsIdRedirect />} />
          <Route path="/decks/:id" element={<DeckDetailPage />} />
          <Route path="/decks/:id/study/:mode" element={<StudyPage />} />
          <Route path="/create-with-ai" element={<AdminOnly><AgentPage /></AdminOnly>} />
          <Route path="/mixes/new" element={<AdminOnly><MixEditorPage /></AdminOnly>} />
          <Route path="/mixes/:id/study/:mode" element={<AdminOnly><StudyPage /></AdminOnly>} />
          <Route path="/mixes/:id" element={<AdminOnly><MixEditorPage /></AdminOnly>} />
          <Route path="/mixes" element={<AdminOnly><MixesPage /></AdminOnly>} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/library" element={<LibraryPage />} />
          <Route path="/library/groups/:id" element={<LibraryGroupPage />} />
          <Route path="/library/decks/:id" element={<LibraryDeckPage />} />
          <Route path="/classes" element={<AdminOnly><ClassesPage /></AdminOnly>} />
          <Route path="/classes/:id" element={<ClassDetailPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  )
}
