import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { api } from '../api'
import { formatDate } from '../i18n/format'
import { translateError } from '../i18n/errors'

export default function AdminUsersPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [submitted, setSubmitted] = useState('')
  const [users, setUsers] = useState([])
  const [openId, setOpenId] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(true)

  useEffect(() => {
    let cancelled = false
    setBusy(true)
    const path = submitted ? `/api/admin/users?q=${encodeURIComponent(submitted)}` : '/api/admin/users'
    api(path)
      .then((rows) => {
        if (!cancelled) {
          setUsers(rows)
          setError('')
        }
      })
      .catch((err) => {
        if (cancelled) {
          return
        }
        if (err.message === 'Admin required') {
          navigate('/', { replace: true })
          return
        }
        setError(err.message)
      })
      .finally(() => {
        if (!cancelled) {
          setBusy(false)
        }
      })
    return () => {
      cancelled = true
    }
  }, [submitted, navigate])

  const count = useMemo(() => t('admin.userCount', { count: users.length }), [t, users.length])

  function search(event) {
    event.preventDefault()
    setSubmitted(query.trim())
  }

  return (
    <div className="admin-page">
      <form className="admin-search" onSubmit={search}>
        <label className="admin-search-field">
          <span className="admin-sr">{t('admin.search')}</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t('admin.searchPlaceholder')}
            maxLength={80}
          />
        </label>
        <button className="admin-btn" type="submit" disabled={busy}>
          {t('admin.search')}
        </button>
      </form>
      {error ? <div className="admin-error">{translateError(t, error)}</div> : null}
      <p className="admin-count">{busy ? t('app.loading') : count}</p>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>{t('admin.colName')}</th>
              <th>{t('admin.colEmail')}</th>
              <th>{t('admin.colPro')}</th>
              <th>{t('admin.colPlan')}</th>
              <th>{t('admin.colStatus')}</th>
              <th>{t('admin.colExpires')}</th>
              <th>{t('admin.colCredits')}</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => {
              const open = openId === user.id
              const sub = user.subscriptions?.[0]
              return (
                <FragmentRow
                  key={user.id}
                  user={user}
                  sub={sub}
                  open={open}
                  onToggle={() => setOpenId(open ? '' : user.id)}
                  t={t}
                />
              )
            })}
          </tbody>
        </table>
      </div>
      {!busy && users.length === 0 ? <p className="admin-empty">{t('admin.empty')}</p> : null}
    </div>
  )
}

function FragmentRow({ user, sub, open, onToggle, t }) {
  return (
    <>
      <tr>
        <td>
          <button className="admin-link" type="button" onClick={onToggle} aria-expanded={open}>
            {user.displayName}
          </button>
          <div className="admin-flags">
            {user.admin ? <span>{t('admin.flagAdmin')}</span> : null}
            {user.teacherMode ? <span>{t('admin.flagTeacher')}</span> : null}
          </div>
        </td>
        <td>{user.email}</td>
        <td>{user.proActive ? t('admin.yes') : t('admin.no')}</td>
        <td>{sub?.plan || '—'}</td>
        <td>{sub?.status || '—'}</td>
        <td>{formatStamp(user.proExpiresAt || sub?.currentPeriodEnd)}</td>
        <td>
          {user.includedCredits}/{user.addonCredits}
        </td>
      </tr>
      {open ? (
        <tr className="admin-detail-row">
          <td colSpan={7}>
            <dl className="admin-dl">
              <div>
                <dt>{t('admin.userId')}</dt>
                <dd>{user.id}</dd>
              </div>
              <div>
                <dt>{t('admin.created')}</dt>
                <dd>{formatStamp(user.createdAt)}</dd>
              </div>
              <div>
                <dt>{t('admin.signIn')}</dt>
                <dd>{user.signIn}</dd>
              </div>
              <div>
                <dt>{t('admin.stripeCustomer')}</dt>
                <dd>{user.stripeCustomerId || '—'}</dd>
              </div>
              <div>
                <dt>{t('admin.creditPeriod')}</dt>
                <dd>{user.creditPeriod || '—'}</dd>
              </div>
              <div>
                <dt>{t('admin.proFlag')}</dt>
                <dd>
                  {user.proLicensed ? t('admin.yes') : t('admin.no')}
                  {sub?.cancelAtPeriodEnd ? ` · ${t('admin.cancelScheduled')}` : ''}
                </dd>
              </div>
            </dl>
            {user.subscriptions?.length ? (
              <ul className="admin-subs">
                {user.subscriptions.map((item) => (
                  <li key={item.providerSubscriptionId}>
                    <strong>
                      {item.provider} {item.plan} {item.status}
                    </strong>
                    <span>{item.providerSubscriptionId}</span>
                    <span>
                      {t('admin.periodEnd')}: {formatStamp(item.currentPeriodEnd) || '—'}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="admin-empty">{t('admin.noSubscription')}</p>
            )}
          </td>
        </tr>
      ) : null}
    </>
  )
}

function formatStamp(value) {
  return value ? formatDate(value) : ''
}
