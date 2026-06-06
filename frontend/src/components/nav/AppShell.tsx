// // import { Outlet, useLocation } from 'react-router-dom'
// // import { useEffect } from 'react'
// // import { MobileNav } from './MobileNav'
// // import { Sidebar } from './Sidebar'
// // import { Topbar } from './Topbar'

// // export function AppShell() {
// //   const { pathname } = useLocation()

// //   useEffect(() => {
// //     window.scrollTo({ top: 0, left: 0, behavior: 'smooth' })
// //   }, [pathname])

// //   return (
// //     <div className="min-h-full">
// //       <Sidebar />
// //       <div className="lg:pl-72">
// //         <Topbar />
// //         <main className="container-app pb-24 pt-6 lg:pb-10">
// //           <Outlet />
// //         </main>
// //       </div>
// //       <MobileNav />
// //     </div>
// //   )
// // }

// // import { Outlet, useLocation } from 'react-router-dom'
// // import { useEffect } from 'react'
// // import { MobileNav } from './MobileNav'
// // import { Sidebar } from './Sidebar'
// // import { Topbar } from './Topbar'

// // export function AppShell() {
// //   const { pathname } = useLocation()

// //   useEffect(() => {
// //     window.scrollTo({ top: 0, left: 0, behavior: 'smooth' })
// //   }, [pathname])

// //   return (
// //     <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
// //       <Sidebar />

// //       {/* This div uses a CSS class defined in index.css for the 250px offset */}
// //       <div className="app-content-area">
// //         <Topbar />
// //         <main
// //           style={{
// //             padding: '24px 28px 40px 28px',
// //             background: '#f8fafc',
// //             minHeight: 'calc(100vh - 68px)',
// //             boxSizing: 'border-box',
// //           }}
// //         >
// //           <Outlet />
// //         </main>
// //       </div>

// //       <MobileNav />
// //     </div>
// //   )
// // }

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
//       <Sidebar />

//       <div className="app-content-area" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
//         <Topbar />

//         {/*
//           padding: '20px 24px 32px' — consistent page padding for ALL pages.
//           Dashboard overrides this with its own wrapper (which is fine — it
//           sets padding on its own root div, which simply replaces this).
//           Every other page (Godowns, Products, Calendar, etc.) gets this
//           padding automatically without needing their own wrapper.
//         */}
//         <main
//           style={{
//             flex: 1,
//             padding: '20px 24px 32px',
//             margin: 0,
//             background: '#edf0f8',
//             minHeight: 'calc(100vh - 68px)',
//             boxSizing: 'border-box',
//           }}
//         >
//           <Outlet />
//         </main>
//       </div>

//       <MobileNav />
//     </div>
//   )
// }

import { Outlet, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { MobileNav } from './MobileNav'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'

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
          className="mobile-pb"
          style={{
            flex: 1,
            padding: '20px 24px 32px',
            margin: 0,
            background: '#edf0f8',
            minHeight: 'calc(100vh - 68px)',
            boxSizing: 'border-box',
          }}
        >
          <Outlet />
        </main>
      </div>

      {/* Bottom nav: only visible on mobile (lg:hidden inside MobileNav) */}
      <MobileNav />
    </div>
  )
}