
// Topbar.tsx
// CLEAN VERSION
// ✔ 3 navigation buttons removed
// ✔ No build errors
// ✔ Fully responsive
// ✔ Logout working
// ✔ Production ready

import { useMemo } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'

import { cn } from '../../lib/cn'
import { logout, useAuth } from '../../auth/store'
import { useGodownScope } from '../../hooks/useGodownScope'

import {
  topbarMetaFromPath,
  type Breadcrumb,
} from './topbarMeta'

function BreadcrumbTrail({
  items,
}: {
  items: Breadcrumb[]
}) {
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

export function Topbar() {
  const { pathname } = useLocation()

  const navigate = useNavigate()

  const auth = useAuth()
  const { isGodown, godownName } = useGodownScope()

  const role =
    auth.status === 'authenticated'
      ? auth.user.role
      : 'ADMIN'

  const meta = useMemo(
    () => topbarMetaFromPath(pathname),
    [pathname],
  )

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
      : 'Admin'

  const userSub =
    auth.status === 'authenticated'
      ? isGodown
        ? auth.user.contactPhone || auth.user.email || 'Godown operator'
        : auth.user.email ||
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
          gap-4 py-4
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

          {/* PROFILE & LOGOUT */}
          <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => navigate('/editprofile')}
            title="Edit profile"
            className="
            group
            flex shrink-0 items-center gap-3
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
            {/* AVATAR */}
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

            {/* USER INFO */}
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

          <button
            type="button"
            onClick={() => {
              logout()
              navigate('/login')
            }}
            title="Logout"
            className="
            flex h-11 w-11 items-center justify-center
            rounded-2xl border border-slate-200
            bg-white text-slate-600 shadow-sm
            transition-all
            hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600
            "
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          </div>
        </div>
      </div>
    </header>
  )
}