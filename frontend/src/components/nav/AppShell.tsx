
// import { Outlet, useLocation } from 'react-router-dom'
// import { useEffect } from 'react'
// import { MobileNav } from './MobileNav'
// import { Sidebar } from './Sidebar'
// import { Topbar } from './Topbar'

// export function AppShell() {
//   const { pathname } = useLocation()

//   useEffect(() => {
//     window.scrollTo({ top: 0, left: 0, behavior: 'smooth' })
//   }, [pathname])

//   return (
//     <div style={{ minHeight: '100vh', background: '#edf0f8' }}>
//       {/* Sidebar: hidden on mobile (lg:flex inside Sidebar itself) */}
//       <Sidebar />

//       {/* Content area: offset by 250px on desktop, full-width on mobile */}
//       <div className="app-content-area" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
//         <Topbar />

//         <main
//           className="mobile-pb main-content"
//           style={{
//             flex: 1,
//             margin: 0,
//             background: '#edf0f8',
//             minHeight: 'calc(100vh - 68px)',
//             boxSizing: 'border-box',
//           }}
//         >
//           <Outlet />
//         </main>
//       </div>

//       {/* Bottom nav: only visible on mobile (lg:hidden inside MobileNav) */}
//       <MobileNav />
//     </div>
//   )
// }

import { Outlet, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { MobileNav } from './MobileNav'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { Footer } from './Footer'

export function AppShell() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' })
  }, [pathname])

  return (
    <div style={{ minHeight: '100vh', background: '#edf0f8' }}>
      {/* Sidebar: hidden on mobile (lg:flex inside Sidebar itself) */}
      <Sidebar />

      {/* Content area: offset by 250px on desktop, full-width on mobile */}
      <div className="app-content-area" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Topbar />

        <main
          className="mobile-pb main-content"
          style={{
            flex: 1,
            margin: 0,
            background: '#edf0f8',
            minHeight: 'calc(100vh - 68px)',
            boxSizing: 'border-box',
          }}
        >
          <Outlet />
        </main>

        <Footer />
      </div>

      {/* Bottom nav: only visible on mobile (lg:hidden inside MobileNav) */}
      <MobileNav />
    </div>
  )
}