import { Link, Navigate, Outlet, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom'
import { lazy, Suspense, useEffect, useLayoutEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { AuthProvider, useAuth } from './AuthContext'
import { AiCreditsProvider } from './AiCreditsContext'
import { isAdmin } from './admin'
import { isEmailVerified } from './email'
import { isProLicensed } from './pro'
import { currentLocale } from './i18n'
import DeckDetailPage from './pages/DeckDetailPage'
import DecksPage from './pages/DecksPage'
import GroupDetailPage from './pages/GroupDetailPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import StudyPage from './pages/StudyPage'
import AppLayout from './pages/AppLayout'
import AdminLayout from './pages/AdminLayout'
import AdminUsersPage from './pages/AdminUsersPage'
import GroupsPage from './pages/GroupsPage'
import SettingsPage from './pages/SettingsPage'
import AccountSettings from './pages/AccountSettings'
import ProPage from './pages/ProPage'
import HelpPage from './pages/HelpPage'
import AgentPage from './pages/AgentPage'
import MixesPage from './pages/MixesPage'
import MixEditorPage from './pages/MixEditorPage'
import LibraryPage from './pages/LibraryPage'
import LibraryGroupPage from './pages/LibraryGroupPage'
import LibraryDeckPage from './pages/LibraryDeckPage'
import PrivacyPage from './pages/PrivacyPage'
import MarketingHeader, { MarketingFooter } from './pages/MarketingHeader'
import ClassesPage from './pages/ClassesPage'
import ClassDetailPage from './pages/ClassDetailPage'
import JoinClassPage from './pages/JoinClassPage'
import SharePage from './pages/SharePage'
import VerifyEmailPage from './pages/VerifyEmailPage'
import OfflineDecksPage from './pages/OfflineDecksPage'
import OfflineListenPage from './pages/OfflineListenPage'
import OfflineStudyPage from './pages/OfflineStudyPage'
import ListenPage from './pages/ListenPage'
import LanguageStudioPage from './pages/LanguageStudioPage'
import LanguageStudioCreate from './pages/LanguageStudioCreate'
import LanguageStudioPractice from './pages/LanguageStudioPractice'
import LanguageStudioSamples from './pages/LanguageStudioSamples'
import SavingIndicator from './pages/SavingIndicator'
import { getToken } from './api'
import { clearLibraryReturn, pathAfterAuth, peekJoinInvite, shouldResumeJoinInvite } from './authRedirect'
import { webMarketing } from './webOnly'
import { BackNavigation } from './backNavigation'
import { IncomingLinks } from './incomingLinks'
import { stopSpeaking } from './tts'

const RememberPages = webMarketing ? lazy(() => import('./pages/remember/RememberPages.jsx')) : null
const QuizletAlternativePage = webMarketing ? lazy(() => import('./pages/QuizletAlternativePage.jsx')) : null
const AudioFlashcardsPage = webMarketing ? lazy(() => import('./pages/AudioFlashcardsPage.jsx')) : null
const LanguageConversationsPage = webMarketing ? lazy(() => import('./pages/LanguageConversationsPage.jsx')) : null

function isListenPath(path) {
  return path === '/listen' || path.startsWith('/listen/') || path === '/offline/listen'
}

function StopListenSpeechOnLeave() {
  const { pathname } = useLocation()
  const previous = useRef(pathname)
  useEffect(() => {
    const wasListen = isListenPath(previous.current)
    previous.current = pathname
    if (wasListen && !isListenPath(pathname)) {
      stopSpeaking()
    }
  }, [pathname])
  return null
}

function AnalyticsPageViews() {
  const { pathname, search } = useLocation()
  const first = useRef(true)
  const lastTitle = useRef(typeof document === 'undefined' ? '' : document.title)
  useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    const path = pathname + search
    let cancelled = false
    let timer = 0
    let observer
    const send = () => {
      if (cancelled || typeof window.gtag !== 'function') return
      cancelled = true
      observer?.disconnect()
      window.clearTimeout(timer)
      lastTitle.current = document.title
      window.gtag('event', 'page_view', {
        page_path: path,
        page_location: window.location.href,
        page_title: document.title,
      })
    }
    if (document.title !== lastTitle.current) {
      send()
      return
    }
    const titleEl = document.querySelector('title')
    if (titleEl) {
      observer = new MutationObserver(send)
      observer.observe(titleEl, { childList: true, characterData: true, subtree: true })
    }
    timer = window.setTimeout(send, 1000)
    return () => {
      cancelled = true
      observer?.disconnect()
      window.clearTimeout(timer)
    }
  }, [pathname, search])
  return null
}

function ScrollToTop() {
  const { pathname, hash } = useLocation()
  useLayoutEffect(() => {
    if (hash) {
      return
    }
    window.scrollTo(0, 0)
  }, [pathname, hash])
  return null
}

function DocumentLang() {
  const { t, i18n } = useTranslation()
  const { pathname } = useLocation()
  const { user } = useAuth()
  useEffect(() => {
    const library = pathname.startsWith('/library')
    const remember =
      pathname.startsWith('/memorize') ||
      pathname === '/quizlet-alternative' ||
      pathname === '/audio-flashcards' ||
      pathname === '/language-conversations'
    const splash = !user && (pathname === '/' || pathname === '/login' || pathname === '/register')
    const privacy = pathname === '/privacy'
    const join = pathname.startsWith('/join/')
    const admin = Boolean(user) && pathname.startsWith('/admin')
    const billing = pathname.startsWith('/pro')
    const help = pathname.startsWith('/help')
    const verify = pathname.startsWith('/verify')
    if (remember) {
      document.documentElement.lang = 'en'
      document.documentElement.dir = 'ltr'
      return
    }
    if (library) {
      document.documentElement.lang = currentLocale()
      document.documentElement.dir = currentLocale() === 'ar' ? 'rtl' : 'ltr'
      return
    }
    document.title = privacy
      ? `${t('privacy.title')} — ${t('app.name')}`
      : verify
        ? `${t('verify.title')} — ${t('app.name')}`
        : help
        ? `${t('help.title')} — ${t('app.name')}`
        : join
        ? `${t('classes.joinTitle')} — ${t('app.name')}`
        : admin
          ? `${t('admin.console')} — ${t('app.name')}`
          : billing
            ? `${isProLicensed(user) ? t('pro.titleAccount') : t('pro.titleUpgrade')} — ${t('app.name')}`
            : splash
            ? t('app.title')
            : t('app.name')
    document.documentElement.lang = currentLocale()
    document.documentElement.dir = currentLocale() === 'ar' ? 'rtl' : 'ltr'
    const publicPage = splash || privacy || help
    let robots = document.querySelector('meta[name="robots"]')
    if (!robots) {
      robots = document.createElement('meta')
      robots.setAttribute('name', 'robots')
      document.head.appendChild(robots)
    }
    robots.setAttribute('content', publicPage ? 'index,follow,max-image-preview:large' : 'noindex,follow')

    const description = splash
      ? t('marketing.seoDescription')
      : privacy
        ? t('privacy.intro')
        : help
          ? t('help.subtitle')
          : null
    let meta = document.querySelector('meta[name="description"]')
    if (description) {
      if (!meta) {
        meta = document.createElement('meta')
        meta.setAttribute('name', 'description')
        document.head.appendChild(meta)
      }
      meta.setAttribute('content', description)
    }

    const canonicalPath = privacy ? '/privacy' : help ? '/help' : splash ? '/' : null
    let canonical = document.querySelector('link[rel="canonical"]')
    if (canonicalPath) {
      if (!canonical) {
        canonical = document.createElement('link')
        canonical.setAttribute('rel', 'canonical')
        document.head.appendChild(canonical)
      }
      canonical.setAttribute('href', `https://zipdeck.app${canonicalPath}`)
    }
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
    if (!ready || !user || location.pathname.startsWith('/join/') || location.pathname.startsWith('/share/')) {
      return
    }
    if (!isEmailVerified(user)) {
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

function OfflineHold() {
  const { t } = useTranslation()
  return (
    <div className="page-loading">
      <div className="card-form stack">
        <p>{t('offline.held')}</p>
        <Link className="btn primary" to="/offline">
          {t('offline.menu')}
        </Link>
      </div>
    </div>
  )
}

function ProtectedLayout() {
  const { user, ready, offline } = useAuth()
  const location = useLocation()
  if (!ready) {
    return <LoadingScreen />
  }
  if (!user && offline && getToken()) {
    return <OfflineHold />
  }
  if (!user) {
    if (location.pathname === '/') {
      return <LoginPage />
    }
    if (location.pathname.startsWith('/help')) {
      return (
        <div className="marketing">
          <MarketingHeader />
          <div className="marketing-wrap">
            <Outlet />
          </div>
          <MarketingFooter />
        </div>
      )
    }
    return <Navigate to="/login" replace />
  }
  if (!isEmailVerified(user) && !unverifiedPath(location.pathname)) {
    return <Navigate to="/verify" replace />
  }
  if (location.pathname.startsWith('/admin')) {
    if (!isAdmin(user)) {
      return <Navigate to="/" replace />
    }
    return <AdminLayout />
  }
  return <AppLayout />
}

function unverifiedPath(pathname) {
  return (
    pathname.startsWith('/verify') ||
    pathname.startsWith('/help') ||
    pathname.startsWith('/library') ||
    pathname.startsWith('/settings')
  )
}

function SetsIdRedirect() {
  const { id } = useParams()
  return <Navigate to={`/sets/${id}`} replace />
}

function LibraryGate() {
  const { user, ready, offline } = useAuth()
  useEffect(() => {
    if (user && isEmailVerified(user)) {
      clearLibraryReturn()
    }
  }, [user])
  if (!ready) {
    return <LoadingScreen />
  }
  if (user) {
    return <AppLayout />
  }
  if (offline && getToken()) {
    return (
      <div className="marketing">
        <div className="marketing-wrap">
          <Outlet />
        </div>
      </div>
    )
  }
  if (!webMarketing) {
    return <Navigate to="/login" replace />
  }
  return (
    <div className="marketing">
      <MarketingHeader />
      <div className="marketing-wrap">
        <Outlet />
      </div>
      <MarketingFooter />
    </div>
  )
}

function WebArticleGate({ children }) {
  return (
    <div className="marketing">
      <MarketingHeader />
      <div className="marketing-wrap">
        <Suspense fallback={<LoadingScreen />}>
          {children}
        </Suspense>
      </div>
      <MarketingFooter />
    </div>
  )
}

function OfflineGate() {
  const { user, ready } = useAuth()
  if (!ready) {
    return <LoadingScreen />
  }
  if (user) {
    return <AppLayout />
  }
  return (
    <div className="marketing">
      <MarketingHeader />
      <div className="marketing-wrap">
        <Outlet />
      </div>
      <MarketingFooter />
    </div>
  )
}

function GuestOnly({ children }) {
  const { user, ready } = useAuth()
  const location = useLocation()
  if (!ready) {
    return <LoadingScreen />
  }
  if (user) {
    if (!isEmailVerified(user)) {
      return <Navigate to="/verify" replace />
    }
    const next = pathAfterAuth(location)
    return <Navigate to={next} replace />
  }
  return children
}

export default function App() {
  return (
    <AuthProvider>
      <AiCreditsProvider>
        <ScrollToTop />
        <BackNavigation />
        <IncomingLinks />
        <DocumentLang />
        {webMarketing ? <AnalyticsPageViews /> : null}
        <StopListenSpeechOnLeave />
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
        <Route
          path="/forgot-password"
          element={
            <GuestOnly>
              <ForgotPasswordPage />
            </GuestOnly>
          }
        />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route element={<OfflineGate />}>
          <Route path="/offline" element={<OfflineDecksPage />} />
          <Route path="/offline/listen" element={<OfflineListenPage />} />
          <Route path="/offline/:deckId" element={<OfflineStudyPage />} />
        </Route>
        <Route path="/join/:code" element={<JoinClassPage />} />
        <Route path="/share/:code" element={<SharePage />} />
        {webMarketing ? <Route path="/memorize/*" element={<WebArticleGate>{RememberPages ? <RememberPages /> : null}</WebArticleGate>} /> : null}
        {webMarketing ? <Route path="/quizlet-alternative" element={<WebArticleGate>{QuizletAlternativePage ? <QuizletAlternativePage /> : null}</WebArticleGate>} /> : null}
        {webMarketing ? <Route path="/audio-flashcards" element={<WebArticleGate>{AudioFlashcardsPage ? <AudioFlashcardsPage /> : null}</WebArticleGate>} /> : null}
        {webMarketing ? <Route path="/language-conversations" element={<WebArticleGate>{LanguageConversationsPage ? <LanguageConversationsPage /> : null}</WebArticleGate>} /> : null}
        <Route element={<LibraryGate />}>
          <Route path="/library" element={<LibraryPage />} />
          <Route path="/library/groups/:id" element={<LibraryGroupPage />} />
          <Route path="/library/decks/:id" element={<LibraryDeckPage />} />
          <Route path="/library/:groupSlug/:deckSlug" element={<LibraryDeckPage />} />
          <Route path="/library/:groupSlug" element={<LibraryGroupPage />} />
        </Route>
        <Route element={<ProtectedLayout />}>
          <Route path="/" element={<DecksPage />} />
          <Route path="/sets" element={<GroupsPage />} />
          <Route path="/sets/:id" element={<GroupDetailPage />} />
          <Route path="/groups" element={<Navigate to="/sets" replace />} />
          <Route path="/groups/:id" element={<SetsIdRedirect />} />
          <Route path="/decks/:id" element={<DeckDetailPage />} />
          <Route path="/decks/:id/study/:mode" element={<StudyPage />} />
          <Route path="/create-with-ai" element={<AgentPage />} />
          <Route path="/mixes/new" element={<MixEditorPage />} />
          <Route path="/mixes/:id/study/:mode" element={<StudyPage />} />
          <Route path="/mixes/:id" element={<MixEditorPage />} />
          <Route path="/mixes" element={<MixesPage />} />
          <Route path="/listen" element={<ListenPage />} />
          <Route path="/language-studio/new" element={<LanguageStudioCreate />} />
          <Route path="/language-studio/samples/:slug" element={<LanguageStudioPractice />} />
          <Route path="/language-studio/samples" element={<LanguageStudioSamples />} />
          <Route path="/language-studio/:id" element={<LanguageStudioPractice />} />
          <Route path="/language-studio" element={<LanguageStudioPage />} />
          <Route path="/pro" element={<ProPage />} />
          <Route path="/verify" element={<VerifyEmailPage />} />
          <Route path="/help" element={<HelpPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/account" element={<AccountSettings />} />
          <Route path="/classes" element={<ClassesPage />} />
          <Route path="/classes/:id" element={<ClassDetailPage />} />
          <Route path="/admin" element={<AdminUsersPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AiCreditsProvider>
    </AuthProvider>
  )
}
