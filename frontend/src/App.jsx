import { Navigate, Route, Routes, useLocation, useParams } from 'react-router-dom'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { AuthProvider, useAuth } from './AuthContext'
import DeckDetailPage from './pages/DeckDetailPage'
import DecksPage from './pages/DecksPage'
import GroupDetailPage from './pages/GroupDetailPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import StudyPage from './pages/StudyPage'
import AppLayout from './pages/AppLayout'
import GroupsPage from './pages/GroupsPage'
import SettingsPage from './pages/SettingsPage'
import LibraryPage from './pages/LibraryPage'
import LibraryGroupPage from './pages/LibraryGroupPage'
import LibraryDeckPage from './pages/LibraryDeckPage'

function DocumentLang() {
  const { t, i18n } = useTranslation()
  useEffect(() => {
    document.title = t('app.name')
    document.documentElement.lang = i18n.resolvedLanguage === 'es' ? 'es' : 'en'
  }, [t, i18n.resolvedLanguage])
  return null
}

function LoadingScreen() {
  const { t } = useTranslation()
  return <div className="page-loading">{t('app.loading')}</div>
}

function ProtectedLayout() {
  const { user, ready } = useAuth()
  const location = useLocation()
  if (!ready) {
    return <LoadingScreen />
  }
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }
  return <AppLayout />
}

function SetsIdRedirect() {
  const { id } = useParams()
  return <Navigate to={`/sets/${id}`} replace />
}

function GuestOnly({ children }) {
  const { user, ready } = useAuth()
  if (!ready) {
    return <LoadingScreen />
  }
  if (user) {
    return <Navigate to="/" replace />
  }
  return children
}

export default function App() {
  return (
    <AuthProvider>
      <DocumentLang />
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
        <Route element={<ProtectedLayout />}>
          <Route path="/" element={<DecksPage />} />
          <Route path="/sets" element={<GroupsPage />} />
          <Route path="/sets/:id" element={<GroupDetailPage />} />
          <Route path="/groups" element={<Navigate to="/sets" replace />} />
          <Route path="/groups/:id" element={<SetsIdRedirect />} />
          <Route path="/decks/:id" element={<DeckDetailPage />} />
          <Route path="/decks/:id/study/:mode" element={<StudyPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/library" element={<LibraryPage />} />
          <Route path="/library/groups/:id" element={<LibraryGroupPage />} />
          <Route path="/library/decks/:id" element={<LibraryDeckPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  )
}
