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
    <div className="min-h-full">
      <Sidebar />
      <div className="lg:pl-72">
        <Topbar />
        <main className="container-app pb-24 pt-6 lg:pb-10">
          <Outlet />
        </main>
      </div>
      <MobileNav />
    </div>
  )
}

