import { Outlet } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { UserMenu } from './AppHeader'

export default function AdminLayout() {
  const { t } = useTranslation()
  return (
    <div className="admin-shell">
      <div className="admin-banner" role="status">
        {t('admin.banner')}
      </div>
      <header className="admin-header">
        <div>
          <p className="admin-kicker">{t('admin.console')}</p>
          <h1>{t('admin.users')}</h1>
        </div>
        <UserMenu />
      </header>
      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  )
}
