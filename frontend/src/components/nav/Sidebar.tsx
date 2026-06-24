// import { NavLink, useLocation, useNavigate } from 'react-router-dom'
// import { logout, useAuth } from '../../auth/store'
// import { useGodownScope } from '../../hooks/useGodownScope'
// import { navItemsForRole } from './navItems'

// // ── inline SVG icons ───────────────────────────────────────────────────────

// function DashboardIcon() {
//   return (
//     <svg viewBox="0 0 24 24" fill="none" width="18" height="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//       <rect x="3" y="3" width="7" height="7" rx="1" />
//       <rect x="14" y="3" width="7" height="7" rx="1" />
//       <rect x="3" y="14" width="7" height="7" rx="1" />
//       <rect x="14" y="14" width="7" height="7" rx="1" />
//     </svg>
//   )
// }

// function GodownIcon() {
//   return (
//     <svg viewBox="0 0 24 24" fill="none" width="18" height="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//       <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
//       <polyline points="9 22 9 12 15 12 15 22" />
//     </svg>
//   )
// }

// function CalendarIcon() {
//   return (
//     <svg viewBox="0 0 24 24" fill="none" width="18" height="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//       <rect x="3" y="4" width="18" height="18" rx="2" />
//       <path d="M16 2v4M8 2v4M3 10h18" />
//     </svg>
//   )
// }

// function ProductIcon() {
//   return (
//     <svg viewBox="0 0 24 24" fill="none" width="18" height="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//       <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
//       <line x1="3" y1="6" x2="21" y2="6" />
//       <path d="M16 10a4 4 0 01-8 0" />
//     </svg>
//   )
// }

// function DeliveryIcon() {
//   return (
//     <svg viewBox="0 0 24 24" fill="none" width="18" height="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//       <rect x="1" y="3" width="15" height="13" rx="1" />
//       <path d="M16 8h4l3 4v4h-7V8z" />
//       <circle cx="5.5" cy="18.5" r="2.5" />
//       <circle cx="18.5" cy="18.5" r="2.5" />
//     </svg>
//   )
// }

// function ReportsIcon() {
//   return (
//     <svg viewBox="0 0 24 24" fill="none" width="18" height="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//       <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
//       <polyline points="14 2 14 8 20 8" />
//       <line x1="8" y1="13" x2="16" y2="13" />
//       <line x1="8" y1="17" x2="16" y2="17" />
//     </svg>
//   )
// }

// function LogoutIcon() {
//   return (
//     <svg viewBox="0 0 24 24" fill="none" width="18" height="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//       <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
//     </svg>
//   )
// }

// function BillerIcon() {
//   return (
//     <svg viewBox="0 0 24 24" fill="none" width="18" height="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//       <path d="M3 21h18" />
//       <path d="M6 21V10l6-4 6 4v11" />
//       <path d="M10 14h4" />
//     </svg>
//   )
// }

// function DeliveryPersonIcon() {
//   return (
//     <svg viewBox="0 0 24 24" fill="none" width="18" height="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//       <circle cx="12" cy="8" r="4" />
//       <path d="M20 21a8 8 0 10-16 0" />
//     </svg>
//   )
// }

// // map route → icon
// function iconForPath(to: string) {
//   if (to === '/' || to === '/dashboard') return <DashboardIcon />
//   if (to.startsWith('/godowns')) return <GodownIcon />
//   if (to.startsWith('/calendar')) return <CalendarIcon />
//   if (to.startsWith('/products')) return <ProductIcon />
//   if (to.startsWith('/deliveries')) return <DeliveryIcon />
//   if (to.startsWith('/reports')) return <ReportsIcon />
//   if (to.startsWith('/masters/billers')) return <BillerIcon />
//   if (to.startsWith('/masters/delivery-persons')) return <DeliveryPersonIcon />
//   return <DashboardIcon />
// }

// // ── sidebar ────────────────────────────────────────────────────────────────

// export function Sidebar() {
//   const auth = useAuth()
//   const navigate = useNavigate()
//   const { pathname } = useLocation()
//   const { isGodown, godownId, godownName } = useGodownScope()
//   const isDeliveriesRoute = pathname.startsWith('/deliveries')

//   const role = auth.status === 'authenticated' ? auth.user.role : 'ADMIN'
//   const navItems = navItemsForRole(role, godownId)
//   const showMasters = role === 'ADMIN' || role === 'BILLER'

//   const userInitial =
//     auth.status === 'authenticated'
//       ? (auth.user.email || auth.user.loginId || 'A').charAt(0).toUpperCase()
//       : 'A'

//   const roleLabelMap: Record<string, string> = {
//     ADMIN: 'Admin',
//     BILLER: 'Biller',
//     GODOWN: 'Godown',
//     DELIVERY_PERSON: 'Delivery Person',
//   }

//   const userLabel =
//     auth.status === 'authenticated'
//       ? roleLabelMap[auth.user.role] ?? auth.user.role
//       : 'Admin'

//   const userSub =
//     auth.status === 'authenticated'
//       ? auth.user.email || auth.user.loginId || 'View profile'
//       : 'View profile'

//   // ── shared nav item active/inactive styles ──────────────────────────────

//   const itemBase: React.CSSProperties = {
//     display: 'flex',
//     alignItems: 'center',
//     gap: 12,
//     padding: '10px 16px',
//     borderRadius: 10,
//     fontSize: 14,
//     fontWeight: 500,
//     textDecoration: 'none',
//     cursor: 'pointer',
//     border: 'none',
//     background: 'none',
//     width: '100%',
//     boxSizing: 'border-box',
//     transition: 'background 0.15s, color 0.15s',
//     position: 'relative',
//   }

//   const itemInactive: React.CSSProperties = {
//     ...itemBase,
//     color: '#94a3b8',
//     borderLeft: '3px solid transparent',
//   }

//   const itemActive: React.CSSProperties = {
//     ...itemBase,
//     background: '#065f46',
//     color: '#fff',
//     borderLeft: '3px solid #34d399',
//   }

//   return (
//     // <aside
//     //   style={{
//     //     position: 'fixed',
//     //     inset: '0 auto 0 0',
//     //     zIndex: 40,
//     //     width: 250,
//     //     display: 'flex',
//     //     flexDirection: 'column',
//     //     background: '#064e3b',
//     //     borderRight: '1px solid rgba(255,255,255,0.08)',
//     //     fontFamily: 'inherit',
//     //   }}
//     //   className="hidden lg:flex"
//     // >
//     // AFTER — just delete the display: 'flex' line
// <aside
//   style={{
//     position: 'fixed',
//     inset: '0 auto 0 0',
//     zIndex: 40,
//     width: 250,
//     flexDirection: 'column',
//     background: '#064e3b',
//     borderRight: '1px solid rgba(255,255,255,0.08)',
//     fontFamily: 'inherit',
//   }}
//   className="hidden lg:flex"
// >
//       {/* ── logo / brand ── */}
//       <div
//         style={{
//           padding: '20px 20px 18px',
//           borderBottom: '1px solid rgba(255,255,255,0.08)',
//           display: 'flex',
//           alignItems: 'center',
//           gap: 12,
//         }}
//       >
//         {/* icon box */}
//         <div
//           style={{
//             width: 40,
//             height: 40,
//             borderRadius: 12,
//             background: '#10b981',
//             display: 'flex',
//             alignItems: 'center',
//             justifyContent: 'center',
//             flexShrink: 0,
//           }}
//         >
//           {/* inner white square */}
//           <div
//             style={{
//               width: 18,
//               height: 18,
//               background: '#fff',
//               borderRadius: 5,
//               opacity: 0.9,
//             }}
//           />
//         </div>

//         {/* text */}
//         <div>
//           <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>
//             {isDeliveriesRoute
//               ? 'Delivery Manager'
//               : role === 'ADMIN'
//                 ? 'Admin '
//                 : role === 'BILLER'
//                   ? 'Biller Portal'
//                   : 'Godown Manager'}
//           </div>
//           <div style={{ fontSize: 11, color: '#6b7280', marginTop: 1 }}>
//             {isGodown && godownName
//               ? godownName
//               : role === 'ADMIN'
//                 ? ' Admin Console'
//                 : role === 'BILLER'
//                   ? 'Biller View'
//                   : 'Admin Console'}
//           </div>
//         </div>
//       </div>

//       {/* ── nav ── */}
//       <nav style={{ flex: 1, padding: '12px 12px 0', overflowY: 'auto' }}>
//         {/* main nav items */}
//         <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
//           {navItems.map((item) => {
//             const icon = item.icon ?? iconForPath(item.to)
//             return (
//               <NavLink
//                 key={item.to}
//                 to={item.to}
//                 end={item.to === '/'}
//                 style={({ isActive }) =>
//                   isActive ? itemActive : itemInactive
//                 }
//                 onMouseEnter={(e) => {
//                   const el = e.currentTarget as HTMLElement
//                   if (!el.classList.contains('active-nav')) {
//                     el.style.background = 'rgba(16,185,129,0.12)'
//                     el.style.color = '#fff'
//                   }
//                 }}
//                 onMouseLeave={(e) => {
//                   const el = e.currentTarget as HTMLElement
//                   // restore only if not active
//                   const isActive = el.getAttribute('aria-current') === 'page'
//                   if (!isActive) {
//                     el.style.background = 'none'
//                     el.style.color = '#94a3b8'
//                   }
//                 }}
//               >
//                 <span style={{ flexShrink: 0, opacity: 0.85 }}>{icon}</span>
//                 <span>{item.label}</span>
//               </NavLink>
//             )
//           })}
//         </div>

//         {/* masters section */}
//         {showMasters && (
//           <>
//             <div
//               style={{
//                 fontSize: 10,
//                 fontWeight: 700,
//                 letterSpacing: '0.1em',
//                 textTransform: 'uppercase',
//                 color: '#4b5563',
//                 padding: '20px 16px 8px',
//               }}
//             >
//               Masters
//             </div>
//             <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
//               {[
//                 { label: 'Billers', to: '/masters/billers', icon: <BillerIcon /> },
//                 { label: 'Delivery Persons', to: '/masters/delivery-persons', icon: <DeliveryPersonIcon /> },
//               ].map((item) => (
//                 <NavLink
//                   key={item.to}
//                   to={item.to}
//                   style={({ isActive }) =>
//                     isActive ? itemActive : itemInactive
//                   }
//                   onMouseEnter={(e) => {
//                     const el = e.currentTarget as HTMLElement
//                     const isActive = el.getAttribute('aria-current') === 'page'
//                     if (!isActive) {
//                       el.style.background = 'rgba(16,185,129,0.12)'
//                       el.style.color = '#fff'
//                     }
//                   }}
//                   onMouseLeave={(e) => {
//                     const el = e.currentTarget as HTMLElement
//                     const isActive = el.getAttribute('aria-current') === 'page'
//                     if (!isActive) {
//                       el.style.background = 'none'
//                       el.style.color = '#94a3b8'
//                     }
//                   }}
//                 >
//                   <span style={{ flexShrink: 0, opacity: 0.85 }}>{item.icon}</span>
//                   <span>{item.label}</span>
//                 </NavLink>
//               ))}
//             </div>
//           </>
//         )}

//         {/* logout — sits below masters / nav items */}
//         <div style={{ marginTop: 8 }}>
//           <button
//             type="button"
//             onClick={() => { logout(); navigate('/login') }}
//             style={{
//               ...itemInactive,
//               width: '100%',
//               textAlign: 'left',
//             }}
//             onMouseEnter={(e) => {
//               const el = e.currentTarget as HTMLElement
//               el.style.background = 'rgba(239,68,68,0.12)'
//               el.style.color = '#f87171'
//             }}
//             onMouseLeave={(e) => {
//               const el = e.currentTarget as HTMLElement
//               el.style.background = 'none'
//               el.style.color = '#94a3b8'
//             }}
//           >
//             <span style={{ flexShrink: 0, opacity: 0.85 }}>
//               <LogoutIcon />
//             </span>
//             <span>Logout</span>
//           </button>
//         </div>
//       </nav>

//       {/* ── user card (bottom) ── */}
//       <div
//         style={{
//           borderTop: '1px solid rgba(255,255,255,0.08)',
//           padding: '14px 16px',
//         }}
//       >
//         <button
//           type="button"
//           onClick={() => navigate('/editprofile')}
//           style={{
//             display: 'flex',
//             alignItems: 'center',
//             gap: 12,
//             width: '100%',
//             padding: '8px 10px',
//             borderRadius: 10,
//             border: 'none',
//             background: 'rgba(255,255,255,0.05)',
//             cursor: 'pointer',
//             textAlign: 'left',
//             transition: 'background 0.15s',
//           }}
//           onMouseEnter={(e) =>
//             ((e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.1)')
//           }
//           onMouseLeave={(e) =>
//             ((e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)')
//           }
//         >
//           {/* avatar circle */}
//           <div
//             style={{
//               width: 36,
//               height: 36,
//               borderRadius: '50%',
//               background: '#10b981',
//               display: 'flex',
//               alignItems: 'center',
//               justifyContent: 'center',
//               fontSize: 14,
//               fontWeight: 700,
//               color: '#fff',
//               flexShrink: 0,
//             }}
//           >
//             {userInitial}
//           </div>

//           {/* name + email */}
//           <div style={{ minWidth: 0 }}>
//             <div
//               style={{
//                 fontSize: 13,
//                 fontWeight: 700,
//                 color: '#fff',
//                 overflow: 'hidden',
//                 textOverflow: 'ellipsis',
//                 whiteSpace: 'nowrap',
//               }}
//             >
//               {userLabel}
//             </div>
//             <div
//               style={{
//                 fontSize: 11,
//                 color: '#6b7280',
//                 overflow: 'hidden',
//                 textOverflow: 'ellipsis',
//                 whiteSpace: 'nowrap',
//               }}
//             >
//               {userSub}
//             </div>
//           </div>
//         </button>
//       </div>
//     </aside>
//   )
// }

import { useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
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

function BillerIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" width="18" height="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 21h18" />
      <path d="M6 21V10l6-4 6 4v11" />
      <path d="M10 14h4" />
    </svg>
  )
}

function DeliveryPersonIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" width="18" height="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M20 21a8 8 0 10-16 0" />
    </svg>
  )
}

function ChevronDownIcon({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      width="14"
      height="14"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      style={{
        transition: 'transform 0.2s ease',
        transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
        marginLeft: 'auto',
        flexShrink: 0,
      }}
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  )
}

function TruckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" width="14" height="14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="3" width="15" height="13" rx="1" />
      <path d="M16 8h4l3 4v4h-7V8z" />
      <circle cx="5.5" cy="18.5" r="2.5" />
      <circle cx="18.5" cy="18.5" r="2.5" />
    </svg>
  )
}

function ReturnIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" width="14" height="14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 14l-4-4 4-4" />
      <path d="M5 10h11a4 4 0 0 1 0 8h-1" />
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
  if (to.startsWith('/masters/billers')) return <BillerIcon />
  if (to.startsWith('/masters/delivery-persons')) return <DeliveryPersonIcon />
  return <DashboardIcon />
}

// ── sidebar ────────────────────────────────────────────────────────────────

export function Sidebar() {
  const auth = useAuth()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { isGodown, godownId, godownName } = useGodownScope()
  const isDeliveriesRoute = pathname.startsWith('/deliveries')

  const role = auth.status === 'authenticated' ? auth.user.role : 'ADMIN'
  const navItems = navItemsForRole(role, godownId)
  const showMasters = role === 'ADMIN' || role === 'BILLER'

  // Calendar submenu open state — auto-open if on a calendar route
  const isOnCalendar = pathname.startsWith('/calendar') || pathname.startsWith('/return-calendar')
  const [calendarOpen, setCalendarOpen] = useState(isOnCalendar)

  const userInitial =
    auth.status === 'authenticated'
      ? (auth.user.email || auth.user.loginId || 'A').charAt(0).toUpperCase()
      : 'A'

  const roleLabelMap: Record<string, string> = {
    ADMIN: 'Admin',
    BILLER: 'Biller',
    GODOWN: 'Godown',
    DELIVERY_PERSON: 'Delivery Person',
  }

  const userLabel =
    auth.status === 'authenticated'
      ? roleLabelMap[auth.user.role] ?? auth.user.role
      : 'Admin'

  const userSub =
    auth.status === 'authenticated'
      ? auth.user.email || auth.user.loginId || 'View profile'
      : 'View profile'

  // ── shared nav item styles ──────────────────────────────────────────────

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
    borderLeft: '3px solid transparent',
  }

  const itemActive: React.CSSProperties = {
    ...itemBase,
    background: '#065f46',
    color: '#fff',
    borderLeft: '3px solid #34d399',
  }

  // Sub-item styles (indented, smaller)
  const subItemBase: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '8px 16px 8px 44px',
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 500,
    textDecoration: 'none',
    cursor: 'pointer',
    border: 'none',
    background: 'none',
    width: '100%',
    boxSizing: 'border-box',
    transition: 'background 0.15s, color 0.15s',
    borderLeft: '3px solid transparent',
  }

  const subItemInactive: React.CSSProperties = {
    ...subItemBase,
    color: '#6b7280',
  }

  const subItemActive: React.CSSProperties = {
    ...subItemBase,
    background: 'rgba(52,211,153,0.12)',
    color: '#34d399',
    borderLeft: '3px solid #34d399',
  }

  // Determine if Calendar parent item is "active" (either sub-route active)
  const calendarParentActive = isOnCalendar

  // Filter out the Calendar item from navItems — we render it manually with submenu
  // const nonCalendarItems = navItems.filter((item) => !item.to.startsWith('/calendar'))

  return (
    <aside
      style={{
        position: 'fixed',
        inset: '0 auto 0 0',
        zIndex: 40,
        width: 250,
        flexDirection: 'column',
        background: '#064e3b',
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
            background: '#10b981',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
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
            {isDeliveriesRoute
              ? 'Delivery Manager'
              : role === 'ADMIN'
                ? 'Admin '
                : role === 'BILLER'
                  ? 'Biller Portal'
                  : 'Godown Manager'}
          </div>
          <div style={{ fontSize: 11, color: '#6b7280', marginTop: 1 }}>
            {isGodown && godownName
              ? godownName
              : role === 'ADMIN'
                ? ' Admin Console'
                : role === 'BILLER'
                  ? 'Biller View'
                  : 'Admin Console'}
          </div>
        </div>
      </div>

      {/* ── nav ── */}
      <nav style={{ flex: 1, padding: '12px 12px 0', overflowY: 'auto' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>

          {/* Render nav items, injecting Calendar submenu where Calendar appears */}
          {navItems.map((item) => {
            // Calendar item → render as expandable group
            if (item.to === '/calendar') {
              return (
                <div key="calendar-group">
                  {/* Calendar parent button */}
                  <button
                    type="button"
                    onClick={() => setCalendarOpen((o) => !o)}
                    style={{
                      ...itemBase,
                      color: calendarParentActive ? '#fff' : '#94a3b8',
                      background: calendarParentActive ? '#065f46' : 'none',
                      borderLeft: calendarParentActive ? '3px solid #34d399' : '3px solid transparent',
                    }}
                    onMouseEnter={(e) => {
                      if (!calendarParentActive) {
                        (e.currentTarget as HTMLElement).style.background = 'rgba(16,185,129,0.12)'
                        ;(e.currentTarget as HTMLElement).style.color = '#fff'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!calendarParentActive) {
                        (e.currentTarget as HTMLElement).style.background = 'none'
                        ;(e.currentTarget as HTMLElement).style.color = '#94a3b8'
                      }
                    }}
                  >
                    <span style={{ flexShrink: 0, opacity: 0.85 }}>
                      <CalendarIcon />
                    </span>
                    <span>Calendar</span>
                    <ChevronDownIcon open={calendarOpen} />
                  </button>

                  {/* Submenu */}
                  {calendarOpen && (
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 1,
                        marginTop: 2,
                        marginBottom: 2,
                        borderLeft: '1px solid rgba(52,211,153,0.2)',
                        marginLeft: 20,
                      }}
                    >
                      {/* Delivery Calendar */}
                      <NavLink
                        to="/calendar"
                        end
                        style={({ isActive }) => (isActive ? subItemActive : subItemInactive)}
                        onMouseEnter={(e) => {
                          const el = e.currentTarget as HTMLElement
                          if (el.getAttribute('aria-current') !== 'page') {
                            el.style.background = 'rgba(16,185,129,0.08)'
                            el.style.color = '#a7f3d0'
                          }
                        }}
                        onMouseLeave={(e) => {
                          const el = e.currentTarget as HTMLElement
                          if (el.getAttribute('aria-current') !== 'page') {
                            el.style.background = 'none'
                            el.style.color = '#6b7280'
                          }
                        }}
                      >
                        <TruckIcon />
                        <span>Delivery Calendar</span>
                      </NavLink>

                      {/* Return Calendar */}
                      <NavLink
                        to="/return-calendar"
                        style={({ isActive }) => (isActive ? subItemActive : subItemInactive)}
                        onMouseEnter={(e) => {
                          const el = e.currentTarget as HTMLElement
                          if (el.getAttribute('aria-current') !== 'page') {
                            el.style.background = 'rgba(16,185,129,0.08)'
                            el.style.color = '#a7f3d0'
                          }
                        }}
                        onMouseLeave={(e) => {
                          const el = e.currentTarget as HTMLElement
                          if (el.getAttribute('aria-current') !== 'page') {
                            el.style.background = 'none'
                            el.style.color = '#6b7280'
                          }
                        }}
                      >
                        <ReturnIcon />
                        <span>Return Calendar</span>
                      </NavLink>
                    </div>
                  )}
                </div>
              )
            }

            // All other nav items
            const icon = item.icon ?? iconForPath(item.to)
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                style={({ isActive }) => (isActive ? itemActive : itemInactive)}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLElement
                  if (!el.classList.contains('active-nav')) {
                    el.style.background = 'rgba(16,185,129,0.12)'
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
                { label: 'Billers', to: '/masters/billers', icon: <BillerIcon /> },
                { label: 'Delivery Persons', to: '/masters/delivery-persons', icon: <DeliveryPersonIcon /> },
              ].map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  style={({ isActive }) => (isActive ? itemActive : itemInactive)}
                  onMouseEnter={(e) => {
                    const el = e.currentTarget as HTMLElement
                    const isActive = el.getAttribute('aria-current') === 'page'
                    if (!isActive) {
                      el.style.background = 'rgba(16,185,129,0.12)'
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
                  <span style={{ flexShrink: 0, opacity: 0.85 }}>{item.icon}</span>
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </div>
          </>
        )}

        {/* logout */}
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
              background: '#10b981',
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