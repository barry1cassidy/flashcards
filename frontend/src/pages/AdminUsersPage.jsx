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
  const [pending, setPending] = useState(null)
  const [acting, setActing] = useState(false)

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

  function toggleUser(userId) {
    setOpenId((current) => (current === userId ? '' : userId))
    setPending(null)
  }

  function replaceUser(updated) {
    setUsers((current) => current.map((row) => (row.id === updated.id ? updated : row)))
  }

  async function runPending() {
    if (!pending || acting) {
      return
    }
    setActing(true)
    setError('')
    try {
      const path =
        pending.action === 'CANCEL'
          ? `/api/admin/users/${pending.userId}/subscription/cancel`
          : `/api/admin/users/${pending.userId}/subscription`
      const updated = await api(path, {
        method: 'POST',
        body: pending.action === 'CANCEL' ? undefined : JSON.stringify({ plan: pending.action }),
      })
      replaceUser(updated)
      setPending(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setActing(false)
    }
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
                  onToggle={() => toggleUser(user.id)}
                  pending={pending?.userId === user.id ? pending.action : null}
                  acting={acting}
                  onAsk={(action) => setPending({ userId: user.id, action })}
                  onConfirm={runPending}
                  onCancelAsk={() => setPending(null)}
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

function FragmentRow({ user, sub, open, onToggle, pending, acting, onAsk, onConfirm, onCancelAsk, t }) {
  const adminGrant = activeAdminGrant(user)
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
                  <li key={`${item.provider}:${item.providerSubscriptionId}`}>
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
            <div className="admin-grant">
              <p>
                <strong>{t('admin.grantHeading')}</strong>
              </p>
              <p>{t('admin.grantHint')}</p>
              {pending ? (
                <div className="admin-grant-confirm">
                  <p>
                    {pending === 'YEARLY'
                      ? t('admin.confirmGrantYearly')
                      : pending === 'MONTHLY'
                        ? t('admin.confirmGrantMonthly')
                        : t('admin.confirmCancelGrant')}
                  </p>
                  <div className="admin-grant-actions">
                    <button
                      className={pending === 'CANCEL' ? 'admin-btn admin-btn-danger' : 'admin-btn'}
                      type="button"
                      disabled={acting}
                      onClick={onConfirm}
                    >
                      {t('admin.confirmAction')}
                    </button>
                    <button className="admin-btn" type="button" disabled={acting} onClick={onCancelAsk}>
                      {t('common.cancel')}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="admin-grant-actions">
                  <button className="admin-btn" type="button" disabled={acting} onClick={() => onAsk('MONTHLY')}>
                    {t('admin.grantMonthly')}
                  </button>
                  <button className="admin-btn" type="button" disabled={acting} onClick={() => onAsk('YEARLY')}>
                    {t('admin.grantYearly')}
                  </button>
                  {adminGrant ? (
                    <button
                      className="admin-btn admin-btn-danger"
                      type="button"
                      disabled={acting}
                      onClick={() => onAsk('CANCEL')}
                    >
                      {t('admin.cancelGrant')}
                    </button>
                  ) : null}
                </div>
              )}
            </div>
          </td>
        </tr>
      ) : null}
    </>
  )
}

function activeAdminGrant(user) {
  const now = Date.now()
  return (user.subscriptions || []).some((item) => {
    if (item.provider !== 'ADMIN') {
      return false
    }
    if (item.status !== 'ACTIVE' && item.status !== 'PAST_DUE' && item.status !== 'TRIALING') {
      return false
    }
    if (!item.currentPeriodEnd) {
      return true
    }
    return new Date(item.currentPeriodEnd).getTime() >= now
  })
}

function formatStamp(value) {
  return value ? formatDate(value) : ''
}
