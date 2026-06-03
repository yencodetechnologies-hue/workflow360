// import { NavLink, useNavigate } from 'react-router-dom'
// import { cn } from '../../lib/cn'
// import { navItemsForRole } from './navItems'
// import { logout, useAuth } from '../../auth/store'
// import { useGodownScope } from '../../hooks/useGodownScope'

// function LogoutNavButton() {
//   const navigate = useNavigate()

//   return (
//     <button
//       type="button"
//       onClick={() => {
//         logout()
//         navigate('/login')
//       }}
//       className={cn(
//         'group relative flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-300',
//         'text-slate-700 hover:bg-rose-50 hover:text-rose-700 hover:shadow-md',
//       )}
//     >
//       <span className="opacity-90">
//         <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden>
//           <path
//             d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"
//             stroke="currentColor"
//             strokeWidth="2"
//             strokeLinecap="round"
//             strokeLinejoin="round"
//           />
//         </svg>
//       </span>
//       <span className="relative z-10">Logout</span>
//     </button>
//   )
// }

// export function Sidebar() {
//   const auth = useAuth()
//   const navigate = useNavigate()
//   const { isGodown, godownId, godownName } = useGodownScope()
//   // console.log("authh",auth?.user?.email);

//   const userInitial = auth.status === 'authenticated' && auth.user?.email
//   ? auth.user.email.charAt(0).toUpperCase()
//   : 'A';
  
//   const role = auth.status === 'authenticated' ? auth.user.role : 'ADMIN'

//   const navItems = navItemsForRole(role, godownId)
//   const showMasters = role === 'ADMIN' || role === 'BILLER'

//   return (
//     <aside className="hidden lg:fixed lg:inset-y-0 lg:z-40 lg:flex lg:w-72 lg:flex-col fade-in">
//       <div className="flex h-full flex-col border-r border-white/20 glass shadow-xl">
//         <div className="px-6 py-6 border-b border-white/10">
//           <div className="flex items-center gap-3 group cursor-pointer">
//             <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 shadow-lg group-hover:shadow-xl transform group-hover:scale-105 transition-all duration-300 flex items-center justify-center">
//               <div className="h-6 w-6 bg-white rounded-lg opacity-90"></div>
//             </div>
//             <div>
//               <div className="text-sm font-bold gradient-text-primary">
//                 Godown Manager
//               </div>
//               <div className="text-xs text-slate-500 font-medium">
//                 {isGodown && godownName ? godownName : 'Admin Console'}
//               </div>
//             </div>
//           </div>
//         </div>

//         <nav className="flex-1 px-4 py-4">
//           <div className="space-y-2">
//             {navItems.map((item, index) => (
//               <div key={item.to}>
//                 <NavLink
//                   to={item.to}
//                   end={item.to === '/'}
//                   className={({ isActive }) =>
//                     cn(
//                       'group relative flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-300 hover:scale-105 slide-up',
//                       'before:absolute before:inset-0 before:rounded-xl before:bg-gradient-to-r before:from-primary-500/10 before:to-transparent before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-300',
//                       isActive
//                         ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-500/25 transform scale-105'
//                         : 'text-slate-700 hover:bg-white/50 hover:text-primary-700 hover:shadow-md',
//                     )
//                   }
//                   style={{ animationDelay: `${index * 50}ms` }}
//                 >
//                   <span className="opacity-90">{item.icon}</span>
//                   <span className="relative z-10">{item.label}</span>
//                 </NavLink>
//                 {item.to === '/reports' ? <LogoutNavButton /> : null}
//               </div>
//             ))}
//           </div>

//           {showMasters ? (
//           <>
//           <div className="mt-8 px-4 text-xs font-bold uppercase tracking-wider text-slate-400 gradient-text">
//             Masters
//           </div>
//           <div className="mt-3 space-y-2">
//             {[
//               { label: 'Billers', to: '/masters/billers' },
//               { label: 'Delivery Persons', to: '/masters/delivery-persons' },
//             ].map((item, index) => (
//               <NavLink
//                 key={item.to}
//                 to={item.to}
//                 className={({ isActive }) =>
//                   cn(
//                     'group relative flex items-center rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-300 hover:scale-105 slide-up',
//                     'before:absolute before:inset-0 before:rounded-xl before:bg-gradient-to-r before:from-accent-500/10 before:to-transparent before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-300',
//                     isActive
//                       ? 'bg-gradient-to-r from-accent-500 to-accent-600 text-white shadow-lg shadow-accent-500/25 transform scale-105'
//                       : 'text-slate-600 hover:bg-white/50 hover:text-accent-700 hover:shadow-md',
//                   )
//                 }
//                 style={{ animationDelay: `${(index + navItems.length) * 50}ms` }}
//               >
//                 <span className="relative z-10">{item.label}</span>
//               </NavLink>
//             ))}
//           </div>
//           </>
//           ) : null}
//         </nav>

//         <div className="border-t border-white/10 px-6 py-4">
//           <button
//             type="button"
//             onClick={() => navigate('/editprofile')}
//             className="w-full text-left flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all duration-300 cursor-pointer group"
//           >
//             <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 shadow-md group-hover:shadow-lg transform group-hover:scale-105 transition-all duration-300 flex items-center justify-center">
//               <span className="text-white font-bold text-sm">
//                  <span>{userInitial}</span>
//               </span>
//             </div>
//             <div className="min-w-0">
//               <div className="truncate text-sm font-bold text-slate-900 gradient-text">
//                 {auth.status === 'authenticated' ? auth.user.role : 'Admin'}
//               </div>
//               <div className="truncate text-xs text-slate-500 font-medium">
//                 {auth.status === 'authenticated'
//                   ? auth.user.email || auth.user.loginId || 'View profile'
//                   : 'View profile'}
//               </div>
//             </div>
//           </button>
//         </div>
//       </div>
//     </aside>
//   )
// }

import { NavLink, useNavigate } from 'react-router-dom'
import { logout, useAuth } from '../../auth/store'
import { useGodownScope } from '../../hooks/useGodownScope'
import { navItemsForRole } from './navItems'

// ── inline SVG icons ───────────────────────────────────────────────────────

function DashboardIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" width="18" height="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  )
}

function GodownIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" width="18" height="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  )
}

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" width="18" height="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  )
}

function ProductIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" width="18" height="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <path d="M16 10a4 4 0 01-8 0" />
    </svg>
  )
}

function DeliveryIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" width="18" height="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="3" width="15" height="13" rx="1" />
      <path d="M16 8h4l3 4v4h-7V8z" />
      <circle cx="5.5" cy="18.5" r="2.5" />
      <circle cx="18.5" cy="18.5" r="2.5" />
    </svg>
  )
}

function ReportsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" width="18" height="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="8" y1="13" x2="16" y2="13" />
      <line x1="8" y1="17" x2="16" y2="17" />
    </svg>
  )
}

function LogoutIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" width="18" height="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
    </svg>
  )
}

// map route → icon
function iconForPath(to: string) {
  if (to === '/' || to === '/dashboard') return <DashboardIcon />
  if (to.startsWith('/godowns')) return <GodownIcon />
  if (to.startsWith('/calendar')) return <CalendarIcon />
  if (to.startsWith('/products')) return <ProductIcon />
  if (to.startsWith('/deliveries')) return <DeliveryIcon />
  if (to.startsWith('/reports')) return <ReportsIcon />
  return <DashboardIcon />
}

// ── sidebar ────────────────────────────────────────────────────────────────

export function Sidebar() {
  const auth = useAuth()
  const navigate = useNavigate()
  const { isGodown, godownId, godownName } = useGodownScope()

  const role = auth.status === 'authenticated' ? auth.user.role : 'ADMIN'
  const navItems = navItemsForRole(role, godownId)
  const showMasters = role === 'ADMIN' || role === 'BILLER'

  const userInitial =
    auth.status === 'authenticated' && auth.user?.email
      ? auth.user.email.charAt(0).toUpperCase()
      : 'A'

  const userLabel =
    auth.status === 'authenticated' ? auth.user.role : 'ADMIN'

  const userSub =
    auth.status === 'authenticated'
      ? auth.user.email || auth.user.loginId || 'View profile'
      : 'View profile'

  // ── shared nav item active/inactive styles ──────────────────────────────

  const itemBase: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '10px 16px',
    borderRadius: 10,
    fontSize: 14,
    fontWeight: 500,
    textDecoration: 'none',
    cursor: 'pointer',
    border: 'none',
    background: 'none',
    width: '100%',
    boxSizing: 'border-box',
    transition: 'background 0.15s, color 0.15s',
    position: 'relative',
  }

  const itemInactive: React.CSSProperties = {
    ...itemBase,
    color: '#94a3b8',
  }

  const itemActive: React.CSSProperties = {
    ...itemBase,
    background: '#312e81',
    color: '#fff',
    borderLeft: '3px solid #818cf8',
    paddingLeft: 13, // compensate for 3px border
  }

  return (
    <aside
      style={{
        position: 'fixed',
        inset: '0 auto 0 0',
        zIndex: 40,
        width: 250,
        display: 'flex',
        flexDirection: 'column',
        background: '#1e1b4b',
        borderRight: '1px solid rgba(255,255,255,0.08)',
        fontFamily: 'inherit',
      }}
      className="hidden lg:flex"
    >
      {/* ── logo / brand ── */}
      <div
        style={{
          padding: '20px 20px 18px',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}
      >
        {/* icon box */}
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            background: '#6366f1',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          {/* inner white square */}
          <div
            style={{
              width: 18,
              height: 18,
              background: '#fff',
              borderRadius: 5,
              opacity: 0.9,
            }}
          />
        </div>

        {/* text */}
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>
            Godown Manager
          </div>
          <div style={{ fontSize: 11, color: '#6b7280', marginTop: 1 }}>
            {isGodown && godownName ? godownName : 'Admin Console'}
          </div>
        </div>
      </div>

      {/* ── nav ── */}
      <nav style={{ flex: 1, padding: '12px 12px 0', overflowY: 'auto' }}>
        {/* main nav items */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {navItems.map((item) => {
            const icon = item.icon ?? iconForPath(item.to)
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                style={({ isActive }) =>
                  isActive ? itemActive : itemInactive
                }
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLElement
                  if (!el.classList.contains('active-nav')) {
                    el.style.background = 'rgba(99,102,241,0.12)'
                    el.style.color = '#fff'
                  }
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLElement
                  // restore only if not active
                  const isActive = el.getAttribute('aria-current') === 'page'
                  if (!isActive) {
                    el.style.background = 'none'
                    el.style.color = '#94a3b8'
                  }
                }}
              >
                <span style={{ flexShrink: 0, opacity: 0.85 }}>{icon}</span>
                <span>{item.label}</span>
              </NavLink>
            )
          })}
        </div>

        {/* masters section */}
        {showMasters && (
          <>
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: '#4b5563',
                padding: '20px 16px 8px',
              }}
            >
              Masters
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {[
                { label: 'Billers', to: '/masters/billers' },
                { label: 'Delivery Persons', to: '/masters/delivery-persons' },
              ].map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  style={({ isActive }) =>
                    isActive ? itemActive : itemInactive
                  }
                  onMouseEnter={(e) => {
                    const el = e.currentTarget as HTMLElement
                    const isActive = el.getAttribute('aria-current') === 'page'
                    if (!isActive) {
                      el.style.background = 'rgba(99,102,241,0.12)'
                      el.style.color = '#fff'
                    }
                  }}
                  onMouseLeave={(e) => {
                    const el = e.currentTarget as HTMLElement
                    const isActive = el.getAttribute('aria-current') === 'page'
                    if (!isActive) {
                      el.style.background = 'none'
                      el.style.color = '#94a3b8'
                    }
                  }}
                >
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </div>
          </>
        )}

        {/* logout — sits below masters / nav items */}
        <div style={{ marginTop: 8 }}>
          <button
            type="button"
            onClick={() => { logout(); navigate('/login') }}
            style={{
              ...itemInactive,
              width: '100%',
              textAlign: 'left',
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLElement
              el.style.background = 'rgba(239,68,68,0.12)'
              el.style.color = '#f87171'
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLElement
              el.style.background = 'none'
              el.style.color = '#94a3b8'
            }}
          >
            <span style={{ flexShrink: 0, opacity: 0.85 }}>
              <LogoutIcon />
            </span>
            <span>Logout</span>
          </button>
        </div>
      </nav>

      {/* ── user card (bottom) ── */}
      <div
        style={{
          borderTop: '1px solid rgba(255,255,255,0.08)',
          padding: '14px 16px',
        }}
      >
        <button
          type="button"
          onClick={() => navigate('/editprofile')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            width: '100%',
            padding: '8px 10px',
            borderRadius: 10,
            border: 'none',
            background: 'rgba(255,255,255,0.05)',
            cursor: 'pointer',
            textAlign: 'left',
            transition: 'background 0.15s',
          }}
          onMouseEnter={(e) =>
            ((e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.1)')
          }
          onMouseLeave={(e) =>
            ((e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)')
          }
        >
          {/* avatar circle */}
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: '#6366f1',
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

          {/* name + email */}
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: '#fff',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {userLabel}
            </div>
            <div
              style={{
                fontSize: 11,
                color: '#6b7280',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {userSub}
            </div>
          </div>
        </button>
      </div>
    </aside>
  )
}
