import { useMemo } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { cn } from '../../lib/cn'
import { logout, useAuth } from '../../auth/store'
import { Button } from '../ui/Button'
import { DeliveryIcon, ReportsIcon } from './icons'
import { navItemsForRole } from './navItems'
import { topbarMetaFromPath, type Breadcrumb } from './topbarMeta'

function BreadcrumbTrail({ items }: { items: Breadcrumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1 text-xs text-slate-500">
      {items.map((item, i) => {
        const isLast = i === items.length - 1
        return (
          <span key={`${item.label}-${i}`} className="inline-flex items-center gap-1">
            {i > 0 ? (
              <svg className="h-3.5 w-3.5 shrink-0 text-slate-300" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="m9 6 6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ) : null}
            {item.to && !isLast ? (
              <Link to={item.to} className="font-medium transition-colors hover:text-violet-600">
                {item.label}
              </Link>
            ) : (
              <span className={cn('font-medium', isLast ? 'text-violet-600' : 'text-slate-500')}>{item.label}</span>
            )}
          </span>
        )
      })}
    </nav>
  )
}

export function Topbar() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const auth = useAuth()
  const role = auth.status === 'authenticated' ? auth.user.role : 'ADMIN'
  const nav = navItemsForRole(role)

  const meta = useMemo(() => topbarMetaFromPath(pathname), [pathname])
  const onReports = pathname.startsWith('/reports')
  const onDeliveries = pathname.startsWith('/deliveries')
  const showDeliveriesShortcut = role !== 'DELIVERY' && !onDeliveries && nav.some((n) => n.to === '/deliveries')
  const showReportsShortcut = nav.some((n) => n.to === '/reports') && !onReports

  const userInitial =
    auth.status === 'authenticated'
      ? (auth.user.email?.slice(0, 1) || auth.user.loginId?.slice(0, 1) || auth.user.role.slice(0, 1)).toUpperCase()
      : 'A'
  const userLabel = auth.status === 'authenticated' ? auth.user.role : 'Admin'
  const userSub =
    auth.status === 'authenticated' ? auth.user.email || auth.user.loginId || 'Signed in' : 'Not signed in'

  return (
    <header className="sticky top-0 z-30 border-b border-white/40 bg-white/75 shadow-sm shadow-slate-200/50 backdrop-blur-xl">
      <div className="container-app flex min-h-[4.25rem] flex-col justify-center gap-3 py-3 sm:h-[4.25rem] sm:flex-row sm:items-center sm:gap-4 sm:py-0">
        {/* Page context */}
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 via-purple-500 to-violet-600 text-white shadow-lg shadow-violet-300/40 ring-1 ring-white/60">
            <span className="[&_svg]:h-5 [&_svg]:w-5">{meta.icon}</span>
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="truncate text-lg font-bold tracking-tight text-slate-900 sm:text-xl">{meta.title}</h1>
              <span className="hidden rounded-full bg-violet-50 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-violet-700 ring-1 ring-violet-100 sm:inline-flex">
                {role}
              </span>
            </div>
            <p className="mt-0.5 hidden truncate text-sm text-slate-500 sm:block">{meta.subtitle}</p>
            <div className="mt-1 sm:hidden">
              <BreadcrumbTrail items={meta.breadcrumbs} />
            </div>
          </div>
        </div>

        {/* Breadcrumbs — desktop */}
        <div className="hidden min-w-0 flex-[1.2] items-center justify-center lg:flex">
          <div className="rounded-full border border-slate-200/80 bg-slate-50/80 px-4 py-2 shadow-inner">
            <BreadcrumbTrail items={meta.breadcrumbs} />
          </div>
        </div>

        {/* Actions */}
        <div className="flex shrink-0 items-center gap-2 sm:gap-2.5">
          {showDeliveriesShortcut ? (
            <Button
              variant="secondary"
              size="sm"
              className="hidden gap-2 shadow-sm sm:inline-flex"
              onClick={() => navigate('/deliveries')}
            >
              <span className="text-slate-600">
                <DeliveryIcon />
              </span>
              Deliveries
            </Button>
          ) : null}

          {showReportsShortcut ? (
            <Button variant="primary" size="sm" className="gap-2 shadow-md shadow-violet-300/30" onClick={() => navigate('/reports')}>
              <ReportsIcon />
              Reports
            </Button>
          ) : null}

          <button
            type="button"
            onClick={() => logout()}
            title="Sign out"
            className="group flex items-center gap-2.5 rounded-2xl border border-slate-200/80 bg-white py-1.5 pl-1.5 pr-3 shadow-sm transition-all hover:border-violet-200 hover:shadow-md"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-400 to-purple-600 text-sm font-bold text-white shadow-md transition-transform group-hover:scale-105">
              {userInitial}
            </span>
            <span className="hidden min-w-0 text-left sm:block">
              <span className="block truncate text-xs font-bold text-slate-900">{userLabel}</span>
              <span className="block max-w-[8rem] truncate text-[10px] text-slate-500">{userSub}</span>
            </span>
          </button>
        </div>
      </div>
    </header>
  )
}
