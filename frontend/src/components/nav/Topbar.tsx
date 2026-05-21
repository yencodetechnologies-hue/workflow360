// import { useMemo } from 'react'
// import { Link, useLocation, useNavigate } from 'react-router-dom'
// import { cn } from '../../lib/cn'
// import { logout, useAuth } from '../../auth/store'
// import { Button } from '../ui/Button'
// import { DeliveryIcon, ReportsIcon } from './icons'
// import { navItemsForRole } from './navItems'
// import { topbarMetaFromPath, type Breadcrumb } from './topbarMeta'

// function BreadcrumbTrail({ items }: { items: Breadcrumb[] }) {
//   return (
//     <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1 text-xs text-slate-500">
//       {items.map((item, i) => {
//         const isLast = i === items.length - 1
//         return (
//           <span key={`${item.label}-${i}`} className="inline-flex items-center gap-1">
//             {i > 0 ? (
//               <svg className="h-3.5 w-3.5 shrink-0 text-slate-300" viewBox="0 0 24 24" fill="none" aria-hidden>
//                 <path d="m9 6 6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
//               </svg>
//             ) : null}
//             {item.to && !isLast ? (
//               <Link to={item.to} className="font-medium transition-colors hover:text-violet-600">
//                 {item.label}
//               </Link>
//             ) : (
//               <span className={cn('font-medium', isLast ? 'text-violet-600' : 'text-slate-500')}>{item.label}</span>
//             )}
//           </span>
//         )
//       })}
//     </nav>
//   )
// }

// export function Topbar() {
//   const { pathname } = useLocation()
//   const navigate = useNavigate()
//   const auth = useAuth()
//   const role = auth.status === 'authenticated' ? auth.user.role : 'ADMIN'
//   const nav = navItemsForRole(role)

//   const meta = useMemo(() => topbarMetaFromPath(pathname), [pathname])
//   const onReports = pathname.startsWith('/reports')
//   const onDeliveries = pathname.startsWith('/deliveries')
//   const showDeliveriesShortcut = role !== 'DELIVERY' && !onDeliveries && nav.some((n) => n.to === '/deliveries')
//   const showReportsShortcut = nav.some((n) => n.to === '/reports') && !onReports

//   const userInitial =
//     auth.status === 'authenticated'
//       ? (auth.user.email?.slice(0, 1) || auth.user.loginId?.slice(0, 1) || auth.user.role.slice(0, 1)).toUpperCase()
//       : 'A'
//   const userLabel = auth.status === 'authenticated' ? auth.user.role : 'Admin'
//   const userSub =
//     auth.status === 'authenticated' ? auth.user.email || auth.user.loginId || 'Signed in' : 'Not signed in'

//   return (
//     <header className="sticky top-0 z-30 border-b border-white/40 bg-white/75 shadow-sm shadow-slate-200/50 backdrop-blur-xl">
//       <div className="container-app flex min-h-[4.25rem] flex-col justify-center gap-3 py-3 sm:h-[4.25rem] sm:flex-row sm:items-center sm:gap-4 sm:py-0">
//         {/* Page context */}
//         <div className="flex min-w-0 flex-1 items-center gap-3">
//           <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 via-purple-500 to-violet-600 text-white shadow-lg shadow-violet-300/40 ring-1 ring-white/60">
//             <span className="[&_svg]:h-5 [&_svg]:w-5">{meta.icon}</span>
//           </div>
//           <div className="min-w-0">
//             <div className="flex flex-wrap items-center gap-2">
//               <h1 className="truncate text-lg font-bold tracking-tight text-slate-900 sm:text-xl">{meta.title}</h1>
//               <span className="hidden rounded-full bg-violet-50 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-violet-700 ring-1 ring-violet-100 sm:inline-flex">
//                 {role}
//               </span>
//             </div>
//             <p className="mt-0.5 hidden truncate text-sm text-slate-500 sm:block">{meta.subtitle}</p>
//             <div className="mt-1 sm:hidden">
//               <BreadcrumbTrail items={meta.breadcrumbs} />
//             </div>
//           </div>
//         </div>

//         {/* Breadcrumbs — desktop */}
//         <div className="hidden min-w-0 flex-[1.2] items-center justify-center lg:flex">
//           <div className="rounded-full border border-slate-200/80 bg-slate-50/80 px-4 py-2 shadow-inner">
//             <BreadcrumbTrail items={meta.breadcrumbs} />
//           </div>
//         </div>

//         {/* Actions */}
//         <div className="flex shrink-0 items-center gap-2 sm:gap-2.5">
//           {showDeliveriesShortcut ? (
//             <Button
//               variant="secondary"
//               size="sm"
//               className="hidden gap-2 shadow-sm sm:inline-flex"
//               onClick={() => navigate('/deliveries')}
//             >
//               <span className="text-slate-600">
//                 <DeliveryIcon />
//               </span>
//               Deliveries
//             </Button>
//           ) : null}

//           {showReportsShortcut ? (
//             <Button variant="primary" size="sm" className="gap-2 shadow-md shadow-violet-300/30" onClick={() => navigate('/reports')}>
//               <ReportsIcon />
//               Reports
//             </Button>
//           ) : null}

//           <button
//             type="button"
//             onClick={() => logout()}
//             title="Sign out"
//             className="group flex items-center gap-2.5 rounded-2xl border border-slate-200/80 bg-white py-1.5 pl-1.5 pr-3 shadow-sm transition-all hover:border-violet-200 hover:shadow-md"
//           >
//             <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-400 to-purple-600 text-sm font-bold text-white shadow-md transition-transform group-hover:scale-105">
//               {userInitial}
//             </span>
//             <span className="hidden min-w-0 text-left sm:block">
//               <span className="block truncate text-xs font-bold text-slate-900">{userLabel}</span>
//               <span className="block max-w-[8rem] truncate text-[10px] text-slate-500">{userSub}</span>
//             </span>
//           </button>
//         </div>
//       </div>
//     </header>
//   )
// }

// Topbar.tsx
// FULLY FIXED SaaS STYLE TOPBAR
// ✔ Single straight responsive row
// ✔ Mobile nav no longer breaks below
// ✔ Deliveries + Reports perfectly aligned
// ✔ Clean SaaS spacing
// ✔ Keeps ALL your existing logic intact

import { useMemo } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { cn } from '../../lib/cn'
import { logout, useAuth } from '../../auth/store'
import { navItemsForRole } from './navItems'
import { topbarMetaFromPath, type Breadcrumb } from './topbarMeta'

import {
  DeliveryIcon,
  ReportsIcon,
  DashboardIcon,
} from './icons'

function BreadcrumbTrail({ items }: { items: Breadcrumb[] }) {
  return (
    <nav
      aria-label="Breadcrumb"
      className="flex items-center gap-1 overflow-hidden whitespace-nowrap text-xs text-slate-500"
    >
      {items.map((item, i) => {
        const isLast = i === items.length - 1

        return (
          <span
            key={`${item.label}-${i}`}
            className="inline-flex items-center gap-1"
          >
            {i > 0 && (
              <svg
                className="h-3 w-3 text-slate-300"
                viewBox="0 0 24 24"
                fill="none"
              >
                <path
                  d="m9 6 6 6-6 6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}

            {item.to && !isLast ? (
              <Link
                to={item.to}
                className="transition-colors hover:text-violet-600"
              >
                {item.label}
              </Link>
            ) : (
              <span
                className={cn(
                  'font-medium',
                  isLast
                    ? 'text-violet-600'
                    : 'text-slate-500',
                )}
              >
                {item.label}
              </span>
            )}
          </span>
        )
      })}
    </nav>
  )
}

function TopNavButton({
  active,
  label,
  icon,
  onClick,
}: {
  active?: boolean
  label: string
  icon: React.ReactNode
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        `
        flex h-11 shrink-0 items-center gap-2
        rounded-2xl border px-4
        transition-all duration-200
        `,
        active
          ? `
            border-violet-500
            bg-gradient-to-r
            from-violet-600
            to-purple-600
            text-white
            shadow-lg shadow-violet-300/40
          `
          : `
            border-slate-200
            bg-white
            text-slate-700
            hover:border-violet-200
            hover:bg-violet-50
          `,
      )}
    >
      <span
        className={cn(
          `
          flex items-center justify-center
          [&_svg]:h-[18px]
          [&_svg]:w-[18px]
          `,
          active ? 'text-white' : 'text-slate-500',
        )}
      >
        {icon}
      </span>

      <span className="text-sm font-semibold">
        {label}
      </span>
    </button>
  )
}

export function Topbar() {
  const { pathname } = useLocation()
  const navigate = useNavigate()

  const auth = useAuth()

  const role =
    auth.status === 'authenticated'
      ? auth.user.role
      : 'ADMIN'

  const nav = navItemsForRole(role)

  const meta = useMemo(
    () => topbarMetaFromPath(pathname),
    [pathname],
  )

  const onReports = pathname.startsWith('/reports')

  const onDeliveries =
    pathname.startsWith('/deliveries')

  const onDashboard =
    pathname === '/' ||
    pathname.startsWith('/dashboard')

  const showDeliveriesShortcut =
    role !== 'DELIVERY' &&
    nav.some((n) => n.to === '/deliveries')

  const showReportsShortcut =
    nav.some((n) => n.to === '/reports')

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
      ? auth.user.role
      : 'Admin'

  const userSub =
    auth.status === 'authenticated'
      ? auth.user.email ||
        auth.user.loginId ||
        'Signed in'
      : 'Not signed in'

  return (
    <header
      className="
      sticky top-0 z-40
      border-b border-slate-200
      bg-white/90
      backdrop-blur-xl
    "
    >
      <div className="container-app">
        {/* MAIN ROW */}
        <div
          className="
          flex items-center justify-between
          gap-4
          py-4
          "
        >
          {/* LEFT SECTION */}
          <div
            className="
            flex min-w-0 flex-1 items-center gap-4
            "
          >
            {/* ICON */}
            <div
              className="
              flex h-16 w-16 shrink-0
              items-center justify-center
              rounded-3xl
              bg-gradient-to-br
              from-violet-500
              via-purple-500
              to-violet-700
              text-white
              shadow-xl shadow-violet-300/40
              "
            >
              <span className="[&_svg]:h-7 [&_svg]:w-7">
                {meta.icon}
              </span>
            </div>

            {/* TEXT */}
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1
                  className="
                  truncate
                  text-2xl font-bold
                  tracking-tight
                  text-slate-900
                  "
                >
                  {meta.title}
                </h1>

                <span
                  className="
                  rounded-full
                  bg-violet-100
                  px-3 py-1
                  text-[11px]
                  font-bold
                  uppercase tracking-wider
                  text-violet-700
                  "
                >
                  {role}
                </span>
              </div>

              <p
                className="
                truncate text-sm
                text-slate-500
                "
              >
                {meta.subtitle}
              </p>

              <div className="mt-1 hidden sm:block">
                <BreadcrumbTrail
                  items={meta.breadcrumbs}
                />
              </div>
            </div>
          </div>

          {/* RIGHT SECTION */}
          <div
            className="
            flex shrink-0 items-center gap-3
            "
          >
            {/* NAV BUTTONS */}
            <div
              className="
              flex items-center gap-2
              overflow-x-auto
              scrollbar-none
              "
            >
              <TopNavButton
                label="Home"
                active={onDashboard}
                icon={<DashboardIcon />}
                onClick={() => navigate('/dashboard')}
              />

              {showDeliveriesShortcut && (
                <TopNavButton
                  label="Deliveries"
                  active={onDeliveries}
                  icon={<DeliveryIcon />}
                  onClick={() =>
                    navigate('/deliveries')
                  }
                />
              )}

              {showReportsShortcut && (
                <TopNavButton
                  label="Reports"
                  active={onReports}
                  icon={<ReportsIcon />}
                  onClick={() =>
                    navigate('/reports')
                  }
                />
              )}
            </div>

            {/* USER CARD */}
            <button
              type="button"
              onClick={() => logout()}
              title="Logout"
              className="
              group
              flex items-center gap-3
              rounded-2xl
              border border-slate-200
              bg-white
              px-3 py-2
              shadow-sm
              transition-all
              hover:border-violet-200
              hover:shadow-md
              "
            >
              <div
                className="
                flex h-11 w-11
                items-center justify-center
                rounded-2xl
                bg-gradient-to-br
                from-violet-500
                to-purple-600
                text-sm font-bold
                text-white
                shadow-md
                "
              >
                {userInitial}
              </div>

              <div className="hidden text-left md:block">
                <div className="text-sm font-bold text-slate-900">
                  {userLabel}
                </div>

                <div
                  className="
                  max-w-[180px]
                  truncate
                  text-xs text-slate-500
                  "
                >
                  {userSub}
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* MOBILE NAV */}
        {/* <div
          className="
          flex items-center gap-2
          overflow-x-auto
          border-t border-slate-100
          py-3
          sm:hidden
          "
        >
          <TopNavButton
            label="Home"
            active={onDashboard}
            icon={<DashboardIcon />}
            onClick={() => navigate('/dashboard')}
          />

          {showDeliveriesShortcut && (
            <TopNavButton
              label="Deliveries"
              active={onDeliveries}
              icon={<DeliveryIcon />}
              onClick={() => navigate('/deliveries')}
            />
          )}

          {showReportsShortcut && (
            <TopNavButton
              label="Reports"
              active={onReports}
              icon={<ReportsIcon />}
              onClick={() => navigate('/reports')}
            />
          )}
        </div> */}
      </div>
    </header>
  )
}