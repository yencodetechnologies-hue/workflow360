import type { ReactNode } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from './store'
import type { Role } from './store'

export function ProtectedRoute({ roles, children }: { roles?: Role[]; children?: ReactNode }) {
  const auth = useAuth()
  if (auth.status !== 'authenticated') return <Navigate to="/login" replace />
  if (roles && !roles.includes(auth.user.role)) {
    if (auth.user.role === 'DELIVERY') return <Navigate to="/deliveries" replace />
    return <Navigate to="/" replace />
  }
  if (children) return <>{children}</>
  return <Outlet />
}

