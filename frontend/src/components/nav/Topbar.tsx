
import { useMemo } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { logout, useAuth } from '../../auth/store'
import { useGodownScope } from '../../hooks/useGodownScope'
import { topbarMetaFromPath, type Breadcrumb } from './topbarMeta'
import { NotificationBell } from './NotificationBell'

// ── breadcrumb ─────────────────────────────────────────────────────────────

function BreadcrumbTrail({ items }: { items: Breadcrumb[] }) {
  return (
    <nav
      aria-label="Breadcrumb"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        fontSize: 12,
        color: '#94a3b8',
        overflow: 'hidden',
        whiteSpace: 'nowrap',
      }}
    >
      {items.map((item, i) => {
        const isLast = i === items.length - 1
        return (
          <span key={`${item.label}-${i}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            {i > 0 && (
              <svg viewBox="0 0 24 24" fill="none" width="12" height="12">
                <path d="m9 6 6 6-6 6" stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
            {item.to && !isLast ? (
              <Link
                to={item.to}
                style={{ color: '#94a3b8', textDecoration: 'none', transition: 'color 0.15s' }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = '#6366f1')}
                onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = '#94a3b8')}
              >
                {item.label}
              </Link>
            ) : (
              <span style={{ fontWeight: isLast ? 600 : 400, color: isLast ? '#6366f1' : '#94a3b8' }}>
                {item.label}
              </span>
            )}
          </span>
        )
      })}
    </nav>
  )
}

// ── logout icon ────────────────────────────────────────────────────────────

function LogoutIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" width="18" height="18" aria-hidden>
      <path
        d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

// ── bell icon ──────────────────────────────────────────────────────────────


// ── topbar ─────────────────────────────────────────────────────────────────

export function Topbar() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const auth = useAuth()
  const { isGodown, godownName } = useGodownScope()

  const role =
    auth.status === 'authenticated' ? auth.user.role : 'ADMIN'

  const meta = useMemo(() => topbarMetaFromPath(pathname), [pathname])

  const userInitial =
    auth.status === 'authenticated'
      ? (
          auth.user.email?.slice(0, 1) ||
          auth.user.loginId?.slice(0, 1) ||
          auth.user.role.slice(0, 1)
        ).toUpperCase()
      : 'A'

  const userLabel =
    auth.status === 'authenticated'
      ? isGodown && godownName
        ? godownName
        : auth.user.role
      : 'ADMIN'

  const userSub =
    auth.status === 'authenticated'
      ? isGodown
        ? auth.user.contactPhone || auth.user.email || 'Godown operator'
        : auth.user.email || auth.user.loginId || 'Signed in'
      : 'admin@gmail.com'

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 40,
        background: '#fff',
        borderBottom: '1px solid #e2e8f0',
        backdropFilter: 'blur(12px)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          padding: '10px 24px',
          height: 68,
          boxSizing: 'border-box',
        }}
      >
        {/* ── LEFT: icon + title + badge + breadcrumb ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0, flex: 1 }}>
          {/* page icon box */}
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: 'rgb(49, 46, 129)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              flexShrink: 0,
            }}
          >
            <span style={{ display: 'flex', width: 22, height: 22 }}>{meta.icon}</span>
          </div>

          {/* text block */}
          <div style={{ minWidth: 0 }}>
            {/* title row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <h1
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: '#0f172a',
                  margin: 0,
                  lineHeight: 1.2,
                  whiteSpace: 'nowrap',
                }}
              >
                {meta.title}
              </h1>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: '0.07em',
                  textTransform: 'uppercase',
                  background: '#ede9fe',
                  color: '#6d28d9',
                  borderRadius: 999,
                  padding: '2px 10px',
                }}
              >
                {role}
              </span>
            </div>

            {/* subtitle / breadcrumb */}
            <div style={{ marginTop: 2 }}>
              <BreadcrumbTrail items={meta.breadcrumbs} />
            </div>
          </div>
        </div>

        {/* ── RIGHT: bell + profile + logout ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          {/* notification bell */}
          {auth.status === 'authenticated' &&
            (role === 'GODOWN' || role === 'ADMIN' || role === 'DELIVERY') && (
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  border: '1px solid #e2e8f0',
                  background: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#64748b',
                  cursor: 'pointer',
                }}
              >
                <NotificationBell />
              </div>
            )}

          {/* profile button */}
          <button
            type="button"
            onClick={() => navigate('/editprofile')}
            title="Edit profile"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '6px 12px 6px 6px',
              borderRadius: 12,
              border: '1px solid #e2e8f0',
              background: '#fff',
              cursor: 'pointer',
              transition: 'border-color 0.15s',
            }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.borderColor = '#c7d2fe')}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.borderColor = '#e2e8f0')}
          >
            {/* avatar */}
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: 'rgb(49, 46, 129)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 14,
                fontWeight: 700,
                color: '#fff',
                flexShrink: 0,
              }}
            >
              {userInitial}
            </div>
            {/* user info */}
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', lineHeight: 1.3 }}>
                {userLabel}
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: '#94a3b8',
                  maxWidth: 160,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {userSub}
              </div>
            </div>
          </button>

          {/* logout button */}
          <button
            type="button"
            onClick={() => { logout(); navigate('/login') }}
            title="Logout"
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              border: '1px solid #e2e8f0',
              background: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#64748b',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLElement
              el.style.background = '#fef2f2'
              el.style.borderColor = '#fecaca'
              el.style.color = '#dc2626'
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLElement
              el.style.background = '#fff'
              el.style.borderColor = '#e2e8f0'
              el.style.color = '#64748b'
            }}
          >
            <LogoutIcon />
          </button>
        </div>
      </div>
    </header>
  )
}